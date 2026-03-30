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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Calendar, CalendarDays, Users, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactSelect from 'react-select';
import { z } from 'zod';
import axiosInstance from '@/lib/axios';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { useParams } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const holidayRequestSchema = z
  .object({
    holidayYear: z
      .string({ required_error: 'Holiday year is required' })
      .min(1, 'Holiday year is required'),

    reason: z.string({ required_error: 'Reason is required' }).optional(),

    holidayType: z
      .string({ required_error: 'Holiday type is required' })
      .min(1, 'Holiday type is required'),

    startDate: z.date({
      required_error: 'Please select a date range',
      invalid_type_error: 'Please select a date range'
    }),

    endDate: z.date({
      required_error: 'Please select a date range',
      invalid_type_error: 'Please select a date range'
    }),

    totalDays: z
      .number({
        required_error: 'Total days is required',
        invalid_type_error: 'Total days must be a number'
      })
      .min(0.5, 'Total days must be at least 0.5'),

    totalHours: z
      .number({
        required_error: 'Total hours is required',
        invalid_type_error: 'Total hours must be a number'
      })
      .min(1, 'Total hours must be at least 1')
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['startDate']
  });

type HolidayFormErrors = Partial<
  Record<keyof z.infer<typeof holidayRequestSchema> | 'dateRange', string>
>;

// ─── Constants ────────────────────────────────────────────────────────────────

const leaveTypeOptions = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'absence', label: 'Absence' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'family', label: 'Family Leave' }
];

const HOURS_PER_DAY = 8;

// ─── Component ────────────────────────────────────────────────────────────────

