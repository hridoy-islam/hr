import { useEffect, useState, useRef } from 'react';
import {
  CalendarDays,
  CheckCircle,
  Eye,
  Info,
  MapPin,
  MoreVertical,
  MoveLeft,
  Plus,
  UserRoundPlus,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import moment from 'moment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function ViewApplicant() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToReject, setSelectedToReject] = useState<string | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null); // For focus restoration
  const { id } = useParams();
  const location = useLocation();
  const [vacancy, setVacancy] = useState<any>({});
  const navigate = useNavigate();

  const fetchData = async (
    page: number,
    entriesPerPage: number,
    searchTerm = ''
  ) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(
        `/hr/applicant?vacancyId=${id}`,
        {
          params: {
            page,
            limit: entriesPerPage,
            ...(searchTerm ? { searchTerm } : {})
          }
        }
      );
      const sorted = response.data.data.result.sort(
        (a: any, b: any) =>
          (b.status === 'shortlisted' ? 1 : 0) -
          (a.status === 'shortlisted' ? 1 : 0)
      );
      setApplicants(sorted);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchVacancyDetails = async () => { 
    try {
      const response = await axiosInstance.get(`/hr/vacancy/${id}`);
      setVacancy(response?.data?.data);
    } catch (error) {
      console.error('Error fetching vacancy details:', error);
      return {};
    }
  }

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const handleDelete = async (applicantId: string) => {
    try {
      await axiosInstance.patch(`/hr/applicant/${applicantId}`, {
        status: 'rejected'
      });
      toast({ title: 'Applicant rejected successfully' });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      toast({
        title: 'Failed to reject applicant',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (
    applicantId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus =
        currentStatus === 'shortlisted' ? 'applied' : 'shortlisted';
      await axiosInstance.patch(`/hr/applicant/${applicantId}`, {
        status: newStatus
      });
      toast({
        title: `Status updated to ${
          newStatus === 'shortlisted' ? 'Shortlisted' : 'Applied'
        }`
      });
      fetchData(currentPage, entriesPerPage, searchTerm);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
    fetchVacancyDetails();
  }, [currentPage, entriesPerPage]);

  return (
    <div className="space-y-3">
      {/* Vacancy Details Card */}
      <Card className="-mt-3 w-full rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col items-start justify-between gap-1 text-sm text-gray-700">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <h2 className="truncate text-lg font-semibold text-gray-800">
              Vacancy Title: {vacancy.title || 'N/A'}
            </h2>
            <Button
              className="h-8 bg-supperagent text-white hover:bg-supperagent/90"
              onClick={handleBack}
            >
              <MoveLeft />
              Back
            </Button>
          </div>

          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Employment Type:</span>
              <span>{vacancy.employmentType || 'N/A'}</span>
            </div>

            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Skills Required:</span>
              <span>{vacancy.skillsRequired || 'N/A'}</span>
            </div>

            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Salary Range:</span>
              {vacancy.salaryRange ? (
                <span>
                  {vacancy.salaryRange.min ?? 0} -{' '}
                  {vacancy.salaryRange.max ?? 0}
                  {vacancy.salaryRange.negotiable ? ' (Negotiable)' : ''}
                </span>
              ) : (
                <span>N/A</span>
              )}
            </div>

            <div className="flex min-w-[180px] flex-col items-start gap-2">
              <span className="font-medium">Location:</span>
              <span>{vacancy.location || 'N/A'}</span>
            </div>

            <div className="flex min-w-[200px] flex-col items-start gap-2">
              <span className="font-medium">Deadline:</span>
              <span>
                {vacancy.applicationDeadline
                  ? moment(vacancy.applicationDeadline).format('MMM D, YYYY')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Search & Create Applicant Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-6">
          <h1 className="text-2xl font-semibold">All Applicants</h1>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="h-8 min-w-[400px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              Search
            </Button>
          </div>
        </div>
        <Button
          onClick={() => {
            navigate(`/admin/hr/add-applicant/${id}`);
          }}
          className="h-8 bg-supperagent text-white hover:bg-supperagent/90"
        >
          <Plus /> Create Applicant
        </Button>
      </div>

      {/* Applicant Table */}
      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vacancy Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((app) => (
                  <TableRow
                    key={app._id}
                    className={
                      app.status === 'shortlisted' ? 'bg-green-100' : ''
                    }
                  >
                    <TableCell>
                      {app.firstName} {app.lastName}
                      {(app.status === 'hired' ||
                        app.status === 'rejected') && (
                        <Badge
                          className={`ml-2 ${app.status === 'hired' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                          {app.status === 'hired' ? 'Hired' : 'Rejected'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.position}</TableCell>
                    <TableCell>{app.employmentType}</TableCell>
                    <TableCell>{app.address}</TableCell>
                    <TableCell className="text-right flex flex-row items-end gap-2 justify-end">
                      <Button size='icon' className='bg-supperagent text-white  hover:bg-supperagent/90' onClick={()=> navigate(`/admin/hr/view-applicant/${app._id}`)}><Eye size={24}/></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-gray-200 bg-white text-black"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(app._id, app.status)
                            }
                            className="cursor-pointer hover:bg-supperagent hover:text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {app.status === 'shortlisted'
                              ? 'Remove from Shortlisted'
                              : 'Make Shortlisted'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/admin/hr/recruit-applicant/${app._id}`,
                                { state: { applicant: app } }
                              )
                            }
                            className="cursor-pointer hover:bg-supperagent hover:text-white"
                          >
                            <UserRoundPlus className="mr-2 h-4 w-4" />
                            Recruit Applicant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleDelete(app._id);
                            }}
                            className="cursor-pointer text-destructive hover:bg-red-700 hover:text-white"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedToReject(null);
            rejectButtonRef.current?.focus(); // Restore focus
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will mark the applicant as rejected. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (selectedToReject) {
                  handleDelete(selectedToReject);
                  setDialogOpen(false);
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
