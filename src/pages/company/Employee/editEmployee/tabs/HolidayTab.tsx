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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  const { id, eid } = useParams();

  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayRecordId, setHolidayRecordId] = useState<string | null>(null);

  const [leaveAllowance, setLeaveAllowance] = useState({
    holidayAllowance: 0,
    holidayEntitlement: 0,
    carryForward: 0,
    holidayAccured: 0,
    usedHours: 0,
    bookedHours: 0,
    requestedHours: 0,
    remainingHours: 0,
    unpaidLeaveTaken: 0,
    unpaidBookedHours: 0,
    unpaidLeaveRequest: 0
  });

  // ── Edit Dialog State ──
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editEntitlement, setEditEntitlement] = useState<number | string>(0);
  const [editCarryForward, setEditCarryForward] = useState<number | string>(0);
  const [carryForwardError, setCarryForwardError] = useState<string>('');
  const [previousYearRemainingHours, setPreviousYearRemainingHours] =
    useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Fetch previous year's remaining hours for carry forward validation ──
  const fetchPreviousYearRemainingHours = async () => {
    try {
      // Derive the previous holiday year string
      // e.g. selectedYear = "2026-2027" → prevYear = "2025-2026"
      const [startYear] = selectedYear.split('-').map(Number);
      const prevYear = `${startYear - 1}-${startYear}`;

      const response = await axiosInstance.get(
        `/hr/holidays?userId=${eid}&year=${prevYear}&limit=all`
      );

      const responseData =
        response.data?.data?.result || response.data?.data || response.data;

      let prevRecord = null;
      if (Array.isArray(responseData)) {
        prevRecord = responseData.find((item: any) => item.year === prevYear);
      } else if (responseData?.year === prevYear) {
        prevRecord = responseData;
      }

      // If no record or negative remaining, treat as 0
      const prevRemaining = prevRecord?.remainingHours ?? 0;
      setPreviousYearRemainingHours(Math.max(0, prevRemaining));
    } catch (err) {
      console.error('Error fetching previous year holiday:', err);
      setPreviousYearRemainingHours(0);
    }
  };

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
        setHolidayRecordId(holidayRecord._id);
        setLeaveAllowance({
          holidayAllowance: holidayRecord.holidayAllowance || 0,
          holidayEntitlement: holidayRecord.holidayEntitlement || 0,
          carryForward: holidayRecord.carryForward || 0,
          holidayAccured: holidayRecord.holidayAccured || 0,
          usedHours: holidayRecord.usedHours || 0,
          bookedHours: holidayRecord.bookedHours || 0,
          requestedHours: holidayRecord.requestedHours || 0,
          remainingHours: holidayRecord.remainingHours || 0,
          unpaidLeaveTaken: holidayRecord.unpaidLeaveTaken || 0,
          unpaidBookedHours: holidayRecord.unpaidBookedHours || 0,
          unpaidLeaveRequest: holidayRecord.unpaidLeaveRequest || 0
        });
        setEditEntitlement(holidayRecord.holidayEntitlement || 0);
        setEditCarryForward(holidayRecord.carryForward || 0);
      } else {
        setHolidayRecordId(null);
        setLeaveAllowance({
          holidayAllowance: 0,
          holidayEntitlement: 0,
          carryForward: 0,
          holidayAccured: 0,
          usedHours: 0,
          bookedHours: 0,
          requestedHours: 0,
          remainingHours: 0,
          unpaidLeaveTaken: 0,
          unpaidBookedHours: 0,
          unpaidLeaveRequest: 0
        });
        setEditEntitlement(0);
        setEditCarryForward(0);
      }
    } catch (err: any) {
      console.error('Error fetching holiday allowance:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axiosInstance.get(
        `/hr/leave?userId=${eid}&holidayYear=${selectedYear}&limit=all`
      );
      let data =
        response.data.data?.result || response.data.data || response.data || [];

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
        holidayType: item.holidayType,

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

  // ── Open dialog: reset fields from current data + fetch prev year ──
  const handleOpenEditDialog = async () => {
    setEditEntitlement(leaveAllowance.holidayEntitlement);
    setEditCarryForward(leaveAllowance.carryForward);
    setCarryForwardError('');
    await fetchPreviousYearRemainingHours();
    setIsEditDialogOpen(true);
  };

  // ── Carry forward change with live validation ──
  const handleCarryForwardChange = (value: string) => {
    setEditCarryForward(value);
    const numValue = Number(value);
    const maxAllowed = previousYearRemainingHours; // already clamped to >= 0

    if (numValue < 0) {
      setCarryForwardError('Carry forward cannot be negative.');
    }
    // else if (numValue > maxAllowed) {
    //   setCarryForwardError(
    //     `Max carry forward is ${maxAllowed.toFixed(2)} h (previous year's remaining balance).`
    //   );
    // }
    else {
      setCarryForwardError('');
    }
  };

  // ── Save dialog ──
  const handleUpdateAllowance = async () => {
    if (!holidayRecordId) {
      toast({
        title: 'No holiday record exists for this year to update yet.',
        variant: 'destructive'
      });
      return;
    }

    if (carryForwardError) return; // block if validation error

    const carryForwardNum = Math.max(0, Number(editCarryForward));
    const entitlementNum = Number(editEntitlement);

    // Final guard (in case user bypassed UI)
    // if (carryForwardNum > previousYearRemainingHours) {
    //   setCarryForwardError(
    //     `Max carry forward is ${previousYearRemainingHours.toFixed(2)} h.`
    //   );
    //   return;
    // }

    setIsUpdating(true);
    try {
      await axiosInstance.patch(`/hr/holidays/${holidayRecordId}`, {
        holidayEntitlement: entitlementNum,
        carryForward: carryForwardNum
      });

      toast({ title: 'Holiday allowance updated successfully!' });
      setIsEditDialogOpen(false);
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
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
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
      years.push(`${currentYear - i}-${currentYear - i + 1}`);
    }
    years.push(`${currentYear}-${currentYear + 1}`);
    for (let i = 1; i <= forward; i++) {
      years.push(`${currentYear + i}-${currentYear + i + 1}`);
    }
    return years;
  };

  const holidayYears = useMemo(() => generateHolidayYears(20, 50), []);

  const allowanceStatsList = useMemo(
    () => [
      {
        label: 'Carry Forward From Last Year',
        value: leaveAllowance.carryForward,
        color: 'text-gray-800'
      },
      {
        label: 'Present Year Holiday Entitlement',
        value: leaveAllowance.holidayEntitlement,
        color: 'text-gray-800'
      },
      {
        label: 'Opening This Year',
        value: leaveAllowance.holidayAllowance,
        color: 'text-blue-800'
      },
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
        label: 'Balance Remaining',
        value: leaveAllowance.remainingHours,
        color: 'text-red-600',
        isBold: true
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
                        <TableHead className="w-[30%]">Reason</TableHead>
                        <TableHead>Holiday Type</TableHead>

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
                            <TableCell>
                              {holiday.holidayType.charAt(0).toUpperCase() +
                                holiday.holidayType.slice(1) || '-'}
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

        {/* ── Right: Allowance Card ── */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Leave Allowance
                </div>
                <Button size="sm" onClick={handleOpenEditDialog}>
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Opening This Year (derived: entitlement + carryForward) */}
                {/* <div className="flex items-center justify-between border-b border-gray-300 py-2">
                  <span className="font-medium text-gray-600">Opening This Year</span>
                  <span className="font-semibold text-gray-800">
                    {leaveAllowance.holidayAllowance.toFixed(2)} h
                  </span>
                </div> */}

                {allowanceStatsList.map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-300 py-2"
                  >
                    <span className="max-w-[60%] text-gray-600">{label}</span>
                    <span className={`font-semibold ${color}`}>
                      {value.toFixed(2)} h
                    </span>
                  </div>
                ))}

                {/* <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="font-semibold text-black">
                    Balance Remaining
                  </span>
                  <span className="text-lg font-bold text-theme">
                    {leaveAllowance.remainingHours.toFixed(2)} h
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Holiday Allowance {selectedYear}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="carryForward">
                Carry Forward from Last Year (hours)
              </Label>
              <Input
                id="carryForward"
                type="number"
                min={0}
                step={0.01}
                value={editCarryForward}
                onChange={(e) => handleCarryForwardChange(e.target.value)}
                disabled={isUpdating}
              />
              {/* Hint: always show max allowed */}
              {/* <p className="text-xs text-gray-500">
                Max allowed:{' '}
                <span className="font-medium">
                  {previousYearRemainingHours.toFixed(2)} h
                </span>{' '}
                
              </p> */}
              {/* Live validation error */}
              {carryForwardError && (
                <p className="text-xs font-medium text-red-600">
                  {carryForwardError}
                </p>
              )}
            </div>
            {/* Holiday Entitlement */}
            <div className="space-y-1.5">
              <Label htmlFor="entitlement">
                Present Year Holiday Entitlement (hours)
              </Label>
              <Input
                id="entitlement"
                type="number"
                min={0}
                step={1}
                value={editEntitlement}
                onChange={(e) => setEditEntitlement(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            {/* Carry Forward */}

            {/* Preview: derived allowance */}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAllowance}
              disabled={isUpdating || !!carryForwardError}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HolidayTab;
