import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Calendar,
  ChevronDown,
  CalendarDays,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios'; // Import configured axios
import { useSelector } from 'react-redux';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface HolidayAPI {
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
  holidayType?: string;
  title: string;
  holidayYear: string;
  totalDays?: number;
  totalHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const Holiday: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // State for holidays and allowance
  const [holidays, setHolidays] = useState<HolidayAPI[]>([]);
  const [leaveAllowance, setLeaveAllowance] = useState({
    openingThisYear: 224, // Default 28 days × 8 hours
    bankHolidayAutoBooked: 0,
    taken: 0,
    booked: 0,
    requested: 0,
    leftThisYear: 224
  });

  // Fetch leave requests filtered by year
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all leave requests for the user
      const response = await axiosInstance.get(`/hr/leave?userId=${user._id}`);

      let data =
        response.data.data?.result || response.data.data || response.data || [];

      // Filter by holidayYear (this matches your Leave model)
      const filteredData = data.filter((item: any) => {
        return item.holidayYear === selectedYear;
      });

      const mappedHolidays = filteredData.map((item: any, idx: number) => ({
        id: idx + 1,
        status: mapStatus(item.status),
        startDate: item.startDate,
        endDate: item.endDate,
        title: item.title,
        reason: item.reason,
        hours: formatHours(item.totalHours || 0),
        holidayYear: item.holidayYear
      }));

      setHolidays(mappedHolidays);

      // Recalculate leave summary based on filtered data
      const totalTaken = mappedHolidays
        .filter((h) => h.status === 'Approved')
        .reduce((sum, h) => sum + parseHours(h.hours), 0);

      const totalRequested = mappedHolidays
        .filter((h) => h.status === 'Pending')
        .reduce((sum, h) => sum + parseHours(h.hours), 0);

      const totalBooked = mappedHolidays
        .filter((h) => h.status === 'Approved')
        .reduce((sum, h) => sum + parseHours(h.hours), 0);

      setLeaveAllowance((prev) => ({
        ...prev,
        taken: totalTaken,
        requested: totalRequested,
        booked: totalBooked,
        leftThisYear: prev.openingThisYear - totalTaken - totalRequested
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch leave requests when user or year changes
  useEffect(() => {
    if (user._id) {
      fetchLeaveRequests();
    }
  }, [user._id, selectedYear]); // This will trigger when selectedYear changes

  const mapStatus = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const formatHours = (hours: number): string => {
    if (!hours) return '0:00';
    const h = Math.floor(hours);
    const min = Math.round((hours - h) * 60);
    return `${h}:${min.toString().padStart(2, '0')}`;
  };

  const parseHours = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Bank Holiday Auto Booked':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Auto Booked
          </Badge>
        );
      case 'Approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      case 'Taken':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Taken
          </Badge>
        );
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSubmitRequest = async () => {
    if (!selectedType || !startDate || !endDate || !title || !reason) return;

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const totalHours = totalDays * 8; // assuming 8 hrs/day

    try {
      await axiosInstance.post(`/hr/leave`, {
        holidayYear: selectedYear,
        userId: user._id,
        startDate,
        endDate,
        reason,
        holidayType: selectedType,
        totalDays,
        totalHours,
        status: 'pending',
        title: title
      });

      toast({ title: 'Leave request submitted successfully!' });
      setStartDate(undefined);
      setEndDate(undefined);
      setTitle('');
      setReason('');
      setSelectedType('');
      fetchLeaveRequests(); // Refresh the data
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Submission failed',
        className: 'bg-destructive text-white border-none'
      });
      console.error('Error submitting leave:', err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-600">Error: {error}</div>
        <Button onClick={() => fetchLeaveRequests()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* My Holidays Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  My Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Dropdown Year Selector */}
                <div className="mb-4 flex items-center justify-start gap-4">
                  <span className="font-semibold text-gray-700">
                    Holiday Year:
                  </span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Leave Allowance Summary */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {leaveAllowance.bankHolidayAutoBooked} h
                      </div>
                      <div className="text-sm text-gray-600">Bank Holiday</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {leaveAllowance.taken.toFixed(1)} h
                      </div>
                      <div className="text-sm text-gray-600">Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {leaveAllowance.booked.toFixed(1)} h
                      </div>
                      <div className="text-sm text-gray-600">Booked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {leaveAllowance.leftThisYear.toFixed(1)} h
                      </div>
                      <div className="text-sm text-gray-600">Balance</div>
                    </div>
                  </div>

                  {/* Holiday Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holidays.length > 0 ? (
                          holidays.map((holiday, index) => (
                            <TableRow
                              key={`${holiday.startDate}-${holiday.title}-${index}`}
                            >
                              <TableCell>
                                {getStatusBadge(holiday.status)}
                              </TableCell>
                              <TableCell>
                                {formatDate(holiday.startDate)}
                              </TableCell>
                              <TableCell>
                                {formatDate(holiday.endDate)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {holiday?.title}
                              </TableCell>
                              <TableCell>{holiday.hours}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-gray-500"
                            >
                              No leave requests found for {selectedYear}.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Leave Allowance */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  My Leave Allowance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">Opening This Year</span>
                    <span className="font-semibold">
                      {leaveAllowance.openingThisYear.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">
                      Bank Holiday Auto Booked
                    </span>
                    <span className="font-semibold">
                      {leaveAllowance.bankHolidayAutoBooked.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">Taken</span>
                    <span className="font-semibold text-green-600">
                      {leaveAllowance.taken.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">Booked</span>
                    <span className="font-semibold text-orange-600">
                      {leaveAllowance.booked.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">Requested</span>
                    <span className="font-semibold text-yellow-600">
                      {leaveAllowance.requested.toFixed(1)} h
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <span className="font-semibold text-blue-900">
                      Left This Year
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {leaveAllowance.leftThisYear.toFixed(1)} h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Holiday Request */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-supperagent" />
                  Submit Leave Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="holiday-year">Holiday Year</Label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter leave title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Reason field */}
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for leave"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holiday">
                          Holiday / Vacation
                        </SelectItem>
                        <SelectItem value="personal">Personal Day</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="family">Family Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Select Date</Label>
                    <DatePicker
                      selectsRange
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setStartDate(start ?? undefined);
                        setEndDate(end ?? undefined);
                      }}
                      isClearable
                      placeholderText="Select start and end date"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitRequest}
                    className="w-full bg-supperagent text-white hover:bg-supperagent/90"
                    disabled={
                      !selectedType ||
                      !startDate ||
                      !endDate ||
                      !title ||
                      !reason
                    }
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holiday;
