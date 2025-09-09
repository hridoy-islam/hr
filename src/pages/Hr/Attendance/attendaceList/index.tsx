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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AttendanceDialog } from './components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function AttendanceList() {
  const [attendance, setAttendance] = useState<any>([]);
  const [employeeRates, setEmployeeRates] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendence, setEditingAttendence] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  // Track modified records
  const [modifiedAttendance, setModifiedAttendance] = useState<{
    [key: string]: any;
  }>({});

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/attendance`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      let fetchedData = response.data.data.result;
      fetchedData = fetchedData.filter(
        (item) => item.approvalStatus !== 'pending'
      );
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
      console.error('Error fetching data:', error);
      toast({
        title: 'Failed to load data',
        className: 'bg-red-500 border-none text-white'
      });
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
      .filter(Boolean);
    return shiftDescriptions.length > 0
      ? shiftDescriptions.join(', ')
      : 'Not assigned';
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
      } else {
        toast({
          title: 'Operation failed',
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

 const updateAttendance = async (id) => {
  try {
    const record = attendance.find((a) => a._id === id);
    const modified = modifiedAttendance[id] || {};

    const clockInRaw = modified.clockIn !== undefined ? modified.clockIn : moment(record.clockIn).format('HH:mm');
    const clockOutRaw = modified.clockOut !== undefined
      ? modified.clockOut
      : record.clockOut
        ? moment(record.clockOut).format('HH:mm')
        : '';

    const payload = {
      clockIn: formatTimeForBackend(clockInRaw),
      clockOut: clockOutRaw ? formatTimeForBackend(clockOutRaw) : null
    };

    await axiosInstance.patch(`/hr/attendance/${id}`, payload);

    toast({
      title: 'Attendance updated successfully',
      className: 'bg-supperagent border-none text-white'
    });

    // Clean up modified record
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


  // Helper function to format time for backend (assuming backend expects ISO string)
  const formatTimeForBackend = (timeString) => {
    if (!timeString) return null;

    // If time is in HH:mm format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toISOString();
    }

    // If time is just digits (e.g., "0930")
    if (/^\d+$/.test(timeString)) {
      const hours = timeString.slice(0, 2);
      const minutes = timeString.slice(2);
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
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
    <div className="space-y-3">
      <div className="flex flex-col gap-4">
        <Card className="w-full shadow-lg">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
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
            <div className="flex w-full flex-row justify-start gap-12 text-sm text-gray-700 md:text-base">
              <div className="flex flex-row items-center gap-2">
                <p className="font-medium text-gray-600">Attendance Date:</p>
                <p className="font-bold text-gray-900">{date}</p>
              </div>
              <div className="flex flex-row items-center gap-2">
                <p className="font-medium text-gray-600">Attendance Count:</p>
                <p className="font-bold text-gray-900">{count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md bg-white p-4 shadow-lg">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Punch Time</TableHead>
                <TableHead className="text-center">Authorized</TableHead>
                <TableHead>Duration</TableHead>
                
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((attendence) => (
                <TableRow key={attendence._id}>
                  <TableCell>
                    {attendence?.userId?.title} {attendence?.userId?.firstName}
                  </TableCell>
                  <TableCell>{getShiftName(attendence?.userId?._id)}</TableCell>
                  <TableCell>
                    {moment(attendence?.clockIn).format('HH:mm')}
                    {attendence?.clockOut &&
                      ` - ${moment(attendence.clockOut).format('HH:mm')}`}
                  </TableCell>
                  <TableCell className="flex flex-row items-center justify-center gap-4 text-center">
                    <div className="w-32">
                      <Input
                        type="text"
                        placeholder="HH:mm"
                        value={
                          modifiedAttendance[attendence._id]?.clockIn !==
                          undefined
                            ? modifiedAttendance[attendence._id]?.clockIn
                            : moment(attendence.clockIn).format('HH:mm')
                        }
                        onChange={(e) => {
                          // Get cursor position before change
                          const cursorPos = e.target.selectionStart;
                          handleTimeChange(
                            attendence._id,
                            'clockIn',
                            e.target.value
                          );

                          // Set cursor position after change
                          setTimeout(() => {
                            // If we added a colon, move cursor forward
                            if (
                              e.target.value.includes(':') &&
                              cursorPos &&
                              e.target.value[cursorPos] === ':'
                            ) {
                              e.target.setSelectionRange(
                                cursorPos + 1,
                                cursorPos + 1
                              );
                            }
                          }, 0);
                        }}
                        className="text-center"
                        maxLength={5}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="text"
                        placeholder="HH:mm"
                        value={
                          modifiedAttendance[attendence._id]?.clockOut !==
                          undefined
                            ? modifiedAttendance[attendence._id]?.clockOut
                            : attendence.clockOut
                              ? moment(attendence.clockOut).format('HH:mm')
                              : ''
                        }
                        onChange={(e) => {
                          const cursorPos = e.target.selectionStart;
                          handleTimeChange(
                            attendence._id,
                            'clockOut',
                            e.target.value
                          );
                          setTimeout(() => {
                            if (
                              e.target.value.includes(':') &&
                              cursorPos &&
                              e.target.value[cursorPos] === ':'
                            ) {
                              e.target.setSelectionRange(
                                cursorPos + 1,
                                cursorPos + 1
                              );
                            }
                          }, 0);
                        }}
                        className="text-center"
                        maxLength={5}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {attendence?.clockIn && attendence?.clockOut
                      ? (() => {
                          const duration = moment.duration(
                            moment(attendence.clockOut).diff(
                              moment(attendence.clockIn)
                            )
                          );
                          return `${duration.hours()}h ${duration.minutes()}m`;
                        })()
                      : 'In progress'}
                  </TableCell>
                  <TableCell className="text-center">
                    {modifiedAttendance[attendence._id] && (
                      <Button
                        variant="ghost"
                        className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                        onClick={() => updateAttendance(attendence._id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
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
