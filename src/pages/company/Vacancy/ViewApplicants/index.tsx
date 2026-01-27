import { useEffect, useState, useRef } from 'react';
import {
  Banknote,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  Eye,
  Info,
  Layers,
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
import { Card, CardContent } from '@/components/ui/card';
import moment from 'moment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ViewApplicant() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToReject, setSelectedToReject] = useState<string | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null); // For focus restoration
  const { id,vid } = useParams();
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
        `/hr/applicant?vacancyId=${vid}`,
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
      const response = await axiosInstance.get(`/hr/vacancy/${vid}`);
      setVacancy(response?.data?.data);
    } catch (error) {
      console.error('Error fetching vacancy details:', error);
      return {};
    }
  };

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
      <Card className="w-full  bg-white shadow-sm ">
        <CardContent className="p-4">
          {/* Header: Title & Back Button */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">
                {vacancy.title || 'Untitled Position'}
              </h1>
              <p className="text-xs text-gray-500">
                Posted{' '}
                {vacancy.createdAt
                  ? moment(vacancy.createdAt).format('MMM D, YYYY')
                  : 'N/A'}
              </p>
            </div>
            <Button
              size="sm"
              className=" px-2 text-xs font-medium"
              onClick={handleBack}
            >
              <MoveLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          {/* Data Grid - Compact & Labeled */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 border-t border-gray-100 py-3 sm:grid-cols-4">
            {/* Location */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Location
              </span>
              <span className="break-words text-sm font-medium leading-snug text-gray-800">
                {vacancy.location || 'Remote'}
              </span>
            </div>

            {/* Salary */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Salary
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <span className="break-words text-sm font-medium leading-snug text-gray-800">
                  {vacancy.salaryRange ? (
                    <>
                      {vacancy.salaryRange.min} - {vacancy.salaryRange.max}
                    </>
                  ) : (
                    'N/A'
                  )}
                </span>
                {vacancy.salaryRange?.negotiable && (
                  <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-bold text-green-700">
                    Negotiable
                  </span>
                )}
              </div>
            </div>

            {/* Type */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Type
              </span>
              <span className="break-words text-sm font-medium leading-snug text-gray-800">
                {vacancy.employmentType || 'Full-time'}
              </span>
            </div>

            {/* Deadline */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Deadline
              </span>
              <span className="text-sm font-medium leading-snug text-gray-800">
                {vacancy.applicationDeadline
                  ? moment(vacancy.applicationDeadline).format('MMM D, YYYY')
                  : 'No Deadline'}
              </span>
            </div>
          </div>

          {/* Skills Section */}
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Required Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {vacancy.skillsRequired ? (
                vacancy.skillsRequired
                  .toString()
                  .split(',')
                  .map((skill: string, i: number) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="h-5 rounded-sm bg-gray-100 px-1.5 py-0 text-[10px] font-medium text-gray-700 hover:bg-gray-200"
                    >
                      {skill.trim()}
                    </Badge>
                  ))
              ) : (
                <span className="text-xs text-gray-400">N/A</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Create Applicant Section */}

      {/* Applicant Table */}
      <div className="space-y-3 rounded-md bg-white p-4 shadow-lg">
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
                className="bg-theme text-white hover:bg-theme/90"
              >
                Search
              </Button>
            </div>
          </div>
          <Button
            onClick={() => {
              navigate(`/company/${id}/vacancy/add-applicant/${vid}`);
            }}
            className="h-8 bg-theme text-white hover:bg-theme/90"
          >
            <Plus /> Create Applicant
          </Button>
        </div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
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
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/company/${id}/vacancy/view-applicant/${app._id}`)
                      }
                    >
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
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/company/${id}/vacancy/view-applicant/${app._id}`)
                      }
                    >
                      {app.email}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/company/${id}/vacancy/view-applicant/${app._id}`)
                      }
                    >
                      {app.position}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/company/${id}/vacancy/view-applicant/${app._id}`)
                      }
                    >
                      {app.employmentType}
                    </TableCell>
                    
                    <TableCell className="flex flex-row items-end justify-end gap-2 text-right">
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
                            className="cursor-pointer hover:bg-theme hover:text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {app.status === 'shortlisted'
                              ? 'Remove from Shortlisted'
                              : 'Make Shortlisted'}
                          </DropdownMenuItem>
                          {app.status !== 'hired' && (
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  `/company/${id}/vacancy/recruit-applicant/${app._id}`,
                                  { state: { applicant: app } }
                                )
                              }
                              className="cursor-pointer hover:bg-theme hover:text-white"
                            >
                              <UserRoundPlus className="mr-2 h-4 w-4" />
                              Recruit Applicant
                            </DropdownMenuItem>
                          )}
                           {app.status !== 'hired' && (
                          <DropdownMenuItem
                            onClick={() => {
                              handleDelete(app._id);
                            }}
                            className="cursor-pointer text-destructive hover:bg-red-700 hover:text-white"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {applicants.length > 50 && (
              <>
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
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
