import { useEffect, useState } from 'react';
import { MoveLeft, Pen, Plus, Save, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { Card, CardContent } from '@/components/ui/card';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AttendanceDialog } from './components';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function AttendanceApproveList() {
  const [attendence, setAttendance] = useState<any>([]);
  const [employeeRates, setEmployeeRates] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendence, setEditingAttendence] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  // State for time picker
  const [openDialog, setOpenDialog] = useState<null | 'start' | 'end'>(null);
  const [tempTime, setTempTime] = useState({ hour: 0, minute: 0 });
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  // Track modified records
  const [modifiedAttendance, setModifiedAttendance] = useState<{
    [key: string]: any;
  }>({});

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(
        `/hr/attendance?approvalStatus=pending`,
        {
          params: {
            page,
            limit: entriesPerPage,
            ...(searchTerm ? { searchTerm } : {})
          }
        }
      );

      let fetchedData = response.data.data.result;

      // Filter by dateParam if it exists
      if (dateParam) {
        fetchedData = fetchedData.filter((item) =>
          moment(item.clockIn).isSame(dateParam, 'day')
        );
      }

      setAttendance(fetchedData);
      setTotalPages(response.data.data.meta.totalPage);

      const ratesResponse = await axiosInstance.get('/hr/employeeRate');
      setEmployeeRates(ratesResponse.data?.data?.result);
    } catch (error) {
      console.error('Error fetching Attendance:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const getShiftName = (userId) => {
    const employeeRate = employeeRates.find(
      (rate) => rate.employeeId === userId
    );
    if (!employeeRate || !Array.isArray(employeeRate.shiftId)) {
      return 'Not assigned';
    }
    const shiftDescriptions = employeeRate.shiftId
      .map((shift) => {
        if (shift?.name && shift?.startTime && shift?.endTime) {
          return `${shift.name} (${shift.startTime} - ${shift.endTime})`;
        } else if (shift?.name) {
          return shift.name;
        }
        return null;
      })
      .filter(Boolean); // remove null/undefined
    return shiftDescriptions.length > 0
      ? shiftDescriptions.join(', ')
      : 'Not assigned';
  };

  const handleApprove = async (attendance) => {
    try {
      const response = await axiosInstance.patch(
        `/hr/attendance/${attendance._id}`,
        { approvalStatus: 'approved' }
      );
      if (response.data && response.data.success === true) {
        toast({
          title: 'Attendance approved successfully!'
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: 'Approval failed. Please try again.',
          className: 'bg-destructive border-none text-white'
        });
      } else {
        toast({
          title: 'Unexpected response. Please try again.',
          className: 'bg-destructive border-none text-white'
        });
      }
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error approving attendance:', error);
      toast({
        title: 'An error occurred while approving the attendance.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setSelectedAttendance(null);
    }
  };

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingAttendence) {
        response = await axiosInstance.patch(
          `/hr/attendance/${editingAttendence?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/hr/attendance/clock-in`, data);
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
      setEditingAttendence(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleEdit = (notice) => {
    setEditingAttendence(notice);
    setDialogOpen(true);
  };

  const openConfirmDialog = (attendance) => {
    setSelectedAttendance(attendance);
    setConfirmDialogOpen(true);
  };

  const handleTimeChange = (
    id: string,
    type: 'clockIn' | 'clockOut',
    value: string
  ) => {
    const previous = modifiedAttendance[id]?.[type] || '';

    // Allow clearing the field
    if (value === '') {
      setModifiedAttendance((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: ''
        }
      }));
      return;
    }

    // Detect backspacing — allow free form typing
    if (value.length < previous.length) {
      setModifiedAttendance((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: value
        }
      }));
      return;
    }

    // Clean input (keep digits and colon)
    const sanitized = value.replace(/[^0-9]/g, '');
    let formatted = value;

    if (value.includes(':')) {
      // User typed manually, allow partial like '1:' or '12:3'
      const [h, m] = value.split(':');
      const hours = h?.slice(0, 2) ?? '';
      const minutes = m?.slice(0, 2) ?? '';
      formatted = `${hours}${minutes !== '' ? ':' + minutes : ''}`;
    } else {
      // Auto-format based on digits only (e.g. '1538' → '15:38')
      if (sanitized.length <= 2) {
        formatted = sanitized; // '2' or '19'
      } else if (sanitized.length === 3) {
        formatted = `${sanitized.slice(0, 2)}:${sanitized.slice(2)}`;
      } else if (sanitized.length === 4) {
        formatted = `${sanitized.slice(0, 2)}:${sanitized.slice(2)}`;
      } else {
        formatted = previous; // Prevent overflow
      }
    }

    setModifiedAttendance((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [type]: formatted
      }
    }));
  };

  const updateAttendance = async (id: string) => {
    try {
      const record = attendence.find((a) => a._id === id);
      if (!record) return;

      const modified = modifiedAttendance[id] || {};

      const clockInRaw =
        modified.clockIn ?? moment(record.clockIn).format('HH:mm');
      const clockOutRaw =
        modified.clockOut ??
        (record.clockOut ? moment(record.clockOut).format('HH:mm') : '');

      const payload = {
        clockIn: formatTimeForBackend(clockInRaw, record.clockIn),
        clockOut: clockOutRaw
          ? formatTimeForBackend(clockOutRaw, record.clockOut || record.clockIn)
          : null
      };

      await axiosInstance.patch(`/hr/attendance/${id}`, payload);

      toast({
        title: 'Attendance updated successfully',
        className: 'bg-supperagent border-none text-white'
      });

      setModifiedAttendance((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      toast({
        title: 'Failed to update attendance',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  // Helper: preserves the original date, updates only hours and minutes
  const formatTimeForBackend = (timeString, baseDate) => {
    if (!timeString || !baseDate) return null;

    const date = new Date(baseDate); // keep original date

    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date.toISOString();
    }

    if (/^\d+$/.test(timeString)) {
      const hours = timeString.slice(0, 2);
      const minutes = timeString.slice(2);
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date.toISOString();
    }

    return null;
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const navigate = useNavigate();
  const location = useLocation();
  const { count, date } = location.state || {};

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="space-y-4 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Details
          </h1>
          <Button
            className="flex h-9 items-center gap-2 bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Attendance Info */}
        <div className="flex flex-wrap gap-12 text-sm text-gray-700 md:text-base">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-600">Attendance Date:</p>
            <p className="font-bold text-gray-900">
              {moment(date).format('DD MMM, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-600">Attendance Day:</p>
            <p className="font-bold text-gray-900">
              {moment(date).format('dddd')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-600">Attendance Count:</p>
            <p className="font-bold text-gray-900">{count}</p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="rounded-md bg-white">
          {initialLoading ? (
            <div className="flex justify-center py-6">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : attendence.length === 0 ? (
            <div className="flex justify-center py-6 text-gray-500">
              No records found.
            </div>
          ) : (
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Punch Time</TableHead>
                  <TableHead className="text-center">Authorized</TableHead>
                  <TableHead className="w-36 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendence.map((att) => (
                  <TableRow key={att._id}>
                    <TableCell className="whitespace-nowrap">
                      {att?.userId?.title} {att?.userId?.firstName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getShiftName(att?.userId?._id)}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="HH:mm"
                        value={
                          modifiedAttendance[att._id]?.clockIn ??
                          moment(att.clockIn).format('HH:mm')
                        }
                        onChange={(e) =>
                          handleTimeChange(att._id, 'clockIn', e.target.value)
                        }
                        className="h-8 w-24 text-center"
                        maxLength={5}
                      />
                      <Input
                        type="text"
                        placeholder="HH:mm"
                        value={
                          modifiedAttendance[att._id]?.clockOut ??
                          (att.clockOut
                            ? moment(att.clockOut).format('HH:mm')
                            : '')
                        }
                        onChange={(e) =>
                          handleTimeChange(att._id, 'clockOut', e.target.value)
                        }
                        className="h-8 w-24 text-center"
                        maxLength={5}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {att.clockIn && att.clockOut
                        ? (() => {
                            const duration = moment.duration(
                              moment(att.clockOut).diff(moment(att.clockIn))
                            );
                            return `${duration.hours()}h ${duration.minutes()}m`;
                          })()
                        : 'In progress'}
                    </TableCell>
                    <TableCell className="flex justify-center gap-2">
                      {modifiedAttendance[att._id] && (
                        <Button
                          variant="ghost"
                          className="bg-supperagent text-white hover:bg-supperagent/90"
                          size="sm"
                          onClick={() => updateAttendance(att._id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-supperagent px-4 text-white hover:bg-supperagent/90"
                        onClick={() => openConfirmDialog(att)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {attendence.length > 8 && (
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {/* Confirm Dialog */}
          <AlertDialog
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Attendance</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve this attendance?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    selectedAttendance && handleApprove(selectedAttendance)
                  }
                  className="bg-supperagent text-white hover:bg-supperagent/90"
                >
                  Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
