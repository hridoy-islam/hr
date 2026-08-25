import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  ListTodo,
  NotebookText,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import Select from 'react-select';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { useNavigate, useParams } from 'react-router-dom';
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Duration suggestions (stored/passed in total minutes)
const DURATION_PRESETS = [
  { label: '15m', minutes: '15' },
  { label: '30m', minutes: '30' },
  { label: '45m', minutes: '45' },
  { label: '60m', minutes: '60' }
];

// Helper to compute minutes between HH:MM time strings
const calculateDurationInMinutes = (start: string, end: string): string => {
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
    .string({ required_error: 'Start time is required' })
    .regex(timeRegex, { message: 'Enter a valid start time (HH:MM)' }),
  endTime: z
    .string({ required_error: 'End time is required' })
    .regex(timeRegex, { message: 'Enter a valid end time (HH:MM)' }),
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

const isPresetMatch = (taskName: string, presets: any[]) => {
  if (!taskName) return false;
  return presets.some(
    (p) => p.title?.trim().toLowerCase() === taskName.trim().toLowerCase()
  );
};

const DailyWorkFlowDetailsPage: React.FC = () => {
  const { toast } = useToast();
  const { id: companyId, wid } = useParams();
  const navigate = useNavigate();

  // ── State ──
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [tasks, setTasks] = useState<WorkFlowTask[]>([]);

  const [presetTasks, setPresetTasks] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<DailyWorkFlowFormErrors>({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note Dialog State
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Delete Confirmation Dialog State
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // ── Fetch Presets ──
  const fetchPresetTasks = async (companyIdParam: string) => {
    try {
      const response = await axiosInstance.get(`/preset-task`, {
        params: { page: 1, limit: 500, companyId: companyIdParam }
      });
      setPresetTasks(response.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching preset tasks:', error);
    }
  };

  // ── Fetch Workflow Record ──
  useEffect(() => {
    const loadRecord = async () => {
      if (!wid) return;
      try {
        const response = await axiosInstance.get(`/daily-work-flow/${wid}`);
        const record = response.data?.data;

        if (record) {
          const emp = record.employeeId;
          if (emp && typeof emp === 'object' && emp.firstName) {
            setEmployeeName(
              `${emp.firstName} ${emp.lastName ?? ''}`.trim()
            );
          }
          if (record.date) setRecordDate(new Date(record.date));

          // Fetch preset tasks for the record's company
          const recordCompanyId =
            typeof record.companyId === 'object'
              ? record.companyId?._id
              : record.companyId;
          if (recordCompanyId || companyId) {
            await fetchPresetTasks(recordCompanyId || companyId || '');
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
        }
      } catch (error) {
        console.error('Error fetching daily work flow:', error);
        toast({
          title: 'Failed to load daily work flow.',
          className: 'bg-red-500 border-none text-white'
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadRecord();
  }, [wid]);

  // ── Fetch Presets when presetTasks changes ──
  useEffect(() => {
    // Re-evaluate isOther status when presetTasks loads
    if (presetTasks.length > 0 && tasks.length > 0) {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          const matched = isPresetMatch(t.taskName, presetTasks);
          return {
            ...t,
            isOther: !matched,
            isSelecting: t.isSelecting || false
          };
        })
      );
    }
  }, [presetTasks]);

  // Options for React Select (exclude presets already picked by other rows)
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

  // ── Task Handlers ──
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
      setTasks((prev) =>
        prev.map((task, i) => {
          if (i !== index) return task;

          const start = preset.startTime || task.startTime || '';
          const end = preset.endTime || task.endTime || '';
          const duration =
            start && end
              ? calculateDurationInMinutes(start, end)
              : preset.duration || task.duration || '';

          return {
            ...task,
            taskName: preset.title || option.label,
            startTime: start,
            endTime: end,
            duration,
            isOther: false,
            isSelecting: false
          };
        })
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

  // ── Note Modal Handlers ──
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

  // ── Submit ──
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
        tasks: validation.data.tasks.map((task) => ({
          taskName: task.taskName,
          startTime: task.startTime,
          endTime: task.endTime,
          ...(task.duration ? { duration: task.duration } : {}),
          ...(task.note ? { note: task.note } : {})
        }))
      };

      const response = await axiosInstance.patch(
        `/daily-work-flow/${wid}`,
        payload
      );

      if (response.data?.success) {
        toast({
          title: response.data.message || 'Daily work flow updated!',
          className: 'bg-theme border-none text-white'
        });

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
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.message || 'Failed to update daily work flow.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──
  if (initialLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-md bg-white">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  // Helper component to render Task Name Selection/Input
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
                {recordDate
                  ? moment(recordDate).format('DD MMMM YYYY')
                  : '-'}
              </p>
            </div>
          </div>

          <Button size="sm" onClick={() => navigate(-1)} title="Back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {tasks.length === 0 ? (
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
                {/* Mobile View: Cards */}
                <div className="space-y-4 md:hidden">
                  {tasks.map((task, index) => {
                    const hasTimes = Boolean(task.startTime && task.endTime);
                    return (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                    >
                      {/* Task Name Field */}
                      <div>
                        <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                          Task Name
                        </label>
                        {renderTaskNameField(task, index)}
                      </div>

                      {/* Start and End Times */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                            Start Time
                          </label>
                          <Input
                            value={task.startTime}
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
                              const current = task.startTime;
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
                          {formErrors[`tasks.${index}.startTime`] && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              {formErrors[`tasks.${index}.startTime`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-black uppercase tracking-wider block mb-1">
                            End Time
                          </label>
                          <Input
                            value={task.endTime}
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
                              const current = task.endTime;
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
                          {formErrors[`tasks.${index}.endTime`] && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              {formErrors[`tasks.${index}.endTime`]}
                            </p>
                          )}
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

                      {/* Bottom Actions Row: Note, Edit Selection, and Remove */}
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
                            title="Change Task Selection"
                            className="h-9 w-9"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteIndex(index)}
                            title="Remove Task"
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

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="w-[55%] px-4 py-3 min-w-[260px]">Task Name</th>
                        <th className="px-4 py-3 min-w-[140px]">Start Time</th>
                        <th className="px-4 py-3 min-w-[140px]">End Time</th>
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
                          {/* Task Name Column */}
                          <td className="w-[45%] pr-2 py-3 align-top">
                            {renderTaskNameField(task, index)}
                          </td>

                          {/* Start Time Column */}
                          <td className="px-2 py-3 align-top">
                            <Input
                              value={task.startTime}
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
                                const current = task.startTime;
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
                            {formErrors[`tasks.${index}.startTime`] && (
                              <p className="mt-1 text-xs font-medium text-red-500">
                                {formErrors[`tasks.${index}.startTime`]}
                              </p>
                            )}
                          </td>

                          {/* End Time Column */}
                          <td className="px-2 py-3 align-top">
                            <Input
                              value={task.endTime}
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
                                const current = task.endTime;
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
                            {formErrors[`tasks.${index}.endTime`] && (
                              <p className="mt-1 text-xs font-medium text-red-500">
                                {formErrors[`tasks.${index}.endTime`]}
                              </p>
                            )}
                          </td>

                          {/* Duration Column */}
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

                          {/* Note Icon Button Column */}
                          <td className="px-4 py-3 text-center align-top">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleOpenNoteModal(index)}
                              title={task.note ? 'Edit Note' : 'Add Note'}
                            >
                              <NotebookText className="h-5 w-5 mr-2" />Note
                            </Button>
                          </td>

                          {/* Action Column */}
                          <td className="px-4 py-3 text-right align-top">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleToggleEditTaskSelection(index)}
                                title="Change Task Selection"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeleteIndex(index)}
                                title="Remove Task"
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

            {/* Bottom Actions */}
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
                {isSubmitting ? 'Saving...' : 'Update'}
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

export default DailyWorkFlowDetailsPage;