import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import moment from 'moment';
import {
  Search,
  Calendar as CalendarIcon,
  Loader2,
  RotateCcw,
  Eye,
  Check,
  X as XIcon
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
      const start = moment(log.clockIn, 'HH:mm');
      const end = moment(log.clockOut, 'HH:mm');
      if (end.isBefore(start)) end.add(1, 'day');
      totalMinutes += end.diff(start, 'minutes');
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
    if (!startDate || !startTime || !endDate || !endTime) {
      return { display: "00:00", minutes: 0 };
    }

    const start = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const end = moment(`${endDate} ${endTime}`, 'YYYY-MM-DD HH:mm');

    if (!start.isValid() || !end.isValid()) {
      return { display: "00:00", minutes: 0 };
    }

    const diffMinutes = end.diff(start, 'minutes');
    if (diffMinutes <= 0) {
      return { display: "00:00", minutes: 0 };
    }

    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return {
      display: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      minutes: diffMinutes
    };
  };

const AttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // State: Default range is Full Current Month
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    moment().startOf('month').toDate(),
    moment().endOf('month').toDate()
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  // Options State
  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [departmentsOptions, setDepartmentsOptions] = useState<any[]>([]);
  const [usersOptions, setUsersOptions] = useState<any[]>([]);

  // Filters State
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);

  // Reconcile/Edit States
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    rotaId: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Rota options + raw data for the currently editing record
  const [rotaOptions, setRotaOptions] = useState<any[]>([]);
  const [rotaRawList, setRotaRawList] = useState<any[]>([]); // full rota objects
  const [isLoadingRotas, setIsLoadingRotas] = useState(false);

  // Memo: map rotaId -> raw rota object for instant department lookup
  const rotaRawMap = useMemo(() => {
    const map: Record<string, any> = {};
    rotaRawList.forEach((r) => { map[r._id] = r; });
    return map;
  }, [rotaRawList]);

  // Fetch Meta Data
  useEffect(() => {
    if (!id) return;
    const fetchMetaData = async () => {
      try {
        const companyId = id;
        const [desRes, deptRes, usersRes] = await Promise.all([
          axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/users?company=${companyId}&limit=all&role=employee`)
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

  // Fetch Attendance Data
  const fetchAttendance = async (page: number, limit: number) => {
    if (!id) return;

    setIsLoading(true);
    try {
      const params = {
        companyId: id,
        page,
        limit,
        fromDate: startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
        toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
        designationId: selectedDesignation?.value,
        departmentId: selectedDepartment?.value,
        userId: selectedUser?.value,
        userType: 'employee'
      };

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;

      if (apiResponse.success && apiResponse.data) {
        setAttendanceData(apiResponse.data.result || []);
        setTotalPages(apiResponse.data.meta?.totalPage || 1);
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

  // Reset Filters
  const handleReset = () => {
    setSelectedUser(null);
    setSelectedDesignation(null);
    setSelectedDepartment(null);
    setDateRange([
      moment().startOf('month').toDate(),
      moment().endOf('month').toDate()
    ]);
  };

  const handleView = (recordId: string) => {
    navigate(`${recordId}`);
  };

  // --- Fetch Rotas for a given employee and date range ---
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
          limit: 'all'
        }
      });
      const result = res.data?.data?.result || [];
      setRotaRawList(result);
      setRotaOptions(
        result.map((rota: any) => ({
          value: rota._id,
          label: `${rota.shiftName || 'Shift'} (${rota.startTime || ''} – ${rota.endTime || ''})`
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

  // --- Inline Edit Handlers ---
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

  // Fetch rotas using attendance's own clockInDate and clockOutDate
  // If clockOutDate is missing, use clockInDate as both from and to
  const employeeId = record.userId?._id || record.userId;
  if (employeeId) {
    const from = clockInDate
      ? moment(clockInDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    const to = clockOutDate
      ? moment(clockOutDate).format('YYYY-MM-DD')
      : from; // fallback: same as clockInDate if no clockOutDate

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

  // When shift (rota) changes: update form + reflect department in live table state instantly
  const handleRotaChange = useCallback((opt: any) => {
    const newRotaId = opt?.value || '';
    setEditForm((prev) => ({ ...prev, rotaId: newRotaId }));
    setEditError(null);

    setAttendanceData((prevData) =>
      prevData.map((r) => {
        if (r._id !== editingRecordId) return r;

        if (!newRotaId) {
          // Rota cleared — null out rotaId so department shows '--'
          return { ...r, rotaId: null };
        }

        const rawRota = rotaRawMap[newRotaId];
        if (!rawRota) return r;

        // Fix: If the rota API only returned a string ID, re-populate it manually 
        // using the departmentsOptions so the UI can read .departmentName
        let populatedDept = rawRota.departmentId;
        if (typeof populatedDept === 'string') {
          const foundDept = departmentsOptions.find((d) => d.value === populatedDept);
          populatedDept = {
            _id: populatedDept,
            departmentName: foundDept ? foundDept.label : '--'
          };
        }

        // Mirror the populated rotaId shape the API returns
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
  }, [editingRecordId, rotaRawMap, departmentsOptions]); // Added departmentsOptions here

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

    // Find the record being edited to get employeeId
    const record = attendanceData.find((r) => r._id === editingRecordId);
    const employeeId = record?.userId?._id || record?.userId;

    try {
      await axiosInstance.patch(`/hr/attendance/${editingRecordId}`, {
        clockInDate: editForm.startDate,
        clockOutDate: editForm.endDate,
        clockIn: editForm.startTime,
        clockOut: editForm.endTime,
        ...(editForm.rotaId ? { rotaId: editForm.rotaId } : {}),
        ...(employeeId ? { employeeId } : {})
      });

      // Update local state optimistically
     setAttendanceData((prevData) =>
        prevData.map((r) => {
          if (r._id !== editingRecordId) return r;
          const rawRota = editForm.rotaId ? rotaRawMap[editForm.rotaId] : null;

          // Re-populate the department locally for the optimistic update
          let populatedDept = rawRota?.departmentId;
          if (rawRota && typeof populatedDept === 'string') {
            const foundDept = departmentsOptions.find((d) => d.value === populatedDept);
            populatedDept = {
              _id: populatedDept,
              departmentName: foundDept ? foundDept.label : '--'
            };
          }

          return {
            ...r,
            clockInDate: editForm.startDate,
            clockOutDate: editForm.endDate,
            clockIn: editForm.startTime,
            clockOut: editForm.endTime,
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
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Failed to update attendance record';
      setEditError(msg);
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="w-full bg-white shadow-md">
        <CardContent className="space-y-3 pt-4">
          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-5">
            {/* Employee Filter */}
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

            {/* Department Filter */}
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

            {/* Date Range */}
            <div className="w-full">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                Date Range
              </label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  dateFormat="dd-MM-yyyy"
                  className="flex w-full h-10 rounded-md border border-gray-300 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Search & Reset Buttons */}
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
                className="h-10"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>

          {/* Table Header Summary */}
          <div className="mt-2 text-lg font-semibold text-gray-600">
            Attendance:{' '}
            <span>
              {startDate ? moment(startDate).format('MMM DD, YYYY') : '...'}
            </span>
            {endDate && <span> - {moment(endDate).format('MMM DD, YYYY')}</span>}
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
            />
          </div>
        </CardContent>
      </Card>
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
  onTimeBlur
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
        <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
        <p className="max-w-[250px] text-sm text-gray-500">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  const datePickerClass =
    'flex h-8 w-28 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme';

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="w-[9%]">Start Date</TableHead>
            <TableHead className="w-[9%]">Start Time</TableHead>
            <TableHead className="w-[9%]">End Date</TableHead>
            <TableHead className="w-[9%]">End Time</TableHead>
            <TableHead className="w-[9%]">Duration</TableHead>
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
            const shiftName = record.rotaId?.shiftName || '--';

            const isEditing = editingRecordId === record._id;

            // Dates & times — prefer clockIn/Out fields; fall back to date
            const rStartDate = record.clockInDate || record.date || '';
            const rEndDate = record.clockOutDate || record.date || '';

            // For display: use first attendanceLog if available
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

            let dCalc;
            if (isEditing) {
              // If currently editing this row, use the live form values
              dCalc = calculateDuration(
                editForm.startDate,
                editForm.startTime,
                editForm.endDate,
                editForm.endTime
              );
            } else {
              // If not editing, use the saved record values
              dCalc = calculateDuration(
                record.clockInDate,
                record.clockIn,
                record.clockOutDate,
                record.clockOut
              );
            }

            // Ensure duration is valid when editing
            const isDurationValid = isEditing ? dCalc.minutes > 0 : true;

            // Current rota option for the Select
            const selectedRotaOption =
              rotaOptions.find((o) => o.value === editForm.rotaId) || null;

            return (
              <TableRow key={record._id}>
                {/* Shift */}
                <TableCell className="font-medium text-sm">
                  {isEditing ? (
                    <div className="min-w-[180px]">
                      <Select
                        options={rotaOptions}
                        value={selectedRotaOption}
                        onChange={(opt: any) => onRotaChange(opt)}
                        placeholder={
                          isLoadingRotas ? 'Loading shifts...' : 'Select shift...'
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
                    shiftName
                  )}
                </TableCell>

                {/* Employee */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{fullName}</span>
                    <span className="text-xs text-gray-800">{email}</span>
                  </div>
                </TableCell>

                {/* Department */}
                <TableCell className="text-sm">{departmentName}</TableCell>

                {/* --- Start Date --- */}
                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative">
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

                {/* --- Start Time --- */}
                <TableCell className="font-mono text-sm">
                  {isEditing ? (
                    <Input
                      value={editForm.startTime}
                      onChange={(e) => onFormChange('startTime', e.target.value)}
                      onBlur={(e) => onTimeBlur('startTime', e.target.value)}
                      placeholder="HH:mm"
                      className="h-8 w-20 font-mono text-xs"
                      maxLength={5}
                    />
                  ) : (
                    displayTime(rStartTime)
                  )}
                </TableCell>

                {/* --- End Date --- */}
                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative">
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

                {/* --- End Time --- */}
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

                {/* --- Duration --- */}
                <TableCell className="text-sm">
                  <div
                    className={`flex items-center gap-1 font-mono text-sm ${
                      !isDurationValid && isEditing
                        ? 'font-bold text-red-500'
                        : 'text-black'
                    }`}
                  >
                    {dCalc.display}
                  </div>
                </TableCell>

                {/* --- Action --- */}
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditClick(record)}
                          className="h-8 px-2"
                        >
                          Reconcile
                        </Button>
                        {/* <Button
                          size="sm"
                          onClick={() => onViewClick(record._id)}
                          className="h-8 px-2"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button> */}
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