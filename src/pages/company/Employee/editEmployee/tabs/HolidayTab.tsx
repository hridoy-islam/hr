import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CalendarDays, Users, Edit2, Save, X } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useParams } from 'react-router-dom';
import moment from '@/lib/moment-setup';

interface HolidayTabProps {
  formData?: any;
}

const HolidayTab: React.FC<HolidayTabProps> = ({ formData }) => {
  const getCurrentHolidayYear = () => {
    const year = moment().year();
    return `${year}-${year + 1}`;
  };

  // ── State ──
  const [selectedYear, setSelectedYear] = useState(getCurrentHolidayYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { id, eid } = useParams(); // target user's ID

  const [holidays, setHolidays] = useState<any[]>([]);

  // To update the record, we need its DB _id
  const [holidayRecordId, setHolidayRecordId] = useState<string | null>(null);

  // Exact sync with your new DB schema
  const [leaveAllowance, setLeaveAllowance] = useState({
    holidayAllowance: 0,
    holidayAccured: 0,
    usedHours: 0,
    bookedHours: 0,
    requestedHours: 0,
    remainingHours: 0,
    unpaidLeaveTaken: 0,
    unpaidBookedHours: 0,
    unpaidLeaveRequest: 0
  });

  // Edit Allowance States
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [editAllowanceValue, setEditAllowanceValue] = useState<number | string>(
    0
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Data Fetching ──
  const fetchHolidayAllowance = async () => {
    try {
      const response = await axiosInstance.get(
        `/hr/holidays?userId=${eid}&year=${selectedYear}&limit=all`
      );

      const responseData =
        response.data?.data?.result || response.data?.data || response.data;

      let holidayRecord = null;
      if (Array.isArray(responseData)) {
        holidayRecord = responseData.find(
          (item: any) => item.year === selectedYear
        );
      } else if (responseData?.year === selectedYear) {
        holidayRecord = responseData;
      }

      if (holidayRecord) {
        setHolidayRecordId(holidayRecord._id); // Save ID for PATCH request

        setLeaveAllowance({
          holidayAllowance: holidayRecord.holidayAllowance || 0,
          holidayAccured: holidayRecord.holidayAccured || 0,
          usedHours: holidayRecord.usedHours || 0,
          bookedHours: holidayRecord.bookedHours || 0,
          requestedHours: holidayRecord.requestedHours || 0,
          remainingHours: holidayRecord.remainingHours || 0,
          unpaidLeaveTaken: holidayRecord.unpaidLeaveTaken || 0,
          unpaidBookedHours: holidayRecord.unpaidBookedHours || 0,
          unpaidLeaveRequest: holidayRecord.unpaidLeaveRequest || 0
        });
        setEditAllowanceValue(holidayRecord.holidayAllowance || 0);
      } else {
        setHolidayRecordId(null);
        setLeaveAllowance({
          holidayAllowance: 0,
          holidayAccured: 0,
          usedHours: 0,
          bookedHours: 0,
          requestedHours: 0,
          remainingHours: 0,
          unpaidLeaveTaken: 0,
          unpaidBookedHours: 0,
          unpaidLeaveRequest: 0
        });
        setEditAllowanceValue(0);
      }
    } catch (err: any) {
      console.error('Error fetching holiday allowance:', err);
    }
  };

const fetchLeaveRequests = async () => {
    try {
      // Added holidayYear to the query parameters
      const response = await axiosInstance.get(
        `/hr/leave?userId=${eid}&holidayYear=${selectedYear}&limit=all`
      );
      let data =
        response.data.data?.result || response.data.data || response.data || [];

      // Kept local filter as a safety fallback
      const filteredData = data.filter(
        (item: any) => item.holidayYear === selectedYear
      );

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
      console.error('Error fetching leave requests:', err);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchHolidayAllowance(), fetchLeaveRequests()])
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, selectedYear]);

  // ── Update Action ──
  const handleUpdateAllowance = async () => {
    if (!holidayRecordId) {
      toast({
        title: 'No holiday record exists for this year to update yet.',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Patch request to update the holiday allowance opening balance
      await axiosInstance.patch(`/hr/holidays/${holidayRecordId}`, {
        holidayAllowance: Number(editAllowanceValue)
      });

      toast({ title: 'Allowance updated successfully!' });
      setIsEditingAllowance(false);

      // Refresh the data to get newly calculated remaining balances
      await fetchHolidayAllowance();
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Failed to update allowance',
        variant: 'destructive'
      });
      console.error('Error updating allowance:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Helpers ──
  const mapStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const generateHolidayYears = (backward = 20, forward = 50) => {
    const currentYear = moment().year();
    const years: string[] = [];
    for (let i = backward; i > 0; i--) {
      const start = currentYear - i;
      years.push(`${start}-${start + 1}`);
    }
    years.push(`${currentYear}-${currentYear + 1}`);
    for (let i = 1; i <= forward; i++) {
      const start = currentYear + i;
      years.push(`${start}-${start + 1}`);
    }
    return years;
  };

  const holidayYears = useMemo(() => generateHolidayYears(20, 50), []);

  // ── Memoized Allowance Stats ──
  const allowanceStatsList = useMemo(
    () => [
      {
        label: 'Holiday Accrued',
        value: leaveAllowance.holidayAccured,
        color: 'text-gray-800'
      },
      {
        label: 'Taken',
        value: leaveAllowance.usedHours,
        color: 'text-green-600'
      },
      {
        label: 'Booked',
        value: leaveAllowance.bookedHours,
        color: 'text-orange-600'
      },
      {
        label: 'Requested',
        value: leaveAllowance.requestedHours,
        color: 'text-yellow-600'
      },
      {
        label: 'Unpaid Leave Taken',
        value: leaveAllowance.unpaidLeaveTaken,
        color: 'text-cyan-600'
      },
      {
        label: 'Unpaid Booked',
        value: leaveAllowance.unpaidBookedHours,
        color: 'text-blue-600'
      },
      {
        label: 'Unpaid Requested',
        value: leaveAllowance.unpaidLeaveRequest,
        color: 'text-theme'
      }
    ],
    [leaveAllowance]
  );

  // ── Render Guards ──
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-600">Error: {error}</div>
        <Button
          onClick={() => {
            fetchHolidayAllowance();
            fetchLeaveRequests();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── JSX ──
  return (
    <div className="">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Left: Leave Requests Table ── */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-theme" />
                {`${formData?.firstName || 'User'}'s`} Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-start gap-4">
                <span className="font-semibold text-gray-700">
                  Holiday Year:
                </span>
                <ShadcnSelect
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {holidayYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {leaveAllowance.holidayAllowance.toFixed(1)} h
                    </div>
                    <div className="text-sm text-gray-600">Total Allowance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {leaveAllowance.usedHours.toFixed(1)} h
                    </div>
                    <div className="text-sm text-gray-600">Taken</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {leaveAllowance.bookedHours.toFixed(1)} h
                    </div>
                    <div className="text-sm text-gray-600">Booked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {leaveAllowance.remainingHours.toFixed(1)} h
                    </div>
                    <div className="text-sm text-gray-600">
                      Remaining Balance
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="w-[10vw]">Reason</TableHead>
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
                            <TableCell>{formatDate(holiday.endDate)}</TableCell>
                            <TableCell className="w-[30%] whitespace-pre-wrap font-medium">
                              {holiday?.reason || '-'}
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

        {/* ── Right: Allowance & Edit Functionality ── */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Leave Allowance
                </div>
                {!isEditingAllowance && (
                  <Button
                    size="sm"
                    onClick={() => setIsEditingAllowance(true)}
                  >
                    Edit{' '}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Editable Holiday Allowance Row */}
                {isEditingAllowance ? (
                  <div className="flex flex-col gap-2 border-b border-gray-300 py-2">
                    <span className="font-medium text-gray-600">
                      Opening This Year
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        className="h-8 w-48 text-left"
                        value={editAllowanceValue}
                        onChange={(e) => setEditAllowanceValue(e.target.value)}
                        disabled={isUpdating}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={handleUpdateAllowance}
                        disabled={isUpdating}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setIsEditingAllowance(false);
                          setEditAllowanceValue(
                            leaveAllowance.holidayAllowance
                          ); // reset
                        }}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="font-medium text-gray-600">
                      Opening This Year
                    </span>
                    <span className="font-semibold text-gray-800">
                      {leaveAllowance.holidayAllowance.toFixed(2)} h
                    </span>
                  </div>
                )}

                {/* Rest of the UI map */}
                {allowanceStatsList.map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-300 py-2"
                  >
                    <span className="text-gray-600">{label}</span>
                    <span className={`font-semibold ${color}`}>
                      {value.toFixed(2)} h
                    </span>
                  </div>
                ))}

                {/* Remaining Balance Total */}
                <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="font-semibold text-black">
                    Balance Remaining
                  </span>
                  <span className="text-lg font-bold text-theme">
                    {leaveAllowance.remainingHours.toFixed(2)} h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HolidayTab;
