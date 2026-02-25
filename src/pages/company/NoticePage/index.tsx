import { useEffect, useState } from 'react';
import { Pen, Plus, Calendar as CalendarIcon } from 'lucide-react';
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
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import Select from 'react-select';

// --- IMPORTS FOR REACT DATEPICKER ---
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { NoticeDialog } from './components/NoticeDialog';
import { useParams } from 'react-router-dom';

export default function CompanyNoticeBoard() {
  const [notice, setNotice] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const {id:companyId} = useParams()
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // --- DATE PICKER STATE ---
  // We store start and end date in a single array or separate variables.
  // react-datepicker range mode uses [start, end]
  const [dateRange, setDateRange] = useState<(Date | null)[]>([null, null]);
  const [startDate, endDate] = dateRange;

  // Filter states
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [deptRes, desigRes, userRes] = await Promise.all([
            axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
                 axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
                 axiosInstance.get(`/users?company=${companyId}&limit=all`)
        ]);
        setDepartments(deptRes.data.data.result);
        setDesignations(desigRes.data.data.result);
        setUsers(userRes.data.data.result);
      } catch (err) {
        console.error('Error fetching filters', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchData = async (
    page: number,
    entries: number,
    startStr?: string | null,
    endStr?: string | null,
    departmentIds?: string[],
    designationIds?: string[],
    userIds?: string[]
  ) => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/notice?companyId=${companyId}`, {
        params: {
          page,
          limit: entries,
          ...(startStr && { startDate: startStr }),
          ...(endStr && { endDate: endStr }),
          ...(departmentIds?.length && { department: departmentIds.join(',') }),
          ...(designationIds?.length && {
            designation: designationIds.join(',')
          }),
          ...(userIds?.length && { users: userIds.join(',') })
        }
      });
      setNotice(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching Notice:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let response;
      if (editingNotice) {
        response = await axiosInstance.patch(
          `/hr/notice/${editingNotice?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/hr/notice`, data);
      }

      if (response.data && response.data.success) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-theme border-none text-white'
        });
      } else {
        toast({
          title: response.data.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
      handleSearch();
      setEditingNotice(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleStatusChange = async (id: string, status: boolean) => {
    try {
      const updatedStatus = status ? 'active' : 'inactive';
      await axiosInstance.patch(`/hr/notice/${id}`, { status: updatedStatus });
      toast({
        title: 'Record updated successfully',
        className: 'bg-green-500 border-none text-white'
      });
      handleSearch();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  };

  // Helper to format dates and fetch
  const handleSearch = () => {
    const formattedStart = startDate
      ? moment(startDate).format('YYYY-MM-DD')
      : undefined;
    const formattedEnd = endDate
      ? moment(endDate).format('YYYY-MM-DD')
      : undefined;

    fetchData(
      currentPage,
      entriesPerPage,
      formattedStart,
      formattedEnd,
      selectedDepartments.map((d) => d.value),
      selectedDesignations.map((d) => d.value),
      selectedUsers.map((d) => d.value)
    );
  };

  // Auto-fetch when filters change
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    entriesPerPage,
    selectedDepartments,
    selectedDesignations,
    selectedUsers,
    startDate, // Trigger when start date changes
    endDate // Trigger when end date changes
  ]);

  return (
    <div className="space-y-3 rounded-md bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          All Notice
        </h2>
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Notice
        </Button>
      </div>

      <div className="">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-64">
            <label className="mb-1 block text-sm font-medium">Department</label>
            <Select
              isMulti
              options={departments.map((d) => ({
                value: d._id,
                label: d.departmentName
              }))}
               menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
              className="react-select-container"
              classNamePrefix="react-select"
              value={selectedDepartments}
              onChange={(val) => setSelectedDepartments(val as any)}
            />
          </div>

          <div className="w-64">
            <label className="mb-1 block text-sm font-medium">
              Designation
            </label>
            <Select
              isMulti
              options={designations.map((d) => ({
                value: d._id,
                label: d.title
              }))}
               menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
              className="react-select-container"
              classNamePrefix="react-select"
              value={selectedDesignations}
              onChange={(val) => setSelectedDesignations(val as any)}
            />
          </div>

          <div className="w-64">
            <label className="mb-1 block text-sm font-medium">Users</label>
            <Select
              isMulti
              options={users.map((u) => ({
                value: u._id,
                label: `${u.firstName} ${u.lastName}`
              }))}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
              className="react-select-container"
              classNamePrefix="react-select"
              value={selectedUsers}
              onChange={(val) => setSelectedUsers(val as any)}
            />
          </div>

          {/* --- REACT DATEPICKER IMPLEMENTATION --- */}
          <div className="w-">
            <label className="mb-1 block text-sm font-medium">
              Filter By Date
            </label>
            <div className="relative">
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                }}
                popperClassName="z-[99999]"
                portalId="root-portal"
                isClearable={true}
                placeholderText="Select Date Range"
                className="flex h-10 w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="py-4 ">
          {initialLoading ? (
            <div className="flex justify-center py-6">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : notice.length === 0 ? (
            <div className="flex justify-center py-6 text-gray-500">
              No records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notice Type</TableHead>
                  <TableHead>Notice Description</TableHead>
                  <TableHead>Notice Date</TableHead>
                  <TableHead>Notice By</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-32 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notice.map((n) => (
                  <TableRow key={n._id}>
                    <TableCell>
                      {n.noticeType.charAt(0).toUpperCase() +
                        n.noticeType.slice(1)}
                    </TableCell>
                    <TableCell>{n.noticeDescription}</TableCell>
                    <TableCell>
                      {moment(n.noticeDate).format('MMMM Do YYYY')}
                    </TableCell>
                    <TableCell>
  {n.noticeBy?.firstName || n.noticeBy?.lastName
    ? `${n.noticeBy?.firstName ?? ""} ${n.noticeBy?.lastName ?? ""}`.trim()
    : n.noticeBy?.name}
</TableCell>
                    <TableCell>
                      {n.department
                        ?.map((d: any) => d.departmentName)
                        .join(', ') || '-'}
                    </TableCell>
                    <TableCell>
                      {n.designation?.map((d: any) => d.title).join(', ') ||
                        '-'}
                    </TableCell>
                    <TableCell>
                      {n.users
                        ?.map((u: any) => `${u.firstName} ${u.lastName}`)
                        .join(', ') || '-'}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        className="border-none bg-theme text-white hover:bg-theme/90"
                        size="icon"
                        onClick={() => handleEdit(n)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {notice.length > 9 && (
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
      <NoticeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingNotice(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingNotice}
      />
    </div>
  );
}
