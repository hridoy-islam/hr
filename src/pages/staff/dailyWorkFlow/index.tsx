import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  ListTodo,
  Loader2,
  NotebookText,
  Pencil,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

interface WorkFlowTask {
  taskName: string;
  startTime: string;
  endTime: string;
  duration?: string;
  note?: string;
  isOther?: boolean;
  isSelecting?: boolean;
}

interface SelectOption {
  label: string;
  value: string;
  presetData?: any;
}

// Duration suggestions (stored/passed in total minutes)
const DURATION_PRESETS = [
  { label: '15m', minutes: '15' },
  { label: '30m', minutes: '30' },
  { label: '45m', minutes: '45' },
  { label: '1h', minutes: '60' },
  // { label: '2h', minutes: '120' },
];

// Helper to compute minutes between HH:MM time strings
const calculateDurationInMinutes = (start: string, end: string): string => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) return '';

  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);

  let startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;

  if (endTotal < startTotal) {
    endTotal += 24 * 60; // Overnight handling
  }

  return `${endTotal - startTotal}`;
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Allow only numbers with a single decimal point (max 2 decimal places)
const sanitizeDurationInput = (value: string): string => {
  let val = value.replace(/[^0-9.]/g, '');
  const dotIndex = val.indexOf('.');
  if (dotIndex !== -1) {
    val =
      val.slice(0, dotIndex + 1) +
      val
        .slice(dotIndex + 1)
        .replace(/\./g, '')
        .slice(0, 2);
  }
  return val;
};

const workFlowTaskSchema = z.object({
  taskName: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, { message: 'Task name is required' })
    .max(200, { message: 'Task name cannot exceed 200 characters' }),
  startTime: z
    .string()
    .optional()
    .refine((val) => !val || timeRegex.test(val), {
      message: 'Enter a valid start time (HH:MM)'
    }),
  endTime: z
    .string()
    .optional()
    .refine((val) => !val || timeRegex.test(val), {
      message: 'Enter a valid end time (HH:MM)'
    }),
  duration: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Duration must be a number with up to 2 decimal places'
    }),
  note: z.string().optional()
});

const dailyWorkFlowSchema = z.object({
  tasks: z
    .array(workFlowTaskSchema)
    .min(1, { message: 'Please add at least one task.' })
});

type DailyWorkFlowFormErrors = Partial<Record<string, string>>;

const normalizeToUTCDate = (date: Date) =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();

const isPresetMatch = (taskName: string, presets: any[]) => {
  if (!taskName) return false;
  return presets.some(
    (p) => p.title?.trim().toLowerCase() === taskName.trim().toLowerCase()
  );
};

