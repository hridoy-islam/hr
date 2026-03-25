import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from '@/lib/moment-setup';
import {
  Search,
  Calendar as CalendarIcon,
  Loader2,
  RotateCcw,
  Eye,
  Pencil,
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
}

// --- Helpers ---
const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
) => {
  // Normalize Time to "HH:mm"
  const normalizeTime = (t: string) => {
    if (!t || t === '--') return null;
    if (t.includes('T')) return moment(t).format('HH:mm');
    // Handle cases like "0930" -> "09:30"
    if (!t.includes(':') && t.length >= 3) {
      const m = moment(t, ['HHmm', 'Hmm']);
      if (m.isValid()) return m.format('HH:mm');
    }
    if (t.includes(':')) return t.substring(0, 5);
    return t;
  };

  const cleanSTime = normalizeTime(startTime);
  const cleanETime = normalizeTime(endTime);

  if (!startDate || !endDate || !cleanSTime || !cleanETime) {
    return { display: '--', minutes: 0 };
  }

  const start = moment(`${startDate} ${cleanSTime}`, 'YYYY-MM-DD HH:mm');
  const end = moment(`${endDate} ${cleanETime}`, 'YYYY-MM-DD HH:mm');

  if (!start.isValid() || !end.isValid()) {
    return { display: '--', minutes: 0 };
  }

  const diffMs = end.diff(start);
  const duration = moment.duration(diffMs);
  const totalMinutes = duration.asMinutes();

  // If negative or zero, return invalid
  if (totalMinutes <= 0) {
    return { display: '--', minutes: 0 };
  }

  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();

  // Format with leading zeros: HH:mm (e.g., 01:05)
  const display = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  return { display, minutes: totalMinutes };
};

const VisitorAttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  const { id } = useParams();
  const {toast} = useToast()
  // State: Default range is Full Current Month
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    moment().startOf('month').toDate(),
    moment().endOf('month').toDate()
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  // Reconcile/Edit States
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Attendance Data
  const fetchAttendance = async (page: number, limit: number) => {
    if (!id) return;

    setIsLoading(true);
    try {
      const params = {
        companyId: id,
        page,
        limit,
        userType: 'visitor', // Crucial: Only fetch visitors
        fromDate: startDate
          ? moment(startDate).format('YYYY-MM-DD')
          : undefined,
        toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined
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
    setDateRange([
      moment().startOf('month').toDate(),
      moment().endOf('month').toDate()
    ]);
  };

  const handleView = (recordId: string) => {
    navigate(`${recordId}`);
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

    setEditForm({
      startDate: extractDate(record.clockInDate, moment().format('YYYY-MM-DD')),
      endDate: extractDate(record.clockOutDate, moment().format('YYYY-MM-DD')),
      startTime: extractTime(record.clockIn),
      endTime: extractTime(record.clockOut)
    });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditForm({ startDate: '', endDate: '', startTime: '', endTime: '' });
    setEditError(null);
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

  const handleTimeBlur = (field: keyof EditFormState, value: string) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) {
        cleanValue = m.format('HH:mm');
      }
    }
    setEditForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

const handleSaveEdit = async () => {
    if (!editingRecordId) return;
    setIsUpdating(true);
    setEditError(null);

    try {
      // 1. Convert your raw strings into exact Moment objects
      const clockInMoment = moment(`${editForm.startDate} ${editForm.startTime}`, 'YYYY-MM-DD HH:mm');
      const clockOutMoment = moment(`${editForm.endDate} ${editForm.endTime}`, 'YYYY-MM-DD HH:mm');

      // 2. Build the new payload with full ISO strings
      const isoPayload = {
        clockInDate: moment(editForm.startDate, 'YYYY-MM-DD').startOf('day').toISOString(),
        clockOutDate: moment(editForm.endDate, 'YYYY-MM-DD').startOf('day').toISOString(),
        clockIn: clockInMoment.toISOString(),
        clockOut: clockOutMoment.toISOString()
      };

      // 3. Send the ISO strings to the backend (this fixes your payload issue)
      await axiosInstance.patch(`/hr/attendance/${editingRecordId}`, isoPayload);

      // 4. Update the local table UI
      setAttendanceData((prevData) =>
        prevData.map((record) =>
          record._id === editingRecordId
            ? { ...record, ...isoPayload }
            : record
        )
      );

      handleCancelEdit();
      toast({ title: "Attendance Updated Successfully" });
    } catch (error: any) {
      setEditError(
        error?.response?.data?.message || 'Failed to update attendance record'
      );
      toast({
        title: error?.response?.data?.message || 'Failed to update attendance record',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="space-y-3">
      <Card className="w-full bg-white shadow-md">
        <CardContent className="space-y-3 pt-4">
          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-5 ">
            <label className="mb-2 block text-xl font-bold  ">
              Visitor Attendance
            </label>
            {/* Date Range */}
            <div className="w-full ">
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="flex h-10 w-full rounded-md border-2 border-gray-600 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                  dateFormat="dd-MM-yyyy"
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div className=" flex gap-2">
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
                <RotateCcw className="mr-2 h-4 w-4" /> Reset To Current Month
              </Button>
            </div>
          </div>

          {/* Table Header Summary */}
          <div className="mt-2 text-lg font-semibold ">
            Attendance:{' '}
            <span className="">
              {startDate ? moment(startDate).format('MMM DD, YYYY') : '...'}
            </span>
            {endDate && (
              <span> - {moment(endDate).format('MMM DD, YYYY')}</span>
            )}
          </div>

          <div className="rounded-md">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              entriesPerPage={entriesPerPage}
              setEntriesPerPage={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              editingRecordId={editingRecordId}
              editForm={editForm}
              editError={editError}
              isUpdating={isUpdating}
              onEditClick={handleEditClick}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onFormChange={handleFormChange}
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
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  totalPages,
  setCurrentPage,
  editingRecordId,
  editForm,
  editError,
  isUpdating,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onFormChange,
  onTimeBlur
}: {
  data: any[];
  loading: boolean;
  entriesPerPage: number;
  setEntriesPerPage: (val: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (val: number) => void;
  editingRecordId: string | null;
  editForm: EditFormState;
  editError: string | null;
  isUpdating: boolean;
  onEditClick: (rec: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onFormChange: (field: keyof EditFormState, value: string) => void;
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
        <h3 className="text-lg font-semibold text-gray-900">
          No records found
        </h3>
        <p className="max-w-3xl text-sm text-gray-700">
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
            <TableHead>Visitor Name</TableHead>
            <TableHead className='w-[30%]'>Reason For Visit</TableHead>
            <TableHead className='w-[10%]'>Start Date</TableHead>
            <TableHead className='w-[10%]'>Start Time</TableHead>
            <TableHead className='w-[10%]'>End Date</TableHead>
            <TableHead className='w-[10%]'>End Time</TableHead>
            <TableHead className='w-[10%]'>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const visitorName = record.visitorName || 'Unknown';
            const visitReason = record.visitReason || '--';

            const isEditing = editingRecordId === record._id;

            // Date Handling
            const startDate = record.clockInDate || record.date;
            const endDate = record.clockOutDate || record.date;

            // Time Handling
            const rStartTime = record.clockIn || '--';
            const rEndTime = record.clockOut || '--';

            const displayTime = (t: string) => {
              if (!t || t === '--') return '--';
              if (t.includes('T')) return moment(t).format('HH:mm');
              if (t.length >= 5) return t.substring(0, 5);
              return t;
            };

            const displayDate = (d: string) => {
              return d ? moment(d).format('DD-MM-YYYY') : '--';
            };

            // Calculate Duration dynamically based on display values
            const dCalc = isEditing
              ? calculateDuration(
                  editForm.startDate,
                  editForm.startTime,
                  editForm.endDate,
                  editForm.endTime
                )
              : calculateDuration(startDate, rStartTime, endDate, rEndTime);

            // Strict check: Minutes must be > 0
            const isDurationValid = dCalc.minutes > 0;

            return (
              <TableRow key={record._id}>
                <TableCell>
                  <span className="text-sm font-medium">{visitorName}</span>
                </TableCell>

                <TableCell className="truncate text-xs max-w-[150px]">
                  {visitReason}
                </TableCell>

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
                          const val = date ? moment(date).format('YYYY-MM-DD') : '';
                          onFormChange('startDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        className={datePickerClass}
                        placeholderText="Start Date"
                        portalId="root"
                      />
                    </div>
                  ) : (
                    displayDate(startDate)
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
                          const val = date ? moment(date).format('YYYY-MM-DD') : '';
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
                    displayDate(endDate)
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
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
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
                          Reconcile
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Pagination & Editing Error Display */}
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

export default VisitorAttendancePage;