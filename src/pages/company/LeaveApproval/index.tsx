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
  CheckCircle,
  Upload,
  FileText
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
import { cn } from '@/lib/utils'; // Make sure you have this utility or adjust accordingly

// --- INTERFACES ---
interface LeaveDay {
  leaveDate: string;
  leaveType: string;
  duration?: number;
  _id?: string;
}

interface LeaveDayUI {
  leaveDate: Date;
  leaveType: string;
  duration: number | string; // Allows empty strings while typing safely
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
  documents?: string[]; // Added documents array
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
  uploadedFiles?: string; // Added document error
}

// --- ZOD SCHEMAS ---
const leaveProcessSchema = z.object({
  totalDays: z.preprocess(
    (val) => (val === '' || Number.isNaN(Number(val)) ? NaN : Number(val)),
    z.number().min(0, 'Number of days cannot be less than 0')
  ),
  totalHours: z.preprocess(
    (val) => (val === '' || Number.isNaN(Number(val)) ? NaN : Number(val)),
    z.number().min(0, 'Hours cannot be negative')
  ),
  startDate: z.string().optional(), // Added mapping for dynamic start dates
  endDate: z.string(),
  reason: z.string().optional()
});

type LeaveProcessFormValues = z.infer<typeof leaveProcessSchema>;

