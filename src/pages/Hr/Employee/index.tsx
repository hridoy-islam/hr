import { useEffect, useState } from 'react';
import { DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

interface OptionType {
  value: string;
  label: string;
}

export default function Employee() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [departments, setDepartments] = useState<OptionType[]>([]);
  const [designations, setDesignations] = useState<OptionType[]>([]);
  const [trainings, setTrainings] = useState<OptionType[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<OptionType | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<OptionType | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<OptionType | null>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const params: any = {
        page: currentPage,
        limit: entriesPerPage,
        role: 'employee',
      };

      if (searchTerm) params.searchTerm = searchTerm;
      if (selectedDepartment) params.departmentId = selectedDepartment.value;
      if (selectedDesignation) params.designationId = selectedDesignation.value;
      if (selectedTraining) params.trainingId = selectedTraining.value; // Backend must support array query

      const response = await axiosInstance.get('/users', { params });

      setEmployees(response.data.data.result || []);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load employees.',
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, desigRes, trainingRes] = await Promise.all([
          axiosInstance.get('/hr/department?limit=all'),
          axiosInstance.get('/hr/designation?limit=all'),
          axiosInstance.get('/hr/training?limit=all'),
        ]);

        setDepartments(
          deptRes.data.data.result.map((d: any) => ({ value: d._id, label: d.departmentName }))
        );
        setDesignations(
          desigRes.data.data.result.map((d: any) => ({ value: d._id, label: d.title }))
        );
        setTrainings(
          trainingRes.data.data.result.map((t: any) => ({ value: t._id, label: t.name }))
        );
      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast({
          title: 'Error',
          description: 'Failed to load filter options.',
          variant: 'destructive',
        });
      }
    };
    fetchOptions();
  }, []);

  // Refetch employees when filters/pagination/searchTerm change
  useEffect(() => {
    fetchData();
  }, [
    currentPage,
    entriesPerPage,
    searchTerm,
    selectedDepartment,
    selectedDesignation,
    selectedTraining,
  ]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedDepartment(null);
    setSelectedDesignation(null);
    setSelectedTraining(null);
    setCurrentPage(1);
  };

  const handleStatusChange = async (id: string, status: boolean) => {
    try {
      const updatedStatus = status ? 'active' : 'block';
      await axiosInstance.patch(`/users/${id}`, { status: updatedStatus });
      toast({
        title: 'Success',
        description: 'Status updated successfully.',
        className: 'bg-supperagent text-white',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3 ">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Employees</h1>
      </div>

      {/* Search & Filter Section */}
      <div className="rounded-lg bg-white p-5 shadow-md space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email"
              className="h-10 text-sm"
            />
          </div>
          <div>
            <Select
              options={departments}
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              placeholder="Department"
              isClearable
              className="text-sm"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <div>
            <Select
              options={designations}
              value={selectedDesignation}
              onChange={setSelectedDesignation}
              placeholder="Designation"
              isClearable
              className="text-sm"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          {/* <div>
            <Select
              options={trainings}
              value={selectedTraining}
              onChange={setSelectedTraining}
              placeholder="Training"
              isClearable
              className="text-sm"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div> */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <Button
              onClick={handleSearch}
              className="bg-supperagent text-white hover:bg-supperagent/90 flex items-center gap-1 h-9 w-20"
              size="sm"
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              size="sm"
              className="flex items-center gap-1 h-9"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-md bg-white p-4 shadow-lg">
        {initialLoading ? (
          <div className="flex justify-center py-8">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex justify-center py-8 text-gray-500">
            No employees found matching your criteria.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell  onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}>
                      {employee.title} {employee.firstName} {employee.initial} {employee.lastName}
                    </TableCell>
                    <TableCell  onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}>{employee.email}</TableCell>
                    <TableCell  onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}>{employee.mobilePhone || '–'}</TableCell>
                    <TableCell  onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}>{employee.departmentId?.departmentName || '–'}</TableCell>
                    <TableCell  onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}>{employee.designationId?.title || '–'}</TableCell>
                   
                    <TableCell>
                      <Switch
                        checked={employee.status === 'active'}
                        onCheckedChange={(checked) => handleStatusChange(employee._id, checked)}
                        className="mx-auto"
                      />
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-supperagent text-white hover:bg-supperagent/90"
                        onClick={() =>
                          navigate(`/admin/hr/employee/${employee._id}/employee-rate`, {
                            state: employee,
                          })
                        }
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-supperagent text-white hover:bg-supperagent/90"
                        onClick={() => navigate(`/admin/hr/employee/${employee._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6">
              <DynamicPagination
                pageSize={entriesPerPage}
                setPageSize={setEntriesPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
