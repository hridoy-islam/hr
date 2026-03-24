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
import { Trash2, CalendarIcon, Plus } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CirclePicker } from 'react-color';

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
    slots: z.array(slotSchema)
  })
  .superRefine((data, ctx) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!data.leaveType) {
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: '',
      shiftName: '',
      color: '#2196f3',
      note: '',
      slots: []
    }
  });

  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: 'slots'
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandard = !watchLeaveType;

  useEffect(() => {
    if (isOpen && rota) {
      const rotaArray = Array.isArray(rota) ? rota : [rota];
      const first = rotaArray[0] || {};
      form.reset({
        leaveType: first.leaveType || '',
        shiftName: first.shiftName || '',
        color: first.color || '#2196f3',
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

  // useEffect(() => {
  //   if (watchLeaveType) {
  //     const currentSlots = form.getValues('slots') || [];
  //     currentSlots.forEach((_, idx) => {
  //       form.setValue(`slots.${idx}.startTime`, '');
  //       form.setValue(`slots.${idx}.endTime`, '');
  //     });
  //     form.setValue('shiftName', watchLeaveType);
  //     form.setValue('color', '');
  //   }
  // }, [watchLeaveType, form]);

  useEffect(() => {
    if (watchLeaveType) {
      form.setValue('shiftName', watchLeaveType);
      form.setValue('color', '');
      // Do NOT clear startTime/endTime here — clearing happens only on submit
    }
  }, [watchLeaveType, form]);

 const onSubmit = async (values: FormValues) => {
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

        // --- NEW: Check if the date is already published ---
        const isPublished = publishedDates?.has(startDateStr);

        const payload: any = {
          startDate: startDateStr,
          endDate: endDateStr,
          note: values.note || '',
          ...(isPublished ? { status: 'publish' } : {}) // <--- ADDED
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
          return axiosInstance.patch(`/rota/${slot._id}`, payload);
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

            <Tabs
              defaultValue="details"
              className="flex flex-1 flex-col overflow-hidden"
            >
              <TabsList className="mx-5 grid w-[calc(100%-40px)] grid-cols-2 bg-gray-100">
                <TabsTrigger value="details">Shift Details</TabsTrigger>
                <TabsTrigger value="note">Notes</TabsTrigger>
              </TabsList>

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
                            disabled={!isStandard}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Shift Details</h3>
                    {isStandard && (
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
                        className="relative space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                      >
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
                                        dateFormat="dd-MM-yyyy"
                                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
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
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Color picker: only show when no leave type selected */}
                {isStandard && (
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

                {/* ✅ Leave Type section — always visible */}
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
              </TabsContent>

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
                          placeholder="Specific instructions..."
                          className="min-h-[150px] resize-none bg-gray-50"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-5">
              {fields.some((f) => !f._id) ? (
                <div />
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
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