const DailyWorkFlowPage: React.FC = () => {
  const { toast } = useToast();
  const { id: companyId, eid } = useParams();
  const [searchParams] = useSearchParams();

  const getInitialDate = (): Date => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = new Date(`${dateParam}T00:00:00`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const [appliedDate, setAppliedDate] = useState<Date>(getInitialDate);
  const [tasks, setTasks] = useState<WorkFlowTask[]>([]);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');

  const [presetTasks, setPresetTasks] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<DailyWorkFlowFormErrors>({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // ── Fetch Presets ──
  useEffect(() => {
    const fetchPresetTasks = async () => {
      if (!companyId) return;
      try {
        const response = await axiosInstance.get(`/preset-task`, {
          params: { page: 1, limit: 500, companyId }
        });
        setPresetTasks(response.data?.data?.result || []);
      } catch (error) {
        console.error('Error fetching preset tasks:', error);
      }
    };

    fetchPresetTasks();
  }, [companyId]);

  // ── Fetch Employee Name ──
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (!eid || employeeName) return;
      try {
        const res = await axiosInstance.get(`/users/${eid}`);
        const user = res.data?.data;
        if (user) {
          setEmployeeName(
            `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
          );
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployeeName();
  }, [eid]);

  // ── Fetch Daily Workflow ──
  useEffect(() => {
    const fetchDailyWorkFlow = async () => {
      if (!eid || !companyId || !appliedDate) return;

      const year = appliedDate.getFullYear();
      if (year < 1000 || year > 9999) return;

      setFetchingTasks(true);
      try {
        const response = await axiosInstance.get(`/daily-work-flow`, {
          params: {
            employeeId: eid,
            companyId,
            date: normalizeToUTCDate(appliedDate),
            limit: 1
          }
        });
        const record = response.data?.data?.result?.[0];
        if (record) {
          setExistingId(record._id);
          const emp = record.employeeId;
          if (emp && typeof emp === 'object' && emp.firstName) {
            setEmployeeName(
              `${emp.firstName} ${emp.lastName ?? ''}`.trim()
            );
          }

          setTasks(
            (record.tasks || []).map((t: any) => {
              const matched = isPresetMatch(t.taskName, presetTasks);
              return {
                taskName: t.taskName || '',
                startTime: t.startTime || '',
                endTime: t.endTime || '',
                // If duration is missing in the response, auto-calculate
                // it from the start/end times
                duration:
                  t.duration ||
                  calculateDurationInMinutes(
                    t.startTime || '',
                    t.endTime || ''
                  ),
                note: t.note || '',
                isOther: !matched,
                isSelecting: false
              };
            })
          );
        } else {
          setExistingId(null);
          setTasks([]);
        }
      } catch (error) {
        console.error('Error fetching daily work flow:', error);
        setTasks([]);
      } finally {
        setFetchingTasks(false);
        setInitialLoading(false);
      }
    };

    fetchDailyWorkFlow();
  }, [eid, companyId, appliedDate, presetTasks]);

  const getAvailablePresetOptions = (currentIndex: number): SelectOption[] => {
    const takenTitles = new Set(
      tasks
        .filter((_, i) => i !== currentIndex)
        .map((task) => task.taskName?.trim().toLowerCase())
        .filter(Boolean)
    );

    return [
      ...presetTasks
        .filter(
          (preset) => !takenTitles.has(preset.title?.trim().toLowerCase())
        )
        .map((preset) => ({
          label: preset.title,
          value: preset._id || preset.title,
          presetData: preset
        })),
      { label: 'Other', value: 'OTHER' }
    ];
  };

  const handlePrevDay = () => {
    const prev = new Date(appliedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    setAppliedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(appliedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    setAppliedDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setAppliedDate(today);
  };

  const isDateDirty =
    normalizeToUTCDate(selectedDate) !== normalizeToUTCDate(appliedDate);

  const handleSearchDate = () => {
    if (isDateDirty) {
      setAppliedDate(selectedDate);
    }
  };

  const handleAddTask = () => {
    setFormErrors((prev) => ({ ...prev, tasks: '' }));
    setTasks((prev) => [
      ...prev,
      {
        taskName: '',
        startTime: '',
        endTime: '',
        duration: '',
        note: '',
        isOther: false,
        isSelecting: true
      }
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setFormErrors({});
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmRemoveTask = () => {
    if (deleteIndex !== null) {
      handleRemoveTask(deleteIndex);
    }
    setDeleteIndex(null);
  };

  const handleToggleEditTaskSelection = (index: number) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, isSelecting: !task.isSelecting } : task
      )
    );
  };

  const handleTaskChange = (
    index: number,
    field: keyof WorkFlowTask,
    value: any
  ) => {
    const errorKey = `tasks.${index}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }

    setTasks((prev) =>
      prev.map((task, i) => {
        if (i !== index) return task;

        const updatedTask = { ...task, [field]: value };

        // Auto-calculate duration (in mins) from startTime & endTime.
        // If either time is missing/invalid, reset it so the
        // duration quick-add badges show up again.
        if (field === 'startTime' || field === 'endTime') {
          const start = field === 'startTime' ? value : task.startTime;
          const end = field === 'endTime' ? value : task.endTime;

          updatedTask.duration =
            start && end ? calculateDurationInMinutes(start, end) : '';
        }

        return updatedTask;
      })
    );
  };

  const handleSelectPreset = (index: number, option: SelectOption | null) => {
    if (!option) return;

    if (option.value === 'OTHER') {
      setTasks((prev) =>
        prev.map((task, i) =>
          i === index
            ? {
                ...task,
                taskName: task.taskName || '',
                isOther: true,
                isSelecting: task.isSelecting,
                startTime: task.startTime || '',
                endTime: task.endTime || '',
                duration: task.duration || ''
              }
            : task
        )
      );
    } else {
      const preset = option.presetData;
      const start = preset.startTime || tasks[index].startTime || '';
      const end = preset.endTime || tasks[index].endTime || '';
      const computedDuration =
        start && end ? calculateDurationInMinutes(start, end) : preset.duration || '';

      setTasks((prev) =>
        prev.map((task, i) =>
          i === index
            ? {
                ...task,
                taskName: preset.title || option.label,
                startTime: start,
                endTime: end,
                duration: computedDuration,
                isOther: false,
                isSelecting: false
              }
            : task
        )
      );
    }
  };

  const handleTimeBlur = (value: string, updater: (val: string) => void) => {
    let val = value.replace(/[^0-9:]/g, '').slice(0, 5);
    if (!val) {
      updater('');
      return;
    }
    const [rawHour, rawMinute] = val.split(':');
    let hour = rawHour || '';
    let minute = rawMinute || '';

    if (hour.length === 1) hour = `0${hour}`;
    if (minute.length === 1) minute = `${minute}0`;
    if (!minute) minute = '00';

    updater(`${hour}:${minute}`);
  };

  const handleOpenNoteModal = (index: number) => {
    setActiveNoteIndex(index);
    setTempNoteText(tasks[index].note || '');
  };

  const handleSaveNote = () => {
    if (activeNoteIndex !== null) {
      handleTaskChange(activeNoteIndex, 'note', tempNoteText);
    }
    setActiveNoteIndex(null);
  };

  const handleSave = async () => {
    setFormErrors({});

    const validation = dailyWorkFlowSchema.safeParse({ tasks });

    if (!validation.success) {
      const errors: DailyWorkFlowFormErrors = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path.join('.');
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: eid,
        companyId,
        date: normalizeToUTCDate(appliedDate),
        tasks: validation.data.tasks.map((task) => ({
          taskName: task.taskName,
          ...(task.startTime ? { startTime: task.startTime } : {}),
          ...(task.endTime ? { endTime: task.endTime } : {}),
          ...(task.duration ? { duration: task.duration } : {}),
          ...(task.note ? { note: task.note } : {})
        }))
      };

      let response;
      if (existingId) {
        response = await axiosInstance.patch(
          `/daily-work-flow/${existingId}`,
          payload
        );
      } else {
        response = await axiosInstance.post(`/daily-work-flow`, payload);
      }

      if (response.data?.success) {
        if (!existingId && response.data.data?._id) {
          setExistingId(response.data.data._id);
        }

        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            const matched = isPresetMatch(t.taskName, presetTasks);
            return {
              ...t,
              isOther: !matched,
              isSelecting: false
            };
          })
        );

        toast({
          title:
            response.data.message ||
            (existingId
              ? 'Daily work flow updated successfully!'
              : 'Daily work flow saved successfully!'),
          className: 'bg-theme border-none text-white'
        });
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.message || 'Failed to save daily work flow.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-md bg-white">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const renderTaskNameField = (task: WorkFlowTask, index: number) => {
    const selectedOption = task.isOther
      ? { label: 'Other', value: 'OTHER' }
      : presetTasks
          .map((preset) => ({
            label: preset.title,
            value: preset._id || preset.title,
            presetData: preset
          }))
          .find(
            (opt) =>
              opt.label.trim().toLowerCase() ===
              task.taskName.trim().toLowerCase()
          ) || (task.taskName ? { label: task.taskName, value: task.taskName } : null);

    return (
      <div className="space-y-2">
        {task.isSelecting && (
          <Select
            options={getAvailablePresetOptions(index)}
            value={selectedOption}
            onChange={(option) =>
              handleSelectPreset(index, option as SelectOption)
            }
            placeholder="Select task..."
            className="text-sm"
            isSearchable
            menuPortalTarget={
              typeof window !== 'undefined' ? document.body : null
            }
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 })
            }}
          />
        )}

        {(!task.isSelecting || task.isOther) && (
          <div>
            <Input
              value={task.taskName}
              disabled={!task.isOther}
              placeholder={
                task.isOther
                  ? 'Enter custom task name...'
                  : 'Selected task name'
              }
              className={`text-sm ${
                formErrors[`tasks.${index}.taskName`]
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              } ${
                !task.isOther
                  ? 'bg-gray-100 text-gray-700 font-medium cursor-not-allowed'
                  : ''
              }`}
              onChange={(e) =>
                handleTaskChange(index, 'taskName', e.target.value)
              }
            />
            {formErrors[`tasks.${index}.taskName`] && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {formErrors[`tasks.${index}.taskName`]}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render suggested badges when start/end time are omitted
  const renderDurationBadges = (index: number, currentDuration?: string) => {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Quick Add:
        </span>
        {DURATION_PRESETS.map((preset) => {
          const isSelected = currentDuration === preset.minutes;
          return (
            <Badge
              key={preset.minutes}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer text-xs px-2 py-0.5 transition-all select-none ${
                isSelected
                  ? 'bg-theme text-white hover:bg-theme/90'
                  : 'hover:bg-theme/10 hover:border-theme text-gray-700 border-gray-300'
              }`}
              onClick={() =>
                handleTaskChange(
                  index,
                  'duration',
                  isSelected ? '' : preset.minutes
                )
              }
            >
              {preset.label}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4 rounded-md bg-white">
      {/* Header Banner */}
      <div className="rounded-t-md border-b border-slate-100 bg-gradient-to-r from-theme/5 to-transparent p-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme">
              <ListTodo className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="break-words text-lg font-semibold text-black">
                {employeeName
                  ? `${employeeName}'s Daily Work Flow`
                  : 'Daily Work Flow'}
              </h1>
              <p className="text-xl font-bold">
                {moment(appliedDate).format('DD MMMM YYYY')}
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">
              Select Date (DD-MM-YYYY)
            </label>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="h-10 w-10 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="relative w-full sm:w-48">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                      if (date) setSelectedDate(date);
                    }}
                    dateFormat="dd-MM-yyyy"
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    popperProps={{ strategy: 'fixed' }}
                    popperClassName="z-[9999]"
                    portalId="root"
                    wrapperClassName="w-full"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                  title="Next Day"
                  className="h-10 w-10 shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isDateDirty && (
                  <Button
                    size="sm"
                    onClick={handleSearchDate}
                    disabled={fetchingTasks}
                    className="h-10 flex-1 sm:flex-none px-4 text-white"
                  >
                    {fetchingTasks ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Search
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleToday}
                  className="h-10 flex-1 sm:flex-none px-3 text-xs font-semibold"
                >
                  Today
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {fetchingTasks ? (
              <div className="flex h-48 w-full items-center justify-center">
                <BlinkingDots size="medium" color="bg-theme" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 rounded-full bg-gray-50 p-4">
                  <ListTodo className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-black">
                  No tasks added yet
                </h3>
                <p className="mt-1 max-w-[280px] text-sm text-black">
                  Click "Add Task" below to start adding tasks to your daily workflow.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                  {tasks.map((task, index) => {
                    const hasTimes = Boolean(task.startTime && task.endTime);
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                      >
                        <div>
                          <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                            Task Name
                          </label>
                          {renderTaskNameField(task, index)}
                        </div>

                        {/* Optional Times */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                              Start Time <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <Input
                              value={task.startTime || ''}
                              placeholder="09:00"
                              maxLength={5}
                              className={`font-mono text-sm bg-white ${
                                formErrors[`tasks.${index}.startTime`]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                              onChange={(e) => {
                                let val = e.target.value
                                  .replace(/[^0-9:]/g, '')
                                  .slice(0, 5);
                                const current = task.startTime || '';
                                if (
                                  val.length === 2 &&
                                  current.length === 1 &&
                                  !val.includes(':')
                                )
                                  val += ':';
                                handleTaskChange(index, 'startTime', val);
                              }}
                              onBlur={(e) =>
                                handleTimeBlur(e.target.value, (val) =>
                                  handleTaskChange(index, 'startTime', val)
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                              End Time <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <Input
                              value={task.endTime || ''}
                              placeholder="17:00"
                              maxLength={5}
                              className={`font-mono text-sm bg-white ${
                                formErrors[`tasks.${index}.endTime`]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                              onChange={(e) => {
                                let val = e.target.value
                                  .replace(/[^0-9:]/g, '')
                                  .slice(0, 5);
                                const current = task.endTime || '';
                                if (
                                  val.length === 2 &&
                                  current.length === 1 &&
                                  !val.includes(':')
                                )
                                  val += ':';
                                handleTaskChange(index, 'endTime', val);
                              }}
                              onBlur={(e) =>
                                handleTimeBlur(e.target.value, (val) =>
                                  handleTaskChange(index, 'endTime', val)
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Duration Field and Badges */}
                        <div>
                          <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                            Duration (Minutes)
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={task.duration || ''}
                            placeholder="e.g. 30"
                            readOnly={hasTimes}
                            className={`text-sm bg-white ${
                              hasTimes
                                ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                                : ''
                            } ${
                              formErrors[`tasks.${index}.duration`]
                                ? 'border-red-500'
                                : ''
                            }`}
                            onChange={(e) =>
                              handleTaskChange(
                                index,
                                'duration',
                                sanitizeDurationInput(e.target.value)
                              )
                            }
                          />
                          {formErrors[`tasks.${index}.duration`] && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              {formErrors[`tasks.${index}.duration`]}
                            </p>
                          )}
                          {!hasTimes && !task.duration &&
                            renderDurationBadges(index, task.duration)}
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60">
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleOpenNoteModal(index)}
                              className="flex-1 text-xs h-9"
                            >
                              <NotebookText className="mr-2 h-4 w-4" />
                              {task.note ? 'Edit Note' : 'Add Note'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleToggleEditTaskSelection(index)}
                              className="h-9 w-9"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeleteIndex(index)}
                              className="h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="w-[30%] px-4 py-3 min-w-[200px]">Task Name</th>
                        <th className="px-4 py-3 min-w-[130px]">Start Time</th>
                        <th className="px-4 py-3 min-w-[130px]">End Time</th>
                        <th className="px-4 py-3 min-w-[220px]">Duration (Mins)</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">Note</th>
                        <th className="px-4 py-3 text-right min-w-[110px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, index) => {
                        const hasTimes = Boolean(task.startTime && task.endTime);
                        return (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="w-[30%] pr-2 py-3 align-top">
                              {renderTaskNameField(task, index)}
                            </td>

                            <td className="px-2 py-3 align-top">
                              <Input
                                value={task.startTime || ''}
                                placeholder="09:00"
                                maxLength={5}
                                className={`font-mono text-sm ${
                                  formErrors[`tasks.${index}.startTime`]
                                    ? 'border-red-500'
                                    : ''
                                }`}
                                onChange={(e) => {
                                  let val = e.target.value
                                    .replace(/[^0-9:]/g, '')
                                    .slice(0, 5);
                                  const current = task.startTime || '';
                                  if (
                                    val.length === 2 &&
                                    current.length === 1 &&
                                    !val.includes(':')
                                  )
                                    val += ':';
                                  handleTaskChange(index, 'startTime', val);
                                }}
                                onBlur={(e) =>
                                  handleTimeBlur(e.target.value, (val) =>
                                    handleTaskChange(index, 'startTime', val)
                                  )
                                }
                              />
                            </td>

                            <td className="px-2 py-3 align-top">
                              <Input
                                value={task.endTime || ''}
                                placeholder="17:00"
                                maxLength={5}
                                className={`font-mono text-sm ${
                                  formErrors[`tasks.${index}.endTime`]
                                    ? 'border-red-500'
                                    : ''
                                }`}
                                onChange={(e) => {
                                  let val = e.target.value
                                    .replace(/[^0-9:]/g, '')
                                    .slice(0, 5);
                                  const current = task.endTime || '';
                                  if (
                                    val.length === 2 &&
                                    current.length === 1 &&
                                    !val.includes(':')
                                  )
                                    val += ':';
                                  handleTaskChange(index, 'endTime', val);
                                }}
                                onBlur={(e) =>
                                  handleTimeBlur(e.target.value, (val) =>
                                    handleTaskChange(index, 'endTime', val)
                                  )
                                }
                              />
                            </td>

                            <td className="px-2 py-3 align-top">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={task.duration || ''}
                                placeholder="Minutes (e.g. 45)"
                                readOnly={hasTimes}
                                className={`text-sm ${
                                  hasTimes
                                    ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-mono'
                                    : ''
                                } ${
                                  formErrors[`tasks.${index}.duration`]
                                    ? 'border-red-500'
                                    : ''
                                }`}
                                onChange={(e) =>
                                  handleTaskChange(
                                    index,
                                    'duration',
                                    sanitizeDurationInput(e.target.value)
                                  )
                                }
                              />
                              {formErrors[`tasks.${index}.duration`] && (
                                <p className="mt-1 text-xs font-medium text-red-500">
                                  {formErrors[`tasks.${index}.duration`]}
                                </p>
                              )}
                              {!hasTimes && !task.duration &&
                                renderDurationBadges(index, task.duration)}
                            </td>

                            <td className="px-4 py-3 text-center align-top">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenNoteModal(index)}
                                title={task.note ? 'Edit Note' : 'Add Note'}
                              >
                                <NotebookText className="h-5 w-5 mr-2" />
                                Note
                              </Button>
                            </td>

                            <td className="px-4 py-3 text-right align-top">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleToggleEditTaskSelection(index)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setDeleteIndex(index)}
                                  className="h-9 w-9"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {formErrors['tasks'] && (
              <p className="mt-4 text-xs font-medium text-red-500">
                {formErrors['tasks']}
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2 pt-4">
              <Button
                type="button"
                onClick={handleAddTask}
                className="bg-theme text-white hover:bg-theme/90 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || tasks.length === 0}
                className="bg-theme text-white hover:bg-theme/90 w-full sm:w-auto"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : existingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note Dialog Modal */}
      <Dialog
        open={activeNoteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveNoteIndex(null);
        }}
      >
        <DialogContent className="sm:max-w-md w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {activeNoteIndex !== null && tasks[activeNoteIndex]?.note
                ? 'Update Note'
                : 'Add Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              placeholder="Enter note here..."
              rows={4}
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveNoteIndex(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNote}
              className="bg-theme text-white hover:bg-theme/90"
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
      >
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Remove Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-black">
              {deleteIndex !== null && tasks[deleteIndex]?.taskName
                ? `"${tasks[deleteIndex].taskName}"`
                : 'this task'}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteIndex(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoveTask}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyWorkFlowPage;