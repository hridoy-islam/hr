import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import moment from 'moment';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Calendar as CalendarIcon,
  History,
  Pencil,
  Check,
  X as XIcon,
  Loader2,
  RotateCcw
} from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// Custom Imports
import axiosInstance from '@/lib/axios';
import CSVExporter from './components/CSVExporter';
import { useNavigate, useParams } from 'react-router-dom';
import { BlinkingDots } from '@/components/shared/blinking-dots';

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
  startTime: string; // HH:mm
  endDate: string;
  endTime: string; // HH:mm
}

// --- Helpers ---

/**
 * Robust Duration Calculator
 */
const calculateDuration = (
  sDate: string,
  sTime: string,
  eDate: string,
  eTime: string
) => {
  // Normalize Time to "HH:mm"
  const normalizeTime = (t: string) => {
    if (!t || t === '--') return null;
    if (t.includes('T')) return moment(t).format('HH:mm');
    // Handle cases like "0930" -> "09:30"
    if (!t.includes(':') && t.length >= 3) {
       const m = moment(t, ['HHmm', 'Hmm']);
       if(m.isValid()) return m.format('HH:mm');
    }
    if (t.includes(':')) return t.substring(0, 5);
    return t;
  };

  const cleanSTime = normalizeTime(sTime);
  const cleanETime = normalizeTime(eTime);

  if (!cleanSTime || !cleanETime || cleanSTime.length !== 5 || cleanETime.length !== 5) {
    return { display: '--', minutes: 0 };
  }

  const start = moment(
    `${moment(sDate).format('YYYY-MM-DD')} ${cleanSTime}`,
    'YYYY-MM-DD HH:mm'
  );
  const end = moment(
    `${moment(eDate).format('YYYY-MM-DD')} ${cleanETime}`,
    'YYYY-MM-DD HH:mm'
  );

  if (!start.isValid() || !end.isValid()) {
    return { display: '--', minutes: 0 };
  }

  const diffMs = end.diff(start);
  const duration = moment.duration(diffMs);

  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();

  const display = `${hours}:${mins}`;
  return { display, minutes: duration.asMinutes() };
};

const AttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  const {id, aid} = useParams();
  // State: Default range is Current Month Start -> Current Day
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    moment().startOf('month').toDate(),
    new Date()
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  // Options State
  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [departmentsOptions, setDepartmentsOptions] = useState<any[]>([]);
  const [usersOptions, setUsersOptions] = useState<any[]>([]);

  const [stats, setStats] = useState({ present: 0, absent: 0, pending: 0 });

  // Filters State
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Inline Edit State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Meta Data
  useEffect(() => {
    if (!id) return;
    const fetchMetaData = async () => {
      try {
        const companyId = id;

        const [desRes, deptRes, usersRes] = await Promise.all([
          axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/users?company=${companyId}&limit=all`)
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
  }, [user]);

  // Fetch Attendance Data
  const fetchAttendance = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const params = {
        companyId: id,
        limit: 'all',
        fromDate: startDate
          ? moment(startDate).format('YYYY-MM-DD')
          : undefined,
        toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
        designationId: selectedDesignation?.value,
        departmentId: selectedDepartment?.value,
        userId: selectedUser?.value,
      };

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;

      if (apiResponse.success && apiResponse.data) {
        setAttendanceData(apiResponse.data.result || []);
        if (apiResponse.data.meta?.stats) {
          setStats(apiResponse.data.meta.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // Reset Filters
  const handleReset = () => {
    setSelectedUser(null);
    setSelectedDesignation(null);
    setSelectedDepartment(null);
    setDateRange([moment().startOf('month').toDate(), new Date()]);
  };

  // --- Edit Handlers ---

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

    setEditForm({
      startDate: extractDate(
        record.startDate,
        moment(record.createdAt || record.date).format('YYYY-MM-DD')
      ),
      startTime: extractTime(record.startTime || record.clockIn),
      endDate: extractDate(
        record.endDate,
        moment(record.createdAt || record.date).format('YYYY-MM-DD')
      ),
      endTime: extractTime(record.endTime || record.clockOut)
    });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditForm({ startDate: '', startTime: '', endDate: '', endTime: '' });
    setEditError(null);
  };

  const handleFormChange = (field: keyof EditFormState, value: string) => {
    let processedValue = value;

    if (field === 'startTime' || field === 'endTime') {
      // 1. Sanitize: Allow only digits and colons, max 5 chars
      processedValue = processedValue.replace(/[^0-9:]/g, '').slice(0, 5);

      // 2. Smart Auto-Colon:
      // If we went from 1 character to 2 characters, and neither is a colon, append the colon.
      // This detects "typing" vs "backspacing".
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

  const handleTimeBlur = (field: keyof EditFormState, value: string) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      // Parse whatever exists to HH:mm (e.g. "9" -> "09:00", "9:30" -> "09:30")
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if(m.isValid()) {
         cleanValue = m.format('HH:mm');
      }
    }
    setEditForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      const { minutes } = calculateDuration(
        editForm.startDate,
        editForm.startTime,
        editForm.endDate,
        editForm.endTime
      );

      const formatForBackend = (t: string) => {
          if(t && t.length === 5 && t.includes(':')) return `${t}:00.000`;
          return t;
      };

      await axiosInstance.patch(`/hr/attendance/${editingRecordId}`, {
        startDate: editForm.startDate,
        startTime: formatForBackend(editForm.startTime),
        endDate: editForm.endDate,
        endTime: formatForBackend(editForm.endTime),
        duration: minutes,
        clockIn: formatForBackend(editForm.startTime),
        clockOut: formatForBackend(editForm.endTime)
      });

      await fetchAttendance();
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to update attendance', error);
      setEditError('Failed to update record. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (recordId: string) => {
    try {
      await axiosInstance.patch(`/hr/attendance/${recordId}`, {
        approvalStatus: 'approved'
      });
      await fetchAttendance();
    } catch (error) {
      console.error('Failed to approve attendance', error);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="w-full bg-white shadow-md">
       

        <CardContent className="space-y-3 pt-4">

        

          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-5 ">
            {/* Employee Filter */}
            <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
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
            <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
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

            {/* Designation Filter */}
            <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Designation
              </label>
              <Select
                options={designationsOptions}
                value={selectedDesignation}
                onChange={setSelectedDesignation}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div>

            {/* Date Range */}
            <div className="w-full">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Date Range
              </label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="flex w-full h-10 rounded-md border border-gray-300 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                  maxDate={new Date()}
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div className=" flex gap-2">
              <Button onClick={fetchAttendance} disabled={isLoading} className="h-10">
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

          {/* SINGLE TABLE VIEW */}
          <div className="mt-2 text-lg font-semibold text-gray-600">
              Attendance: <span className="">{startDate ? moment(startDate).format("MMM DD, YYYY") : '...'}</span> 
              {endDate && <span > - {moment(endDate).format("MMM DD, YYYY")}</span>}
          </div>

          <div className="rounded-md">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              editingRecordId={editingRecordId}
              editForm={editForm}
              editError={editError}
              isUpdating={isUpdating}
              onEditClick={handleEditClick}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onFormChange={handleFormChange}
              onTimeBlur={handleTimeBlur}
              onApprove={handleApprove}
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
  editingRecordId,
  editForm,
  editError,
  isUpdating,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onFormChange,
  onTimeBlur,
  onApprove
}: {
  data: any[];
  loading: boolean;
  editingRecordId: string | null;
  editForm: EditFormState;
  editError: string | null;
  isUpdating: boolean;
  onEditClick: (rec: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onFormChange: (field: keyof EditFormState, value: string) => void;
  onTimeBlur: (field: keyof EditFormState, value: string) => void;
  onApprove: (recordId: string) => void;
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
        <p className="max-w-[250px] text-sm ">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  const datePickerClass =
    'flex h-8 max-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Email</TableHead>
            <TableHead >Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead >End Date</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const firstName = record.userId?.firstName || '';
            const lastName = record.userId?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const email = record.userId?.email || '';
            const phone = record.userId?.phone || '';
            const isEditing = editingRecordId === record._id;

            const rStartDate = record.startDate
              ? moment(record.startDate).format('YYYY-MM-DD')
              : moment(record.createdAt).format('YYYY-MM-DD');
            const rStartTime = record.startTime || record.clockIn || '--';
            const rEndDate = record.endDate
              ? moment(record.endDate).format('YYYY-MM-DD')
              : rStartDate;
            const rEndTime = record.endTime || record.clockOut || '--';

            const displayTime = (t: string) => {
               if(!t || t === '--') return '--';
               if(t.includes('T')) return moment(t).format('HH:mm');
               if(t.length >= 5) return t.substring(0, 5);
               return t;
            };

            const dCalc = isEditing
              ? calculateDuration(
                  editForm.startDate,
                  editForm.startTime,
                  editForm.endDate,
                  editForm.endTime
                )
              : calculateDuration(rStartDate, rStartTime, rEndDate, rEndTime);

            const isDurationValid = dCalc.minutes > 0;

            return (
              <TableRow key={record._id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{fullName}</span>
                   
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm ">{email}</span>
                  
                  </div>
                </TableCell>

                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative w-full">
                      <DatePicker
                        selected={
                          editForm.startDate
                            ? moment(editForm.startDate).toDate()
                            : null
                        }
                        onChange={(date: Date) => {
                          const val = date
                            ? moment(date).format('YYYY-MM-DD')
                            : '';
                          onFormChange('startDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        className={datePickerClass}
                        placeholderText="Select Date"
                        portalId="root"
                      />
                    </div>
                  ) : (
                    moment(rStartDate).format('DD-MM-YYYY')
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
                      placeholder="09:00"
                      className="h-8 w-20 font-mono text-xs"
                      maxLength={5}
                    />
                  ) : (
                    displayTime(rStartTime)
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  {isEditing ? (
                    <div className="relative w-full">
                      <DatePicker
                        selected={
                          editForm.endDate
                            ? moment(editForm.endDate).toDate()
                            : null
                        }
                        onChange={(date: Date) => {
                          const val = date
                            ? moment(date).format('YYYY-MM-DD')
                            : '';
                          onFormChange('endDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        className={datePickerClass}
                        placeholderText="Select Date"
                        portalId="root"
                      />
                    </div>
                  ) : (
                    moment(rEndDate).format('DD-MM-YYYY')
                  )}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {isEditing ? (
                    <Input
                      value={editForm.endTime}
                      onChange={(e) => onFormChange('endTime', e.target.value)}
                      onBlur={(e) => onTimeBlur('endTime', e.target.value)}
                      placeholder="18:00"
                      className="h-8 w-20 font-mono text-xs"
                      maxLength={5}
                    />
                  ) : (
                    displayTime(rEndTime)
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  <div
                    className={`flex items-center gap-1 font-mono text-sm ${!isDurationValid && isEditing ? 'font-bold text-red-500' : 'text-black'}`}
                  >
                    {dCalc.display}
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
                          <XIcon className="mr-1 h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={onSaveEdit}
                          disabled={isUpdating || !isDurationValid}
                          className="h-8 px-2"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="mr-1 h-3 w-3" />
                          )}
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditClick(record)}
                          className="h-8 px-2"
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Reconcile
                        </Button>
                        {record.approvalStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => onApprove(record._id)}
                            className="h-8 bg-green-600 px-2 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {editError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
          {editError}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;