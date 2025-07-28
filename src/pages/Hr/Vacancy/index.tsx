import { useEffect, useState } from 'react';
import { Eye, Pen, Plus, PlusIcon } from 'lucide-react';
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
// import { InstitutionDialog } from './components/institution-dialog';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
// import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useNavigate } from 'react-router-dom';

export default function Vacancy() {
  const [vacancy, setVacancy] = useState<any>([]);
  //   const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/vacancy`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setVacancy(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching Vacancy:', error);
    } finally {
      setInitialLoading(false);
    }
  };


  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? 'active' : 'closed';
      await axiosInstance.patch(`/hr/vacancy/${id}`, {
        status: updatedStatus
      });
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const navigate = useNavigate();

  const handleNewVacancyClick = () => {
    navigate('/admin/hr/create-vacancy');
  };

  const handleEdit = (data) => {
   
    navigate(`/admin/hr/edit-vacancy/${data._id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Vacancy</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={handleNewVacancyClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Vacancy
        </Button>
      </div>

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
                <TableHead> Employment Type</TableHead>
                <TableHead> Application Deadline</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className=" text-right" colSpan={3}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacancy.map((vacancy) => (
                <TableRow key={vacancy._id}>
                  <TableCell>{vacancy.title}</TableCell>
                  <TableCell>{vacancy.employmentType}</TableCell>
                  <TableCell>
                    {moment(vacancy.applicationDeadline).format('MMMM Do YYYY')}
                  </TableCell>
                  <TableCell>{vacancy.postedBy.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={vacancy.status == 'active'}
                      onCheckedChange={(checked) =>
                        handleStatusChange(vacancy._id, checked)
                      }
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="flex flex-row items-end justify-end gap-2 text-right">
                    <Button
                      variant="ghost"
                      className=" border-none bg-supperagent  text-sm text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={() => {
                        navigate(`/admin/hr/view-applicants/${vacancy._id}`);
                      }}
                    >
                      <Eye size={24} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={() => {
                        handleEdit(vacancy);
                      }}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      className=" border-none bg-supperagent px-2 text-sm text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={() => {
                        navigate(`/admin/hr/add-applicant/${vacancy._id}`, {
                          state: { vacancyTitle: vacancy.title }
                        });
                      }}
                    >
                      <PlusIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
