import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { Trash2, CalendarIcon, Plus, AlertCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CirclePicker } from 'react-color';
import { useSelector } from 'react-redux';

// --- Zod schema (common + slots) ---
const slotSchema = z.object({
  _id: z.string().optional(),
  startDate: z.date({ required_error: 'Start Date is required' }),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

const formSchema = z
  .object({
    leaveType: z.string().optional(),
    shiftName: z.string().max(20, 'Max 20 characters').optional(),
    color: z.string().optional(),
    note: z.string().optional(),
    slots: z.array(slotSchema),
    byNotice: z.boolean().default(false),
    byEmail: z.boolean().default(false), 
  })
  .superRefine((data, ctx) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    // Only validate time strictly if it's a standard working shift and not an AL/DO 
    if (!data.leaveType && !['AL', 'DO'].includes(data.leaveType || '')) {
      data.slots.forEach((slot, index) => {
        if (!slot.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start time is required',
            path: ['slots', index, 'startTime']
          });
        } else if (!timeRegex.test(slot.startTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Time must be HH:MM (max 23:59)',
            path: ['slots', index, 'startTime']
          });
        }
        if (!slot.endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End time is required',
            path: ['slots', index, 'endTime']
          });
        } else if (!timeRegex.test(slot.endTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Time must be HH:MM (max 23:59)',
            path: ['slots', index, 'endTime']
          });
        }
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const handleTimeBlur = (value: string, onChange: (val: string) => void) => {
  let clean = value.trim();
  if (clean) {
    const m = moment(clean, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
    if (m.isValid()) clean = m.format('HH:mm');
  }
  onChange(clean);
};

export default function EditRotaSidebar({
  isOpen,
  onClose,
  rota,
  employee,
  onSuccess,
  onDeleteSuccess,
  publishedDates
}: any) {
  const { toast } = useToast();
  const user = useSelector((state: any) => state.auth?.user) || null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: '',
      shiftName: '',
      color: '#2196f3',
      note: '',
      slots: [],
      byNotice: false,
      byEmail: false
    }
  });

  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: 'slots'
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandard = !watchLeaveType;
  
  // 🚀 Lock UI if the shift is an auto-generated AL or DO 
  const isLeaveGenerated = watchLeaveType === 'AL' || watchLeaveType === 'DO';

  // Collect all history entries across all rota slots, sorted latest first
  const allHistory = (() => {
    const rotaArray = Array.isArray(rota) ? rota : rota ? [rota] : [];
    const entries: any[] = [];
    const seen = new Set<string>(); // Keep track of unique history items

    rotaArray.forEach((r: any) => {
      if (r.history && r.history.length > 0) {
        r.history.forEach((h: any) => {
          // Create a unique key using the message and timestamp
          const uniqueKey = `${h.message}`;
          
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            entries.push({
              ...h,
              // attach the slot's startDate for context if needed
              slotDate: r.startDate
            });
          }
        });
      }
    });
    
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  })();

  const hasHistory = allHistory.length > 0;

  useEffect(() => {
    if (isOpen && rota) {
      const rotaArray = Array.isArray(rota) ? rota : [rota];
      const first = rotaArray[0] || {};
      form.reset({
        leaveType: first.leaveType || '',
        shiftName: first.shiftName || '',
        color: first.color || '#2196f3',
        byNotice: first.byNotice || false, 
        byEmail: first.byEmail || false,   
        note: first.note || '',
        slots: rotaArray.map((r: any) => ({
          _id: r._id,
          startDate: r.startDate ? new Date(r.startDate) : new Date(),
          startTime: r.startTime || '',
          endTime: r.endTime || ''
        }))
      });
    }
  }, [isOpen, rota, form]);

  useEffect(() => {
    if (watchLeaveType && !isLeaveGenerated) {
      form.setValue('shiftName', watchLeaveType);
      form.setValue('color', '');
    } else if (isLeaveGenerated) {
      form.setValue('shiftName', watchLeaveType); // Map AL/DO to shift name as well for visual consistency
    }
  }, [watchLeaveType, form, isLeaveGenerated]);

  const onSubmit = async (values: FormValues) => {
    if (isLeaveGenerated) return; // Hard block for AL/DO submissions just in case
    
    try {
      const baseRota = Array.isArray(rota) ? rota[0] : rota;

      const promises = values.slots.map(async (slot) => {
        const startDateStr = moment(slot.startDate).format('YYYY-MM-DD');
        let endDateStr = startDateStr;

        if (
          isStandard &&
          slot.endTime &&
          slot.startTime &&
          slot.endTime < slot.startTime
        ) {
          endDateStr = moment(slot.startDate)
            .add(1, 'days')
            .format('YYYY-MM-DD');
        }

        const isPublished = publishedDates?.has(startDateStr);

        const payload: any = {
          startDate: startDateStr,
          endDate: endDateStr,
          note: values.note || '',
          byNotice: values.byNotice, 
          byEmail: values.byEmail,
          ...(isPublished ? { status: 'publish' } : {})
        };

        if (!isStandard) {
          payload.leaveType = values.leaveType;
          payload.shiftName = values.leaveType;
          payload.startTime = '';
          payload.endTime = '';
          payload.color = '';
        } else {
          payload.leaveType = '';
          payload.shiftName = values.shiftName || '';
          payload.startTime = slot.startTime || '';
          payload.endTime = slot.endTime || '';
          payload.color = values.color || '';
        }

        if (slot._id) {
          const patchPayload = {
            ...payload,
            actionUserId: user?._id
          };
          return axiosInstance.patch(`/rota/${slot._id}`, patchPayload);
        } else {
          payload.employeeId = employee?._id;
          payload.companyId = baseRota?.companyId;
          payload.departmentId = baseRota?.departmentId;
          return axiosInstance.post(`/rota`, payload);
        }
      });

      const responses = await Promise.all(promises);
      const updated = responses.map((res) => res.data.data);
      toast({ title: 'Shifts saved successfully' });
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to update shifts', variant: 'destructive' });
    }
  };

  const handleDeleteSlot = async (index: number, rotaId?: string) => {
    if (isLeaveGenerated) return; 

    if (!rotaId) {
      remove(index);
      return;
    }
    try {
      await axiosInstance.delete(`/rota/${rotaId}`);
      toast({ title: 'Shift deleted successfully' });
      remove(index);
      if (onDeleteSuccess) onDeleteSuccess(rotaId);
      if (fields.length === 1) onClose();
    } catch (error) {
      toast({ title: 'Failed to delete shift', variant: 'destructive' });
    }
  };

  const handleDeleteAll = async () => {
    if (isLeaveGenerated) return;

    try {
      const existingRotas = fields.filter((f) => f._id);
      const promises = existingRotas.map((f) =>
        axiosInstance.delete(`/rota/${f._id}`)
      );
      await Promise.all(promises);
      toast({ title: 'All shifts deleted successfully' });
      existingRotas.forEach((f) => onDeleteSuccess?.(f._id));
      onClose();
    } catch (error) {
      toast({ title: 'Failed to delete shifts', variant: 'destructive' });
    }
  };

  const handleAddSlot = () => {
    const baseDate =
      fields.length > 0 ? form.getValues(`slots.0.startDate`) : new Date();
    append({
      _id: undefined,
      startDate: baseDate,
      startTime: '',
      endTime: ''
    });
  };

  if (!isOpen || !employee) return null;

 const leaveOptions = [
    // { id: 'DO', label: 'Day Off (DO)' },
    // { id: 'AL', label: 'Annual Leave (AL)' },
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[550px] flex-col border-l border-gray-200 bg-white shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-lg font-bold text-black">Edit Shifts</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="p-5 pb-2">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <Avatar className="h-12 w-12 border border-gray-200">
                  <AvatarImage src={employee?.image || '/placeholder.png'} />
                  <AvatarFallback className="bg-blue-100 font-black text-theme">
                    {employee?.firstName?.[0] || ''}
                    {employee?.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-black">
                    {employee?.firstName} {employee?.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* 🚀 Restrict Edit Banner for Auto-Generated Leaves */}
            {isLeaveGenerated && (
              <div className="mx-5 mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs font-medium leading-relaxed text-amber-800">
                  This shift was generated from an approved Leave Request (
                  {watchLeaveType === 'AL' ? 'Annual Leave' : 'Day Off'}). It
                  cannot be edited or deleted from the Rota.
                </p>
              </div>
            )}

            {/* --- Tabs: conditionally show History tab --- */}
            <Tabs
              defaultValue="details"
              className="flex flex-1 flex-col overflow-hidden mt-2"
            >
              <TabsList
                className={`mx-5 grid w-[calc(100%-40px)] bg-gray-100 ${
                  hasHistory ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                <TabsTrigger value="details">Shift Details</TabsTrigger>
                {hasHistory && (
                  <TabsTrigger value="history">History</TabsTrigger>
                )}
                <TabsTrigger value="note">Notes</TabsTrigger>
              </TabsList>

              {/* ---- Shift Details Tab ---- */}
              <TabsContent
                value="details"
                className="flex-1 space-y-6 overflow-y-auto p-5"
              >
                <div className="space-y-4">
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
                            placeholder="e.g. Morning"
                            disabled={!isStandard || isLeaveGenerated}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 🚀 AL Display: Show ONLY Duration in Hours */}
                {watchLeaveType === 'AL' ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold">Leave Duration</h3>
                    
                      <Input
                        readOnly
                        value={`${fields.length * 8}`} // Assuming standard 8 hours per day
                        className="mt-2 w-32 h-10 cursor-not-allowed bg-gray-100 text-gray-500 font-medium"
                      />
                  
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">Shift Details</h3>
                      {!isLeaveGenerated && isStandard && (
                        <Button type="button" size="sm" onClick={handleAddSlot}>
                          <Plus className="mr-1 h-3 w-3" />
                          Add Slot
                        </Button>
                      )}
                    </div>
                    {fields.map((slot, index) => {
                      const startDate = form.watch(`slots.${index}.startDate`);
                      const startTime = form.watch(`slots.${index}.startTime`);
                      const endTime = form.watch(`slots.${index}.endTime`);
                      let displayEndDate = startDate;
                      if (
                        isStandard &&
                        startDate &&
                        startTime &&
                        endTime &&
                        endTime < startTime
                      ) {
                        displayEndDate = moment(startDate)
                          .add(1, 'days')
                          .toDate();
                      }

                      return (
                        <div
                          key={slot.id}
                          className={`relative space-y-4 rounded-lg border p-4 ${
                            isLeaveGenerated ? 'bg-gray-100/50 border-gray-200' : 'bg-gray-50/50 border-gray-100'
                          }`}
                        >
                          {!isLeaveGenerated && isStandard && (
                            <div className="absolute right-4 top-4 flex justify-between">
                              {fields.length > 1 &&
                                (slot._id ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="text-gray-400 transition-colors hover:text-red-600"
                                        title="Delete this slot"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete shift slot?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          specific shift slot will be permanently
                                          deleted from the database.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteSlot(index, slot._id)
                                          }
                                          className="bg-red-600 text-white hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSlot(index, slot._id)
                                    }
                                    className="text-gray-400 transition-colors hover:text-red-600"
                                    title="Remove this slot"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ))}
                            </div>
                          )}

                          <div className="flex gap-4 pr-6">
                            <div className="flex-1">
                              <FormField
                                control={form.control}
                                name={`slots.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                    <FormLabel className="text-xs font-bold uppercase">
                                      Start Date
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <DatePicker
                                          selected={field.value}
                                          onChange={(date: Date) =>
                                            field.onChange(date)
                                          }
                                          disabled={isLeaveGenerated}
                                          dateFormat="dd-MM-yyyy"
                                          className={`flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 ${
                                            isLeaveGenerated ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                                          }`}
                                          wrapperClassName="w-full"
                                        />
                                        <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex-1">
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold uppercase text-gray-500">
                                  End Date
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      readOnly
                                      value={
                                        displayEndDate
                                          ? moment(displayEndDate).format(
                                              'DD-MM-YYYY'
                                            )
                                          : ''
                                      }
                                      className="flex h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm text-gray-500"
                                    />
                                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            </div>
                          </div>

                          {/* 🚀 Time fields ONLY render for standard working shifts (!watchLeaveType) */}
                          {isStandard && (
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`slots.${index}.startTime`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-bold uppercase">
                                        Start Time
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder={isLeaveGenerated && !field.value ? '--:--' : '09:00'}
                                          maxLength={5}
                                          disabled={isLeaveGenerated}
                                          className={`font-mono ${isLeaveGenerated ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                              </div>
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`slots.${index}.endTime`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-bold uppercase">
                                        End Time
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder={isLeaveGenerated && !field.value ? '--:--' : '17:00'}
                                          maxLength={5}
                                          disabled={isLeaveGenerated}
                                          className={`font-mono ${isLeaveGenerated ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isLeaveGenerated && isStandard && (
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
                            color={field.value || '#2196f3'}
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
                )}

                {!isLeaveGenerated && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <label className="text-xs font-bold uppercase text-gray-900">
                      Leave Type
                    </label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-gray-100 bg-gray-50/50 p-4">
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
                                  onCheckedChange={(checked) =>
                                    field.onChange(checked ? option.id : '')
                                  }
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer text-xs font-medium leading-none">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold uppercase text-gray-900">
                     Send Notification
                  </label>
                  <div className={`flex gap-6 rounded-md border p-4 ${isLeaveGenerated ? 'bg-gray-100/50 border-gray-200' : 'bg-gray-50/50 border-gray-100'}`}>
                    <FormField
                      control={form.control}
                      name="byEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLeaveGenerated}
                            />
                          </FormControl>
                          <FormLabel className={`text-sm font-medium leading-none ${isLeaveGenerated ? 'text-gray-400' : 'cursor-pointer'}`}>
                            By Email
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="byNotice"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLeaveGenerated}
                            />
                          </FormControl>
                          <FormLabel className={`text-sm font-medium leading-none ${isLeaveGenerated ? 'text-gray-400' : 'cursor-pointer'}`}>
                            By Notice
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ---- History Tab (only rendered when history exists) ---- */}
              {hasHistory && (
                <TabsContent
                  value="history"
                  className="flex-1 overflow-y-auto p-5"
                >
                  <div className="space-y-4">
                    <h4 className="border-b border-gray-200 pb-2 font-semibold text-gray-900">
                      Activity Logs
                    </h4>
                    <div className="space-y-4">
                      {allHistory.map((item: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-theme" />
                          </div>
                          <div className="pb-2">
                            <p className="text-sm font-medium text-gray-800">
                              {item.message}{' '}{moment(item.createdAt).format(
                                'hh:mm A, DD MMM YYYY'
                              )}
                            </p>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* ---- Notes Tab ---- */}
              <TabsContent value="note" className="flex-1 overflow-y-auto p-5">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">
                        Notes (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={isLeaveGenerated}
                          placeholder="Specific instructions..."
                          className={`min-h-[150px] resize-none ${isLeaveGenerated ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

            </Tabs>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-5">
              {fields.some((f) => !f._id) || isLeaveGenerated ? (
                <div /> // Hidden for AL/DO
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all shifts?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All {fields.length}{' '}
                        shift(s) for {employee?.firstName} will be permanently
                        deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAll}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {isLeaveGenerated ? 'Close' : 'Cancel'}
                </Button>
                {!isLeaveGenerated && (
                  <Button type="submit">Save Changes</Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}