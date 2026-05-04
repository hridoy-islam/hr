import React, { useEffect, useState, useMemo } from 'react';
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
import Select from 'react-select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CirclePicker } from 'react-color';
import { Plus, Trash2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type Department = {
  _id: string;
  departmentName: string;
  parentDepartmentId?: any;
  index?: number;
};

type ShiftEntry = {
  id: string;
  startTime: string;
  endTime: string;
  startTimeError?: string;
  endTimeError?: string;
};

// ─── Zod Schema ─────────────────────────────────────────────────────────────
const formSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department'),
  employeeId: z.string().min(1, 'Please select an employee'),
  date: z.date({ required_error: 'Date is required' }),
  shiftName: z.string().max(20, 'Max 20 characters').optional(),
  leaveType: z.string().optional(),
  note: z.string().optional(),
  color: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export default function AddRotaDialog({
  isOpen,
  onClose,
  users = [],
  companyId,
  onSuccess,
  companyColor,
  departments = [],
  publishedDates
}: any) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: '',
      employeeId: '',
      shiftName: '',
      leaveType: '',
      note: '',
      color: '#2196f3'
    }
  });

  const watchLeaveType = form.watch('leaveType');
  const watchDepartmentId = form.watch('departmentId');
  const watchEmployeeId = form.watch('employeeId');

  const isStandardShift = !watchLeaveType;

  const [shifts, setShifts] = useState<ShiftEntry[]>([
    { id: '1', startTime: '', endTime: '' }
  ]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        departmentId: '',
        employeeId: '',
        shiftName: '',
        leaveType: '',
        note: '',
        color: '#2196f3'
      });
      setShifts([{ id: '1', startTime: '', endTime: '' }]);
    }
  }, [isOpen, form]);

  // --- NEW: Hierarchical Department Options Logic ---
  const departmentOptions = useMemo(() => {
    const options: any[] = [];

    // Identify root departments (no parent or parent not in the list)
    const allDeptIds = new Set(departments.map((d: any) => d._id));
    const roots = departments
      .filter((d: any) => {
        const parentId = d.parentDepartmentId?._id || d.parentDepartmentId;
        return !parentId || !allDeptIds.has(parentId);
      })
      .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));

    // Build the flat list with hierarchy markers
    roots.forEach((root: any) => {
      options.push({
        value: root._id,
        label: root.departmentName,
        isChild: false
      });

      const children = departments
        .filter((d: any) => {
          const parentId = d.parentDepartmentId?._id || d.parentDepartmentId;
          return parentId === root._id;
        })
        .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));

      children.forEach((child: any) => {
        options.push({
          value: child._id,
          label: child.departmentName,
          isChild: true
        });
      });
    });

    return options;
  }, [departments]);

  // Filter users based on selected department
  const filteredUsers = useMemo(() => {
    if (!watchDepartmentId) return [];

    return users.filter((u: any) => {
      if (!u.departmentId || !Array.isArray(u.departmentId)) return false;
      return u.departmentId.some((d: any) => {
        const id = typeof d === 'object' ? d._id : d;
        return id === watchDepartmentId;
      });
    });
  }, [users, watchDepartmentId]);

  // Auto-clear employee if they don't belong to newly selected department
  useEffect(() => {
    if (watchDepartmentId && watchEmployeeId) {
      const isEmployeeInDept = filteredUsers.some(
        (u: any) => u._id === watchEmployeeId
      );
      if (!isEmployeeInDept) {
        form.setValue('employeeId', '');
      }
    }
  }, [watchDepartmentId, watchEmployeeId, filteredUsers, form]);

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

  const validateShifts = (): boolean => {
    let valid = true;
    const updated = shifts.map((s) => {
      const errors: { startTimeError?: string; endTimeError?: string } = {};
      if (!s.startTime) {
        errors.startTimeError = 'Start time is required';
        valid = false;
      } else if (!timeRegex.test(s.startTime)) {
        errors.startTimeError = 'Invalid time';
        valid = false;
      }
      if (!s.endTime) {
        errors.endTimeError = 'End time is required';
        valid = false;
      } else if (!timeRegex.test(s.endTime)) {
        errors.endTimeError = 'Invalid time';
        valid = false;
      }
      return { ...s, ...errors };
    });
    setShifts(updated);
    return valid;
  };

  const onSubmit = async (values: FormValues) => {
    if (isStandardShift && !validateShifts()) return;

    const startDate = moment(values.date).format('YYYY-MM-DD');

    // --- NEW: Check if the date is already published ---
    const isPublished = publishedDates?.has(startDate);
    const extraPayload = isPublished ? { status: 'publish' } : {};

    try {
      if (!isStandardShift) {
        const payload: any = {
          companyId,
          employeeId: values.employeeId,
          departmentId: values.departmentId,
          note: values.note || '',
          startDate,
          endDate: startDate,
          leaveType: values.leaveType,
          shiftName: values.leaveType,
          ...extraPayload 
        };
        const response = await axiosInstance.post('/rota', payload);
        toast({ title: 'Rota created successfully' });
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      } else {
        const results: any[] = [];
        for (const shift of shifts) {
          let endDate = startDate;
          if (
            shift.endTime &&
            shift.startTime &&
            shift.endTime < shift.startTime
          ) {
            endDate = moment(values.date).add(1, 'days').format('YYYY-MM-DD');
          }
          const payload: any = {
            companyId,
            employeeId: values.employeeId,
            departmentId: values.departmentId,
            note: values.note || '',
            startDate,
            endDate,
            shiftName: values.shiftName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            color: values.color,
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
      toast({ title: 'Failed to create rota', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  const leaveOptions = [
    { id: 'DO', label: 'Day Off (DO)' },
    // { id: 'AL', label: 'Annual Leave (AL)' },
    // { id: 'S', label: 'Sick (S)' },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="my-4 flex max-h-[95vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold text-black">Add Rota</h2>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">
                          Select Department
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={departmentOptions}
                            value={
                              departmentOptions.find(
                                (opt) => opt.value === field.value
                              ) || null
                            }
                            onChange={(opt) => field.onChange(opt?.value || '')}
                            placeholder="Select department..."
                            className="text-sm text-black"
                            formatOptionLabel={(option: any) => (
                              <div
                                className={`flex items-center gap-2 ${option.isChild ? 'ml-6 ' : 'font-semibold text-slate-900'}`}
                              >
                                {option.isChild && (
                                  <span className="">└─</span>
                                )}
                                <span>{option.label}</span>
                              </div>
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 2. Select Employee (Filtered) */}
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">
                          Select Employee
                        </FormLabel>
                        <FormControl>
                          <Select
                            isDisabled={!watchDepartmentId}
                            options={filteredUsers.map((u: any) => ({
                              value: u._id,
                              label:
                                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                                u.name
                            }))}
                            value={
                              field.value
                                ? {
                                    value: field.value,
                                    label: filteredUsers.find(
                                      (u: any) => u._id === field.value
                                    )
                                      ? `${filteredUsers.find((u: any) => u._id === field.value)?.firstName || ''} ${filteredUsers.find((u: any) => u._id === field.value)?.lastName || ''}`.trim() ||
                                        filteredUsers.find(
                                          (u: any) => u._id === field.value
                                        )?.name
                                      : ''
                                  }
                                : null
                            }
                            onChange={(opt) => field.onChange(opt?.value)}
                            placeholder={
                              watchDepartmentId
                                ? 'Select employee...'
                                : 'Select department first'
                            }
                            className="text-sm text-black"
                          />
                        </FormControl>
                        {filteredUsers.length === 0 && watchDepartmentId && (
                          <p className="mt-1 text-[11px] text-gray-500">
                            No employees found in this department.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    
                  {/* 3. Date */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col pt-2">
                        <FormLabel className="text-xs font-bold uppercase">
                          Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={field.value}
                            onChange={(date: Date) => field.onChange(date)}
                            dateFormat="dd-MM-yyyy"
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                            placeholderText="Select date"
                            wrapperClassName="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 4. Leave Type */}
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="text-xs font-bold uppercase text-slate-900">
                      Leave Type
                    </label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-slate-100 bg-slate-50 p-4">
                      {leaveOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="leaveType"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === option.id}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked ? option.id : '');
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── Right Column ──────────────────────────────────────── */}
                <div className="flex flex-col space-y-6">
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
                                placeholder="e.g. Morning"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Time Slots */}
                      <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            Time Slots
                          </h3>
                          <Button type="button" size="sm" onClick={addShift}>
                            <Plus className="mr-1 h-3 w-3" />
                            Add Slot
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {shifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="group relative flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300"
                            >
                              <div className="flex flex-1 gap-3">
                                <div className="flex-1">
                                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                                    Start Time
                                  </label>
                                  <Input
                                    value={shift.startTime}
                                    placeholder="09:00"
                                    maxLength={5}
                                    className={`h-9 font-mono text-sm ${shift.startTimeError ? 'border-red-500' : ''}`}
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
                                <div className="flex-1">
                                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                                    End Time
                                  </label>
                                  <Input
                                    value={shift.endTime}
                                    placeholder="17:00"
                                    maxLength={5}
                                    className={`h-9 font-mono text-sm ${shift.endTimeError ? 'border-red-500' : ''}`}
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
                              {shifts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeShift(shift.id)}
                                  className="mt-6 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">
                              Shift Color
                            </FormLabel>
                            <div className="pt-2">
                              <CirclePicker
                                color={field.value || companyColor || '#2196f3'}
                                width="100%"
                                colors={themeColors}
                                circleSize={26}
                                circleSpacing={12}
                                onChangeComplete={(color) =>
                                  field.onChange(color.hex)
                                }
                              />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 animate-in fade-in">
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
                          Note (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Specific instructions or reasons..."
                            className="min-h-[100px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Add Shift{shifts.length > 1 ? `s (${shifts.length})` : ''}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
