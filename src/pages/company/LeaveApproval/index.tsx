import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Info,
  User,
  Search,
  RotateCcw,
  Clock,
  Calendar,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import ReactSelect from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { useSelector } from 'react-redux';

// --- INTERFACES ---
interface LeaveDay {
  leaveDate: string;
  leaveType: string;
  _id?: string;
}

interface LeaveHistory {
  message: string;
  timestamp: string;
  userId: string | any;
  createdAt?: string;
}

interface LeaveRequest {
  _id: string;
  holidayYear: string;
  userId: {
    _id: string;
    name: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  startDate: string;
  endDate: string;
  title: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  holidayType: string;
  totalDays: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  leaveDays?: LeaveDay[];
  history?: LeaveHistory[];
}

interface EmployeeOption {
  value: string;
  label: string;
}

interface DepartmentOption {
  value: string;
  label: string;
}

interface HolidayFormErrors {
  holidayYear?: string;
  reason?: string;
  holidayType?: string;
  dateRange?: string;
  totalDays?: string;
  totalHours?: string;
  employee?: string;
}

// --- ZOD SCHEMAS ---
const leaveProcessSchema = z.object({
  totalDays: z.number().min(1, 'Number of days cannot be less than 1'),
  totalHours: z.number().min(0, 'Hours cannot be negative'),
  endDate: z.string(),
  reason: z.string().optional(),
  dayStatuses: z.record(z.string(), z.enum(['paid', 'unpaid', 'dayoff']))
});

type LeaveProcessFormValues = z.infer<typeof leaveProcessSchema>;

const holidayRequestSchema = z.object({
  holidayYear: z.string().min(1, 'Holiday year is required'),
  reason: z.string().optional(),
  holidayType: z.string().min(1, 'Type is required'),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  totalDays: z.number().min(1, 'Days must be at least 1'),
  totalHours: z.number().min(1, 'Hours must be at least 1') // Relaxed to 1 so hours can be changed freely
});

// --- CONSTANTS ---
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const leaveTypeOptions = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'absence', label: 'Absence' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'family', label: 'Family Leave' }
];

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '40px',
    borderRadius: '6px',
    fontSize: '14px'
  }),
  placeholder: (base: any) => ({ ...base, color: '#94a3b8', fontSize: '14px' }),
  option: (base: any, state: any) => ({
    ...base,
    color: state.isSelected ? 'white' : '#1e293b',
    fontSize: '14px'
  }),
  singleValue: (base: any) => ({ ...base, fontSize: '14px' }),
  menu: (base: any) => ({ ...base, zIndex: 9999 })
};

// --- HELPER FUNCTIONS ---
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

const getCurrentHolidayYear = () => {
  const year = moment().year();
  return `${year}-${year + 1}`;
};

// Update this function in your React code
const generateLeaveDaysArray = (
  start: Date,
  end: Date,
  holidayType: string
) => {
  const days = [];
  let current = moment(start);
  const endMoment = moment(end);

  // LOGIC: If holiday type is 'holiday', set leaveType to 'paid', otherwise 'unpaid'
  const dayStatus = holidayType === 'holiday' ? 'paid' : 'unpaid';

  while (current.isSameOrBefore(endMoment)) {
    days.push({
      leaveDate: current.format('YYYY-MM-DD'),
      leaveType: dayStatus // This now safely maps to your Mongoose enum
    });
    current.add(1, 'days');
  }
  return days;
};

// --- COMPONENTS ---
const CompanyLeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

  // Approval Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [currentDaysList, setCurrentDaysList] = useState<
    { date: string; label: string }[]
  >([]);

  // Filter State
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeOption | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentOption | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<{
    value: string;
    label: string;
  } | null>({ value: 'pending', label: 'Pending' });
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [startDate, endDate] = dateRange;

  // --- CREATE LEAVE REQUEST STATE ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(
    getCurrentHolidayYear()
  );
  const [createReason, setCreateReason] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [createStartDate, setCreateStartDate] = useState<Date | undefined>();
  const [createEndDate, setCreateEndDate] = useState<Date | undefined>();
  const [calculatedDays, setCalculatedDays] = useState<string>('');
  const [calculatedHours, setCalculatedHours] = useState<string>('');
  const [createSelectedEmployee, setCreateSelectedEmployee] =
    useState<EmployeeOption | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [formErrors, setFormErrors] = useState<HolidayFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const holidayYears = useMemo(() => generateHolidayYears(20, 50), []);

  const { id: companyId } = useParams();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth?.user) || null;

  // --- FORM SETUP ---
  const form = useForm<LeaveProcessFormValues>({
    resolver: zodResolver(leaveProcessSchema),
    defaultValues: {
      totalDays: 1,
      totalHours: 8,
      endDate: '',
      dayStatuses: {}
    }
  });

  const watchTotalDays = form.watch('totalDays');
  const watchStartDate = selectedLeave?.startDate;
  const watchDayStatuses = form.watch('dayStatuses');
  const isInitialLoad = useRef(true);

  // --- FETCH EMPLOYEES FOR FILTER & CREATE DROPDOWNS ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [empRes] = await Promise.all([
          axiosInstance.get(
            `/users?company=${companyId}&limit=all&role=employee`
          )
        ]);

        const employees = empRes.data.data?.result || empRes.data.data || [];
        setEmployeeOptions(
          employees.map((e: any) => ({
            value: e._id,
            label: `${e.firstName} ${e.lastName}`
          }))
        );
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, [companyId]);

  // --- DYNAMIC DAYS GENERATION ---
  useEffect(() => {
    if (watchStartDate && watchTotalDays && watchTotalDays >= 1) {
      const days = [];
      let current = moment(watchStartDate);

      for (let i = 0; i < watchTotalDays; i++) {
        days.push({
          date: current.format('YYYY-MM-DD'),
          label: current.format('ddd')
        });
        current.add(1, 'days');
      }

      setCurrentDaysList(days);

      const newEndDate = moment(watchStartDate)
        .add(watchTotalDays - 1, 'days')
        .format('YYYY-MM-DD');
      form.setValue('endDate', newEndDate);

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        form.setValue('totalHours', watchTotalDays * 8);
      }

      const currentStatuses = form.getValues('dayStatuses') || {};
      const newStatuses: Record<string, 'paid' | 'unpaid' | 'dayoff'> = {};
      days.forEach((d) => {
        newStatuses[d.date] = currentStatuses[d.date] ?? 'paid';
      });
      form.setValue('dayStatuses', newStatuses);
    }
  }, [watchTotalDays, watchStartDate]);

  // --- FETCH LEAVE REQUESTS ---
  const fetchLeaveRequests = async (paramsOverride?: {
    employee?: EmployeeOption | null;
    department?: DepartmentOption | null;
    status?: { value: string; label: string } | null;
    from?: Date | null;
    to?: Date | null;
  }) => {
    if (!companyId) return;

    const employee = paramsOverride?.employee ?? selectedEmployee;
    const status = paramsOverride?.status ?? selectedStatus;
    const from = paramsOverride?.from ?? startDate;
    const to = paramsOverride?.to ?? endDate;

    setLoading(true);
    try {
      const params: any = {
        companyId: companyId,
        page: currentPage,
        limit: entriesPerPage,
        status: status?.value || undefined,
        userId: employee?.value || undefined,
        fromDate: from
          ? `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`
          : undefined,
        toDate: to
          ? `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`
          : undefined
      };

      const res = await axiosInstance.get(`/hr/leave`, { params });

      const apiResponse = res.data;
      if (apiResponse.success && apiResponse.data) {
        setLeaves(apiResponse.data.result || []);
        setTotalPages(apiResponse.data.meta?.totalPage || 1);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError('Unable to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [currentPage, entriesPerPage, companyId]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLeaveRequests();
  };

  const handleReset = () => {
    const defaultStatus = { value: 'pending', label: 'Pending' };

    setSelectedEmployee(null);
    setSelectedDepartment(null);
    setSelectedStatus(defaultStatus);
    setDateRange([null, null]);
    setCurrentPage(1);

    fetchLeaveRequests({
      employee: null,
      department: null,
      status: defaultStatus,
      from: null,
      to: null
    });
  };

  // --- CREATE LEAVE HANDLERS ---
  const clearError = (field: string) => {
    setFormErrors((prev: any) => {
      const newErrs = { ...prev };
      delete newErrs[field];
      return newErrs;
    });
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCalculatedDays(value);

    const parsedDays = parseFloat(value);
    if (!isNaN(parsedDays) && parsedDays >= 1) {
      setCalculatedHours(String(parsedDays * 8)); // Days still updates hours by default

      if (createStartDate) {
        const newEndDate = moment(createStartDate)
          .add(parsedDays - 1, 'days')
          .toDate();
        setCreateEndDate(newEndDate);
      }
    } else if (!isNaN(parsedDays) && parsedDays < 1) {
      // Force minimum 1 day if user types a lower number
      setCalculatedDays('1');
      setCalculatedHours('8');
      if (createStartDate) {
        setCreateEndDate(createStartDate);
      }
    } else {
      setCalculatedHours('');
    }
    clearError('totalDays');
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Just update the hours state. Do not touch calculatedDays or createEndDate.
    setCalculatedHours(value);
    clearError('totalHours');
  };

  const handleSubmitRequest = async () => {
    if (!createSelectedEmployee) {
      setFormErrors((prev) => ({
        ...prev,
        employee: 'Please select an employee'
      }));
      return;
    }

    const formData = {
      holidayYear: selectedYear,
      reason: createReason,
      holidayType: selectedType,
      startDate: createStartDate as Date,
      endDate: createEndDate as Date,
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
      const leaveDays = generateLeaveDaysArray(
        createStartDate!,
        createEndDate!,
        selectedType
      );
      await axiosInstance.post(`/hr/leave`, {
        holidayYear: selectedYear,
        userId: createSelectedEmployee.value,
        startDate: createStartDate,
        endDate: createEndDate,
        reason: createReason,
        companyId,
        holidayType: selectedType,
        totalDays: result.data.totalDays,
        totalHours: result.data.totalHours,
        leaveDays,
        status: 'pending',
        title: createTitle || `${selectedType} Request`
      });

      toast({ title: 'Leave request submitted successfully!' });

      setCreateStartDate(undefined);
      setCreateEndDate(undefined);
      setCreateTitle('');
      setCreateReason('');
      setSelectedType('');
      setCalculatedDays('');
      setCalculatedHours('');
      setCreateSelectedEmployee(null);
      setSelectedYear(getCurrentHolidayYear()); // Reset to the current year after submittal
      setFormErrors({});
      setIsDrawerOpen(false);

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

  // --- APPROVE/UPDATE/REJECT ACTIONS ---
  const handleActionSubmit = async (
    action: 'approved' | 'rejected' | 'update',
    formData?: LeaveProcessFormValues
  ) => {
    if (!selectedLeave) return;

    try {
      const payload: any = {};

      if (action !== 'update') {
        payload.status = action;
      }

      if ((action === 'approved' || action === 'update') && formData) {
        payload.totalDays = formData.totalDays;
        payload.totalHours = formData.totalHours;
        payload.endDate = formData.endDate;
        payload.reason = formData.reason;
        payload.dayBreakdown = formData.dayStatuses;
      }
      payload.actionUserId = user?._id;
      await axiosInstance.patch(`/hr/leave/${selectedLeave._id}`, payload);

      fetchLeaveRequests();

      toast({
        title: `Leave request ${action === 'update' ? 'updated' : action} successfully`
      });
      setIsSheetOpen(false);
      setShowRejectConfirmModal(false);
    } catch (err: any) {
      console.error('Error updating leave status:', err);
      toast({
        title: 'Failed to update leave request',
        description: err.response?.data?.message || 'Check console for details',
        variant: 'destructive'
      });
    }
  };

  const openApprovalSheet = (request: LeaveRequest) => {
    setSelectedLeave(request);
    isInitialLoad.current = true;

    const existingDayStatuses: Record<string, 'paid' | 'unpaid' | 'dayoff'> =
      {};
    if (request.leaveDays && request.leaveDays.length > 0) {
      request.leaveDays.forEach((ld) => {
        const dateKey = moment(ld.leaveDate).format('YYYY-MM-DD');
        existingDayStatuses[dateKey] = ld.leaveType as
          | 'paid'
          | 'unpaid'
          | 'dayoff';
      });
    }

    form.reset({
      totalDays: request.totalDays,
      totalHours: request.totalHours || request.totalDays * 8,
      endDate: request.endDate,
      reason: request.reason || '',
      dayStatuses: existingDayStatuses
    });
    setIsSheetOpen(true);
  };

const formatDate = (dateString: string) => {
  return moment(dateString).startOf('day').format('DD MMM YYYY');
};

  const getStatusBadgeClass = (status: string) => {
    if (status === 'approved')
      return 'bg-green-500 text-white hover:bg-green-500';
    if (status === 'rejected') return 'bg-red-500 text-white hover:bg-red-500';
    return 'bg-yellow-500 text-white hover:bg-yellow-500';
  };

  const LeaveTooltipContent = ({ request }: { request: LeaveRequest }) => {
    const [allowance, setAllowance] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const currentYear = `${moment().format('YYYY')}-${moment().add(1, 'year').format('YYYY')}`;

    useEffect(() => {
      const fetchAllowance = async () => {
        if (!request.userId?._id) return;
        try {
          const res = await axiosInstance.get(
            `/hr/holidays?userId=${request.userId._id}&year=${currentYear}`
          );
          const data = res.data.data?.result || res.data.data || res.data;
          let record = null;
          if (Array.isArray(data)) {
            record = data.find((item: any) => item.year === currentYear);
          } else if (data?.year === currentYear) {
            record = data;
          }

          if (record) {
            setAllowance({
              carryForward: record.carryForward || 0,
              holidayEntitlement: record.holidayEntitlement || 0,
              holidayAllowance: record.holidayAllowance || 0,
              holidayAccured: record.holidayAccured || 0,
              usedHours: record.usedHours || 0,
              bookedHours: record.bookedHours || 0,
              requestedHours: record.requestedHours || 0,
              remainingHours: record.remainingHours || 0,
              unpaidLeaveTaken: record.unpaidLeaveTaken || 0,
              unpaidBookedHours: record.unpaidBookedHours || 0,
              unpaidLeaveRequest: record.unpaidLeaveRequest || 0
            });
          }
        } catch (err) {
          setAllowance(null);
        } finally {
          setLoading(false);
        }
      };
      fetchAllowance();
    }, [request.userId?._id]);

    const allowanceStatsList = allowance
      ? [
          {
            label: 'Carry Forward From Last Year',
            value: allowance.carryForward,
            color: 'text-gray-900',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Present Year Holiday Entitlement',
            value: allowance.holidayEntitlement,
            color: 'text-gray-900',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Opening This Year',
            value: allowance.holidayAllowance,
            color: 'text-red-700',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Holiday Accrued',
            value: allowance.holidayAccured,
            color: 'text-gray-900',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Taken',
            value: allowance.usedHours,
            color: 'text-green-600',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Booked',
            value: allowance.bookedHours,
            color: 'text-orange-600',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Requested',
            value: allowance.requestedHours,
            color: 'text-yellow-500',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Balance Remaining',
            value: allowance.remainingHours,
            color: 'text-red-700',
            labelClass: 'font-bold text-gray-900'
          },
          {
            label: 'Unpaid Leave Taken',
            value: allowance.unpaidLeaveTaken,
            color: 'text-cyan-500',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Unpaid Booked',
            value: allowance.unpaidBookedHours,
            color: 'text-blue-600',
            labelClass: 'text-gray-500'
          },
          {
            label: 'Unpaid Requested',
            value: allowance.unpaidLeaveRequest,
            color: 'text-blue-600',
            labelClass: 'text-gray-500'
          }
        ]
      : [];

    return (
      <div className="w-auto space-y-3 rounded-lg bg-white p-1 shadow-lg">
        {/* Optional Header mapping to User Details. It was not in the immediate crop but helps context. */}
        <div className="flex hidden items-center space-x-2 border-b border-gray-100 px-2 pb-2 pt-1">
          <User className="h-4 w-4" />
          <span className="font-semibold text-gray-800">
            {request.userId?.firstName} {request.userId?.lastName}
          </span>
        </div>

        <div className="px-3 pb-2 text-[13px]">
          {loading ? (
            <div className="flex justify-center py-4">
              <BlinkingDots size="small" color="bg-theme" />
            </div>
          ) : allowance ? (
            <div className="flex flex-col">
              {allowanceStatsList.map(
                ({ label, value, color, labelClass }, index) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between py-[10px] ${
                      index !== allowanceStatsList.length - 1
                        ? 'border-b border-gray-200'
                        : ''
                    }`}
                  >
                    <span className={labelClass}>{label}</span>
                    <span className={`font-semibold ${color}`}>
                      {value.toFixed(2)} h
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-2xl">
              <div className="flex flex-row items-center gap-2">
                <Users className="h-5 w-5 text-theme" />
                Leave Requests
              </div>
              <div>
                <div className="flex gap-2">
                  {/* ── CREATE LEAVE SHEET ── */}
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button className="">Create Leave Request</Button>
                    </SheetTrigger>

                    <SheetContent className="overflow-y-auto sm:max-w-[450px]">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-theme" />
                          Submit Leave Request
                        </SheetTitle>
                      </SheetHeader>

                      <div className="space-y-5">
                        {/* Employee Selection */}
                        <div>
                          <Label className="mb-1 block">Employee</Label>
                          <ReactSelect
                            options={employeeOptions}
                            value={createSelectedEmployee}
                            onChange={(opt) => {
                              setCreateSelectedEmployee(opt);
                              clearError('employee');
                            }}
                            placeholder="Select Employee..."
                            isClearable
                            styles={selectStyles}
                          />
                          {formErrors.employee && (
                            <p className="mt-1 text-xs text-red-500">
                              {formErrors.employee}
                            </p>
                          )}
                        </div>

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
                          <Label htmlFor="create-reason">Reason</Label>
                          <Textarea
                            id="create-reason"
                            placeholder="Enter reason for leave"
                            value={createReason}
                            onChange={(e) => {
                              setCreateReason(e.target.value);
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
                          <Label>Leave Period (DD-MM-YYYY)</Label>
                          <DatePicker
                            selectsRange
                            startDate={createStartDate}
                            endDate={createEndDate}
                            onChange={(dates) => {
                              const [start, end] = dates;
                              setCreateStartDate(start ?? undefined);
                              setCreateEndDate(end ?? undefined);
                              clearError('dateRange');

                              // Auto calculate total days and hours
                              if (start && end) {
                                const daysDiff =
                                  moment(end).diff(moment(start), 'days') + 1;
                                const validDays = Math.max(1, daysDiff);
                                setCalculatedDays(String(validDays));
                                setCalculatedHours(String(validDays * 8));
                              } else if (start && !end) {
                                setCalculatedDays('1');
                                setCalculatedHours('8');
                              } else {
                                setCalculatedDays('');
                                setCalculatedHours('');
                              }
                            }}
                            isClearable
                            placeholderText="Select start and end date"
                            className={`w-full rounded border px-3 py-2 ${formErrors.dateRange ? 'border-red-500' : 'border-gray-300'}`}
                            dateFormat="dd-MM-yyyy"
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
                            min="1"
                            step="1"
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
                            min="1"
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

                  <Button
                    variant={'outline'}
                    onClick={() => navigate('leave-report')}
                  >
                    Report
                  </Button>
                  <Button
                    variant={'outline'}
                    onClick={() => navigate('leave-calendar')}
                  >
                    Leave Calendar
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* ── FILTER BAR ── */}
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide ">
                  Employee
                </label>
                <ReactSelect
                  options={employeeOptions}
                  value={selectedEmployee}
                  onChange={(opt) => setSelectedEmployee(opt)}
                  placeholder="Select..."
                  isClearable
                  styles={selectStyles}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide ">
                  Status
                </label>
                <ReactSelect
                  options={STATUS_OPTIONS}
                  value={selectedStatus}
                  onChange={(opt) => setSelectedStatus(opt)}
                  placeholder="Select..."
                  isClearable
                  styles={selectStyles}
                />
              </div>

              <div className="w-full space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide ">
                  Date Range (DD-MM-YYYY)
                </label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) =>
                    setDateRange(update as [Date | null, Date | null])
                  }
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select date range"
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-theme focus:outline-none focus:ring-1 focus:ring-theme"
                  wrapperClassName="w-full"
                  isClearable
                />
              </div>

              <div className="mt-6 flex items-center justify-start gap-2">
                <Button onClick={handleSearch} className="h-10 gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-10 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* ── TABLE ── */}
            {loading ? (
              <div className="flex justify-center py-12">
                <BlinkingDots size="large" color="bg-theme" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center ">
                            No leave requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaves.map((request) => (
                          <TableRow
                            key={request._id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex cursor-pointer items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={
                                          request.userId?.image ||
                                          '/placeholder.png'
                                        }
                                        alt={
                                          request.userId?.name || 'User Avatar'
                                        }
                                      />
                                      <AvatarFallback className="text-xs font-medium uppercase text-slate-700">
                                        {request.userId?.name?.substring(
                                          0,
                                          2
                                        ) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {request.userId?.firstName}{' '}
                                      {request.userId?.lastName}
                                    </span>
                                    <Info className="h-4 w-4 text-gray-400" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            <TableCell>{request.holidayType}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(request.startDate)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(request.endDate)}
                            </TableCell>
                            <TableCell>
                              {request.totalDays}d ({request.totalHours}h)
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm ">
                              {request.reason}
                            </TableCell>

                            <TableCell>
                              <Badge
                                className={getStatusBadgeClass(request.status)}
                              >
                                {request.status}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => openApprovalSheet(request)}
                              >
                                Check
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <DynamicPagination
                      pageSize={entriesPerPage}
                      setPageSize={setEntriesPerPage}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              </>
            )}

            {/* ── LEAVE APPROVAL SHEET ── */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="w-[90vw] overflow-y-auto sm:max-w-[800px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl font-bold">
                    Process Leave Request
                  </SheetTitle>
                </SheetHeader>

                {selectedLeave && (
                  <div>
                    {/* Header Info */}
                    <div className="text-md flex items-center justify-between pb-4 font-semibold">
                      <span>
                        Staff: {selectedLeave.userId.firstName}{' '}
                        {selectedLeave.userId.lastName}
                      </span>
                      <span className="flex items-center gap-2">
                        {formatDate(selectedLeave.startDate)}
                        <span className="mx-2 font-bold">&rarr;</span>
                        {formatDate(form.watch('endDate'))}
                      </span>
                      <span>{selectedLeave.holidayType.toUpperCase()}</span>
                    </div>

                    {/* Reason Box */}
                    <div className="space-y-2 pb-6">
                      <Label htmlFor="reason">Reason</Label>
                      <Controller
                        name="reason"
                        control={form.control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            id="reason"
                            placeholder="Employee's reason for leave..."
                            className="min-h-[120px] border-theme/20 bg-theme/5 focus-visible:ring-theme/20"
                          />
                        )}
                      />
                    </div>

                    {/* Form Inputs */}
                    <div className="grid grid-cols-2 gap-6 pb-6">
                      <div className="space-y-2">
                        <Label htmlFor="totalDays">Number Of Days</Label>
                        <Controller
                          name="totalDays"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <>
                              <Input
                                id="totalDays"
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <span className="text-xs text-red-500">
                                  {fieldState.error.message}
                                </span>
                              )}
                            </>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalHours">Number Of Hours</Label>
                        <Controller
                          name="totalHours"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <>
                              <Input
                                id="totalHours"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <span className="text-xs text-red-500">
                                  {fieldState.error.message}
                                </span>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className=" flex justify-between gap-3 border-t border-gray-100 pt-6">
                      {selectedLeave.status === 'pending' ? (
                        <>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setIsSheetOpen(false);
                              setShowRejectConfirmModal(true);
                            }}
                          >
                            Reject
                          </Button>

                          <div className="flex flex-row items-center gap-4">
                            <Button
                              variant="outline"
                              onClick={() => setIsSheetOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={form.handleSubmit((data) =>
                                handleActionSubmit('approved', data)
                              )}
                            >
                              Approve
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex w-full justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setIsSheetOpen(false)}
                          >
                            Close
                          </Button>
                          <Button
                            onClick={form.handleSubmit((data) =>
                              handleActionSubmit('update', data)
                            )}
                          >
                            Update Details
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* History Timeline Section */}
                    {selectedLeave.history &&
                      selectedLeave.history.length > 0 && (
                        <div className="mb-6 mt-8 space-y-4 rounded-lg  ">
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ">
                            <Clock className="h-4 w-4" /> Activity History
                          </h3>
                          <div className="space-y-3">
                            {[...selectedLeave.history]
                              .reverse()
                              .map((log, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col border-l-2 border-theme/30 pl-3 text-sm"
                                >
                                  <span className="font-medium text-gray-800">
                                    {log.message}{' '}
                                    {moment(log?.createdAt).format(
                                      'DD MMM YYYY, hh:mm '
                                    )}
                                  </span>
                                  <span className="mt-0.5 text-xs text-gray-400"></span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* ── REJECT CONFIRMATION MODAL ── */}
            <Dialog
              open={showRejectConfirmModal}
              onOpenChange={setShowRejectConfirmModal}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Rejection</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to reject this leave request for{' '}
                  {selectedLeave?.userId?.firstName}?
                </p>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsSheetOpen(true)}
                    >
                      Back
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={() => handleActionSubmit('rejected')}
                    variant="destructive"
                  >
                    Confirm Rejection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default CompanyLeaveApprovalPage;