const holidayRequestSchema = z
  .object({
    holidayYear: z.string().min(1, 'Holiday year is required'),
    reason: z.string().optional(),
    holidayType: z.string().min(1, 'Type is required'),
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date({ required_error: 'End date is required' }),
    totalDays: z.preprocess(
      (val) => (val === '' || Number.isNaN(Number(val)) ? NaN : Number(val)),
      z.number().min(0, 'Number of days cannot be negative')
    ),
    totalHours: z.preprocess(
      (val) => (val === '' || Number.isNaN(Number(val)) ? NaN : Number(val)),
      z.number().min(0, 'Hours cannot be negative')
    )
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['startDate']
  })
  .refine((data) => data.holidayType !== 'holiday' || data.totalHours >= 1, {
    message: 'Total hours must be at least 1 for holidays',
    path: ['totalHours']
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

// Extract actual filename, stripping the timestamp prefix
const getFileNameFromUrl = (url: string) => {
  if (!url) return 'Document';
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    const filenameWithPrefix = parts[parts.length - 1];
    // Regex matches numbers followed by a hyphen (e.g. 1777724870607-Payroll.pdf)
    const match = filenameWithPrefix.match(/^\d+-(.+)$/);
    return match ? match[1] : filenameWithPrefix;
  } catch (e) {
    return 'Document';
  }
};

// --- COMPONENTS ---
const CompanyLeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Approval Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [editLeaveDays, setEditLeaveDays] = useState<LeaveDayUI[]>([]);
  const [approvalEmployeeHoursPerDay, setApprovalEmployeeHoursPerDay] =
    useState<number>(8);

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
  const [leaveDays, setLeaveDays] = useState<LeaveDayUI[]>([]);

  const [createSelectedEmployee, setCreateSelectedEmployee] =
    useState<EmployeeOption | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [formErrors, setFormErrors] = useState<HolidayFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic State for Selected Employee's hoursPerDay
  const [employeeHoursPerDay, setEmployeeHoursPerDay] = useState<number>(8);

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
      endDate: ''
    }
  });

  const isInitialLoad = useRef(true);

  // --- GENERAL UPLOAD LOGIC ---
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setFormErrors((prev) => ({ ...prev, uploadedFiles: undefined }));

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        const targetUserId = selectedLeave?.userId?._id || createSelectedEmployee?.value || user?._id;
        
        formData.append('entityId', targetUserId);
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedResults]);

      if (isSheetOpen && selectedLeave) {
        setSelectedLeave((prev) => prev ? { 
            ...prev, 
            documents: [...(prev.documents || []), ...uploadedResults.map(f => f.url)] 
        } : prev);
      }
    } catch (err) {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      if (isSheetOpen && selectedLeave) {
        setSelectedLeave((curr) => curr ? { 
            ...curr, 
            documents: updated.map(f => f.url) 
        } : curr);
      }
      return updated;
    });
  };

  // UI Component for Upload Segment
  const UploadSection = () => (
    <div className="space-y-2 mt-4">
      <Label className="text-sm font-semibold text-gray-700">
        Attachments <span className="text-red-500">*</span>
      </Label>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl h-28 border-2 border-dashed p-8 transition-all',
          isUploading
            ? 'border-theme bg-theme/5'
            : formErrors.uploadedFiles
              ? 'border-red-500 bg-red-50 hover:bg-red-100/50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/80'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
            <p className="text-sm font-medium text-theme">
              Uploading files...
            </p>
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <Upload
                className={cn(
                  'h-5 w-5',
                  formErrors.uploadedFiles
                    ? 'text-red-500'
                    : 'text-gray-500'
                )}
              />
            </div>
            <span
              className={cn(
                'text-sm font-semibold',
                formErrors.uploadedFiles
                  ? 'text-red-600'
                  : 'text-gray-700'
              )}
            >
              Click or drag to upload
            </span>
            <span className="text-xs text-gray-500">
              (Max 5MB)
            </span>
          </div>
        )}
      </div>

      {formErrors.uploadedFiles && !isUploading && (
        <p className="text-xs font-medium text-red-500">
          {formErrors.uploadedFiles}
        </p>
      )}

      {uploadError && (
        <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-500">
          <span className="h-1 w-1 rounded-full bg-red-500"></span>{' '}
          {uploadError}
        </p>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
          <ul className="max-h-[140px] space-y-2 overflow-y-auto pr-1">
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                  <span className="truncate font-medium text-gray-700" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // --- FETCH EMPLOYEES FOR FILTER & CREATE DROPDOWNS ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [empRes] = await Promise.all([
          axiosInstance.get(
            `/users?company=${companyId}&limit=all&role=employee&status=active`
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

  // 🚀 FETCH DYNAMIC HOURS PER DAY FOR SELECTED EMPLOYEE (CREATE MODE)
  useEffect(() => {
    if (!createSelectedEmployee || !selectedYear) return;

    const fetchEmployeeAllowance = async () => {
      try {
        const res = await axiosInstance.get(
          `/hr/holidays?userId=${createSelectedEmployee.value}&year=${selectedYear}&limit=all`
        );
        const data = res.data?.data?.result || res.data?.data || res.data;
        let record = null;

        if (Array.isArray(data)) {
          record =
            data.find((item: any) => item.year === selectedYear) || data[0];
        } else {
          record = data;
        }

        const fetchedHours = record?.hoursPerDay || 8;
        setEmployeeHoursPerDay(fetchedHours);

        if (createStartDate && createEndDate && selectedType) {
          calculateLeaveData(
            createStartDate,
            createEndDate,
            selectedType,
            fetchedHours
          );
        }
      } catch (err) {
        console.error('Failed to fetch employee allowance data:', err);
        setEmployeeHoursPerDay(8);
      }
    };

    fetchEmployeeAllowance();
  }, [createSelectedEmployee, selectedYear]);

  // 🚀 FETCH DYNAMIC HOURS PER DAY FOR APPROVAL MODAL (EDIT MODE)
  useEffect(() => {
    if (!selectedLeave) return;

    const fetchApprovalEmployeeAllowance = async () => {
      try {
        const res = await axiosInstance.get(
          `/hr/holidays?userId=${selectedLeave.userId._id}&year=${selectedLeave.holidayYear}&limit=all`
        );
        const data = res.data?.data?.result || res.data?.data || res.data;
        let record = null;
        if (Array.isArray(data)) {
          record =
            data.find((item: any) => item.year === selectedLeave.holidayYear) ||
            data[0];
        } else {
          record = data;
        }
        setApprovalEmployeeHoursPerDay(record?.hoursPerDay || 8);
      } catch (err) {
        setApprovalEmployeeHoursPerDay(8);
      }
    };

    fetchApprovalEmployeeAllowance();
  }, [selectedLeave]);

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

  // --- CREATE LEAVE LOGIC ---

  const calculateLeaveData = (
    start: Date | undefined,
    end: Date | undefined,
    type: string,
    hoursOverride: number = employeeHoursPerDay
  ) => {
    if (start && end) {
      const isHoliday = type === 'holiday';
      const daysArr: LeaveDayUI[] = [];
      let current = new Date(start);
      let totalHrs = 0;
      let totalDaysCount = 0;

      while (current <= end) {
        const defaultDuration = isHoliday ? hoursOverride : 0;
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
        if (hoursOverride > 0) {
          setCalculatedDays(
            String(parseFloat((totalHrs / hoursOverride).toFixed(2)))
          );
        } else {
          setCalculatedDays(String(totalDaysCount));
        }
      } else {
        // For Non-Holiday Types, default the Days based on duration gap natively
        setCalculatedDays(String(totalDaysCount));
        setCalculatedHours('0');
      }
    } else {
      setLeaveDays([]);
      setCalculatedDays('');
      setCalculatedHours('');
    }
  };

  const handleDayDurationChange = (index: number, newDuration: string) => {
    let sanitized = newDuration;
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.');
      if (decimal.length > 2) sanitized = `${whole}.${decimal.slice(0, 2)}`;
    }
    const updatedDays = [...leaveDays];
    updatedDays[index].duration = newDuration;

    const numericDuration = parseFloat(newDuration);
    const safeDuration = isNaN(numericDuration)
      ? 0
      : Math.max(0, numericDuration);

    if (safeDuration === 0) {
      updatedDays[index].leaveType = 'dayoff';
    } else {
      updatedDays[index].leaveType = 'paid';
    }

    setLeaveDays(updatedDays);

    const totalHrs = updatedDays.reduce((acc, curr) => {
      const d = parseFloat(String(curr.duration));
      return acc + (isNaN(d) ? 0 : d);
    }, 0);

    setCalculatedHours(String(totalHrs));

    setFormErrors((prev) => ({
      ...prev,
      totalHours: undefined
    }));
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 1. Intercept and limit to a maximum of 2 decimal places
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      if (decimal.length > 2) {
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
    }

    // 2. Update state with the sanitized value
    setCalculatedDays(value);
    clearError('totalDays');

    // 3. Use the sanitized value for all downstream logic
    const parsedDays = parseFloat(value);

    if (isNaN(parsedDays) || parsedDays < 0) {
      if (selectedType === 'holiday') {
        setCalculatedHours('');
      }
      return;
    }

    if (createStartDate) {
      const addedDays = Math.max(0, Math.ceil(parsedDays) - 1);
      const newEndDate = new Date(createStartDate);
      newEndDate.setDate(newEndDate.getDate() + addedDays);
      setCreateEndDate(newEndDate);

      if (selectedType === 'holiday') {
        const newHours = parsedDays * employeeHoursPerDay;
        setCalculatedHours(String(newHours));

        const daysArr: LeaveDayUI[] = [];
        let current = new Date(createStartDate);
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
        // NON-HOLIDAY UPDATE: Rebuild the array with 0 duration for the new length
        setCalculatedHours('0');
        const daysArr: LeaveDayUI[] = [];
        let current = new Date(createStartDate);
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
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      if (decimal.length > 2) {
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
    }
    setCalculatedHours(value);
    clearError('totalHours');

    const parsedHours = parseFloat(value);

    if (isNaN(parsedHours) || parsedHours < 0) {
      if (leaveDays.length > 0) {
        const updatedDays = leaveDays.map((day) => ({
          ...day,
          duration: '',
          leaveType: 'dayoff'
        }));
        setLeaveDays(updatedDays);
      }
      return;
    }

    if (leaveDays.length > 0) {
      const hrsPerDay = parsedHours / leaveDays.length;

      const updatedDays = leaveDays.map((day) => ({
        ...day,
        duration: parseFloat(hrsPerDay.toFixed(2)),
        leaveType: hrsPerDay === 0 ? 'dayoff' : 'paid'
      }));

      setLeaveDays(updatedDays);
    }
  };

  const clearError = (field: string) => {
    setFormErrors((prev: any) => {
      const newErrs = { ...prev };
      delete newErrs[field];
      return newErrs;
    });
  };

  const handleSubmitRequest = async () => {
    if (!createSelectedEmployee) {
      setFormErrors((prev) => ({
        ...prev,
        employee: 'Please select an employee'
      }));
      return;
    }

    if (selectedType === 'sick' && uploadedFiles.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        uploadedFiles: 'At least one document is required for sick leave'
      }));
      return;
    }

    const formData = {
      holidayYear: selectedYear,
      reason: createReason,
      holidayType: selectedType,
      startDate: createStartDate as Date,
      endDate: createEndDate as Date,
      totalDays:
        calculatedDays === '' ? '' : parseFloat(String(calculatedDays)),
      totalHours:
        selectedType === 'holiday'
          ? calculatedHours === ''
            ? ''
            : parseFloat(String(calculatedHours))
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
      const dbLeaveDays = leaveDays.map((day) => ({
        leaveDate: day.leaveDate,
        leaveType: selectedType === 'holiday' ? day.leaveType : 'unpaid',
        duration:
          selectedType === 'holiday'
            ? isNaN(parseFloat(String(day.duration)))
              ? 0
              : parseFloat(String(day.duration))
            : 0
      }));

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
        leaveDays: dbLeaveDays,
        documents: uploadedFiles.map(f => f.url),
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
      setLeaveDays([]);
      setCreateSelectedEmployee(null);
      setSelectedYear(getCurrentHolidayYear());
      setUploadedFiles([]);
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

  const handleEditDayDurationChange = (index: number, newDuration: string) => {
    let sanitized = newDuration;
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.');
      if (decimal.length > 2) sanitized = `${whole}.${decimal.slice(0, 2)}`;
    }
    const updatedDays = [...editLeaveDays];
    updatedDays[index].duration = newDuration;

    const numericDuration = parseFloat(newDuration);
    const safeDuration = isNaN(numericDuration)
      ? 0
      : Math.max(0, numericDuration);

    if (safeDuration === 0) {
      updatedDays[index].leaveType = 'dayoff';
    } else {
      updatedDays[index].leaveType =
        selectedLeave?.holidayType === 'holiday' ? 'paid' : 'unpaid';
    }

    setEditLeaveDays(updatedDays);

    // 🚀 Recalculate duration dynamically (Active days > 0)
    const activeDays = updatedDays.filter(day => {
      const d = parseFloat(String(day.duration));
      return !isNaN(d) && d > 0;
    });

    // Calc Total Hours
    const totalHrs = activeDays.reduce((acc, curr) => {
      const d = parseFloat(String(curr.duration));
      return acc + (isNaN(d) ? 0 : d);
    }, 0);
    form.setValue('totalHours', totalHrs);

    // Calc Total Days
    const totalDaysCount = activeDays.length;
    form.setValue('totalDays', totalDaysCount);

    // Adjust Start Date and End Date based on remaining active days
    if (activeDays.length > 0) {
      // Sort to ensure chronological order
      const sortedActiveDays = [...activeDays].sort((a, b) => new Date(a.leaveDate).getTime() - new Date(b.leaveDate).getTime());
      const newStartDate = sortedActiveDays[0].leaveDate.toISOString();
      const newEndDate = sortedActiveDays[sortedActiveDays.length - 1].leaveDate.toISOString();

      form.setValue('startDate', newStartDate);
      form.setValue('endDate', newEndDate);

      if (selectedLeave) {
        setSelectedLeave({
          ...selectedLeave,
          startDate: newStartDate,
          endDate: newEndDate,
          totalDays: totalDaysCount,
          totalHours: totalHrs
        });
      }
    } else if (selectedLeave) {
      // If all zeroed out, keep dates same but set duration to 0
      setSelectedLeave({
        ...selectedLeave,
        totalDays: 0,
        totalHours: 0
      });
    }
  };

  const handleActionSubmit = async (
    action: 'approved' | 'rejected' | 'update',
    formData?: LeaveProcessFormValues
  ) => {
    if (!selectedLeave) return;

    // Validate manually for approval modal that hours must be >= 1 for holidays
    if ((action === 'approved' || action === 'update') && formData) {
      if (selectedLeave?.holidayType === 'holiday' && formData.totalHours < 1) {
        form.setError('totalHours', {
          type: 'manual',
          message: 'Total hours must be at least 1 for holidays'
        });
        return;
      }
      if (selectedLeave?.holidayType === 'sick' && uploadedFiles.length === 0) {
        setUploadError('At least one document is required for sick leave approval');
        return;
      }
    }

    try {
      const payload: any = {};

      if (action !== 'update') {
        payload.status = action;
      }

      if ((action === 'approved' || action === 'update') && formData) {
        payload.totalDays = formData.totalDays;
        payload.totalHours = formData.totalHours;
        payload.startDate = form.getValues('startDate') || selectedLeave.startDate;
        payload.endDate = formData.endDate;
        payload.reason = formData.reason;
        payload.documents = uploadedFiles.map(f => f.url);
        payload.leaveDays = editLeaveDays.map((day) => ({
          leaveDate: day.leaveDate,
          leaveType:
            selectedLeave?.holidayType === 'holiday' ? day.leaveType : 'unpaid',
          duration:
            selectedLeave?.holidayType === 'holiday' || selectedLeave?.holidayType === 'sick'
              ? isNaN(parseFloat(String(day.duration)))
                ? 0
                : parseFloat(String(day.duration))
              : 0
        }));
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

    const mappedDays =
      request.leaveDays?.map((ld) => ({
        leaveDate: new Date(ld.leaveDate),
        leaveType: ld.leaveType,
        duration: ld.duration ?? 0
      })) || [];

    setEditLeaveDays(mappedDays);

    // Render properly named documents extracted from URL
    if (request.documents && request.documents.length > 0) {
      setUploadedFiles(request.documents.map(url => ({
        name: getFileNameFromUrl(url),
        url: url
      })));
    } else {
      setUploadedFiles([]);
    }

    form.reset({
      totalDays: request.totalDays,
      totalHours: request.totalHours || 0,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || ''
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
                  <Sheet open={isDrawerOpen} onOpenChange={(val) => {
                      setIsDrawerOpen(val);
                      if(val) {
                          setUploadedFiles([]);
                          setFormErrors({});
                      }
                  }}>
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
                        {/* Employee Selection */}
                        <div className='grid grid-cols-2 items-center gap-2'>
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
                          <div className='-mt-2'>
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
                                 className={`h-[38px]  ${
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
                                  createStartDate,
                                  createEndDate,
                                  newType
                                );
                              }}
                              placeholder="Select type"
                              className="react-select-container "
                              classNamePrefix="react-select "
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
                          <div className="flex flex-col gap-1 py-2">
                            <Label>Leave Period (DD-MM-YYYY)</Label>
                            <DatePicker
                              selectsRange
                              startDate={createStartDate}
                              endDate={createEndDate}
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

                                setCreateStartDate(safeStart);
                                setCreateEndDate(safeEnd);
                                clearError('dateRange');
                                calculateLeaveData(
                                  safeStart,
                                  safeEnd,
                                  selectedType
                                );
                              }}
                              isClearable
                              placeholderText="Select start and end date"
                              className={`w-full rounded border h-[38px] px-3 py-2 ${formErrors.dateRange ? 'border-red-500' : 'border-gray-300'}`}
                              dateFormat="dd-MM-yyyy"
                            />
                            {formErrors.dateRange && (
                              <p className="mt-1 text-xs text-red-500">
                                {formErrors.dateRange}
                              </p>
                            )}
                          </div>
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

                        {/* 🚀 Conditional Render based on Selected Type */}
                        {selectedType && (
                          <div className="space-y-1">
                            {/* Daily Duration Breakdown Grid - Only shows if 'holiday' or 'sick' and leaveDays populated */}
                            {(selectedType === 'holiday') &&
                              leaveDays.length > 0 && (
                                <>
                                  <Label className="block w-full  text-sm font-semibold text-gray-700">
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
                                            step="0.5"
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
                              className={`grid grid-cols-2 mt-4 gap-4`}
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
                              )}
                            </div>
                              {selectedType === 'sick' && <UploadSection />}

                            {/* 🚀 Required Upload For Sick Leave */}
                          </div>
                        )}

                        <Button
                          onClick={handleSubmitRequest}
                          className="mt-4 w-full bg-theme text-white hover:bg-theme/90"
                          disabled={isSubmitting || isUploading}
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
                  onChange={(update) => {
                    const [start, end] = update as [Date | null, Date | null];
                    // 🚀 FIX: Normalize dates for the Filter DatePicker as well
                    const safeStart = start
                      ? new Date(
                          start.getFullYear(),
                          start.getMonth(),
                          start.getDate(),
                          12,
                          0,
                          0
                        )
                      : null;
                    const safeEnd = end
                      ? new Date(
                          end.getFullYear(),
                          end.getMonth(),
                          end.getDate(),
                          12,
                          0,
                          0
                        )
                      : null;
                    setDateRange([safeStart, safeEnd]);
                  }}
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
            <Sheet open={isSheetOpen} onOpenChange={(val) => {
                setIsSheetOpen(val);
                if (!val) setUploadError(null);
            }}>
              <SheetContent className="w-[90vw] overflow-y-auto sm:max-w-[800px]">
                {selectedLeave && (
                  <>
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-bold flex flex-row items-center gap-5">
                        <span>
                        Process Leave Request{' '}
                        </span>
                        <span className="flex  text-lg">
                          {formatDate(selectedLeave.startDate)}
                          <span className="mx-2 font-bold">&rarr;</span>
                          {formatDate(selectedLeave.endDate)}
                        </span>
                      </SheetTitle>
                    </SheetHeader>

                    <div>
                      {/* Header Info */}
                      <div className="text-md flex items-center justify-between pb-4 font-semibold">
                        <div className="flex flex-row items-center gap-2">
                          <span>
                            Staff: {selectedLeave.userId?.firstName}{' '}
                            {selectedLeave.userId?.lastName}
                          </span>
                          {selectedLeave?.holidayType && (
                          <span className="rounded-full bg-theme px-3 py-1 text-sm font-medium text-white">
                            {selectedLeave.holidayType.charAt(0).toUpperCase() +
                              selectedLeave.holidayType.slice(1).toLowerCase()}
                          </span>
                        )}
                        </div>
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
                              className="min-h-[80px] border-theme/20 bg-theme/5 focus-visible:ring-theme/20"
                            />
                          )}
                        />
                      </div>

                      {/* 🚀 Daily Duration Breakdown Grid for Approval (Both Holiday and Sick) */}
                      {selectedLeave.holidayType === 'holiday' &&
                        editLeaveDays.length > 0 && (
                          <div className="mb-6 space-y-3 border-b border-gray-100 pb-6">
                            <Label className="block w-full text-sm font-semibold text-gray-700">
                              Daily Duration Breakdown
                            </Label>
                            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:grid-cols-3">
                              {editLeaveDays.map((day: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center justify-center rounded-md border border-gray-100 bg-white p-3 shadow-sm"
                                >
                                  <span className="mb-2 items-center text-center text-[13px] font-semibold text-gray-800">
                                    {moment(day.leaveDate).format('DD MMM, YYYY')}
                                    <br />
                                    {moment(day.leaveDate).format('dddd')}
                                  </span>
                                  <div className="flex w-full items-center justify-center gap-1.5">
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max="24"
                                      className="h-8 w-24 text-center text-sm font-semibold "
                                      value={day.duration}
                                      onChange={(e) =>
                                        handleEditDayDurationChange(idx, e.target.value)
                                      }
                                      disabled={
                                        selectedLeave.status !== 'pending' &&
                                        selectedLeave.status !== 'approved'
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Form Inputs (Total Days / Hours) */}
                      <div className={`grid grid-cols-2 gap-6 pb-6`}>
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
                                  min={0}
                                  step="0.5"
                                  {...field}
                                  value={
                                    field.value === 0 || Number.isNaN(field.value)
                                      ? ''
                                      : field.value
                                  }
                                 onChange={(e) => {
  const val = parseFloat(e.target.value);
  const newDays = isNaN(val) ? '' : val;
  field.onChange(newDays);

  if (newDays === '') {
    if (selectedLeave.holidayType === 'holiday') {
      form.setValue('totalHours', 0);
      setEditLeaveDays([]);
    }
    return;
  }

  if (newDays >= 1 && selectedLeave?.startDate) {
    const start = new Date(selectedLeave.startDate);
    const addedDays = Math.max(0, Math.ceil(Number(newDays)) - 1);
    const newEndDate = new Date(start);
    newEndDate.setDate(newEndDate.getDate() + addedDays);
    const newEndISO = newEndDate.toISOString();

    form.setValue('endDate', newEndISO);

    // ✅ Sync selectedLeave so header date display updates
    setSelectedLeave((prev) =>
      prev ? { ...prev, endDate: newEndISO } : prev
    );

    if (selectedLeave.holidayType === 'holiday') {
      const newHours = Number(newDays) * approvalEmployeeHoursPerDay;
      form.setValue('totalHours', newHours);

      const daysArr = [];
      let current = new Date(start);
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
      setEditLeaveDays(daysArr);
    } else {
      form.setValue('totalHours', 0);
      const daysArr = [];
      let current = new Date(start);
      while (current <= newEndDate) {
        daysArr.push({
          leaveDate: new Date(current),
          leaveType: 'unpaid',
          duration: 0
        });
        current.setDate(current.getDate() + 1);
      }
      setEditLeaveDays(daysArr);
    }
  }
}}
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

                        {selectedLeave.holidayType === 'holiday' && (
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
                                    min={0}
                                    step="0.5"
                                    {...field}
                                    value={
                                      field.value === 0 || Number.isNaN(field.value)
                                        ? ''
                                        : field.value
                                    }
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      const parsedHours = isNaN(val) ? '' : val;
                                      field.onChange(parsedHours);

                                      if (
                                        parsedHours !== '' &&
                                        Number(parsedHours) >= 0 &&
                                        editLeaveDays.length > 0
                                      ) {
                                        const hrsPerDay =
                                          Number(parsedHours) / editLeaveDays.length;
                                        const updatedDays = editLeaveDays.map((day: any) => ({
                                          ...day,
                                          duration: parseFloat(hrsPerDay.toFixed(2)),
                                          leaveType: hrsPerDay === 0 ? 'dayoff' : 'paid'
                                        }));
                                        setEditLeaveDays(updatedDays);
                                      }
                                    }}
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
                        )}
                      </div>

                      {/* Document Upload Area for Sick Leave Approval */}
                      {selectedLeave.holidayType === 'sick' && <UploadSection />}

                      {/* Action Footer */}
                      <div className="flex justify-between gap-3 border-t border-gray-100 pt-6 mt-6">
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
                                disabled={isUploading}
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
                          </div>
                        )}
                      </div>

                      {/* History Timeline Section */}
                      {selectedLeave.history && selectedLeave.history.length > 0 && (
                        <div className="mb-6 mt-8 space-y-4 rounded-lg">
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ">
                            <Clock className="h-4 w-4" /> Activity History
                          </h3>
                          <div className="space-y-3">
                            {[...selectedLeave.history]
                              .reverse()
                              .map((log: any, idx: number) => (
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
                  </>
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