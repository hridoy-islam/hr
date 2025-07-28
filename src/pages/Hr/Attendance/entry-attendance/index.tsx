import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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

interface TimeState {
  hour: number;
  minute: number;
}

interface AttendanceData {
  userId: string;
  clockIn: Date | null;
  clockOut: Date | null;
  clockType: 'manual';
}

interface TimeScrollListProps {
  title: string;
  items: { value: number; label: string }[];
  selectedValue: number;
  onSelect: (val: number) => void;
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
  const [openDialog, setOpenDialog] = useState<'clockIn' | 'clockOut' | null>(
    null
  );
  const [tempTime, setTempTime] = useState<TimeState>({
    hour: new Date().getHours(),
    minute: Math.floor(new Date().getMinutes() / 5) * 5
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    userId: '',
    clockIn: null,
    clockOut: null,
    clockType: 'manual'
  });

  // Fetch employees and shifts
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

  useEffect(() => {
    if (openDialog) {
      setTempTime({ hour: 0, minute: 0 });
    }
  }, [openDialog]);

  const handleEmployeeChange = async (
    selectedOption: { value: string; label: string } | null
  ) => {
    if (!selectedOption) return;

    setAttendanceData((prev) => ({
      ...prev,
      userId: selectedOption.value,
      shiftId: '',
      shiftDetails: null
    }));

    try {
      const rateRes = await axiosInstance.get(
        `/hr/employeeRate?employeeId=${selectedOption.value}`
      );

      const shiftData = rateRes?.data?.data?.result?.[0]?.shiftId || [];

      if (shiftData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Shift Found',
          description: 'This employee has no assigned shift.'
        });
      }

      setShifts(shiftData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching shift',
        description:
          error.response?.data?.message ||
          'Failed to load shift from employee rate'
      });
    }
  };

  const confirmTime = () => {
    if (!openDialog) return;
    const now = attendanceData.createdAt;
    const selectedTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      tempTime.hour,
      tempTime.minute
    );
    setAttendanceData((prev) => ({
      ...prev,
      [openDialog === 'clockIn' ? 'clockIn' : 'clockOut']: selectedTime
    }));
    setOpenDialog(null);
  };

  const handleSubmit = async () => {
    if (!attendanceData.userId || !attendanceData.clockIn) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description:
          'Please select an employee and provide a valid clock in and clock out time.'
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
        clockType: 'manual'
      });
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

  const shiftOptions = shifts.map((shift) => ({
    value: shift._id,
    label: shift.name
  }));

  return (
    <div className=" space-y-3 rounded-lg bg-white px-6 py-4 shadow-md">
      <h1 className="text-3xl font-bold text-gray-800">Attendance Entry</h1>

      {/* Employee Selection */}
      <div className="">
        <h2 className=" text-lg font-semibold text-gray-700">
          Select Employee
        </h2>
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div>
            
            <Select
              options={employeeOptions}
              isLoading={loading.employees}
              onChange={handleEmployeeChange}
              placeholder="Search and select an employee..."
              value={employeeOptions.find(
                (opt) => opt.value === attendanceData.userId
              )}
              className="w-full"
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
          <div className=" col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">
              Assigned Shifts
            </h2>
            {shifts.length > 0 ? (
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
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                No shift assigned to this employee
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Details */}

      {/* Attendance Form */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-700">
          Attendance Details
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Date Picker */}
          {/* Date Picker */}
          <div className="w-full">
            <label
              htmlFor="date-picker"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Date
            </label>
            <div className="w-full">
              <DatePicker
                id="date-picker"
                selected={attendanceData.createdAt}
                onChange={(date: Date) =>
                  setAttendanceData((prev) => ({ ...prev, createdAt: date }))
                }
                dateFormat="MMMM d, yyyy"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                calendarClassName="!w-full"
                wrapperClassName="w-full"
                placeholderText="Select date"
                showMonthDropdown
                showYearDropdown
              />
            </div>
          </div>

          {/* Clock In Button */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Clock In
            </label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start border-gray-300 bg-white text-sm font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => setOpenDialog('clockIn')}
            >
              {attendanceData.clockIn ? (
                <span className="font-medium">
                  {attendanceData.clockIn.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              ) : (
                'Select clock-in time'
              )}
            </Button>
          </div>

          {/* Clock Out Button */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Clock Out
            </label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start border-gray-300 bg-white text-sm font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => setOpenDialog('clockOut')}
            >
              {attendanceData.clockOut ? (
                <span className="font-medium">
                  {attendanceData.clockOut.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              ) : (
                'Select clock-out time'
              )}
            </Button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading.submitting || !attendanceData.clockIn}
            className="bg-black bg-supperagent px-6 py-2 text-white hover:bg-supperagent/90 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading.submitting ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </div>
      </div>

      {/* Time Picker Dialog */}
      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Select {openDialog === 'clockIn' ? 'Clock In' : 'Clock Out'} Time
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4 flex justify-center gap-2 text-3xl font-bold">
            <input
              type="number"
              value={String(tempTime.hour).padStart(2, '0')}
              onChange={(e) => {
                const value = Math.min(23, Math.max(0, Number(e.target.value)));
                setTempTime((prev) => ({ ...prev, hour: value }));
              }}
              className="w-16 rounded border px-2 py-1 text-center text-xl"
              min={0}
              max={23}
            />
            <span className="text-xl">:</span>
            <input
              type="number"
              value={String(tempTime.minute).padStart(2, '0')}
              onChange={(e) => {
                const value = Math.min(59, Math.max(0, Number(e.target.value)));
                setTempTime((prev) => ({ ...prev, minute: value }));
              }}
              className="w-16 rounded border px-2 py-1 text-center text-xl"
              min={0}
              max={59}
            />
          </div>

          <div className="flex gap-4">
            <TimeScrollList
              title="Hours"
              items={Array.from({ length: 24 }, (_, i) => ({
                value: i,
                label: String(i).padStart(2, '0')
              }))}
              selectedValue={tempTime.hour}
              onSelect={(val) =>
                setTempTime((prev) => ({ ...prev, hour: val }))
              }
            />
            <TimeScrollList
              title="Minutes"
              items={Array.from({ length: 60 }, (_, i) => i * 1).map((m) => ({
                value: m,
                label: String(m).padStart(2, '0')
              }))}
              selectedValue={tempTime.minute}
              onSelect={(val) =>
                setTempTime((prev) => ({ ...prev, minute: val }))
              }
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpenDialog(null)}
              className="border-gray-300 text-white hover:bg-black/90"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTime}
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimeScrollList({
  title,
  items,
  selectedValue,
  onSelect
}: TimeScrollListProps) {
  return (
    <div className="flex-1">
      <h3 className="mb-1 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <ScrollArea className="h-48 rounded-md border">
        <div className="flex flex-col gap-1 p-1">
          {items.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              className={cn(
                'h-9 w-full justify-center px-2',
                item.value === selectedValue &&
                  'bg-black text-white hover:bg-black'
              )}
              onClick={() => onSelect(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
