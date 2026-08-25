import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  ListTodo,
  NotebookText,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactSelect from 'react-select';
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
  note: z.string().optional()
});

const dailyWorkFlowCreateSchema = z.object({
  employeeId: z
    .string({ required_error: 'Employee is required' })
    .min(1, { message: 'Please select an employee.' }),
  tasks: z
    .array(workFlowTaskSchema)
    .min(1, { message: 'Please add at least one task.' })
});

type DailyWorkFlowFormErrors = Partial<Record<string, string>>;

const normalizeToUTCDate = (date: Date) =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();

// Helper to check if task name matches any preset task title
const isPresetMatch = (taskName: string, presets: any[]) => {
  if (!taskName) return false;
  return presets.some(
    (p) => p.title?.trim().toLowerCase() === taskName.trim().toLowerCase()
  );
};

const DailyWorkFlowCreatePage: React.FC = () => {
  const { toast } = useToast();
  const { id: companyId } = useParams();
  const navigate = useNavigate();

  // ── State ──
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // ── Data Fetching ──
  useEffect(() => {
    const loadAll = async () => {
      if (!companyId) return;
      try {
        const [empRes, presetRes] = await Promise.all([
          axiosInstance.get(
            `/users?company=${companyId}&status=active&role=employee&limit=all`
          ),
          axiosInstance.get(`/preset-task`, {
            params: { page: 1, limit: 500, companyId }
          })
        ]);
        setEmployees(empRes.data?.data?.result || []);
        setPresetTasks(presetRes.data?.data?.result || []);
      } catch (error) {
        console.error('Error loading create form data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadAll();
  }, [companyId]);

  // ── Re-evaluate isOther when presetTasks changes ──
  useEffect(() => {
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
      prev.map((task, i) => (i === index ? { ...task, [field]: value } : task))
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
                isSelecting: false, // Set to false after selection
                startTime: task.startTime || '',
                endTime: task.endTime || ''
              }
            : task
        )
      );
    } else {
      const preset = option.presetData;
      setTasks((prev) =>
        prev.map((task, i) =>
          i === index
            ? {
                ...task,
                taskName: preset.title || option.label,
                startTime: preset.startTime || task.startTime || '',
                endTime: preset.endTime || task.endTime || '',
                isOther: false,
                isSelecting: false // Set to false after selection
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

    const validation = dailyWorkFlowCreateSchema.safeParse({
      employeeId: selectedEmployee?.value || '',
      tasks
    });

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
        employeeId: validation.data.employeeId,
        companyId,
        date: normalizeToUTCDate(selectedDate),
        tasks: validation.data.tasks.map((task) => ({
          taskName: task.taskName,
          startTime: task.startTime,
          endTime: task.endTime,
          ...(task.note ? { note: task.note } : {})
        }))
      };

      const response = await axiosInstance.post(`/daily-work-flow`, payload);

      if (response.data?.success) {
        toast({
          title:
            response.data.message ||
            'Daily work flow created successfully!',
          className: 'bg-theme border-none text-white'
        });
        const newId = response.data.data?._id;
        if (newId) {
          navigate(`/company/${companyId}/employee-daily-work-flow/${newId}`);
        } else {
          navigate(-1);
        }
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.message || 'Failed to create daily work flow.',
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
          <ReactSelect
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

  return (
    <div className="w-full space-y-4 rounded-md bg-white pb-20 md:pb-0">
      {/* Header Banner */}
      <div className="rounded-t-md border-b border-slate-100 bg-gradient-to-r from-theme/5 to-transparent p-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme">
              <ListTodo className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="break-words text-lg font-semibold text-black">
                Create Daily Work Flow
              </h1>
              <p className="text-xl font-bold">
                {moment(selectedDate).format('DD MMMM YYYY')}
              </p>
            </div>
          </div>

          {/* Employee & Date Selection */}
          <div className="w-full md:w-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-auto">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">
                  Employee <span className="text-red-500">*</span>
                </label>
                <ReactSelect
                  options={employees.map((emp) => ({
                    value: emp._id,
                    label: `${emp.firstName} ${emp.lastName}`
                  }))}
                  value={selectedEmployee}
                  onChange={(option: any) => {
                    setSelectedEmployee(option);
                    if (formErrors['employeeId']) {
                      setFormErrors((prev) => ({ ...prev, employeeId: '' }));
                    }
                  }}
                  placeholder="Select employee..."
                  className="min-w-[220px]"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      height: '40px',
                      borderColor: formErrors['employeeId']
                        ? '#ef4444'
                        : base.borderColor,
                      '&:hover': {
                        borderColor: formErrors['employeeId']
                          ? '#ef4444'
                          : base.borderColor
                      }
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                  menuPortalTarget={
                    typeof window !== 'undefined' ? document.body : null
                  }
                />
                {formErrors['employeeId'] && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {formErrors['employeeId']}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-auto">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black">
                  Select Date (DD-MM-YYYY)
                </label>
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
                  />
                </div>
              </div>
            </div>
          </div>
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
                  {tasks.map((task, index) => (
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
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="w-[55%] px-4 py-3 min-w-[260px]">Task Name</th>
                        <th className="px-4 py-3 min-w-[140px]">Start Time</th>
                        <th className="px-4 py-3 min-w-[140px]">End Time</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">Note</th>
                        <th className="px-4 py-3 text-right min-w-[110px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, index) => (
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
                      ))}
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
                {isSubmitting ? 'Saving...' : 'Save'}
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

export default DailyWorkFlowCreatePage;