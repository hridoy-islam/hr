import { useEffect, useState } from 'react';
import { Building, Pen, Plus } from 'lucide-react';
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

import { Input } from '@/components/ui/input';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { DepartmentDialog } from './Components/departmentDialog';
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

export default function Department() {
  const [department, setDepartment] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
const user = useSelector((state: any) => state.auth.user);
const {id} = useParams()
  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/department`, {
        params: {
          page,
          limit: entriesPerPage,
          companyId:id,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setDepartment(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingDepartment) {
        // Update institution
        response = await axiosInstance.patch(
          `/hr/department/${editingDepartment?._id}`,
          data
        );
      } else {
        // Create new institution

        response = await axiosInstance.post(`/hr/department`, {
        ...data,
        companyId: id
      });
      }

      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-theme border-none text-white'
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: response.data.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      } else {
        toast({
          title: 'Unexpected response. Please try again.',
          className: 'bg-red-500 border-none text-white'
        });
      }

      // Refresh data
      fetchData(currentPage, entriesPerPage);
      setEditingDepartment(undefined); // Reset editing state
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? 'active' : 'inactive';
      await axiosInstance.patch(`/hr/department/${id}`, {
        status: updatedStatus
      });
      toast({
        title: 'Record updated successfully',
        className: 'bg-theme border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Building className="h-6 w-6" />
            All Departments
          </h2>{' '}
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Department Name"
              className="h-8 min-w-[250px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="min-w-[100px] border-none bg-theme text-white hover:bg-theme/90"
            >
              Search
            </Button>
          </div>
        </div>
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Department
        </Button>
      </div>

      <div className="">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : department.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                {/* <TableHead className="text-center">Status</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {department.map((department) => (
                <TableRow key={department._id}>
                  <TableCell>{department.departmentName}</TableCell>

                  {/* <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={department.status === 'active'}
                        onCheckedChange={(checked) =>
                          handleStatusChange(department._id, checked)
                        }
                      />
                      <Badge
                        variant={
                          department.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                        className={`
        min-w-[70px] justify-center shadow-none
        ${
          department.status === 'active'
            ? 'bg-theme text-white hover:bg-theme/90'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }
      `}
                      >
                        {department.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell> */}
                  <TableCell className="text-center">
                    <div className="flex flex-row items-center  justify-end gap-4">
                      <Button
                        size="icon"
                        onClick={() => handleEdit(department)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {department.length > 50 && (
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
      </div>
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingDepartment(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingDepartment}
      />
    </div>
  );
}
