import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import Select from 'react-select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  date: z.date({ required_error: 'Date is required' }),
  shiftName: z.string().max(10, 'Max 10 characters').optional(),
  leaveType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  note: z.string().optional(),
  color: z.string().optional()
}).superRefine((data, ctx) => {
  if (!data.leaveType) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required",
        path: ["startTime"]
      });
    } else if (!timeRegex.test(data.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time cannot be bigger than 23:59",
        path: ["startTime"]
      });
    }

    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time is required",
        path: ["endTime"]
      });
    } else if (!timeRegex.test(data.endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time cannot be bigger than 23:59",
        path: ["endTime"]
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function AddRotaDialog({ isOpen, onClose, users, companyId, onSuccess,companyColor }: any) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { employeeId: '', shiftName: '', leaveType: '', startTime: '', endTime: '', note: '', color: companyColor }
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandardShift = !watchLeaveType;

   useEffect(() => {
    if (companyColor) {
      form.setValue("color", companyColor);
    }
  }, [companyColor, form,isOpen]);

  useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen, form]);

  const handleTimeBlur = (value: string, onChange: (val: string) => void) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    onChange(cleanValue);
  };

  const onSubmit = async (values: FormValues) => {
    const startDate = moment(values.date).format('YYYY-MM-DD');
    let endDate = startDate;

    if (isStandardShift && values.endTime && values.startTime && values.endTime < values.startTime) {
      endDate = moment(values.date).add(1, 'days').format('YYYY-MM-DD');
    }

    const payload: any = {
      companyId,
      employeeId: values.employeeId,
      note: values.note || '',
      startDate,
      endDate,
    };

    if (!isStandardShift) {
      payload.leaveType = values.leaveType;
      payload.shiftName = values.leaveType;
    } else {
      payload.shiftName = values.shiftName;
      payload.startTime = values.startTime;
      payload.endTime = values.endTime;
      payload.color = values.color;
    }

    try {
      const response = await axiosInstance.post('/rota', payload);
      toast({ title: 'Rota created successfully' });
      if (onSuccess) onSuccess(response.data.data);
      onClose();
    } catch (error) {
      toast({ title: 'Failed to create rota', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  const leaveOptions = [
    { id: 'DO', label: 'Day Off (DO)' },
    { id: 'AL', label: 'Annual Leave (AL)' },
    { id: 'S', label: 'Sick (S)' },
    { id: 'ML', label: 'Maternity (ML)' },
    { id: 'NT', label: 'No Task (NT)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="flex w-full max-w-4xl flex-col bg-white rounded-xl shadow-2xl max-h-[95vh] animate-in zoom-in-95 my-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-black">Add Rota</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Select Employee</FormLabel>
                        <FormControl>
                          <Select
                            options={users.map((u: any) => ({ value: u._id, label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name }))}
                            onChange={(opt) => field.onChange(opt?.value)}
                            className="text-sm text-black"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-bold uppercase">Date</FormLabel>
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                          placeholderText="Select Date"
                          dateFormat={'dd-MM-yyyy'}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase">Select Leave Type</FormLabel>
                    <ScrollArea className="h-48 p-4 shadow-sm bg-slate-50/50 rounded-md border border-slate-100">
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
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
                                      checked ? field.onChange(option.id) : field.onChange("")
                                    }
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium cursor-pointer">
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
                <div className="space-y-6 flex flex-col justify-start">
                  {isStandardShift ? (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="shiftName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">Shift Name</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={10} placeholder="e.g. Morning (Max 10 chars)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">Start Time</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="09:00"
                                  maxLength={5}
                                  className="font-mono"
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9:]/g, '').slice(0, 5);
                                    if (val.length === 2 && field.value?.length === 1 && !val.includes(':')) val += ':';
                                    field.onChange(val);
                                  }}
                                  onBlur={(e) => handleTimeBlur(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">End Time</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="17:00"
                                  maxLength={5}
                                  className="font-mono"
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9:]/g, '').slice(0, 5);
                                    if (val.length === 2 && field.value?.length === 1 && !val.includes(':')) val += ':';
                                    field.onChange(val);
                                  }}
                                  onBlur={(e) => handleTimeBlur(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">Shift Color</FormLabel>
                            <FormControl>
                              <Input
                                type="color"
                                {...field}
                                value={field.value || companyColor}
                                className="h-10 w-20 cursor-pointer p-1 rounded-md border border-gray-300"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 flex items-center justify-center text-center text-sm text-slate-500 animate-in fade-in">
                      A leave type is currently selected.<br />Standard shift fields are disabled.
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className={!isStandardShift ? "mt-auto" : ""}>
                        <FormLabel className="text-xs font-bold uppercase">Note (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Specific instructions or reasons..." className="min-h-[100px] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Shift</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}