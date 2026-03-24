import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CirclePicker } from 'react-color';
import { Plus, Trash2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type ShiftEntry = {
  id: string;
  startTime: string;
  endTime: string;
  startTimeError?: string;
  endTimeError?: string;
};

// ─── Zod Schema ─────────────────────────────────────────────────────────────
const formSchema = z.object({
  shiftName: z.string().max(20, 'Max 20 characters').optional(),
  leaveType: z.string().optional(),
  note: z.string().optional(),
  color: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export default function CreateRotaDialog({
  isOpen,
  onClose,
  employee,
  date,
  companyId,
  onSuccess,
  companyColor,
  departments = [],
  preselectedDepartmentId,
  publishedDates
}: any) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shiftName: '',
      leaveType: '',
      note: '',
      color: '#2196f3'
    }
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandardShift = !watchLeaveType;

  // Multiple shift time slots
  const [shifts, setShifts] = useState<ShiftEntry[]>([
    { id: '1', startTime: '', endTime: '' }
  ]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setShifts([{ id: '1', startTime: '', endTime: '' }]);
    }
  }, [isOpen, form]);

  const handleTimeBlur = (value: string): string => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    return cleanValue;
  };

  const updateShift = (
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const blurShift = (
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const formatted = handleTimeBlur(value);
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: formatted } : s))
    );
  };

  const addShift = () => {
    setShifts((prev) => [
      ...prev,
      { id: Date.now().toString(), startTime: '', endTime: '' }
    ]);
  };

  const removeShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  // Determine departmentId from employee's departmentId[] (populated objects from API)
  const employeeDeptIds: string[] =
    employee?.departmentId?.map((d: any) =>
      typeof d === 'object' ? d._id : d
    ) || [];

  // Auto-select: if preselected, use it; else if only one dept, use it
  const autoDepartmentId =
    preselectedDepartmentId ||
    (employeeDeptIds.length === 1 ? employeeDeptIds[0] : null);

  const validateShifts = (): boolean => {
    let valid = true;
    const updated = shifts.map((s) => {
      const errors: { startTimeError?: string; endTimeError?: string } = {};
      if (!s.startTime) {
        errors.startTimeError = 'Start time is required';
        valid = false;
      } else if (!timeRegex.test(s.startTime)) {
        errors.startTimeError = 'Invalid time (HH:MM)';
        valid = false;
      }
      if (!s.endTime) {
        errors.endTimeError = 'End time is required';
        valid = false;
      } else if (!timeRegex.test(s.endTime)) {
        errors.endTimeError = 'Invalid time (HH:MM)';
        valid = false;
      }
      return { ...s, ...errors };
    });
    setShifts(updated);
    return valid;
  };

  const onSubmit = async (values: FormValues) => {
    if (isStandardShift && !validateShifts()) return;

    const startDate = moment(date).format('YYYY-MM-DD');
    const departmentId = autoDepartmentId;

    if (!departmentId) {
      toast({
        title: 'Department not found for this employee',
        variant: 'destructive'
      });
      return;
    }

    // --- NEW: Check if the date is already published ---
    const isPublished = publishedDates?.has(startDate);
    const extraPayload = isPublished ? { status: 'publish' } : {};

    try {
      if (!isStandardShift) {
        // Single leave entry
        const payload: any = {
          companyId,
          employeeId: employee._id,
          note: values.note,
          startDate,
          endDate: startDate,
          leaveType: values.leaveType,
          shiftName: values.leaveType,
          departmentId,
          ...extraPayload // <--- ADDED
        };
        const response = await axiosInstance.post('/rota', payload);
        toast({ title: 'Shift created successfully' });
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      } else {
        // Post one rota per shift entry in loop
        const results: any[] = [];
        for (const shift of shifts) {
          let endDate = startDate;
          if (
            shift.endTime &&
            shift.startTime &&
            shift.endTime < shift.startTime
          ) {
            endDate = moment(date).add(1, 'days').format('YYYY-MM-DD');
          }
          const payload: any = {
            companyId,
            employeeId: employee._id,
            note: values.note,
            startDate,
            endDate,
            shiftName: values.shiftName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            color: values.color,
            departmentId,
            ...extraPayload // <--- ADDED
          };
          const response = await axiosInstance.post('/rota', payload);
          results.push(response.data.data);
        }
        toast({ title: `${results.length} shift(s) created successfully` });
        if (onSuccess) onSuccess(results);
        onClose();
      }
    } catch (error) {
      toast({ title: 'Failed to create shift', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  const leaveOptions = [
    { id: 'DO', label: 'Day Off (DO)' },
    { id: 'AL', label: 'Annual Leave (AL)' },
    { id: 'S', label: 'Sick (S)' },
    { id: 'ML', label: 'Maternity (ML)' },
    { id: 'NT', label: 'No Task (NT)' }
  ];

  const themeColors = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722',
    '#795548',
    '#607d8b'
  ];

  // Find department name for display
  const deptName = departments.find(
    (d: any) => d._id === autoDepartmentId
  )?.departmentName;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-screen items-start justify-center p-2 sm:p-4 md:items-center">
        <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl md:rounded-xl">
          {/* Header */}
          <div className="p-4">
            <h2 className="text-lg font-bold text-slate-900">
              Create Shift Entry
            </h2>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Scrollable Content Area */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                      <div>
                        <p className="text-xs font-bold uppercase">
                          Staff Member
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {employee?.firstName} {employee?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase">
                          Schedule Date
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {moment(date).format('DD MMM, YYYY')}
                        </p>
                      </div>
                      {deptName && (
                        <div className="col-span-2">
                          <p className="text-xs font-bold uppercase">
                            Department
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {deptName}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase">
                        Select Leave Type
                      </FormLabel>

                      <ScrollArea className="h-40 rounded-md bg-slate-50/30 p-3 shadow-sm sm:h-48 sm:p-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                          {leaveOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="leaveType"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value === option.id}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange(option.id)
                                          : field.onChange('')
                                      }
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer text-sm font-medium">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col justify-start space-y-6">
                    {isStandardShift ? (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="shiftName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">
                                Shift Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  maxLength={20}
                                  placeholder="e.g. Morning (Max 20 chars)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Multiple shift time slots */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-bold uppercase">
                              Shift Times
                            </FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              onClick={addShift}
                              className="h-7 gap-1 text-xs"
                            >
                              <Plus className="h-3 w-3" /> Add Time Slot
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {shifts.map((shift, idx) => (
                              <div
                                key={shift.id}
                                className="space-y-2 rounded-md border border-slate-100 bg-slate-50/50 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold ">
                                    Slot {idx + 1}
                                  </span>
                                  {shifts.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeShift(shift.id)}
                                      className="text-red-400 transition-colors hover:text-red-600"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase ">
                                      Start Time
                                    </label>
                                    <Input
                                      value={shift.startTime}
                                      placeholder="09:00"
                                      maxLength={5}
                                      className="mt-1 font-mono"
                                      onChange={(e) => {
                                        let val = e.target.value
                                          .replace(/[^0-9:]/g, '')
                                          .slice(0, 5);
                                        if (
                                          val.length === 2 &&
                                          shift.startTime.length === 1 &&
                                          !val.includes(':')
                                        )
                                          val += ':';
                                        updateShift(shift.id, 'startTime', val);
                                      }}
                                      onBlur={(e) =>
                                        blurShift(
                                          shift.id,
                                          'startTime',
                                          e.target.value
                                        )
                                      }
                                    />
                                    {shift.startTimeError && (
                                      <p className="mt-1 text-[10px] text-red-500">
                                        {shift.startTimeError}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase ">
                                      End Time
                                    </label>
                                    <Input
                                      value={shift.endTime}
                                      placeholder="17:00"
                                      maxLength={5}
                                      className="mt-1 font-mono"
                                      onChange={(e) => {
                                        let val = e.target.value
                                          .replace(/[^0-9:]/g, '')
                                          .slice(0, 5);
                                        if (
                                          val.length === 2 &&
                                          shift.endTime.length === 1 &&
                                          !val.includes(':')
                                        )
                                          val += ':';
                                        updateShift(shift.id, 'endTime', val);
                                      }}
                                      onBlur={(e) =>
                                        blurShift(
                                          shift.id,
                                          'endTime',
                                          e.target.value
                                        )
                                      }
                                    />
                                    {shift.endTimeError && (
                                      <p className="mt-1 text-[10px] text-red-500">
                                        {shift.endTimeError}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Color Picker */}
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">
                                Shift Color
                              </FormLabel>
                              <FormControl>
                                <div className="pt-2">
                                  <CirclePicker
                                    color={
                                      field.value || companyColor || '#2196f3'
                                    }
                                    width="252px"
                                    colors={themeColors}
                                    circleSize={28}
                                    circleSpacing={14}
                                    onChangeComplete={(color) =>
                                      field.onChange(color.hex)
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm duration-300 animate-in fade-in sm:p-8">
                        A leave type is currently selected.
                        <br />
                        Standard shift fields are disabled.
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem className={!isStandardShift ? 'mt-auto' : ''}>
                          <FormLabel className="text-xs font-bold uppercase">
                            Notes (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Specific instructions or reasons..."
                              className="min-h-[100px] resize-none"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse justify-stretch gap-3 p-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full px-8 sm:w-auto">
                  Create Shift{shifts.length > 1 ? `s (${shifts.length})` : ''}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
