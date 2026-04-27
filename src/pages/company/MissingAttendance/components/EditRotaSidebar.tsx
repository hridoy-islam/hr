import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import moment from '@/lib/moment-setup';
import { CalendarIcon } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CirclePicker } from 'react-color';

// Relaxed schema just for viewing
type FormValues = {
  leaveType?: string;
  shiftName?: string;
  color?: string;
  note?: string;
  slots: {
    _id?: string;
    startDate: Date;
    startTime?: string;
    endTime?: string;
  }[];
  byNotice: boolean;
  byEmail: boolean;
};

export default function ViewRotaSidebar({
  isOpen,
  onClose,
  rota,
  employee,
}: {
  isOpen: boolean;
  onClose: () => void;
  rota: any;
  employee: any;
}) {
  const form = useForm<FormValues>({
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

  const { fields } = useFieldArray({
    control: form.control,
    name: 'slots'
  });

  const watchLeaveType = form.watch('leaveType');
  const isStandard = !watchLeaveType;

  // Collect all history entries across all rota slots, sorted latest first
  const allHistory = (() => {
    const rotaArray = Array.isArray(rota) ? rota : rota ? [rota] : [];
    const entries: any[] = [];
    const seen = new Set<string>();

    rotaArray.forEach((r: any) => {
      if (r.history && r.history.length > 0) {
        r.history.forEach((h: any) => {
          const uniqueKey = `${h.message}`;
          
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            entries.push({
              ...h,
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

  if (!isOpen || !employee) return null;

  const leaveOptions = [
    { id: 'DO', label: 'Day Off (DO)' },
    { id: 'AL', label: 'Annual Leave (AL)' },
    { id: 'S', label: 'Sick (S)' },
    { id: 'ML', label: 'Maternity (ML)' },
    { id: 'NT', label: 'No Task (NT)' }
  ];

  const themeColors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[550px] flex-col border-l border-gray-200 bg-white shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-lg font-bold text-black">View Shifts</h2>
        </div>

        <Form {...form}>
          <div className="flex flex-1 flex-col overflow-hidden">
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
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Shift Details</h3>
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
                                    <div className="relative pointer-events-none opacity-70">
                                      <DatePicker
                                        selected={field.value}
                                        disabled
                                        dateFormat="dd-MM-yyyy"
                                        className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 pl-10 text-sm focus-visible:outline-none"
                                        wrapperClassName="w-full"
                                      />
                                      <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                  </FormControl>
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
                                    disabled
                                    value={
                                      displayEndDate
                                        ? moment(displayEndDate).format(
                                            'DD-MM-YYYY'
                                          )
                                        : ''
                                    }
                                    className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 pl-10 text-sm text-gray-500"
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
                                        disabled
                                        className="font-mono bg-gray-100"
                                      />
                                    </FormControl>
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
                                        disabled
                                        className="font-mono bg-gray-100"
                                      />
                                    </FormControl>
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

                {isStandard && (
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">
                          Shift Color
                        </FormLabel>
                        <div className="pt-2 pointer-events-none opacity-80">
                          <CirclePicker
                            color={field.value || '#2196f3'}
                            width="100%"
                            colors={themeColors}
                            circleSize={26}
                            circleSpacing={12}
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

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
                                disabled
                                checked={field.value === option.id}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-medium leading-none text-gray-500">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold uppercase text-gray-900">
                     Send Notification
                  </label>
                  <div className="flex gap-6 rounded-md border border-gray-100 bg-gray-50/50 p-4">
                    <FormField
                      control={form.control}
                      name="byEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              disabled
                              checked={field.value}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium leading-none text-gray-500">
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
                              disabled
                              checked={field.value}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium leading-none text-gray-500">
                            By Notice
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ---- History Tab ---- */}
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
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled
                          className="min-h-[150px] resize-none bg-gray-100"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </>
  );
}