const HolidayPage: React.FC = () => {
  const getCurrentHolidayYear = () => {
    const year = moment().year();
    return `${year}-${year + 1}`;
  };

  // ── State ──
  const [selectedYear, setSelectedYear] = useState(getCurrentHolidayYear());
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [calculatedDays, setCalculatedDays] = useState<number | string>('');
  const [calculatedHours, setCalculatedHours] = useState<number | string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<HolidayFormErrors>({});

  // Loading States
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { toast } = useToast();
  const { id: companyId, eid } = useParams();
  const [holidays, setHolidays] = useState<any[]>([]);

  // Aligning state exactly with your new DB schema
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

  // ── Auto-calculate days & hours ONLY when dates change ──
  useEffect(() => {
    if (startDate && endDate) {
      const days =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      if (days >= 0) {
        setCalculatedDays(days);
        setCalculatedHours(days * HOURS_PER_DAY);
      } else {
        setCalculatedDays(0);
        setCalculatedHours(0);
      }
    } else {
      setCalculatedDays('');
      setCalculatedHours('');
    }
  }, [startDate, endDate]);

  // ── Handlers ──
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCalculatedDays(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 0) {
      setCalculatedHours(parseFloat((val * HOURS_PER_DAY).toFixed(2)));
    } else {
      setCalculatedHours('');
    }
    setFormErrors((prev) => ({
      ...prev,
      totalDays: undefined,
      totalHours: undefined
    }));
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCalculatedHours(raw);
    setFormErrors((prev) => ({ ...prev, totalHours: undefined }));
  };

  const clearError = (field: keyof HolidayFormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
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
        // Direct map from DB to UI
        setLeaveAllowance({
          carryForward: holidayRecord.carryForward || 0,
          holidayEntitlement: holidayRecord.holidayEntitlement || 0,
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
      } else {
        // Reset if no record found for the year
        setLeaveAllowance({
          carryForward: 0,
          holidayEntitlement: 0,
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
      }
    } catch (err: any) {
      console.error('Error fetching holiday allowance:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setError(null);
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

      // Removed manual frontend math here! We let the DB handle calculations.
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
      console.error('Error fetching leave requests:', err);
    }
  };

  useEffect(() => {
    if (!eid) return;

    const fetchAllData = async () => {
      setError(null);
      try {
        await Promise.all([fetchHolidayAllowance(), fetchLeaveRequests()]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setIsInitialLoad(false); // Only set true on initial mount
      }
    };

    fetchAllData();
  }, [eid, selectedYear]);

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

  const generateLeaveDaysArray = (
    start: Date,
    end: Date,
    currentHolidayType: string
  ) => {
    const daysArray = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Simply check the type: 'holiday' is paid, everything else is unpaid
      const typeOfLeave = currentHolidayType === 'holiday' ? 'paid' : 'unpaid';

      daysArray.push({
        leaveDate: new Date(currentDate),
        leaveType: typeOfLeave
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysArray;
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

  // ── Memoized Allowance Stats (UI Speed Optimization) ──
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

  // ── Submit ──
  const handleSubmitRequest = async () => {
    const formData = {
      holidayYear: selectedYear,
      reason,
      holidayType: selectedType,
      startDate: startDate as Date,
      endDate: endDate as Date,
      totalDays: parseFloat(String(calculatedDays)),
      totalHours: parseFloat(String(calculatedHours))
    };

    const result = holidayRequestSchema.safeParse(formData);

    if (!result.success) {
      const errors: HolidayFormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'startDate' || field === 'endDate') {
          if (!errors.dateRange) errors.dateRange = err.message;
        } else if (field && !errors[field as keyof HolidayFormErrors]) {
          (errors as any)[field] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const leaveDays = generateLeaveDaysArray(startDate!, endDate!);

      await axiosInstance.post(`/hr/leave`, {
        holidayYear: selectedYear,
        userId: eid,
        startDate,
        endDate,
        reason,
        companyId,
        holidayType: selectedType,
        totalDays: result.data.totalDays,
        totalHours: result.data.totalHours,
        leaveDays,
        status: 'pending',
        title: title || `${selectedType} Request`
      });

      toast({ title: 'Leave request submitted successfully!' });

      setStartDate(undefined);
      setEndDate(undefined);
      setTitle('');
      setReason('');
      setSelectedType('');
      setCalculatedDays('');
      setCalculatedHours('');
      setFormErrors({});
      setIsDrawerOpen(false);

      // Refetch without turning the whole page into a loading spinner
      await fetchHolidayAllowance();
      await fetchLeaveRequests();
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Submission failed',
        className: 'bg-destructive text-white border-none'
      });
      console.error('Error submitting leave:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Guards ──
  if (isInitialLoad) {
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
            fetchLeaveRequests();
            fetchHolidayAllowance();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── JSX ──
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {/* ── Left: Leave Requests Table ── */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex flex-row items-center gap-4">
                    <CalendarDays className="h-5 w-5 text-theme" />
                    My Leave Requests
                  </div>
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button className="font-bold">Apply For Leave</Button>
                    </SheetTrigger>

                    <SheetContent className="overflow-y-auto sm:max-w-[450px]">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-theme" />
                          Submit Leave Request
                        </SheetTitle>
                      </SheetHeader>

                      <div className="space-y-5">
                        {/* Drawer content remains the same... */}
                        {/* Holiday Year */}
                        <div>
                          <Label htmlFor="holiday-year">Holiday Year</Label>
                          <ShadcnSelect
                            value={selectedYear}
                            onValueChange={(val) => {
                              setSelectedYear(val);
                              clearError('holidayYear');
                            }}
                          >
                            <SelectTrigger
                              id="holiday-year"
                              className={
                                formErrors.holidayYear ? 'border-red-500' : ''
                              }
                            >
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
                          {formErrors.holidayYear && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.holidayYear}
                            </p>
                          )}
                        </div>

                        {/* Reason */}
                        <div>
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            id="reason"
                            placeholder="Enter reason for leave"
                            value={reason}
                            onChange={(e) => {
                              setReason(e.target.value);
                              clearError('reason');
                            }}
                            className={`border-gray-300 ${formErrors.reason ? 'border-red-500' : ''}`}
                          />
                          {formErrors.reason && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.reason}
                            </p>
                          )}
                        </div>

                        {/* Holiday Type */}
                        <div>
                          <Label htmlFor="type" className="mb-1 block">
                            Holiday Type
                          </Label>
                          <ReactSelect
                            inputId="type"
                            options={leaveTypeOptions}
                            value={
                              leaveTypeOptions.find(
                                (opt) => opt.value === selectedType
                              ) || null
                            }
                            onChange={(option) => {
                              setSelectedType(option?.value || '');
                              clearError('holidayType');
                            }}
                            placeholder="Select type"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderColor: formErrors.holidayType
                                  ? '#ef4444'
                                  : base.borderColor,
                                '&:hover': {
                                  borderColor: formErrors.holidayType
                                    ? '#ef4444'
                                    : base.borderColor
                                }
                              })
                            }}
                          />
                          {formErrors.holidayType && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.holidayType}
                            </p>
                          )}
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex flex-col gap-1">
                          <Label>Leave Period (DD-MM-YYYY)</Label>{' '}
                          <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(dates) => {
                              const [start, end] = dates;
                              setStartDate(start ?? undefined);
                              setEndDate(end ?? undefined);
                              clearError('dateRange');
                            }}
                            isClearable
                            placeholderText="Select start and end date"
                            className={`w-full rounded border px-3 py-2 ${formErrors.dateRange ? 'border-red-500' : 'border-gray-300'}`}
                            dateFormat="dd-MM-yyyy"
                            minDate={new Date()}
                          />
                          {formErrors.dateRange && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.dateRange}
                            </p>
                          )}
                        </div>

                        {/* Total Days */}
                        <div className="space-y-1">
                          <Label htmlFor="duration-days">
                            Holiday Duration (Days)
                          </Label>
                          <Input
                            id="duration-days"
                            type="number"
                            min="0"
                            step="0.5"
                            value={calculatedDays}
                            onChange={handleDaysChange}
                            placeholder="e.g. 2"
                            className={`bg-white ${formErrors.totalDays ? 'border-red-500' : ''}`}
                          />
                          {formErrors.totalDays && (
                            <p className="text-xs text-red-500">
                              {formErrors.totalDays}
                            </p>
                          )}
                        </div>

                        {/* Total Hours */}
                        <div className="space-y-1">
                          <Label htmlFor="duration-hours">
                            Duration (Hours)
                          </Label>
                          <Input
                            id="duration-hours"
                            type="number"
                            min="0"
                            step="0.5"
                            value={calculatedHours}
                            onChange={handleHoursChange}
                            placeholder="e.g. 16"
                            className={`bg-white ${formErrors.totalHours ? 'border-red-500' : ''}`}
                          />
                          {formErrors.totalHours && (
                            <p className="text-xs text-red-500">
                              {formErrors.totalHours}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={handleSubmitRequest}
                          className="mt-4 w-full bg-theme text-white hover:bg-theme/90"
                          disabled={isSubmitting}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row items-center justify-between">
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
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {leaveAllowance.holidayAllowance.toFixed(1)} h
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Allowance
                      </div>
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
                              <TableCell>
                                {formatDate(holiday.endDate)}
                              </TableCell>
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

          {/* ── Right: Allowance + Drawer ── */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex flex-row items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    My Leave Allowance
                  </div>

                  {/* ── Sheet / Drawer ── */}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Using our optimized, memoized UI map */}
                  {allowanceStatsList.map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-gray-300 py-2"
                    >
                      <span
                        className={`max-w-[60%] text-gray-600 ${label === 'Balance Remaining' ? 'font-bold text-gray-900' : ''}`}
                      >
                        {label}
                      </span>{' '}
                      <span className={`font-semibold ${color}`}>
                        {value.toFixed(1)} h
                      </span>
                    </div>
                  ))}

                  {/* <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <span className="font-semibold text-black">
                      Balance Remaining
                    </span>
                    <span className="text-lg font-bold text-theme">
                      {leaveAllowance.remainingHours.toFixed(1)} h
                    </span>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayPage;
