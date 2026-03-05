import React, { useEffect, useState } from 'react';
import { Building, Pen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { DepartmentDialog } from './Components/departmentDialog';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

export default function Department() {
  const [department, setDepartment] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [searchTerm, setSearchTerm] = useState('');

  const user = useSelector((state: any) => state.auth.user);
  const { id } = useParams();

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/department`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setDepartment(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const displayRoots = department.filter((dept) => {
    const parentId = dept.parentDepartmentId?._id || dept.parentDepartmentId;
    // If it has no parent, it's a root.
    if (!parentId) return true;
    
    // If it has a parent, check if that parent exists in the current 'department' array
    const parentInResults = department.some(
      (d) => d._id === parentId
    );
    
    // If the parent is NOT in the results, show this child as a top-level item
    return !parentInResults;
  });

  const handleSubmit = async (data: any) => {
    try {
      let response;
      if (editingDepartment) {
        response = await axiosInstance.patch(
          `/hr/department/${editingDepartment?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/hr/department`, {
          ...data,
          companyId: id
        });
      }

      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-theme border-none text-white'
        });
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }

      fetchData(currentPage, entriesPerPage);
      setEditingDepartment(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDepartment(dept);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  // Filter ONLY root departments (those without a parent)
  const rootDepartments = department.filter((dept) => !dept.parentDepartmentId);

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Building className="h-6 w-6" />
            All Departments
          </h2>
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

      <div>
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRoots.map((rootDept) => (
                <React.Fragment key={rootDept._id}>
                  {/* Parent Row */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-900">
                      {rootDept.departmentName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-row items-center justify-end gap-4">
                        <Button
                          size="icon"
                          onClick={() => handleEdit(rootDept)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Child Rows (Rendered immediately after their parent) */}
                  {department
                    .filter(
                      (childDept) =>
                        childDept.parentDepartmentId?._id === rootDept._id ||
                        childDept.parentDepartmentId === rootDept._id
                    )
                    .map((childDept) => (
                      <TableRow key={childDept._id}>
                        <TableCell className="">
                          <span className="ml-6 flex items-center gap-2">
                            └─ {childDept.departmentName}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-row items-center justify-end gap-4">
                            <Button
                              size="icon"
                              onClick={() => handleEdit(childDept)}
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}

        {department.length > 300 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Notice we pass the full list of departments as a prop to the dialog so it can populate the select menu */}
      <DepartmentDialog
        open={dialogOpen}
        departments={department}
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
