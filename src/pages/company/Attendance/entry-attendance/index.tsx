import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '@/lib/axios';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { CalendarFold, Clock, User, Briefcase } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

// --- Types ---
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
}

// --- Zod Schema ---
// Helper for React Select options that allows null (when cleared) but fails validation if empty
const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string()
}).nullable();

const attendanceSchema = z
  .object({
    employee: selectOptionSchema.refine((val) => val !== null, {
      message: 'Employee is required'
    }),
    shift: selectOptionSchema.refine((val) => val !== null, {
      message: 'Shift is required'
    }),
    startDate: z.date({ required_error: 'Start Date is required' }),
    clockIn: z
      .string()
      .min(5, 'Format HH:MM')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time (HH:MM)'),
    endDate: z.date({ required_error: 'End Date is required' }),
    clockOut: z
      .string()
      .min(5, 'Format HH:MM')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time (HH:MM)'),
    notes: z.string().optional()
  })
  .refine(
    (data) => {
      // Guard: If basic fields are missing, don't trigger this error yet
      if (!data.startDate || !data.clockIn || !data.endDate || !data.clockOut) {
        return true;
      }

      // Combine Date and Time
      const start = moment(
        `${moment(data.startDate).format('YYYY-MM-DD')} ${data.clockIn}`,
        'YYYY-MM-DD HH:mm'
      );
      const end = moment(
        `${moment(data.endDate).format('YYYY-MM-DD')} ${data.clockOut}`,
        'YYYY-MM-DD HH:mm'
      );

      return end.isAfter(start);
    },
    {
      message: 'End time must be after start time',
      path: ['clockOut'] // Shows error under the Clock Out field
    }
  );

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export default function EntryAttendance() {
  const { toast } = useToast();
  const { id } = useParams();

  // --- State ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // --- React Hook Form Setup ---
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
      clockIn: '',
      clockOut: '',
      notes: ''
      // employee and shift start as undefined
    }
  });

  // Watch employee change to trigger shift fetch
  const selectedEmployee = form.watch('employee');

  // --- Fetch Employees on Mount ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empRes = await axiosInstance.get(
          `/users?company=${id}&role=employee&limit=all`
        );
        setEmployees(empRes.data.data.result || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employees.',
          variant: 'destructive'
        });
      }
    };
    fetchEmployees();
  }, [id, toast]);

  // --- Fetch Shifts when Employee Changes ---
  useEffect(() => {
    const fetchShifts = async () => {
      setShifts([]);
      form.setValue('shift', null); // Set to null safely

      if (!selectedEmployee?.value) return;

      setIsLoadingShifts(true);
      try {
        const rateRes = await axiosInstance.get(
          `/hr/employeeRate?employeeId=${selectedEmployee.value}`
        );

        const rates = rateRes?.data?.data?.result || [];
        const collectedShifts: Shift[] = [];
        const seenShiftIds = new Set<string>();

        rates.forEach((rate: any) => {
          const rawShift = rate.shiftId || rate.shifts;
          let shiftsInRate: Shift[] = [];
          if (Array.isArray(rawShift)) {
            shiftsInRate = rawShift;
          } else if (rawShift && typeof rawShift === 'object') {
            shiftsInRate = [rawShift];
          }

          shiftsInRate.forEach((s) => {
            if (s._id && !seenShiftIds.has(s._id)) {
              seenShiftIds.add(s._id);
              collectedShifts.push(s);
            }
          });
        });

        setShifts(collectedShifts);

        if (collectedShifts.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Shifts Found',
            description: 'This employee has no active rates with assigned shifts.'
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load shifts.'
        });
      } finally {
        setIsLoadingShifts(false);
      }
    };

    fetchShifts();
  }, [selectedEmployee?.value, form, toast]);

  // --- Time Input Handler ---
  const handleTimeInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void
  ) => {
    const inputValue = e.target.value;
    
    // 1. Allow clearing
    if (inputValue === '') {
      onChange('');
      return;
    }

    // 2. Only allow numbers and colon
    if (!/^[0-9:]*$/.test(inputValue)) return;

    // 3. Remove existing colon to process logic
    const rawNums = inputValue.replace(':', '');

    // 4. Prevent typing more than 4 numbers
    if (rawNums.length > 4) return;

    let newValue = inputValue;

    // 5. Auto-insert colon if typing the 3rd number
    if (rawNums.length === 3 && !inputValue.includes(':')) {
       newValue = `${rawNums.slice(0, 2)}:${rawNums.slice(2)}`;
    }

    // 6. Strict Limit Validations (HH max 23, MM max 59)
    const parts = newValue.split(':');
    
    // Check Hours
    if (parts[0] && parseInt(parts[0]) > 23) return; 
    
    // Check Minutes
    if (parts[1] && parseInt(parts[1]) > 59) return;

    // 7. Max length check (5 chars: HH:MM)
    if (newValue.length > 5) return;

    onChange(newValue);
  };

  const handleTimeBlur = (value: string, onChange: (val: string) => void) => {
    if (!value) return;
    
    // Auto-format simple numbers
    if (!value.includes(':')) {
      if (value.length === 1) onChange(`0${value}:00`);
      else if (value.length === 2) onChange(`${value}:00`);
      else if (value.length === 3) onChange(`${value.slice(0, 2)}:0${value.slice(2)}`);
      else if (value.length === 4) onChange(`${value.slice(0, 2)}:${value.slice(2)}`);
    } else {
      // Ensure padding
      const [h, m] = value.split(':');
      const formatted = `${h.padStart(2, '0')}:${(m || '00').padEnd(2, '0')}`;
      onChange(formatted);
    }
  };

  // --- Submit Handler ---
  const onSubmit = async (data: AttendanceFormValues) => {
    if (!data.employee || !data.shift) return;

    try {
      const fStartDate = moment(data.startDate).format('YYYY-MM-DD');
      const fStartTime = `${data.clockIn}:00.000`;
      const fEndDate = moment(data.endDate).format('YYYY-MM-DD');
      const fEndTime = `${data.clockOut}:00.000`;

      const startDateTime = moment(`${fStartDate} ${fStartTime}`);
      const endDateTime = moment(`${fEndDate} ${fEndTime}`);
      const durationInMinutes = endDateTime.diff(startDateTime, 'minutes');

      const payload = {
        userId: data.employee.value,
        shiftId: data.shift.value,
        startDate: fStartDate,
        startTime: fStartTime,
        endDate: fEndDate,
        endTime: fEndTime,
        eventType: 'manual',
        clockType: 'manual',
        approvalStatus: 'approved',
        notes: data.notes,
        duration: durationInMinutes
      };

      await axiosInstance.post('/hr/attendance/clock-event', payload);

      toast({
        title: 'Success',
        description: 'Attendance created successfully.'
      });

      // --- FULL RESET ---
      // Explicitly set employee and shift to null to clear the Select components
      form.reset({
        startDate: undefined,
        endDate: undefined,
        clockIn: '',
        clockOut: '',
        notes: '',
        employee: null, 
        shift: null
      });

    } catch (error: any) {
      console.error('Submit Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create attendance.'
      });
    }
  };

  // --- Options ---
  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label: `${emp.firstName} ${emp.lastName}`
  }));

  const shiftOptions = shifts.map((shift) => ({
    value: shift._id,
    label: `${shift.name} (${shift.startTime} - ${shift.endTime})`
  }));

  return (
    <div className="">
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-theme">
            <Clock className="h-5 w-5" />
            Manual Attendance Entry
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: Employee & Shift */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-theme" /> Employee{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          options={employeeOptions}
                          classNamePrefix="select"
                          placeholder="Select Employee..."
                          isClearable
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-theme" /> Shift{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          options={shiftOptions}
                          classNamePrefix="select"
                          placeholder={
                            isLoadingShifts
                              ? 'Loading shifts...'
                              : 'Select Shift...'
                          }
                          isLoading={isLoadingShifts}
                          isDisabled={!selectedEmployee?.value || shifts.length === 0}
                          noOptionsMessage={() => 'No shifts found for this employee'}
                          isClearable
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Start Date & Time */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarFold className="h-4 w-4 text-green-600" />{' '}
                        Start Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-theme focus:ring-1 focus:ring-theme"
                            wrapperClassName="w-full"
                            placeholderText="DD/MM/YYYY"
                          />
                          <CalendarFold className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clockIn"
                  render={({ field }) => (
                    <FormItem className="-mt-2">
                      <FormLabel>
                        Start Time (HH:MM) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="09:00"
                          maxLength={5}
                          className="text-lg tracking-wide"
                          onChange={(e) => handleTimeInput(e, field.onChange)}
                          onBlur={() => handleTimeBlur(field.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: End Date & Time */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarFold className="h-4 w-4 text-red-600" /> End
                        Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-theme focus:ring-1 focus:ring-theme"
                            wrapperClassName="w-full"
                            minDate={form.watch('startDate')}
                            placeholderText="DD/MM/YYYY"
                          />
                          <CalendarFold className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clockOut"
                  render={({ field }) => (
                    <FormItem className="-mt-2">
                      <FormLabel>
                        End Time (HH:MM) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="18:00"
                          maxLength={5}
                          className="text-lg tracking-wide"
                          onChange={(e) => handleTimeInput(e, field.onChange)}
                          onBlur={() => handleTimeBlur(field.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Optional reason..."
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-theme px-8 text-white hover:bg-theme/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? 'Saving...'
                    : 'Save Attendance'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}