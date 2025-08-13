import { useEffect, useState } from 'react';
import { Pen, Plus } from 'lucide-react';
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
import { NoticeDialog } from './noticeDialog';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

export default function AdminNoticeBoard() {
  const [notice, setNotice] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showCalendar, setShowCalendar] = useState(false);

  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);

  const fetchData = async (
    page: number,
    entriesPerPage: number,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/notice`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
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

      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-supperagent border-none text-white'
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

      fetchData(currentPage, entriesPerPage);
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
      await axiosInstance.patch(`/hr/notice/${id}`, {
        status: updatedStatus
      });
      toast({
        title: 'Record updated successfully',
        className: 'bg-green-500 border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  };

  useEffect(() => {
    const { startDate, endDate } = dateRange[0];
    fetchData(
      currentPage,
      entriesPerPage,
      startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
      endDate ? moment(endDate).format('YYYY-MM-DD') : undefined
    );
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    const { startDate, endDate } = dateRange[0];
    fetchData(
      currentPage,
      entriesPerPage,
      startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
      endDate ? moment(endDate).format('YYYY-MM-DD') : undefined
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Notice</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Notice
        </Button>
      </div>

      <div className="relative flex flex-row items-center justify-start gap-4">
        <label className="text-sm font-medium">FIlter By Date</label>
        <div className="relative">
          <div
            onClick={() => setShowCalendar((prev) => !prev)}
            className="relative mt-1 flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 px-4 py-2 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-supperagent focus:ring-offset-2 sm:w-[300px]"
          >
            <span className="text-sm text-gray-700">
              {dateRange[0].startDate && dateRange[0].endDate
                ? `${moment(dateRange[0].startDate).format('MMM D, YYYY')} – ${moment(
                    dateRange[0].endDate
                  ).format('MMM D, YYYY')}`
                : 'Select date range'}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {showCalendar && (
            <div className="absolute z-10 mt-2">
              <div className="rounded-lg bg-white p-4 shadow-xl ring-1 ring-black ring-opacity-5">
                <DateRangePicker
                  ranges={dateRange}
                  onChange={(ranges) => setDateRange([ranges.selection])}
                  showSelectionPreview={true}
                  moveRangeOnFirstSelection={false}
                  months={2}
                  direction="horizontal"
                  rangeColors={['#3B82F6']}
                />

                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCalendar(false);
                      setDateRange([
                        {
                          startDate: null,
                          endDate: null,
                          key: 'selection'
                        }
                      ]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCalendar(false);
                      handleSearch();
                    }}
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md bg-white p-4 shadow-lg ">
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
                <TableHead>Notice Type</TableHead>
                <TableHead>Notice Description</TableHead>
                <TableHead>Notice Date</TableHead>
                <TableHead>Notice By</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notice.map((notice: any) => (
                <TableRow key={notice._id}>
                  <TableCell>{notice.noticeType}</TableCell>
                  <TableCell>{notice.noticeDescription}</TableCell>
                  <TableCell>
                    {moment(notice.noticeDate).format('MMMM Do YYYY')}
                  </TableCell>
                  <TableCell>{notice.noticeBy}</TableCell>
                  <TableCell>
                    {notice.department
                      ?.map((d: any) => d?.departmentName)
                      .join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {notice.designation?.map((d: any) => d?.title).join(', ') ||
                      '-'}
                  </TableCell>
                  <TableCell>
                    {notice.users
                      ?.map((u: any) => `${u?.firstName} ${u?.lastName}`)
                      .join(', ') || '-'}
                  </TableCell>

                  <TableCell className="text-center">
                    <Switch
                      checked={notice.status === 'active'}
                      onCheckedChange={(checked) =>
                        handleStatusChange(notice._id, checked)
                      }
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={() => handleEdit(notice)}
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
