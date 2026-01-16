import { useEffect, useState } from 'react';
import { AlertCircle, Pen, Plus } from 'lucide-react';
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
import { NoticeDialog } from './components/NoticeDialog';

// React Datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminNoticeBoard() {
  const [notice, setNotice] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  
  // Date Filter State
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  // Filter states (Only Users/Companies now)
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const userRes = await axiosInstance.get('/users?role=company&limit=all');
        setUsers(userRes.data.data.result);
      } catch (err) {
        console.error('Error fetching filters', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch Data Function
  const fetchData = async (
    page: number,
    entries: number,
    start?: Date | null,
    end?: Date | null,
    userIds?: string[]
  ) => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/admin-notice`, {
        params: {
          page,
          limit: entries,
          ...(start && { startDate: moment(start).format('YYYY-MM-DD') }),
          ...(end && { endDate: moment(end).format('YYYY-MM-DD') }),
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
          `/admin-notice/${editingNotice?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/admin-notice`, data);
      }

      if (response.data && response.data.success) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-supperagent border-none text-white'
        });
      } else {
        toast({
          title: response.data.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
      
      // Refresh data
      fetchData(
        currentPage, 
        entriesPerPage,
        startDate,
        endDate,
        selectedUsers.map((d) => d.value)
      );
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
      await axiosInstance.patch(`/admin-notice/${id}`, { status: updatedStatus });
      toast({
        title: 'Record updated successfully',
        className: 'bg-green-500 border-none text-white'
      });
      
      // Refresh data
      fetchData(
        currentPage, 
        entriesPerPage,
        startDate,
        endDate,
        selectedUsers.map((d) => d.value)
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  };

  // Initial fetch and fetch on dependencies change (Auto-filter)
  useEffect(() => {
    fetchData(
      currentPage,
      entriesPerPage,
      startDate,
      endDate,
      selectedUsers.map((d) => d.value)
    );
  }, [
    currentPage,
    entriesPerPage,
    selectedUsers,
    startDate,
    endDate
  ]);

  return (
    <div className="space-y-3 bg-white p-3 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className='flex flex-row items-center gap-4'>

        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          All Notice
        </h2>
         <div className="flex flex-wrap items-center gap-4">
        
        {/* User/Company Filter */}
        <div className="w-64">
          <label className="mb-1 block text-sm font-medium">Companies</label>
          <Select
            isMulti
            options={users.map((u) => ({
              value: u._id,
              label: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
            }))}
            value={selectedUsers}
            onChange={(val) => setSelectedUsers(val as any)}
            placeholder="Select Companies"
          />
        </div>

        {/* React Date Picker */}
        <div className="w-72">
          <label className="mb-1 block text-sm font-medium">
            Filter By Date
          </label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
              // Reset to page 1 when filter changes (optional but recommended)
              if (currentPage !== 1) setCurrentPage(1);
            }}
            isClearable={true}
            placeholderText="Select date range"
            className="flex w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-supperagent focus:ring-supperagent outline-none shadow-sm h-[38px]"
            dateFormat="MMM d, yyyy"
          />
        </div>
      </div>
        </div>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Notice
        </Button>
      </div>

      {/* Filters */}
     

      {/* Table */}
      <div className="py-4 ">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : notice.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notice Description</TableHead>
                <TableHead>Notice Date</TableHead>
                <TableHead>Notice By</TableHead>
                {/* <TableHead>Target Users</TableHead> */}
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notice.map((n) => (
                <TableRow key={n._id}>
                  {/* Description */}
                  <TableCell className="max-w-md truncate" title={n.noticeDescription}>
                    {n.noticeDescription}
                  </TableCell>
                  
                  {/* Date (using createdAt as per schema) */}
                  <TableCell>
                    {moment(n.createdAt).format('MMMM Do YYYY')}
                  </TableCell>
                  
                  {/* Notice By */}
                  <TableCell>
                    {n.noticeBy ? (
                      <span className="font-medium">
                        {n.noticeBy?.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </TableCell>
                  
                  {/* Target Users / Setting */}
                  {/* <TableCell>
                    {n.noticeSetting === 'all' ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        All Companies
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {n.users && n.users.length > 0 ? (
                          n.users.map((u: any, idx: number) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {u.name || `${u.firstName} ${u.lastName}`}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    )}
                  </TableCell> */}
                  
                  {/* Status */}
                  <TableCell className="text-center">
                    <Switch
                      checked={n.status === 'active'}
                      onCheckedChange={(checked) =>
                        handleStatusChange(n._id, checked)
                      }
                      className="mx-auto"
                    />
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
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
        
        {notice.length > 40 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
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