import { useEffect, useState } from 'react';
import { Pen, PlusIcon, Users2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip';

export default function Vacancy() {
  const [vacancy, setVacancy] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get('/hr/vacancy', {
        params: {
          page,
          limit,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setVacancy(response.data.data.result || []);
      setTotalPages(response.data.data.meta.totalPage || 1);
    } catch (error) {
      console.error('Error fetching Vacancy:', error);
      toast({
        title: 'Failed to fetch vacancies',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleStatusChange = async (id: string, status: boolean) => {
    try {
      const updatedStatus = status ? 'active' : 'closed';
      await axiosInstance.patch(`/hr/vacancy/${id}`, { status: updatedStatus });
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Failed to update status',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // reset to first page on search
    fetchData(1, entriesPerPage, searchTerm);
  };

  const handleNewVacancyClick = () => navigate('/admin/hr/create-vacancy');

  const handleEdit = (vacancyData: any) => {
    navigate(`/admin/hr/edit-vacancy/${vacancyData._id}`);
  };

  return (
    <div className="space-y-4 rounded-md bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className=" flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Users2 className="h-6 w-6" />
          All Vacancies
        </h2>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size="sm"
          onClick={handleNewVacancyClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Vacancy
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Notice Type"
          className="h-8 max-w-[400px]"
        />
        <Button
          onClick={handleSearch}
          size="sm"
          className="min-w-[100px] border-none bg-supperagent text-white hover:bg-supperagent/90"
        >
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : vacancy.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead>Application Deadline</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacancy.map((vac) => (
                <TableRow key={vac._id}>
                  <TableCell>{vac.title}</TableCell>
                  <TableCell>{vac.employmentType}</TableCell>
                  <TableCell>
                    {moment(vac.applicationDeadline).format('MMMM Do YYYY')}
                  </TableCell>
                  <TableCell>{vac?.postedBy?.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={vac.status === 'active'}
                      onCheckedChange={(checked) =>
                        handleStatusChange(vac._id, checked)
                      }
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="flex flex-row items-center justify-end gap-2 text-right">
                    {/* Show Applicants */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/hr/view-applicants/${vac._id}`)
                          }
                        >
                          <Users2 size={24} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show Applicants</TooltipContent>
                    </Tooltip>

                    {/* Edit Vacancy */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                          size="icon"
                          onClick={() => handleEdit(vac)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Vacancy</TooltipContent>
                    </Tooltip>

                    {/* Add Applicant */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="border-none bg-supperagent px-2 text-white hover:bg-supperagent/90"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/hr/add-applicant/${vac._id}`, {
                              state: { vacancyTitle: vac.title }
                            })
                          }
                        >
                          <PlusIcon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add Applicant</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <DynamicPagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
