/* eslint-disable @typescript-eslint/no-this-alias */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import moment from '@/lib/moment-setup';
import {
  Search,
  Calendar as CalendarIcon,
  Loader2,
  RotateCcw,
  Eye,
  Check,
  X as XIcon,
  History,
  Coffee,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Custom Imports
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useToast } from '@/components/ui/use-toast';

// --- Types ---
interface RootState {
  auth: {
    user: {
      _id: string;
      companyId: string;
      role: string;
    } | null;
  };
}

interface EditFormState {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  rotaId: string;
}

// --- Helpers ---
const calculateDynamicDuration = (logs: any[]) => {
  if (!logs || logs.length === 0) return '00:00';

  let totalMinutes = 0;

  logs.forEach((log) => {
    if (log.clockIn && log.clockOut) {
      const start = log.clockIn.includes('T')
        ? moment(log.clockIn)
        : moment(log.clockIn, 'HH:mm');
      const end = log.clockOut.includes('T')
        ? moment(log.clockOut)
        : moment(log.clockOut, 'HH:mm');

      if (!log.clockOut.includes('T') && end.isBefore(start)) end.add(1, 'day');

      if (start.isValid() && end.isValid()) {
        totalMinutes += end.diff(start, 'minutes');
      }
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
) => {
  if (!startTime || !endTime) {
    return { display: '00:00', minutes: 0 };
  }

  const start = startTime.includes('T')
    ? moment(startTime)
    : moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');

  const end = endTime.includes('T')
    ? moment(endTime)
    : moment(`${endDate} ${endTime}`, 'YYYY-MM-DD HH:mm');

  if (!start.isValid() || !end.isValid()) {
    return { display: '00:00', minutes: 0 };
  }

  const diffMinutes = end.diff(start, 'minutes');
  if (diffMinutes <= 0) {
    return { display: '00:00', minutes: 0 };
  }

  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return {
    display: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
    minutes: diffMinutes
  };
};

const isSameDay = (a: Date | null, b: Date | null) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const AttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [departmentsOptions, setDepartmentsOptions] = useState<any[]>([]);
  const [usersOptions, setUsersOptions] = useState<any[]>([]);

  const approvalOptions = [
    { value: false, label: 'Admin Needs to Approve' },
    { value: true, label: 'Already Approved' }
  ];

  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedApproval, setSelectedApproval] = useState<any>(
    approvalOptions[0]
  );
  const [fetchedApproval, setFetchedApproval] = useState<any>(
    approvalOptions[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [approvingRecordId, setApprovingRecordId] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    rotaId: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [rotaOptions, setRotaOptions] = useState<any[]>([]);
  const [rotaRawList, setRotaRawList] = useState<any[]>([]);
  const [isLoadingRotas, setIsLoadingRotas] = useState(false);

  const [activeDateBtn, setActiveDateBtn] = useState<
    'today' | 'yesterday' | null
  >(null);

  // State for controlling Sidebars
  const [historyRecord, setHistoryRecord] = useState<any | null>(null);
  const [breakLogsRecord, setBreakLogsRecord] = useState<any | null>(null);

  // --- Break Logs State ---
  const [editingBreakLogIndex, setEditingBreakLogIndex] = useState<number | null>(
    null
  );
  const [deletingBreakLogIndex, setDeletingBreakLogIndex] = useState<number | null>(
    null
  );
  const [isAddingBreak, setIsAddingBreak] = useState(false);
  const [isBreakUpdating, setIsBreakUpdating] = useState(false);
  const [breakEditForm, setBreakEditForm] = useState({
    breakStartDate: '',
    breakStart: '',
    breakEndDate: '',
    breakEnd: ''
  });

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDateRange([today, today]);
    setActiveDateBtn('today');
    fetchAttendance(1, entriesPerPage, today, today);
  };

  const handleYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    setDateRange([yesterday, yesterday]);
    setActiveDateBtn('yesterday');
    fetchAttendance(1, entriesPerPage, yesterday, yesterday);
  };

  const rotaRawMap = useMemo(() => {
    const map: Record<string, any> = {};
    rotaRawList.forEach((r) => {
      map[r._id] = r;
    });
    return map;
  }, [rotaRawList]);

  useEffect(() => {
    if (!id) return;
    const fetchMetaData = async () => {
      try {
        const companyId = id;
        const [desRes, deptRes, usersRes] = await Promise.all([
          axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
          axiosInstance.get(
            `/users?company=${companyId}&limit=all&role=employee`
          )
        ]);

        setDesignationsOptions(
          (desRes.data?.data?.result || []).map((d: any) => ({
            value: d._id,
            label: d.title
          }))
        );
        setDepartmentsOptions(
          (deptRes.data?.data?.result || []).map((d: any) => ({
            value: d._id,
            label: d.departmentName
          }))
        );
        setUsersOptions(
          (usersRes.data?.data?.result || []).map((u: any) => ({
            value: u._id,
            label: `${u.firstName} ${u.lastName}`
          }))
        );
      } catch (error) {
        console.error('Failed to fetch meta data', error);
      }
    };
    fetchMetaData();
  }, [id]);

  const fetchAttendance = async (
    page: number,
    limit: number,
    fromOverride?: Date,
    toOverride?: Date
  ) => {
    if (!id) return;

    const from = fromOverride ?? startDate;
    const to = toOverride ?? endDate;

    setIsLoading(true);
    try {
      const params: any = {
        companyId: id,
        page,
        limit,
        fromDate: from
          ? `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`
          : undefined,
        toDate: to
          ? `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`
          : undefined,
        designationId: selectedDesignation?.value,
        departmentId: selectedDepartment?.value,
        userId: selectedUser?.value,
        userType: 'employee'
      };

      if (selectedApproval !== null) {
        params.isApproved = selectedApproval.value;
      }

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;

      if (apiResponse.success && apiResponse.data) {
        setAttendanceData(apiResponse.data.result || []);
        setTotalPages(apiResponse.data.meta?.totalPage || 1);
        setFetchedApproval(selectedApproval);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(currentPage, entriesPerPage);
  }, [id, currentPage, entriesPerPage]);

  const handleReset = () => {
    setSelectedUser(null);
    setSelectedDesignation(null);
    setSelectedDepartment(null);
    setSelectedApproval(approvalOptions[0]);
    setDateRange([
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    ]);
    setFetchedApproval(approvalOptions[0]);
    setActiveDateBtn(null);
  };

  const handleView = (recordId: string) => {
    navigate(`${recordId}`);
  };

  const fetchRotasForEmployee = async (
    employeeId: string,
    fromDate: string,
    toDate: string
  ) => {
    if (!id || !employeeId) return;
    setIsLoadingRotas(true);
    try {
      const res = await axiosInstance.get(`/rota`, {
        params: {
          companyId: id,
          employeeId,
          startDate: fromDate,
          endDate: toDate,
          limit: 'all',
          status: 'publish'
        }
      });
      const result = res.data?.data?.result || [];
      setRotaRawList(result);
      setRotaOptions(
        result.map((rota: any) => ({
          value: rota._id,
          label: `${rota.shiftName || ''} (${rota.startTime || ''} – ${rota.endTime || ''})`
        }))
      );
    } catch (error) {
      console.error('Failed to fetch rotas', error);
      setRotaOptions([]);
      setRotaRawList([]);
    } finally {
      setIsLoadingRotas(false);
    }
  };

  const handleEditClick = (record: any) => {
    setEditingRecordId(record._id);

    const extractDate = (val: string, fallback: string) =>
      val ? moment(val).format('YYYY-MM-DD') : fallback;

    const extractTime = (val: string) => {
      if (!val) return '';
      if (val.includes('T')) return moment(val).format('HH:mm');
      if (val.length >= 5) return val.substring(0, 5);
      return val;
    };

    const firstLog = record.attendanceLogs?.[0];
    const clockIn = firstLog?.clockIn || record.clockIn || '';
    const clockOut = firstLog?.clockOut || record.clockOut || '';

    const clockInDate = record.clockInDate || record.date || '';
    const clockOutDate = record.clockOutDate || record.date || '';

    const form: EditFormState = {
      startDate: extractDate(clockInDate, moment().format('YYYY-MM-DD')),
      endDate: extractDate(clockOutDate, moment().format('YYYY-MM-DD')),
      startTime: extractTime(clockIn),
      endTime: extractTime(clockOut),
      rotaId: record.rotaId?._id || record.rotaId || ''
    };

    setEditForm(form);
    setEditError(null);

    const employeeId = record.userId?._id || record.userId;
    if (employeeId) {
      const from = clockInDate
        ? moment(clockInDate).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD');

      const to = clockOutDate
        ? moment(clockOutDate).format('YYYY-MM-DD')
        : from;

      fetchRotasForEmployee(employeeId, from, to);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditForm({
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      rotaId: ''
    });
    setEditError(null);
    setRotaOptions([]);
    setRotaRawList([]);
  };

  const handleFormChange = (field: keyof EditFormState, value: string) => {
    let processedValue = value;

    if (field === 'startTime' || field === 'endTime') {
      processedValue = processedValue.replace(/[^0-9:]/g, '').slice(0, 5);
      if (
        processedValue.length === 2 &&
        editForm[field].length === 1 &&
        !processedValue.includes(':')
      ) {
        processedValue += ':';
      }
    }

    setEditForm({ ...editForm, [field]: processedValue });
    setEditError(null);
  };

  const handleRotaChange = useCallback(
    (opt: any) => {
      const newRotaId = opt?.value || '';
      setEditForm((prev) => ({ ...prev, rotaId: newRotaId }));
      setEditError(null);

      setAttendanceData((prevData) =>
        prevData.map((r) => {
          if (r._id !== editingRecordId) return r;

          if (!newRotaId) {
            return { ...r, rotaId: null };
          }

          const rawRota = rotaRawMap[newRotaId];
          if (!rawRota) return r;

          let populatedDept = rawRota.departmentId;
          if (typeof populatedDept === 'string') {
            const foundDept = departmentsOptions.find(
              (d) => d.value === populatedDept
            );
            populatedDept = {
              _id: populatedDept,
              departmentName: foundDept ? foundDept.label : '--'
            };
          }

          return {
            ...r,
            rotaId: {
              ...rawRota,
              _id: rawRota._id,
              shiftName: rawRota.shiftName,
              departmentId: populatedDept
            }
          };
        })
      );
    },
    [editingRecordId, rotaRawMap, departmentsOptions]
  );

  const handleTimeBlur = (field: keyof EditFormState, value: string) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    setEditForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleSaveEdit = async () => {
    if (!editingRecordId) return;
    setIsUpdating(true);
    setEditError(null);

    const record = attendanceData.find((r) => r._id === editingRecordId);
    const employeeId = record?.userId?._id || record?.userId;

    const payloadClockInDate = moment(editForm.startDate, 'YYYY-MM-DD')
      .startOf('day')
      .toISOString();
    const payloadClockOutDate = moment(editForm.endDate, 'YYYY-MM-DD')
      .startOf('day')
      .toISOString();
    const payloadClockIn = moment(
      `${editForm.startDate} ${editForm.startTime}`,
      'YYYY-MM-DD HH:mm'
    ).toISOString();
    const payloadClockOut = moment(
      `${editForm.endDate} ${editForm.endTime}`,
      'YYYY-MM-DD HH:mm'
    ).toISOString();

    try {
      await axiosInstance.patch(`/hr/attendance/${editingRecordId}`, {
        clockInDate: payloadClockInDate,
        clockOutDate: payloadClockOutDate,
        clockIn: payloadClockIn,
        clockOut: payloadClockOut,
        actionUserId: user?._id,
        ...(editForm.rotaId ? { rotaId: editForm.rotaId } : {}),
        ...(employeeId ? { employeeId } : {})
      });

      setAttendanceData((prevData) =>
        prevData.map((r) => {
          if (r._id !== editingRecordId) return r;
          const rawRota = editForm.rotaId ? rotaRawMap[editForm.rotaId] : null;

          let populatedDept = rawRota?.departmentId;
          if (rawRota && typeof populatedDept === 'string') {
            const foundDept = departmentsOptions.find(
              (d) => d.value === populatedDept
            );
            populatedDept = {
              _id: populatedDept,
              departmentName: foundDept ? foundDept.label : '--'
            };
          }

          return {
            ...r,
            clockInDate: payloadClockInDate,
            clockOutDate: payloadClockOutDate,
            clockIn: payloadClockIn,
            clockOut: payloadClockOut,
            rotaId: rawRota
              ? {
                  ...rawRota,
                  _id: rawRota._id,
                  shiftName: rawRota.shiftName,
                  departmentId: populatedDept
                }
              : null
          };
        })
      );

      handleCancelEdit();
      toast({ title: 'Attendance Updated Successfully' });

      fetchAttendance(currentPage, entriesPerPage);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Failed to update attendance record';
      setEditError(msg);
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (recordId: string) => {
    setApprovingRecordId(recordId);
    try {
      await axiosInstance.patch(`/hr/attendance/${recordId}`, {
        isApproved: true,
        actionUserId: user?._id
      });
      toast({ title: 'Attendance Approved Successfully' });

      if (selectedApproval?.value === false) {
        setAttendanceData((prev) => prev.filter((r) => r._id !== recordId));
      } else {
        setAttendanceData((prev) =>
          prev.map((r) => (r._id === recordId ? { ...r, isApproved: true } : r))
        );
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Failed to approve attendance';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setApprovingRecordId(null);
    }
  };

  // --- Break Handlers ---
  const handleBreakFormChange = (field: string, value: string) => {
    let processedValue = value;
    if (field === 'breakStart' || field === 'breakEnd') {
      processedValue = processedValue.replace(/[^0-9:]/g, '').slice(0, 5);
      if (
        processedValue.length === 2 &&
        breakEditForm[field as keyof typeof breakEditForm].length === 1 &&
        !processedValue.includes(':')
      ) {
        processedValue += ':';
      }
    }

    // Prevent breakEndDate from being before breakStartDate
    if (field === 'breakEndDate' && breakEditForm.breakStartDate) {
      if (moment(value).isBefore(moment(breakEditForm.breakStartDate))) {
        toast({ title: 'End date cannot be before start date', variant: 'destructive' });
        return;
      }
    }

    // Prevent breakStartDate from being after breakEndDate
    if (field === 'breakStartDate' && breakEditForm.breakEndDate) {
      if (moment(value).isAfter(moment(breakEditForm.breakEndDate))) {
        setBreakEditForm((prev) => ({ ...prev, [field]: processedValue, breakEndDate: processedValue }));
        return;
      }
    }

    setBreakEditForm((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleBreakTimeBlur = (field: string, value: string) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    setBreakEditForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const saveBreakLogs = async (
    attendanceId: string,
    updatedBreakLogs: any[]
  ) => {
    setIsBreakUpdating(true);
    try {
      const res = await axiosInstance.patch(`/hr/attendance/${attendanceId}`, {
        breakLogs: updatedBreakLogs,
        actionUserId: user?._id
      });
      toast({ title: 'Break logs updated successfully' });

      // Only update the break logs internally to retain existing mapped data
      const responseLogs = res.data?.data?.breakLogs || updatedBreakLogs;

      setBreakLogsRecord((prev: any) =>
        prev ? { ...prev, breakLogs: responseLogs } : prev
      );

      // Keep Table in sync
      setAttendanceData((prevData) =>
        prevData.map((r) =>
          r._id === attendanceId ? { ...r, breakLogs: responseLogs } : r
        )
      );

    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || 'Failed to update break logs',
        variant: 'destructive'
      });
    } finally {
      setIsBreakUpdating(false);
      setEditingBreakLogIndex(null);
      setIsAddingBreak(false);
      setDeletingBreakLogIndex(null);
    }
  };

  const handleSaveBreak = () => {
    if (!breakLogsRecord) return;
    const payloadStartDate = moment(breakEditForm.breakStartDate, 'YYYY-MM-DD').startOf('day');
    const payloadEndDate = moment(breakEditForm.breakEndDate, 'YYYY-MM-DD').startOf('day');
    const payloadStart = moment(`${breakEditForm.breakStartDate} ${breakEditForm.breakStart}`, 'YYYY-MM-DD HH:mm');
    const payloadEnd = breakEditForm.breakEnd ? moment(`${breakEditForm.breakEndDate} ${breakEditForm.breakEnd}`, 'YYYY-MM-DD HH:mm') : null;

    if (payloadEndDate.isBefore(payloadStartDate)) {
      toast({ title: 'End date cannot be before start date', variant: 'destructive' });
      return;
    }

    if (payloadEnd && payloadEnd.isSameOrBefore(payloadStart)) {
      toast({ title: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    let duration = 0;
    if (payloadEnd) {
      duration = payloadEnd.diff(payloadStart, 'minutes');
    }

    const updatedLogs = [...(breakLogsRecord.breakLogs || [])];

    if (isAddingBreak) {
      updatedLogs.push({
        breakStart: payloadStart.toISOString(),
        breakStartDate: payloadStartDate.toISOString(),
        breakEnd: payloadEnd ? payloadEnd.toISOString() : null,
        breakEndDate: payloadEndDate.toISOString(),
        duration: Math.max(0, duration)
      });
    } else if (editingBreakLogIndex !== null && editingBreakLogIndex > -1) {
      updatedLogs[editingBreakLogIndex] = {
        ...updatedLogs[editingBreakLogIndex],
        breakStart: payloadStart.toISOString(),
        breakStartDate: payloadStartDate.toISOString(),
        breakEnd: payloadEnd ? payloadEnd.toISOString() : null,
        breakEndDate: payloadEndDate.toISOString(),
        duration: Math.max(0, duration)
      };
    }

    saveBreakLogs(breakLogsRecord._id, updatedLogs);
  };

  const confirmDeleteBreak = () => {
    if (!breakLogsRecord || deletingBreakLogIndex === null) return;
    const updatedLogs = breakLogsRecord.breakLogs.filter(
      (_: any, idx: number) => idx !== deletingBreakLogIndex
    );
    saveBreakLogs(breakLogsRecord._id, updatedLogs);
  };

  const renderBreakForm = () => (
    <div className="flex flex-col gap-3 rounded-md border border-theme bg-blue-50/20 p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Start Date
          </label>
          <div className="relative">
            <DatePicker
              selected={
                breakEditForm.breakStartDate
                  ? moment(breakEditForm.breakStartDate).toDate()
                  : null
              }
              onChange={(date) =>
                handleBreakFormChange(
                  'breakStartDate',
                  date ? moment(date).format('YYYY-MM-DD') : ''
                )
              }
              dateFormat="dd-MM-yyyy"
              className="flex h-8 w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme"
              portalId="root"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Start Time
          </label>
          <Input
            value={breakEditForm.breakStart}
            onChange={(e) =>
              handleBreakFormChange('breakStart', e.target.value)
            }
            onBlur={(e) => handleBreakTimeBlur('breakStart', e.target.value)}
            placeholder="HH:mm"
            className="h-8 font-mono text-xs"
            maxLength={5}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            End Date
          </label>
          <div className="relative">
            <DatePicker
              selected={
                breakEditForm.breakEndDate
                  ? moment(breakEditForm.breakEndDate).toDate()
                  : null
              }
              onChange={(date) =>
                handleBreakFormChange(
                  'breakEndDate',
                  date ? moment(date).format('YYYY-MM-DD') : ''
                )
              }
              dateFormat="dd-MM-yyyy"
              className="flex h-8 w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme"
              portalId="root"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            End Time
          </label>
          <Input
            value={breakEditForm.breakEnd}
            onChange={(e) => handleBreakFormChange('breakEnd', e.target.value)}
            onBlur={(e) => handleBreakTimeBlur('breakEnd', e.target.value)}
            placeholder="HH:mm"
            className="h-8 font-mono text-xs"
            maxLength={5}
          />
        </div>
      </div>
      <div className="mt-1 flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setIsAddingBreak(false);
            setEditingBreakLogIndex(null);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleSaveBreak}
          disabled={isBreakUpdating}
        >
          {isBreakUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );

  const formatDisplayDate = (date: Date) =>
    date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      .replace(',', '');

  return (
    <div className="space-y-3 relative">
      <Card className="w-full bg-white shadow-md">
        <CardContent className="space-y-3 p-2 pt-4">
          {/* Filters Top Bar */}
          <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                Employee
              </label>
              <Select
                options={usersOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                Department
              </label>
              <Select
                options={departmentsOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                Status
              </label>
              <Select
                options={approvalOptions}
                value={selectedApproval}
                onChange={setSelectedApproval}
                placeholder="Select Status"
                isClearable={false}
                className="text-xs"
              />
            </div>
            <div className="w-full">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                Date Range (DD-MM-YYYY)
              </label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={isSameDay(startDate, endDate) ? null : endDate}
                  onChange={(update) => {
                    setDateRange(update);
                    setActiveDateBtn(null);
                  }}
                  isClearable={true}
                  dateFormat="dd-MM-yyyy"
                  className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  portalId="root"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchAttendance(currentPage, entriesPerPage)}
                disabled={isLoading}
                className="h-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                title="Reset Filters"
                className="h-10 px-3"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <div className="mt-2 text-lg font-semibold text-gray-600">
                Attendance:{' '}
                <span>{startDate ? formatDisplayDate(startDate) : '...'}</span>
                {endDate && !isSameDay(startDate, endDate) && (
                  <span> - {formatDisplayDate(endDate)}</span>
                )}
              </div>
              {fetchedApproval && (
                <div className="mt-2 flex items-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-medium ${
                      fetchedApproval.label === 'Already Approved'
                        ? 'border-green-200 bg-green-100 text-green-700'
                        : 'border-orange-200 bg-yellow-100 text-orange-700'
                    }`}
                  >
                    {fetchedApproval.label}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                size={'sm'}
                variant={activeDateBtn === 'today' ? 'default' : 'outline'}
                onClick={handleToday}
              >
                Today
              </Button>
              <Button
                size={'sm'}
                variant={activeDateBtn === 'yesterday' ? 'default' : 'outline'}
                onClick={handleYesterday}
              >
                Yesterday
              </Button>
            </div>
          </div>

          <div className="rounded-md">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              onViewClick={handleView}
              entriesPerPage={entriesPerPage}
              setEntriesPerPage={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              editingRecordId={editingRecordId}
              approvingRecordId={approvingRecordId}
              editForm={editForm}
              editError={editError}
              isUpdating={isUpdating}
              rotaOptions={rotaOptions}
              isLoadingRotas={isLoadingRotas}
              onEditClick={handleEditClick}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onFormChange={handleFormChange}
              onRotaChange={handleRotaChange}
              onTimeBlur={handleTimeBlur}
              onApprove={handleApprove}
              onViewHistory={(record) => setHistoryRecord(record)}
              onViewBreakLogs={(record) => setBreakLogsRecord(record)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deletingBreakLogIndex !== null}
        onOpenChange={(open) => !open && setDeletingBreakLogIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Break Log?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this break log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBreak}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- History Sidebar (Sheet) --- */}
      <Sheet
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Attendance History</SheetTitle>
          </SheetHeader>

          {historyRecord && (
            <div className="space-y-6">
              {/* Context / Details */}
              <div className="rounded-lg border border-gray-200 bg-theme/5 p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium ">Employee:</span>
                  <span className="font-semibold text-gray-900">
                    {historyRecord.userId?.firstName}{' '}
                    {historyRecord.userId?.lastName}
                  </span>

                  <span className="font-medium ">Date:</span>
                  <span className="text-gray-900">
                    {moment(
                      historyRecord.clockInDate || historyRecord.date
                    ).format('DD MMM YYYY')}
                  </span>

                  <span className="font-medium ">Shift:</span>
                  <span className="text-gray-900">
                    {historyRecord.rotaId?.shiftName || '--'}
                  </span>

                  <span className="font-medium ">Clock In:</span>
                  <span className="text-gray-900">
                    {historyRecord.clockIn
                      ? historyRecord.clockIn.includes('T')
                        ? moment(historyRecord.clockIn).format('DD MMM YYYY, HH:mm')
                        : historyRecord.clockIn
                      : '--'}
                  </span>
                  <span className="font-medium ">Clock Out:</span>
                  <span className="text-gray-900">
                    {historyRecord.clockOut
                      ? historyRecord.clockOut.includes('T')
                        ? moment(historyRecord.clockOut).format('DD MMM YYYY, HH:mm')
                        : historyRecord.clockOut
                      : '--'}
                  </span>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h4 className="mb-4 border-b border-gray-200 pb-2 font-semibold text-gray-900">
                  Activity Logs
                </h4>

                {historyRecord.history && historyRecord.history.length > 0 ? (
                  <div className="space-y-4">
                    {[...historyRecord.history]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((item: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="mt-1.5 h-2 w-2 rounded-full bg-theme" />
                          </div>
                          <div className="pb-2">
                            <p className="text-sm font-medium text-gray-800">
                              {item.message}{' '}
                              <span className="  ml-1">
                                {moment(item.createdAt).format(
                                  'hh:mm A, DD MMM YYYY'
                                )}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500">
                    No history available for this record.
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* --- Break Logs Custom Div Overlay --- */}
      {breakLogsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 -top-8 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-xl max-h-[90vh] flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Break Logs</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  setBreakLogsRecord(null);
                  setIsAddingBreak(false);
                  setEditingBreakLogIndex(null);
                  setDeletingBreakLogIndex(null);
                }}
              >
                <XIcon className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            {/* Context / Details */}
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-theme/5 p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium ">Employee:</span>
                  <span className="font-semibold text-gray-900">
                    {breakLogsRecord.userId?.firstName}{' '}
                    {breakLogsRecord.userId?.lastName}
                  </span>

                  <span className="font-medium ">Date:</span>
                  <span className="text-gray-900">
                    {moment(
                      breakLogsRecord.clockInDate || breakLogsRecord.date
                    ).format('DD MMM YYYY')}
                  </span>

                  <span className="font-medium ">Shift:</span>
                  <span className="text-gray-900">
                    {breakLogsRecord.rotaId?.shiftName || '--'}
                  </span>

                  <span className="font-medium ">Clock In:</span>
                  <span className="text-gray-900">
                    {breakLogsRecord.clockIn
                      ? breakLogsRecord.clockIn.includes('T')
                        ? moment(breakLogsRecord.clockIn).format(
                            'DD MMM YYYY, HH:mm'
                          )
                        : breakLogsRecord.clockIn
                      : '--'}
                  </span>
                  <span className="font-medium ">Clock Out:</span>
                  <span className="text-gray-900">
                    {breakLogsRecord.clockOut
                      ? breakLogsRecord.clockOut.includes('T')
                        ? moment(breakLogsRecord.clockOut).format(
                            'DD MMM YYYY, HH:mm'
                          )
                        : breakLogsRecord.clockOut
                      : '--'}
                  </span>
                </div>
              </div>

              {/* Break Logs Details */}
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="font-semibold text-gray-900">Break Details</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      setIsAddingBreak(true);
                      setEditingBreakLogIndex(null);
                      setBreakEditForm({
                        breakStartDate: breakLogsRecord.clockInDate
                          ? moment(breakLogsRecord.clockInDate).format(
                              'YYYY-MM-DD'
                            )
                          : moment().format('YYYY-MM-DD'),
                        breakEndDate: breakLogsRecord.clockOutDate
                          ? moment(breakLogsRecord.clockOutDate).format(
                              'YYYY-MM-DD'
                            )
                          : moment().format('YYYY-MM-DD'),
                        breakStart: '',
                        breakEnd: ''
                      });
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Break
                  </Button>
                </div>

                <div className="space-y-3">
                  {isAddingBreak && renderBreakForm()}

                  {(breakLogsRecord.breakLogs || []).map(
                    (item: any, index: number) => {
                      const isEditing = editingBreakLogIndex === index;

                      if (isEditing) {
                        return (
                          <div key={item._id || index}>
                            {renderBreakForm()}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item._id || index}
                          className="flex flex-col gap-1 rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                        >
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-semibold text-gray-700">
                              Break {index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                                {item.duration || 0} min
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                  setIsAddingBreak(false);
                                  setEditingBreakLogIndex(index);
                                  setBreakEditForm({
                                    breakStartDate: item.breakStartDate
                                      ? moment(item.breakStartDate).format(
                                          'YYYY-MM-DD'
                                        )
                                      : moment(item.breakStart).format(
                                          'YYYY-MM-DD'
                                        ),
                                    breakEndDate: item.breakEndDate
                                      ? moment(item.breakEndDate).format(
                                          'YYYY-MM-DD'
                                        )
                                      : item.breakEnd
                                        ? moment(item.breakEnd).format(
                                            'YYYY-MM-DD'
                                          )
                                        : moment(item.breakStart).format(
                                            'YYYY-MM-DD'
                                          ),
                                    breakStart: item.breakStart
                                      ? moment(item.breakStart).format('HH:mm')
                                      : '',
                                    breakEnd: item.breakEnd
                                      ? moment(item.breakEnd).format('HH:mm')
                                      : ''
                                  });
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 " />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-6 w-6"
                                onClick={() => setDeletingBreakLogIndex(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5 " />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-start gap-4 text-xs text-gray-800">
                            <span className="font-bold">Start Time:</span>
                            <span className='font-semibold'>
                              {moment(item.breakStart).format(
                                'DD MMM YYYY, hh:mm'
                              )}
                            </span>
                          </div>
                          <div className="flex justify-start gap-4 text-xs text-gray-800">
                            <span className="font-bold">End Time:</span>
                            <span className='font-semibold'>
                              {item.breakEnd
                                ? moment(item.breakEnd).format(
                                    'DD MMM YYYY, hh:mm'
                                  )
                                : 'Ongoing'}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}

                  {!breakLogsRecord.breakLogs?.length && !isAddingBreak && (
                    <p className="py-4 text-center text-sm text-gray-500">
                      No break logs available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Table Section
const TableSection = ({
  data,
  loading,
  onViewClick,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  totalPages,
  setCurrentPage,
  editingRecordId,
  approvingRecordId,
  editForm,
  editError,
  isUpdating,
  rotaOptions,
  isLoadingRotas,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onFormChange,
  onRotaChange,
  onTimeBlur,
  onApprove,
  onViewHistory,
  onViewBreakLogs
}: {
  data: any[];
  loading: boolean;
  onViewClick: (recordId: string) => void;
  entriesPerPage: number;
  setEntriesPerPage: (val: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (val: number) => void;
  editingRecordId: string | null;
  approvingRecordId: string | null;
  editForm: EditFormState;
  editError: string | null;
  isUpdating: boolean;
  rotaOptions: any[];
  isLoadingRotas: boolean;
  onEditClick: (rec: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onFormChange: (field: keyof EditFormState, value: string) => void;
  onRotaChange: (opt: any) => void;
  onTimeBlur: (field: keyof EditFormState, value: string) => void;
  onApprove: (id: string) => void;
  onViewHistory: (record: any) => void;
  onViewBreakLogs: (record: any) => void;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-50 p-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          No records found
        </h3>
        <p className="max-w-[250px] text-sm text-gray-500">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  const datePickerClass =
    'flex h-8 w-24 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme';

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift Name</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="w-[9%]">Start Date</TableHead>
            <TableHead className="w-[9%]">Start Time</TableHead>
            <TableHead className="w-[9%]">End Date</TableHead>
            <TableHead className="w-[9%]">End Time</TableHead>
            <TableHead className="w-[12%]">Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const firstName = record.userId?.firstName || '';
            const lastName = record.userId?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const email = record.userId?.email || '--';

            const departmentName =
              record.rotaId?.departmentId?.departmentName || '--';
            const shiftName = record.rotaId?.shiftName || '';
            const rotaStartTime = record.rotaId?.startTime || '';
            const rotaEndTime = record.rotaId?.endTime || '';
            const isEditing = editingRecordId === record._id;
            const isApproving = approvingRecordId === record._id;

            const rStartDate = record.clockInDate || record.date || '';
            const rEndDate = record.clockOutDate || record.date || '';

            const firstLog = record.attendanceLogs?.[0];
            const rStartTime = firstLog?.clockIn || record.clockIn || '--';
            const rEndTime = firstLog?.clockOut || record.clockOut || '--';

            const displayTime = (t: string) => {
              if (!t || t === '--') return '--';
              if (t.includes('T')) return moment(t).format('HH:mm');
              if (t.length >= 5) return t.substring(0, 5);
              return t;
            };

            const displayDate = (d: string) =>
              d ? moment(d).format('DD-MM-YYYY') : '--';

            // Calculate Base Duration
            let dCalc;
            if (isEditing) {
              dCalc = calculateDuration(
                editForm.startDate,
                editForm.startTime,
                editForm.endDate,
                editForm.endTime
              );
            } else {
              dCalc = calculateDuration(
                rStartDate,
                rStartTime,
                rEndDate,
                rEndTime
              );
            }

            // Provide Break details reference
            const breakLogs = record.breakLogs || [];

            if (dCalc && dCalc.minutes < 1) {
              dCalc.display = '00:00';
            }

            const isDurationValid = isEditing ? dCalc.minutes > 0 : true;

            const selectedRotaOption =
              rotaOptions.find((o) => o.value === editForm.rotaId) || null;

           // --- Calculate Shift Duration ---
            let shiftDurationDisplay = '';
            if (rotaStartTime && rotaEndTime) {
              const rStart = moment(rotaStartTime, 'HH:mm');
              const rEnd = moment(rotaEndTime, 'HH:mm');
              // handle overnight shifts where end time is smaller than start time
              if (rEnd.isBefore(rStart)) rEnd.add(1, 'day');
              
              const diffMins = rEnd.diff(rStart, 'minutes');
              if (diffMins > 0) {
                const hrs = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                
                // Only show minutes if they are greater than 0
                shiftDurationDisplay = mins === 0 
                  ? `(${hrs.toString().padStart(2, '0')}h)` 
                  : `(${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m)`;
              }
            }

            return (
              <TableRow key={record._id}>
                <TableCell className="text-sm font-medium">
                  {isEditing ? (
                    <div className="min-w-[150px]">
                      <Select
                        options={rotaOptions}
                        value={selectedRotaOption}
                        onChange={(opt: any) => onRotaChange(opt)}
                        placeholder={
                          isLoadingRotas
                            ? 'Loading shifts...'
                            : 'Select shift...'
                        }
                        isLoading={isLoadingRotas}
                        isClearable
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            minHeight: '32px',
                            height: '32px',
                            fontSize: '12px'
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: '0 6px'
                          }),
                          input: (base) => ({ ...base, margin: 0, padding: 0 })
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {shiftName
                          ? shiftName
                          : rotaStartTime && rotaEndTime
                            ? `${rotaStartTime} - ${rotaEndTime} ${shiftDurationDisplay}`
                            : '--'}
                      </span>

                      {shiftName && rotaStartTime && rotaEndTime && (
                        <span className="mt-0.5 text-xs font-semibold tracking-wide text-gray-800">
                          {rotaStartTime} - {rotaEndTime} <span className="text-gray-500 font-medium">{shiftDurationDisplay}</span>
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{fullName}</span>
                    <span className="text-xs text-gray-800">{email}</span>
                  </div>
                </TableCell>

                <TableCell className="text-sm">{departmentName}</TableCell>

                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative max-w-[110px]">
                      <DatePicker
                        selected={
                          editForm.startDate
                            ? moment(editForm.startDate).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          const val = date
                            ? moment(date).format('YYYY-MM-DD')
                            : '';
                          onFormChange('startDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        className={datePickerClass}
                        placeholderText="Start Date"
                        portalId="root"
                      />
                    </div>
                  ) : (
                    displayDate(rStartDate)
                  )}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {isEditing ? (
                    <Input
                      value={editForm.startTime}
                      onChange={(e) =>
                        onFormChange('startTime', e.target.value)
                      }
                      onBlur={(e) => onTimeBlur('startTime', e.target.value)}
                      placeholder="HH:mm"
                      className="h-8 w-20 font-mono text-xs"
                      maxLength={5}
                    />
                  ) : (
                    displayTime(rStartTime)
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative max-w-[110px]">
                      <DatePicker
                        selected={
                          editForm.endDate
                            ? moment(editForm.endDate).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          const val = date
                            ? moment(date).format('YYYY-MM-DD')
                            : '';
                          onFormChange('endDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        className={datePickerClass}
                        placeholderText="End Date"
                        portalId="root"
                        minDate={
                          editForm.startDate
                            ? moment(editForm.startDate).toDate()
                            : null
                        }
                      />
                    </div>
                  ) : (
                    displayDate(rEndDate)
                  )}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {isEditing ? (
                    <Input
                      value={editForm.endTime}
                      onChange={(e) => onFormChange('endTime', e.target.value)}
                      onBlur={(e) => onTimeBlur('endTime', e.target.value)}
                      placeholder="HH:mm"
                      className="h-8 w-20 font-mono text-xs"
                      maxLength={5}
                    />
                  ) : (
                    displayTime(rEndTime)
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-sm ${
                        !isDurationValid && isEditing
                          ? 'font-bold text-red-500'
                          : 'text-black'
                      }`}
                    >
                      {dCalc.display}
                    </span>
                    {!isEditing && breakLogs?.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-100 hover:text-amber-600"
                        onClick={() => onViewBreakLogs(record)}
                        title="View Break Logs"
                      >
                        <Coffee className="mr-1 h-3 w-3" />
                        Breaks{' '}
                       
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onCancelEdit}
                          disabled={isUpdating}
                          className="h-8 px-2"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={onSaveEdit}
                          disabled={isUpdating || !isDurationValid}
                          className="h-8 px-2"
                        >
                          {isUpdating && (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          Save
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Show History Button if History exists */}
                        {record.history && record.history.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewHistory(record)}
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Show Reconcile Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditClick(record)}
                          className="h-8 px-2"
                        >
                          Reconcile
                        </Button>

                        {/* Show Approve Button only if not approved */}
                        {!record.isApproved && (
                          <Button
                            size="sm"
                            onClick={() => onApprove(record._id)}
                            disabled={
                              isApproving ||
                              !rEndDate ||
                              !rEndTime ||
                              rEndTime === '--'
                            }
                            title={
                              !rEndDate || !rEndTime || rEndTime === '--'
                                ? 'Cannot approve: Missing End Date or End Time'
                                : 'Approve Attendance'
                            }
                          >
                            {isApproving && (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            )}
                            Approve
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Error & Pagination */}
      <div className="flex flex-col gap-2">
        {editError && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
            {editError}
          </div>
        )}

        {data.length > 60 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default AttendancePage;