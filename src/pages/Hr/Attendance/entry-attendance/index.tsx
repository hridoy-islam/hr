import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { CalendarFold } from 'lucide-react';

interface Employee {
  _id: string;
  title?: string;
  firstName: string;
  lastName: string;
  initial?: string;
}

interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  __v?: number;
}

interface AttendanceData {
  userId: string;
  clockIn: Date | null;
  clockOut: Date | null;
  clockType: 'manual';
  createdAt?: Date;
}

export default function EntryAttendance() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState({
    employees: false,
    shifts: false,
    submitting: false
  });

  // Main attendance data
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    userId: '',
    clockIn: null,
    clockOut: null,
    clockType: 'manual',
    createdAt: undefined // Default to today
  });

  // Replace inputTimes with modifiedAttendance-like structure (single entry)
  const [modifiedAttendance, setModifiedAttendance] = useState<{
    [id: string]: { clockIn: string; clockOut: string };
  }>({
    single: { clockIn: '', clockOut: '' }
  });

  // Fetch employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading((prev) => ({ ...prev, employees: true }));
        const empRes = await axiosInstance.get(
          '/users?role=employee&limit=all'
        );
        setEmployees(empRes?.data?.data?.result || []);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error fetching employees',
          description:
            error.response?.data?.message || 'Failed to fetch employees'
        });
      } finally {
        setLoading((prev) => ({ ...prev, employees: false }));
      }
    };
    fetchData();
  }, [toast]);

  // Sync modifiedAttendance when clockIn/clockOut change externally (e.g. date change)
  useEffect(() => {
    if (attendanceData.clockIn) {
      setModifiedAttendance((prev) => ({
        ...prev,
        single: {
          ...prev.single,
          clockIn: moment(attendanceData.clockIn).format('HH:mm')
        }
      }));
    }
    if (attendanceData.clockOut) {
      setModifiedAttendance((prev) => ({
        ...prev,
        single: {
          ...prev.single,
          clockOut: moment(attendanceData.clockOut).format('HH:mm')
        }
      }));
    }
  }, [attendanceData.clockIn, attendanceData.clockOut]);

  // Handle employee change
  const handleEmployeeChange = async (
    selectedOption: { value: string; label: string } | null
  ) => {
    if (!selectedOption) {
      setAttendanceData((prev) => ({ ...prev, userId: '' }));
      setShifts([]);
      setModifiedAttendance((prev) => ({
        ...prev,
        single: { clockIn: '', clockOut: '' }
      }));
      return;
    }

    setAttendanceData((prev) => ({
      ...prev,
      userId: selectedOption.value
    }));

    try {
      const rateRes = await axiosInstance.get(
        `/hr/employeeRate?employeeId=${selectedOption.value}`
      );
      const shiftData = rateRes?.data?.data?.result?.[0]?.shiftId || [];
      setShifts(
        Array.isArray(shiftData) ? shiftData : [shiftData].filter(Boolean)
      );

      if (Array.isArray(shiftData) && shiftData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Shift Found',
          description: 'This employee has no assigned shift.'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching shift',
        description:
          error.response?.data?.message ||
          'Failed to load shift from employee rate'
      });
      setShifts([]);
    }
  };

  // Enhanced time input handler (your provided logic)
  const handleTimeChange = (
    id: string,
    type: 'clockIn' | 'clockOut',
    value: string
  ) => {
    const previous = modifiedAttendance[id]?.[type] || '';

    // Allow clearing the field
    if (value === '') {
      setModifiedAttendance((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: ''
        }
      }));
      return;
    }

    // Detect backspacing — allow free form typing
    if (value.length < previous.length) {
      setModifiedAttendance((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: value
        }
      }));
      return;
    }

    // Clean input (keep digits only for auto-format)
    const sanitized = value.replace(/[^0-9]/g, '');

    let formatted = value;

    if (value.includes(':')) {
      // Manual typing with colon
      const [h, m] = value.split(':');
      const hours = h?.slice(0, 2) ?? '';
      const minutes = m?.slice(0, 2) ?? '';
      formatted = minutes ? `${hours}:${minutes}` : hours;
    } else {
      // Auto-format from digits
      if (sanitized.length <= 2) {
        formatted = sanitized; // '2' or '19'
      } else if (sanitized.length === 3) {
        formatted = `${sanitized.slice(0, 2)}:${sanitized.slice(2)}`;
      } else if (sanitized.length >= 4) {
        formatted = `${sanitized.slice(0, 2)}:${sanitized.slice(2, 4)}`;
      } else {
        formatted = previous; // fallback
      }
    }

    // Prevent invalid times like 25:00
    const [hh, mm] = formatted.split(':').map(Number);
    if (!isNaN(hh) && (hh < 0 || hh > 23)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Hour',
        description: 'Hour must be between 00 and 23.'
      });
      return;
    }
    if (!isNaN(mm) && (mm < 0 || mm > 59)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Minute',
        description: 'Minute must be between 00 and 59.'
      });
      return;
    }

    setModifiedAttendance((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [type]: formatted
      }
    }));
  };

  // Convert HH:mm string + date to Date object
  const parseTimeToDate = (timeStr: string, baseDate: Date): Date | null => {
    if (!timeStr || !moment(timeStr, 'HH:mm', true).isValid()) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // On blur: validate and update attendanceData
  const handleTimeBlur = (id: string, type: 'clockIn' | 'clockOut') => {
    const timeStr = modifiedAttendance[id]?.[type];
    const baseDate = attendanceData.createdAt || new Date();

    if (!timeStr) {
      setAttendanceData((prev) => ({ ...prev, [type]: null }));
      return;
    }

    const parsedDate = parseTimeToDate(timeStr, baseDate);
    if (parsedDate) {
      setAttendanceData((prev) => ({ ...prev, [type]: parsedDate }));
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Time',
        description: `Please enter a valid time in HH:mm format (e.g. 09:30).`
      });
    }
  };

  // Handle date change via DatePicker
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    setAttendanceData((prev) => ({ ...prev, createdAt: date }));

    // Re-parse times with new date
    if (modifiedAttendance.single.clockIn) {
      const newClockIn = parseTimeToDate(
        modifiedAttendance.single.clockIn,
        date
      );
      setAttendanceData((prev) => ({ ...prev, clockIn: newClockIn }));
    }
    if (modifiedAttendance.single.clockOut) {
      const newClockOut = parseTimeToDate(
        modifiedAttendance.single.clockOut,
        date
      );
      setAttendanceData((prev) => ({ ...prev, clockOut: newClockOut }));
    }
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (!attendanceData.userId || !attendanceData.clockIn) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description:
          'Please select an employee and provide a valid clock-in time.'
      });
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, submitting: true }));

      const payload = {
        userId: attendanceData.userId,
        clockIn: attendanceData.clockIn,
        clockOut: attendanceData.clockOut,
        clockType: 'manual',
        eventType: 'manual',
        timestamp: new Date().toISOString()
      };

      await axiosInstance.post('/hr/attendance/clock-event', payload);

      toast({
        title: 'Success',
        description: 'Attendance recorded successfully'
      });

      // Reset form
      setAttendanceData({
        userId: '',
        clockIn: null,
        clockOut: null,
        clockType: 'manual',
        createdAt: undefined
      });
      setModifiedAttendance({ single: { clockIn: '', clockOut: '' } });
      setShifts([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to record attendance'
      });
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label:
      `${emp.title || ''} ${emp.firstName} ${emp.initial || ''} ${emp.lastName}`.trim()
  }));

  return (
    <div className="space-y-3 rounded-lg bg-white px-6 py-4 shadow-md">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
        <CalendarFold className="h-6 w-6" />
        Attendance Entry
      </h2>{' '}
      {/* Employee Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700">Select Employee</h2>
        <div className="flex flex-col gap-4">
          <div>
            <Select
              options={employeeOptions}
              isLoading={loading.employees}
              onChange={handleEmployeeChange}
              placeholder="Search and select an employee..."
              value={
                employeeOptions.find(
                  (opt) => opt.value === attendanceData.userId
                ) || null
              }
              className="w-[30vw]"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#D1D5DB',
                  borderRadius: '0.5rem',
                  padding: '2px',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#9CA3AF' }
                })
              }}
            />
          </div>

          {/* Show Assigned Shifts only if employee is selected and has shifts */}
          {attendanceData.userId && shifts.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-700">
                Assigned Shifts
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shifts.map((shift) => (
                  <div
                    key={shift._id}
                    className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <h3 className="font-medium text-gray-800">{shift.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Attendance Details */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-700">
          Attendance Details
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Date Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Date
            </label>
            <DatePicker
              selected={attendanceData.createdAt}
              onChange={handleDateChange}
              dateFormat="dd-MM-yyyy"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholderText="Select date"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>

          {/* Clock In Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Clock In
            </label>
            <Input
              type="text"
              placeholder="HH:mm"
              value={modifiedAttendance.single.clockIn}
              onChange={(e) =>
                handleTimeChange('single', 'clockIn', e.target.value)
              }
              onBlur={() => handleTimeBlur('single', 'clockIn')}
              maxLength={5}
              className="text-center font-mono bg-white"
            />
          </div>

          {/* Clock Out Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Clock Out
            </label>
            <Input
              type="text"
              placeholder="HH:mm"
              value={modifiedAttendance.single.clockOut}
              onChange={(e) =>
                handleTimeChange('single', 'clockOut', e.target.value)
              }
              onBlur={() => handleTimeBlur('single', 'clockOut')}
              maxLength={5}
              className="text-center font-mono bg-white"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading.submitting || !attendanceData.clockIn}
            className="bg-supperagent px-6 py-2 text-white hover:bg-supperagent/90 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading.submitting ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </div>
      </div>
    </div>
  );
}
