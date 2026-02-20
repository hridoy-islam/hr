
import React, { useEffect } from 'react';
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
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ─── Zod Schema ─────────────────────────────────────────────────────────────
const formSchema = z.object({
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

export default function CreateRotaDialog({
  isOpen,
  onClose,
  employee,
  date,
  companyId,
  onSuccess,
          companyColor
}: any) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shiftName: '',
      leaveType: '',
      startTime: '',
      endTime: '',
      note: '',
      color:companyColor
    }
  });

 useEffect(() => {
  if (companyColor) {
    form.setValue("color", companyColor);
  }
}, [companyColor, form]);

  const watchLeaveType = form.watch('leaveType');
  const isStandardShift = !watchLeaveType;

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
    const startDate = moment(date).format('YYYY-MM-DD');
    let endDate = startDate;

    if (isStandardShift && values.endTime && values.startTime && values.endTime < values.startTime) {
      endDate = moment(date).add(1, 'days').format('YYYY-MM-DD');
    }

    const payload: any = {
      companyId,
      employeeId: employee._id,
      note: values.note,
      startDate,
      endDate
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
      toast({ title: 'Shift created successfully' });
      if (onSuccess) onSuccess(response.data.data);
      onClose();
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
    { id: 'NT', label: 'No Task (NT)' },
  ];

  return (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto">
    <div className="min-h-screen flex items-start md:items-center justify-center p-2 sm:p-4">
      <div className="flex w-full max-w-5xl flex-col bg-white rounded-lg md:rounded-xl shadow-2xl max-h-[95vh]">

        {/* Header */}
        <div className="p-4 ">
          <h2 className="text-lg font-bold text-slate-900">
            Create Shift Entry
          </h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-4 sm:p-6">

                {/* Left Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase ">Staff Member</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {employee?.firstName} {employee?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase ">Schedule Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {moment(date).format('DD MMM, YYYY')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase">
                      Select Leave Type
                    </FormLabel>

                    <ScrollArea className="h-40 sm:h-48 p-3 sm:p-4 shadow-sm bg-slate-50/30 rounded-md">
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
                                      checked
                                        ? field.onChange(option.id)
                                        : field.onChange("")
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
                            <FormLabel className="text-xs font-bold uppercase">
                              Shift Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={10}
                                placeholder="e.g. Morning (Max 10 chars)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">
                                Start Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="09:00"
                                  maxLength={5}
                                  className="font-mono"
                                  onChange={(e) => {
                                    let val = e.target.value
                                      .replace(/[^0-9:]/g, '')
                                      .slice(0, 5);
                                    if (
                                      val.length === 2 &&
                                      field.value?.length === 1 &&
                                      !val.includes(':')
                                    ) {
                                      val += ':';
                                    }
                                    field.onChange(val);
                                  }}
                                  onBlur={(e) =>
                                    handleTimeBlur(
                                      e.target.value,
                                      field.onChange
                                    )
                                  }
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
                              <FormLabel className="text-xs font-bold uppercase">
                                End Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="17:00"
                                  maxLength={5}
                                  className="font-mono"
                                  onChange={(e) => {
                                    let val = e.target.value
                                      .replace(/[^0-9:]/g, '')
                                      .slice(0, 5);
                                    if (
                                      val.length === 2 &&
                                      field.value?.length === 1 &&
                                      !val.includes(':')
                                    ) {
                                      val += ':';
                                    }
                                    field.onChange(val);
                                  }}
                                  onBlur={(e) =>
                                    handleTimeBlur(
                                      e.target.value,
                                      field.onChange
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase ">
                              Shift Color
                            </FormLabel>
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
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 sm:p-8 flex items-center justify-center text-center text-sm  animate-in fade-in duration-300">
                      A leave type is currently selected.
                      <br />
                      Standard shift fields are disabled.
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className={!isStandardShift ? "mt-auto" : ""}>
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
            <div className="flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-3 p-4 ">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="px-8 w-full sm:w-auto"
              >
                Create Shift
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  </div>
);

}
