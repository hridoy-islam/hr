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

interface LeaveDayUI {
  leaveDate: Date;
  leaveType: string;
  duration: number | string; // Allows empty strings while typing safely
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
      .min(0, 'Total days must be at least 0'),
    totalHours: z
      .number({
        required_error: 'Total hours is required',
        invalid_type_error: 'Total hours must be a number'
      })
      .min(0, 'Total hours must be at least 0')
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['startDate']
  })
  .refine((data) => data.holidayType !== 'holiday' || data.totalDays >= 0.5, {
    message: 'Total days must be at least 0.5 for holidays',
    path: ['totalDays']
  })
  .refine((data) => data.holidayType !== 'holiday' || data.totalHours >= 1, {
    message: 'Total hours must be at least 1 for holidays',
    path: ['totalHours']
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
  
  // State for Individual Day Durations 
  const [leaveDays, setLeaveDays] = useState<LeaveDayUI[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<HolidayFormErrors>({});

  // Loading States
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { toast } = useToast();
  const { id: companyId, eid } = useParams();
  const [holidays, setHolidays] = useState<any[]>([]);

  // Aligning state exactly with DB schema and adding hoursPerDay
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
    unpaidLeaveRequest: 0,
    hoursPerDay: 8 // default fallback
  });

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
          unpaidLeaveRequest: holidayRecord.unpaidLeaveRequest || 0,
          hoursPerDay: holidayRecord.hoursPerDay || 8
        });
      } else {
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
          unpaidLeaveRequest: 0,
          hoursPerDay: 8
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
        setIsInitialLoad(false);
      }
    };

    fetchAllData();
  }, [eid, selectedYear]);

  // ── Dynamic Date Picker & Type Auto-Calculator ──
 const calculateLeaveData = (start: Date | undefined, end: Date | undefined, type: string) => {
  if (start && end) {
    const isHoliday = type === 'holiday';
    const daysArr: LeaveDayUI[] = [];
    let current = new Date(start);
    let totalHrs = 0;
    let totalDaysCount = 0;

    while (current <= end) {
      const defaultDuration = isHoliday ? leaveAllowance.hoursPerDay : 0;
      daysArr.push({
        leaveDate: new Date(current),
        leaveType: isHoliday ? 'paid' : 'unpaid',
        duration: defaultDuration
      });
      if (isHoliday) totalHrs += defaultDuration;
      totalDaysCount++;
      current.setDate(current.getDate() + 1);
    }

    setLeaveDays(daysArr);

    if (isHoliday) {
      setCalculatedHours(String(totalHrs));
      if (leaveAllowance.hoursPerDay > 0) {
        setCalculatedDays(String(parseFloat((totalHrs / leaveAllowance.hoursPerDay).toFixed(2))));
      }
    } else {
      setCalculatedDays(String(totalDaysCount)); // ← actual day count, not '0'
      setCalculatedHours('0');
    }
  } else {
    setLeaveDays([]);
    setCalculatedDays('');
    setCalculatedHours('');
  }
};

  // ── Handler for Modifying Specific Day Duration ──
  const handleDayDurationChange = (index: number, newDuration: string) => {
  let sanitized = newDuration;
  if (sanitized.includes('.')) {
    const [whole, decimal] = sanitized.split('.');
    if (decimal.length > 2) sanitized = `${whole}.${decimal.slice(0, 2)}`;
  }

  const updatedDays = [...leaveDays];
  updatedDays[index].duration = sanitized;

  const numericDuration = parseFloat(sanitized);
  const safeDuration = isNaN(numericDuration) ? 0 : Math.max(0, numericDuration);

  updatedDays[index].leaveType = safeDuration === 0 ? 'dayoff' : 'paid';

  setLeaveDays(updatedDays);

  const totalHrs = updatedDays.reduce((acc, curr) => {
    const d = parseFloat(String(curr.duration));
    return acc + (isNaN(d) ? 0 : d);
  }, 0);

  setCalculatedHours(String(totalHrs));
  setFormErrors((prev) => ({ ...prev, totalHours: undefined }));
};

  // ── Handlers for Manual Totals Override (Days & Hours) ──
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;

  // Clamp to 2 decimal places
  if (value.includes('.')) {
    const [whole, decimal] = value.split('.');
    if (decimal.length > 2) value = `${whole}.${decimal.slice(0, 2)}`;
  }

  setCalculatedDays(value);
  clearError('totalDays');

  const parsedDays = parseFloat(value);

  if (isNaN(parsedDays) || parsedDays < 0) {
    if (selectedType === 'holiday') setCalculatedHours('');
    return;
  }

  if (startDate) {
    const addedDays = Math.max(0, Math.ceil(parsedDays) - 1);
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + addedDays);
    setEndDate(newEndDate);

    if (selectedType === 'holiday') {
      const newHours = parsedDays * leaveAllowance.hoursPerDay;
      setCalculatedHours(String(newHours));

      const daysArr: LeaveDayUI[] = [];
      let current = new Date(startDate);
      const numDays = addedDays + 1;
      const hrsPerDay = newHours / numDays;

      while (current <= newEndDate) {
        daysArr.push({
          leaveDate: new Date(current),
          leaveType: hrsPerDay === 0 ? 'dayoff' : 'paid',
          duration: parseFloat(hrsPerDay.toFixed(2))
        });
        current.setDate(current.getDate() + 1);
      }
      setLeaveDays(daysArr);
    } else {
      // Non-holiday: hours stay 0, rebuild days array with 0 duration
      setCalculatedHours('0');
      const daysArr: LeaveDayUI[] = [];
      let current = new Date(startDate);
      while (current <= newEndDate) {
        daysArr.push({
          leaveDate: new Date(current),
          leaveType: 'unpaid',
          duration: 0
        });
        current.setDate(current.getDate() + 1);
      }
      setLeaveDays(daysArr);
    }
  }
};

