
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import moment from 'moment';
import { Trash2, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  startDate: z.date({
    required_error: 'Start Date is required',
    invalid_type_error: 'Start Date is required'
  }),
  shiftName: z.string().max(10, 'Max 10 characters').optional(),
  leaveType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  note: z.string().optional(),
  color: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.leaveType) {
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!data.startTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start time is required", path: ["startTime"] });
    } else if (!timeRegex.test(data.startTime)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time cannot be bigger than 23:59", path: ["startTime"] });
    }

    if (!data.endTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time is required", path: ["endTime"] });
    } else if (!timeRegex.test(data.endTime)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time cannot be bigger than 23:59", path: ["endTime"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function EditRotaSidebar({ isOpen, onClose, rota, employee, onSuccess,onDeleteSuccess,companyColor }: any) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { startDate: undefined, shiftName: '', leaveType: '', startTime: '', endTime: '', note: '',color:companyColor }
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandardShift = !watchLeaveType;

  const watchStartDate = form.watch('startDate');
  const watchStartTime = form.watch('startTime');
  const watchEndTime = form.watch('endTime');

  let displayEndDate = watchStartDate;
  if (isStandardShift && watchStartDate && watchStartTime && watchEndTime) {
    if (watchEndTime < watchStartTime) {
      displayEndDate = moment(watchStartDate).add(1, 'days').toDate();
    }
  }

  useEffect(() => {
    if (isOpen && rota) {
      const existingDate = rota.startDate || rota.scheduleDate;
      const parsedLeaveType = rota.leaveType || '';
      const defaultShiftName = parsedLeaveType ? '' : (rota.shiftName|| '');

      form.reset({
        startDate: existingDate ? new Date(existingDate) : new Date(),
        leaveType: parsedLeaveType,
        shiftName: defaultShiftName,
        startTime: rota.startTime || '',
        endTime: rota.endTime || '',
        note: rota.note || '',
        color: rota.color || companyColor
      });
    }
  }, [isOpen, rota, form]);

  const handleTimeBlur = (value: string, onChange: (val: string) => void) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    onChange(cleanValue);
  };

  const onSubmit = async (values: FormValues) => {
    const startDateStr = moment(values.startDate).format('YYYY-MM-DD');
    let endDateStr = startDateStr;

    if (isStandardShift && values.endTime && values.startTime && values.endTime < values.startTime) {
      endDateStr = moment(values.startDate).add(1, 'days').format('YYYY-MM-DD');
    }

    const payload: any = {
      startDate: startDateStr,
      endDate: endDateStr,
      note: values.note
    };

    if (!isStandardShift) {
      payload.leaveType = values.leaveType;
      payload.shiftName = values.leaveType;
      payload.startTime = ""; 
      payload.endTime = "";
      payload.color = "";
    } else {
      payload.leaveType = ""; 
      payload.shiftName = values.shiftName;
      payload.startTime = values.startTime;
      payload.endTime = values.endTime;
      payload.color = values.color;
    }

    try {
      const response = await axiosInstance.patch(`/rota/${rota._id}`, payload);
      toast({ title: 'Shift updated successfully' });
      if (onSuccess) onSuccess(response.data.data);
      onClose();
    } catch (error) {
      toast({ title: 'Failed to update shift', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/rota/${rota._id}`);
      toast({ title: 'Shift deleted successfully' });
      if (onDeleteSuccess) onDeleteSuccess(rota._id);
      onClose();
    } catch (error) {
      toast({ title: 'Failed to delete shift', variant: 'destructive' });
    }
  };

  if (!isOpen || !rota) return null;

  const leaveOptions = [
    { id: 'DO', label: 'Day Off (DO)' },
    { id: 'AL', label: 'Annual Leave (AL)' },
    { id: 'S', label: 'Sick (S)' },
    { id: 'ML', label: 'Maternity (ML)' },
    { id: 'NT', label: 'No Task (NT)' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col border-l border-gray-200 bg-white shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-black">Edit Shift</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <Avatar className="h-12 w-12 border border-gray-200">
                  <AvatarImage src={employee?.image || '/placeholder.png'} alt={`${employee?.firstName || ''} ${employee?.lastName || ''}`} />
                  <AvatarFallback className="bg-blue-100 font-black text-blue-600">
                    {employee?.firstName?.[0] || ''}{employee?.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-black">{employee?.firstName} {employee?.lastName}</p>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {watchStartDate ? moment(watchStartDate).format('ddd, MMMM DD, YYYY') : ''}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="shift" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="shift">Shift Details</TabsTrigger>
                  <TabsTrigger value="note">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="shift" className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs font-bold uppercase">Start Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DatePicker
                                  selected={field.value}
                                  onChange={(date: Date) => field.onChange(date)}
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
                        <FormLabel className="text-xs font-bold uppercase text-gray-500">End Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              readOnly
                              value={displayEndDate ? moment(displayEndDate).format('DD-MM-YYYY') : ''}
                              className="flex h-10 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm text-gray-500"
                            />
                            <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                      </FormItem>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase">Leave Type</FormLabel>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 p-3 border border-gray-100 bg-gray-50/50 rounded-md">
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
                                  onCheckedChange={(checked) => checked ? field.onChange(option.id) : field.onChange("")}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-medium cursor-pointer">{option.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {isStandardShift ? (
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      <FormField
                        control={form.control}
                        name="shiftName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">Shift Name</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={10} placeholder="e.g. Morning" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-4">
                        <div className="flex-1">
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
                                    className="h-10 font-mono"
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
                        <div className="flex-1">
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
                                    className="h-10 font-mono"
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
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 mt-4 text-center text-xs text-slate-500">
                      A leave type is currently selected.<br />Standard shift fields are disabled.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="note">
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Add optional notes..." className="min-h-[140px] resize-none p-3 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the shift for {employee?.firstName}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Delete Shift</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}