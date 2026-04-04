import React, { useState, useEffect, useRef } from 'react';
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
import { Users, Info, User, Search, RotateCcw, Clock } from 'lucide-react';
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
  SheetTitle
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Select from 'react-select';
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
  _id: string;
}

// 🚀 ADDED: History Interface
interface LeaveHistory {
  message: string;
  timestamp: string;
  userId: string | any;
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
  history?: LeaveHistory[]; // 🚀 ADDED: History array
}

interface EmployeeOption {
  value: string;
  label: string;
}

interface DepartmentOption {
  value: string;
  label: string;
}

// --- ZOD SCHEMA ---
const leaveProcessSchema = z.object({
  totalDays: z.number().min(1, 'Number of days cannot be less than 1'),
  totalHours: z.number().min(0, 'Hours cannot be negative'),
  endDate: z.string(),
  reason: z.string().optional(),
  dayStatuses: z.record(z.string(), z.enum(['paid', 'unpaid', 'dayoff']))
});

type LeaveProcessFormValues = z.infer<typeof leaveProcessSchema>;

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

// --- REACT SELECT CUSTOM STYLES ---
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

// --- DAY STATUS DROPDOWN ---
const DayStatusButton = ({
  day,
  status,
  onChange
}: {
  day: { date: string; label: string };
  status: 'paid' | 'unpaid' | 'dayoff';
  onChange: (date: string, value: 'paid' | 'unpaid' | 'dayoff') => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBtnColor = () => {
    if (status === 'paid')
      return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
    if (status === 'unpaid')
      return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
    return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
  };

  const options: {
    label: string;
    value: 'paid' | 'unpaid' | 'dayoff';
    color: string;
  }[] = [
    { label: 'Paid', value: 'paid', color: 'text-green-600 hover:bg-green-50' },
    { label: 'Unpaid', value: 'unpaid', color: 'text-red-600 hover:bg-red-50' },
    {
      label: 'Day Off',
      value: 'dayoff',
      color: 'text-blue-600 hover:bg-blue-50'
    }
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`w-full rounded-md border-2 px-1 py-2 text-sm font-semibold transition-colors ${getBtnColor()}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="text-xs opacity-80">
          {day.label},{day.date}
        </div>
        <div className="mt-0.5 text-[11px] capitalize">
          {status === 'dayoff' ? 'Day Off' : status}
        </div>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1 w-28 -translate-x-1/2 rounded-md border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-medium ${opt.color} ${status === opt.value ? 'font-bold' : ''}`}
              onClick={() => {
                onChange(day.date, opt.value);
                setOpen(false);
              }}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  opt.value === 'paid'
                    ? 'bg-green-500'
                    : opt.value === 'unpaid'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                }`}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CompanyLeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

  // Sheet State
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

  // --- FETCH EMPLOYEES FOR FILTER DROPDOWNS ---
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

  // 🚀 UPDATED: Action submit now handles a generic 'update' action
  const handleActionSubmit = async (
    action: 'approved' | 'rejected' | 'update',
    formData?: LeaveProcessFormValues
  ) => {
    if (!selectedLeave) return;

    try {
      const payload: any = {};

      // Only attach status if we are actually approving or rejecting
      if (action !== 'update') {
        payload.status = action;
      }

      // If we are approving OR just updating details, grab the form data
      if ((action === 'approved' || action === 'update') && formData) {
        payload.totalDays = formData.totalDays;
        payload.totalHours = formData.totalHours;
        payload.endDate = formData.endDate;
        payload.reason = formData.reason;
        payload.dayBreakdown = formData.dayStatuses;
      }
      payload.actionUserId = user?._id;
      await axiosInstance.patch(`/hr/leave/${selectedLeave._id}`, payload);

      // Re-fetch to get the newly appended history logs and updated data
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const setAllDaysStatus = (status: 'paid' | 'unpaid') => {
    const newStatuses: Record<string, 'paid' | 'unpaid' | 'dayoff'> = {};
    currentDaysList.forEach((d) => {
      newStatuses[d.date] = status;
    });
    form.setValue('dayStatuses', newStatuses, { shouldDirty: true });
  };

  const handleDayStatusChange = (
    date: string,
    value: 'paid' | 'unpaid' | 'dayoff'
  ) => {
    const current = form.getValues('dayStatuses') || {};
    form.setValue(
      'dayStatuses',
      { ...current, [date]: value },
      { shouldDirty: true }
    );
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'approved')
      return 'bg-green-500 text-white hover:bg-green-500';
    if (status === 'rejected') return 'bg-red-500 text-white hover:bg-red-500';
    return 'bg-yellow-500 text-white hover:bg-yellow-500';
  };

  // Enhanced LeaveTooltipContent
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
              holidayAllowance: record.holidayAllowance || 0,
              holidayAccured: record.holidayAccured || 0,
              usedHours: record.usedHours || 0,
              bookedHours: record.bookedHours || 0,
              requestedHours: record.requestedHours || 0,
              unpaidLeaveTaken: record.unpaidLeaveTaken || 0,
              unpaidBookedHours: record.unpaidBookedHours || 0,
              unpaidLeaveRequest: record.unpaidLeaveRequest || 0,
              remainingHours: record.remainingHours || 0
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
            label: 'Opening This Year',
            value: allowance.holidayAllowance,
            color: 'text-gray-800'
          },
          {
            label: 'Holiday Accrued',
            value: allowance.holidayAccured,
            color: 'text-gray-800'
          },
          {
            label: 'Taken',
            value: allowance.usedHours,
            color: 'text-green-600'
          },
          {
            label: 'Booked',
            value: allowance.bookedHours,
            color: 'text-orange-600'
          },
          {
            label: 'Requested',
            value: allowance.requestedHours,
            color: 'text-yellow-600'
          },
          {
            label: 'Unpaid Leave Taken',
            value: allowance.unpaidLeaveTaken,
            color: 'text-cyan-600'
          },
          {
            label: 'Unpaid Booked',
            value: allowance.unpaidBookedHours,
            color: 'text-blue-600'
          },
          {
            label: 'Unpaid Requested',
            value: allowance.unpaidLeaveRequest,
            color: 'text-theme'
          }
        ]
      : [];

    return (
      <div className="max-w-xs space-y-3 rounded-lg bg-white p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 " />
          <span className="font-semibold">
            {request.userId?.firstName} {request.userId?.lastName}
          </span>
        </div>
        <div className="space-y-2 rounded-md bg-blue-50 p-3 text-sm">
          <h4 className="font-semibold text-blue-900">
            Leave Allowance ({currentYear})
          </h4>
          {loading ? (
            <div className="flex justify-center py-2">
              <BlinkingDots size="small" color="bg-blue-600" />
            </div>
          ) : allowance ? (
            <div className="space-y-1">
              {allowanceStatsList.map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-600">{label}:</span>
                  <span className={`font-medium ${color}`}>
                    {value.toFixed(1)} h
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-theme">
                <span>Balance Remaining:</span>
                <span>{allowance.remainingHours.toFixed(1)} h</span>
              </div>
            </div>
          ) : (
            <div className="text-center ">No data</div>
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
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-5 w-5 text-theme" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* ── FILTER BAR ── */}
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide ">
                  Employee
                </label>
                <Select
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
                <Select
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

                  {leaves.length > 50 && (
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

                  

                    {/* 🚀 UPDATED: Action Footer */}
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
                        // If status is ALREADY approved or rejected, hide Approve/Reject, show Update
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


                      {/* 🚀 ADDED: History Timeline Section */}
                    {selectedLeave.history &&
                      selectedLeave.history.length > 0 && (
                        <div className="mb-6 mt-8 space-y-4 rounded-lg  ">
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ">
                            <Clock className="h-4 w-4" /> Activity History
                          </h3>
                          <div className="space-y-3">
                            {/* 🚀 ADDED [...array].reverse() right here */}
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