const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;

  // Clamp to 2 decimal places
  if (value.includes('.')) {
    const [whole, decimal] = value.split('.');
    if (decimal.length > 2) value = `${whole}.${decimal.slice(0, 2)}`;
  }

  setCalculatedHours(value);
  clearError('totalHours');

  const parsedHours = parseFloat(value);

  if (isNaN(parsedHours) || parsedHours < 0) {
    if (leaveDays.length > 0) {
      setLeaveDays(leaveDays.map((day) => ({ ...day, duration: '', leaveType: 'dayoff' })));
    }
    return;
  }

  if (leaveDays.length > 0) {
    const hrsPerDay = parsedHours / leaveDays.length;
    setLeaveDays(leaveDays.map((day) => ({
      ...day,
      duration: parseFloat(hrsPerDay.toFixed(2)),
      leaveType: hrsPerDay === 0 ? 'dayoff' : 'paid'
    })));
  }
};

  const clearError = (field: keyof HolidayFormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
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
      totalDays:
        parseFloat(String(calculatedDays)) || 0,
      totalHours:
        selectedType === 'holiday'
          ? parseFloat(String(calculatedHours)) || 0
          : 0
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
      // 🚀 Explicit fallback enforcement: If not a holiday, force duration strictly to 0 for all days.
      const dbLeaveDays = leaveDays.map((day) => ({
        leaveDate: day.leaveDate,
        leaveType: selectedType === 'holiday' ? day.leaveType : 'unpaid',
        duration: selectedType === 'holiday' 
          ? (isNaN(parseFloat(String(day.duration))) ? 0 : parseFloat(String(day.duration)))
          : 0
      }));

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
        leaveDays: dbLeaveDays, 
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
      setLeaveDays([]);
      setFormErrors({});
      setIsDrawerOpen(false);

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
                  
                  {/* 🚀 NEW UPDATED UI FOR CREATE LEAVE REQUEST DRAWER */}
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button className="">Create Leave Request</Button>
                    </SheetTrigger>

                    <SheetContent className="overflow-y-auto sm:max-w-[750px] max-h-screen">
                      <SheetHeader className="mb-2">
                        <SheetTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-theme" />
                          Submit Leave Request
                        </SheetTitle>
                      </SheetHeader>

                      <div className="space-y-2 max-h-screen">
                        {/* 2-Column Grid to layout Year and Type side-by-side as requested */}
                        <div className="grid grid-cols-2 items-start gap-2">
                          {/* Holiday Year */}
                          <div className="">
                            <Label htmlFor="holiday-year" className="mb-1 block">Holiday Year</Label>
                            <ShadcnSelect
                              value={selectedYear}
                              onValueChange={(val) => {
                                setSelectedYear(val);
                                clearError('holidayYear');
                              }}
                            >
                              <SelectTrigger
                                id="holiday-year"
                                className={`h-[38px] ${
                                  formErrors.holidayYear ? 'border-red-500' : ''
                                }`}
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
                                const newType = option?.value || '';
                                setSelectedType(newType);
                                clearError('holidayType');
                                calculateLeaveData(
                                  startDate,
                                  endDate,
                                  newType
                                );
                              }}
                              placeholder="Select type"
                              className="react-select-container "
                              classNamePrefix="react-select "
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: '38px',
                                  height: '38px',
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
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex flex-col gap-1 py-2">
                          <Label>Leave Period (DD-MM-YYYY)</Label>
                          <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(dates) => {
                              const [start, end] = dates;
                              // 🚀 FIX: Normalize dates to exactly 12:00 PM (Noon) local time to prevent UTC boundary shifts!
                              const safeStart = start
                                ? new Date(
                                    start.getFullYear(),
                                    start.getMonth(),
                                    start.getDate(),
                                    12,
                                    0,
                                    0
                                  )
                                : undefined;
                              const safeEnd = end
                                ? new Date(
                                    end.getFullYear(),
                                    end.getMonth(),
                                    end.getDate(),
                                    12,
                                    0,
                                    0
                                  )
                                : undefined;

                              setStartDate(safeStart);
                              setEndDate(safeEnd);
                              clearError('dateRange');
                              calculateLeaveData(
                                safeStart,
                                safeEnd,
                                selectedType
                              );
                            }}
                            isClearable
                            placeholderText="Select start and end date"
                            className={`w-full rounded border h-[38px] px-3 py-2 ${
                              formErrors.dateRange ? 'border-red-500' : 'border-gray-300'
                            }`}
                            dateFormat="dd-MM-yyyy"
                          />
                          {formErrors.dateRange && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.dateRange}
                            </p>
                          )}
                        </div>

                        {/* Reason */}
                        <div>
                          <Label htmlFor="create-reason">Reason</Label>
                          <Textarea
                            id="create-reason"
                            placeholder="Enter reason for leave"
                            value={reason}
                            onChange={(e) => {
                              setReason(e.target.value);
                              clearError('reason');
                            }}
                            className={`border-gray-300 ${
                              formErrors.reason ? 'border-red-500' : ''
                            }`}
                          />
                          {formErrors.reason && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.reason}
                            </p>
                          )}
                        </div>

                        {/* 🚀 Conditional Render based on Selected Type */}
                        {selectedType && (
                          <div className="space-y-1">
                            {/* Daily Duration Breakdown Grid - Only shows if 'holiday' and leaveDays populated */}
                            {selectedType === 'holiday' &&
                              leaveDays.length > 0 && (
                                <>
                                  <Label className="block w-full pt-2 text-sm font-semibold text-gray-700">
                                    Daily Duration Breakdown
                                  </Label>
                                  <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:grid-cols-5">
                                    {leaveDays.map((day, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col items-center justify-center rounded-md border border-theme/50 bg-white p-3 shadow-sm"
                                      >
                                        <span className="mb-2 items-center text-center text-[13px] font-bold text-black">
                                          {moment(day.leaveDate).format(
                                            'DD MMM, YYYY'
                                          )}
                                          <br />
                                          {moment(day.leaveDate).format('dddd')}
                                        </span>
                                        <div className="flex w-full items-center justify-center gap-1.5">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="24"
                                            className="h-8 w-24 text-center border-orange-600 text-sm"
                                            value={day.duration}
                                            onChange={(e) =>
                                              handleDayDurationChange(
                                                idx,
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

                            {/* User Editable Summary Totals */}
                            <div
                              className={`grid ${
                                selectedType === 'holiday'
                                  ? 'grid-cols-2'
                                  : 'grid-cols-1'
                              } mt-4 gap-4`}
                            >
                              {/* Total Days - Visible to ALL TYPES */}
                              <div className="space-y-1">
                                <Label htmlFor="duration-days">
                                  {selectedType === 'holiday'
                                    ? 'Holiday Duration (Days)'
                                    : 'Duration (Days)'}
                                </Label>
                                <Input
                                  id="duration-days"
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  value={calculatedDays}
                                  onChange={handleDaysChange}
                                  placeholder="e.g. 2"
                                  className={`bg-white ${
                                    formErrors.totalDays ? 'border-red-500' : ''
                                  }`}
                                />
                                {formErrors.totalDays && (
                                  <p className="text-xs text-red-500">
                                    {formErrors.totalDays}
                                  </p>
                                )}
                              </div>

                              {/* Total Hours - Visible ONLY to HOLIDAY TYPES */}
                              {selectedType === 'holiday' && (
                                <div className="space-y-1">
                                  <Label htmlFor="duration-hours">
                                    Duration (Hours)
                                  </Label>
                                  <Input
                                    id="duration-hours"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={calculatedHours}
                                    onChange={handleHoursChange}
                                    placeholder="e.g. 16"
                                    className={`bg-white ${
                                      formErrors.totalHours ? 'border-red-500' : ''
                                    }`}
                                  />
                                  {formErrors.totalHours && (
                                  <p className="text-xs text-red-500">
                                    {formErrors.totalHours}
                                  </p>
                                )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

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
                          <TableHead>Holiday Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead className="w-[30%]">Reason</TableHead>
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
                                {holiday.holidayType.charAt(0).toUpperCase() +
                                  holiday.holidayType.slice(1) || '-'}
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
                              <TableCell>{holiday.hours}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={6}
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

          {/* ── Right: Allowance ── */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex flex-row items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    My Leave Allowance
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
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

                  <div className="mt-4 flex items-center justify-between rounded-md border-b border-gray-300 bg-gray-50 px-2 py-2">
                    <span className="font-medium text-gray-700">
                      Hours Per Day (Standard)
                    </span>
                    <span className="font-bold text-gray-900">
                      {leaveAllowance.hoursPerDay} h
                    </span>
                  </div>
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