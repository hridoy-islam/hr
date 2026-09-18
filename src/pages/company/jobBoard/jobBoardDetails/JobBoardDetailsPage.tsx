import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  CalendarDays,
  History,
  ChevronLeft,
  ChevronRight,
  Check,
  ClipboardList,
  FileText,
  Paperclip,
  Download,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Users2,
  X,
  CheckCircle2,
  Clock,
  Search,
  Eye
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { cn } from '@/lib/utils';
import { employeeName } from '..';

const taskSchema = z.object({
  taskName: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(2, { message: 'Task name must be at least 2 characters long' }),
  taskDate: z.date({
    required_error: 'Task date is required',
    invalid_type_error: 'Please select a valid date'
  }),
  note: z.string().trim().optional(),
  documents: z.array(z.string()).optional()
});

interface EmployeeRecord {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  designationId?: { title: string }[];
}

interface JobBoardRecord {
  _id: string;
  title: string;
  description?: string;
  employeeId: EmployeeRecord[];
}

type TaskLogAction = 'create' | 'update' | 'complete' | 'reopen';

interface TaskLogChange {
  field: string;
  from?: string;
  to?: string;
}

interface TaskLogRecord {
  _id?: string;
  title: string;
  date: string;
  action: TaskLogAction;
  updatedBy?: EmployeeRecord;
  changes?: TaskLogChange[];
}

interface TaskRecord {
  _id: string;
  taskName: string;
  taskDate: string;
  createdAt: string;
  documents?: string[];
  note?: string;
  taskDoneBy?: EmployeeRecord[];
  completedBy?: EmployeeRecord;
  completedAt?: string;
  isCompleted: boolean;
  logs?: TaskLogRecord[];
}

// Each kind of history entry carries its own marker colour
const LOG_ACTION_DOT: Record<TaskLogAction, string> = {
  create: 'bg-sky-500',
  update: 'bg-sky-500',
  complete: 'bg-sky-500',
  reopen: 'bg-sky-500'
};

// The whole entry as one run of text, so every log reads the same way.
// The changed fields are left off on purpose - add changeText back below
// to show them.
const logLine = (log: TaskLogRecord) => {
  // const changeText = (log.changes || [])
  //   .map(
  //     (change) => `${change.field}: ${change.from || '-'} → ${change.to || '-'}`
  //   )
  //   .join('; ');

  // Older entries were saved before the API wrote the time into the title
  return /\d{1,2}:\d{2}\s?(AM|PM)/i.test(log.title)
    ? log.title
    : `${log.title} on ${moment(log.date).format('DD MMM YYYY, h:mm A')}`;
};

// Built from local date parts, so the picker and the API always agree on the
// day - going through the app timezone pushed the month end onto the 1st of
// the next month
const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const monthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const docFileName = (url: string) => {
  const clean = url.split('?')[0];
  return decodeURIComponent(clean.split('/').pop() || 'document');
};

const docExtension = (url: string) =>
  docFileName(url).split('.').pop()?.toLowerCase() || '';

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

// Only images and PDFs can be shown inline - anything else is downloaded
const docKind = (url: string): 'image' | 'pdf' | 'other' => {
  const ext = docExtension(url);
  if (IMAGE_TYPES.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

export default function JobBoardDetailsPage() {
  const { id, jid } = useParams(); // companyId, jobBoardId
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  const [jobBoard, setJobBoard] = useState<JobBoardRecord | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filter - opens on the current month
  const [fromDate, setFromDate] = useState<Date | null>(monthStart());
  const [toDate, setToDate] = useState<Date | null>(monthEnd());

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState<Date | null>(new Date());
  const [note, setNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Worked by is editable from the task dialog once the task is completed
  const [editDoneByIds, setEditDoneByIds] = useState<string[]>([]);
  const [editDoneBySearch, setEditDoneBySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employee assignment
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] =
    useState<EmployeeRecord | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Confirmations on tasks
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);
  // Document preview
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState<TaskRecord | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  // Who completed the task - asked for when a task is marked as done
  const [doneByIds, setDoneByIds] = useState<string[]>([]);
  const [doneByError, setDoneByError] = useState('');
  const [doneBySearch, setDoneBySearch] = useState('');

  // Full task details
  const [viewingTask, setViewingTask] = useState<TaskRecord | null>(null);

  // Day list scrolling - the list opens on today, not on the 1st
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrolledRangeRef = useRef('');

  const fetchJobBoard = async () => {
    try {
      const response = await axiosInstance.get(`/job-board/${jid}`);
      setJobBoard(response.data.data);
    } catch (error) {
      console.error('Error fetching job board:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get(`/job-board-task`, {
        params: {
          companyId: id,
          jobBoardId: jid,
          limit: 'all',
          ...(fromDate ? { fromDate: toApiDate(fromDate) } : {}),
          ...(toDate ? { toDate: toApiDate(toDate) } : {})
        }
      });

      setTasks(response.data.data.result || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get(`/users`, {
        params: {
          company: id,
          role: 'employee',
          fields: 'firstName lastName email designationId',
          limit: 'all',
          status: 'active'
        }
      });
      setEmployees(response.data.data.result || response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchJobBoard();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jid]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jid, fromDate, toDate]);

  // Tasks are grouped by their task date, newest day first
  const todayKey = moment().format('YYYY-MM-DD');

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, TaskRecord[]>();

    tasks.forEach((task) => {
      const key = moment(task.taskDate).format('YYYY-MM-DD');
      groups.set(key, [...(groups.get(key) || []), task]);
    });

    // Every day of the selected range gets its own row, so the whole month
    // is listed even on the days that carry no task
    const days = new Map<string, TaskRecord[]>();

    if (fromDate && toDate) {
      const cursor = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate()
      );
      const last = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate()
      );

      while (cursor <= last && days.size < 400) {
        const key = toApiDate(cursor);
        days.set(key, groups.get(key) || []);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // A task landing outside the range still needs a day of its own
    groups.forEach((dayTasks, key) => {
      if (!days.has(key)) days.set(key, dayTasks);
    });

    // Oldest day first, so the month reads top to bottom
    return Array.from(days.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [tasks, fromDate, toDate]);

  const rangeKey = `${fromDate ? toApiDate(fromDate) : ''}|${
    toDate ? toApiDate(toDate) : ''
  }`;

  // Opens the list on the current day - only once per range, so a refetch
  // after saving does not yank the user back
  useEffect(() => {
    if (loading || groupedTasks.length === 0) return;
    if (scrolledRangeRef.current === rangeKey) return;

    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]'
    );
    if (!viewport) return;

    const frame = requestAnimationFrame(() => {
      const target = dayRefs.current[todayKey];

      if (target) {
        const offset =
          target.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top +
          viewport.scrollTop;
        viewport.scrollTop = Math.max(offset - 8, 0);
      } else {
        viewport.scrollTop = 0;
      }

      scrolledRangeRef.current = rangeKey;
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, groupedTasks, rangeKey, todayKey]);

  // Keeps the open details dialog in step with the list after an update
  useEffect(() => {
    setViewingTask((current) =>
      current ? tasks.find((task) => task._id === current._id) || null : null
    );
  }, [tasks]);

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskName('');
    setTaskDate(new Date());
    setNote('');
    setUploadedFiles([]);
    setFormErrors({});
    setEditDoneByIds([]);
    setEditDoneBySearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditTask = (task: TaskRecord) => {
    setEditingTask(task);
    setTaskName(task.taskName);
    setTaskDate(task.taskDate ? moment(task.taskDate).toDate() : new Date());
    setNote(task.note || '');
    setUploadedFiles(
      (task.documents || []).map((url) => ({
        name: url.split('/').pop() || 'Document',
        url
      }))
    );
    setFormErrors({});
    setEditDoneByIds((task.taskDoneBy || []).map((emp) => emp._id));
    setEditDoneBySearch('');
    setTaskDialogOpen(true);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: `File too large: ${file.name}. Must be less than 20MB.`,
          className: 'bg-red-500 border-none text-white'
        });
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user?._id || id || '');
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results.filter((r) => r.url)]);
    } catch (error) {
      toast({
        title: 'Failed to upload one or more documents',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveTask = async () => {
    setFormErrors({});

    const validation = taskSchema.safeParse({
      taskName,
      taskDate,
      note,
      documents: uploadedFiles.map((file) => file.url)
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    // A completed task must keep at least one person on its worked-by list
    if (editingTask?.isCompleted && editDoneByIds.length === 0) {
      setFormErrors({
        taskDoneBy: 'At least one person is required'
      });
      return;
    }

    // Keep the chosen day intact once axios serialises the date
    const picked = validation.data.taskDate;
    const utcSafeDate = new Date(
      Date.UTC(picked.getFullYear(), picked.getMonth(), picked.getDate())
    );

    const payload = {
      ...validation.data,
      taskDate: utcSafeDate,
      companyId: id,
      jobBoardId: jid,
      // A completed task can have its worked-by list corrected from here
      ...(editingTask?.isCompleted ? { taskDoneBy: editDoneByIds } : {})
    };

    try {
      setIsSubmitting(true);
      const response = editingTask
        ? await axiosInstance.patch(
            `/job-board-task/${editingTask._id}`,
            payload
          )
        : await axiosInstance.post('/job-board-task', payload);

      if (response.data?.success) {
        toast({
          title: editingTask
            ? 'Task updated successfully'
            : 'Task created successfully',
          className: 'bg-theme border-none text-white'
        });
        setTaskDialogOpen(false);
        resetTaskForm();
        fetchTasks();
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to save task',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!taskToToggle) return;

    const markingDone = !taskToToggle.isCompleted;

    if (markingDone && doneByIds.length === 0) {
      setDoneByError('Please select at least one person');
      return;
    }

    try {
      setIsToggling(true);
      const response = await axiosInstance.patch(
        `/job-board-task/${taskToToggle._id}`,
        {
          isCompleted: markingDone,
          completedBy: user?._id,
          ...(markingDone ? { taskDoneBy: doneByIds } : {})
        }
      );

      if (response.data?.success) {
        toast({
          title: taskToToggle.isCompleted
            ? 'Task reopened successfully'
            : 'Task marked as completed',
          className: 'bg-theme border-none text-white'
        });
        closeDoneDialog();
        fetchTasks();
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to update task',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const response = await axiosInstance.delete(
        `/job-board-task/${taskToDelete._id}`
      );

      if (response.data?.success) {
        toast({
          title: 'Task deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        setTaskToDelete(null);
        fetchTasks();
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete task',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleAssignEmployees = async () => {
    if (assignIds.length === 0) return;

    try {
      setIsAssigning(true);
      const response = await axiosInstance.patch(
        `/job-board/${jid}/employees`,
        { employeeId: assignIds }
      );

      if (response.data?.success) {
        toast({
          title: 'Employee assigned successfully',
          className: 'bg-theme border-none text-white'
        });
        setAssignOpen(false);
        setAssignIds([]);
        setAssignSearch('');
        setJobBoard(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to assign employee',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;

    try {
      setIsRemoving(true);
      const response = await axiosInstance.delete(
        `/job-board/${jid}/employees/${employeeToRemove._id}`
      );

      if (response.data?.success) {
        toast({
          title: 'Employee removed successfully',
          className: 'bg-theme border-none text-white'
        });
        setEmployeeToRemove(null);
        setJobBoard(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to remove employee',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Steps the range one whole month back or forward
  const shiftMonth = (offset: number) => {
    const base = fromDate || new Date();
    const start = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    setFromDate(start);
    setToDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
  };

  const assignableEmployees = employees.filter((employee) => {
    const alreadyAssigned = jobBoard?.employeeId?.some(
      (assigned) => assigned._id === employee._id
    );
    if (alreadyAssigned) return false;
    return employeeName(employee)
      .toLowerCase()
      .includes(assignSearch.toLowerCase());
  });

  // Fetching as a blob keeps the download a real download on cross-origin
  // storage URLs, where the anchor download attribute is ignored
  const handleDownloadDoc = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = docFileName(url);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(url, '_blank', 'noreferrer');
    }
  };

  const openDocument = (url: string) => {
    if (docKind(url) === 'other') {
      // Nothing to render, so it goes straight to the download
      handleDownloadDoc(url);
      return;
    }

    setPreviewFailed(false);
    setViewingDoc(url);
  };

  const openDoneDialog = (task: TaskRecord) => {
    setDoneByIds((task.taskDoneBy || []).map((emp) => emp._id));
    setDoneByError('');
    setDoneBySearch('');
    setTaskToToggle(task);
  };

  const closeDoneDialog = () => {
    setTaskToToggle(null);
    setDoneByIds([]);
    setDoneByError('');
    setDoneBySearch('');
  };

  // Narrows the employee list by a search box
  const searchEmployees = (term: string) =>
    (employees || []).filter((employee) => {
      const needle = term.trim().toLowerCase();
      if (!needle) return true;
      return (
        employeeName(employee).toLowerCase().includes(needle) ||
        (employee.email || '').toLowerCase().includes(needle)
      );
    });

  const doneByEmployees = searchEmployees(doneBySearch);
  const editDoneByEmployees = searchEmployees(editDoneBySearch);

  // Newest entry first, without mutating what the API sent
  const taskLogs = [...(viewingTask?.logs || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // A plain property: label above, value underneath. `wide` lets a long
  // value run the full width of the grid
  const renderDetail = (
    label: string,
    value: React.ReactNode,
    wide = false
  ) => (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">
        {label}
      </p>
      <div className="mt-1 whitespace-pre-wrap break-words text-[13px] font-normal leading-relaxed text-black">
        {value}
      </div>
    </div>
  );

  // Labelled divider heading each block of the details dialog
  const renderSectionLabel = (label: string, Icon: LucideIcon) => (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-theme" />
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">
        {label}
      </p>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );

  const renderPerson = (employee: EmployeeRecord, muted = false) => (
    <span
      key={employee._id}
      className="inline-flex items-center gap-2 rounded-lg"
    >
      
      <span className="flex flex-col leading-none">
        <span className="text-sm font-medium text-black">
          {employeeName(employee)}
        </span>
       
      </span>
    </span>
  );

  const renderTaskCard = (task: TaskRecord) => (
    <div
      key={task._id}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white pb-0',
        'transition-all duration-200 ease-out',
        'w-full'
      )}
    >
      {/* Accent edge */}
      {/* <span
        className={cn(
          'absolute inset-y-0 left-0 w-[3px] transition-colors duration-300',
          task.isCompleted ? 'bg-emerald-400/60' : 'bg-theme'
        )}
      /> */}

      <div className="flex flex-col gap-3 py-1 pl-2 pr-3.5 sm:flex-row sm:items-center sm:justify-between w-full">
        {/* Main content */}
        <div
          className="min-w-0 cursor-pointer"
          role="button"
          tabIndex={0}
          title="View task details"
          onClick={() => setViewingTask(task)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setViewingTask(task);
            }
          }}
        >
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                'text-md font-semibold leading-snug tracking-tight text-black',
                'transition-all duration-200'
              )}
            >
              {task.taskName}
            </h4>

            {/* Status badge */}
          </div>

          {/* Note */}
          {/* {task.note && (
            <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-black">
              {task.note}
            </p>
          )} */}

          {/* Metadata row */}
          {/* {Boolean(
            task.taskDoneBy?.length ||
              (task.isCompleted && task.completedBy) ||
              task.documents?.length
          ) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {Boolean(task.taskDoneBy?.length) && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                    Done by
                  </span>
                  <div className="flex items-center gap-1">
                    {task.taskDoneBy?.map((employee) => renderPerson(employee))}
                  </div>
                </div>
              )}

              {task.isCompleted && task.completedBy && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                    Completed by
                  </span>
                  <div className="flex items-center gap-1">
                    {renderPerson(task.completedBy, true)}
                  </div>
                </div>
              )}

              {Boolean(task.documents?.length) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.documents?.map((doc, index) => (
                    <button
                      key={`${task._id}-doc-${index}`}
                      type="button"
                      title={docFileName(doc)}
                      onClick={() => openDocument(doc)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1',
                        'bg-gray-50 text-[11px] font-medium text-black',
                        'ring-1 ring-inset ring-gray-200/80',
                        'transition-all duration-150',
                        'hover:bg-theme hover:text-white hover:ring-theme',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-1'
                      )}
                    >
                      <Paperclip className="h-3 w-3" />
                      <span>Doc {index + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )} */}
        </div>
        

             
        {/* Actions */}
        <div className={cn('flex shrink-0 items-center gap-1')}>
          <div
            className="flex items-center gap-2 mr-4 cursor-pointer"
            title="View task details"
            onClick={() => setViewingTask(task)}
          >
          <span className="text-sm font-medium  tracking-wider text-black">
            Created At
          </span>
          <div className="flex items-center gap-1 text-sm font-medium">
            {moment(task.createdAt).format('DD MMM YYYY')}
          </div>
        </div>
        {Boolean(task.taskDoneBy?.length) && (
                <div
                  className="flex items-center gap-2  mr-4 cursor-pointer"
                  title="View task details"
                  onClick={() => setViewingTask(task)}
                >
                  <span className="text-sm font-medium  tracking-wider text-black">
                    Worked by
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {task.taskDoneBy?.map((employee, index) => (
                      <span
                        key={`${task._id}-done-${employee._id}`}
                        className="flex items-center"
                      >
                        {renderPerson(employee)}
                        {index < (task.taskDoneBy?.length || 0) - 1 && (
                          <span className="text-sm font-medium text-black">
                            ,
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

          {!task.isCompleted &&  (
            <Button
              size="sm"
              className={cn(
                'h-8 gap-1.5 rounded-lg px-3',
                'bg-theme text-[11px] font-semibold text-white',
                'shadow-sm shadow-theme/20',
                'transition-all duration-150',
                'hover:bg-theme/90 hover:shadow-md hover:shadow-theme/25',
                'focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-1',
                'active:scale-[0.97]'
              )}
              onClick={() => openDoneDialog(task)}
            >
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Complete</span>
            </Button>
          )}

          

          <Button
            size="sm"
            variant="outline"
            title="View task details"
            onClick={() => setViewingTask(task)}
          >
            <Eye className="h-4 w-4 mr-1 " /> View
          </Button>
          <Button
            size="sm"
            title="Edit task"
            onClick={() => openEditTask(task)}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
            title="Delete task"
            onClick={() => setTaskToDelete(task)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading && !jobBoard) {
    return (
      <div className="flex justify-center py-20">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-md bg-white p-5 shadow-sm h-[97vh]">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-black">
              <ClipboardList className="h-6 w-6" />
              {jobBoard?.title}
            </h2>
            {jobBoard?.description && (
              <p className="text-sm text-black">{jobBoard.description}</p>
            )}
          </div>

          {/* Date range filter */}
          <div className="">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Previous month"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-theme transition-all hover:border-theme hover:bg-theme hover:text-white focus:outline-none focus-visible:border-theme"
                  onClick={() => shiftMonth(-1)}
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={4} />
                </button>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-theme" />
                  <DatePicker
                    selectsRange
                    startDate={fromDate}
                    endDate={toDate}
                    onChange={(dates) => {
                      const [start, end] = dates as [Date | null, Date | null];
                      setFromDate(start);
                      setToDate(end);
                    }}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode='select'
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select date range"
                    className="h-10 w-full rounded-full border-2 border-black pl-11 pr-4 text-center text-sm font-medium text-black transition-colors focus:border-theme focus:outline-none sm:w-[300px]"
                  />
                </div>

                <button
                  type="button"
                  title="Next month"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-theme transition-all hover:border-theme hover:bg-theme hover:text-white focus:outline-none focus-visible:border-theme"
                  onClick={() => shiftMonth(1)}
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={4}/>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className=" gap-2 "
              onClick={() => navigate(`/company/${id}/job-board`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 "
              onClick={() => {
                setAssignIds([]);
                setAssignSearch('');
                setAssignOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetTaskForm();
                setTaskDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Assigned employees */}
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-start gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-black">
              <Users2 className="h-4 w-4" />
              Employee ({jobBoard?.employeeId?.length || 0})
            </div>

            <div className="flex flex-wrap gap-2">
              {jobBoard?.employeeId?.length ? (
                jobBoard.employeeId.map((employee) => (
                  <div
                    key={employee._id}
                    className="group/emp flex items-center gap-2 rounded-full border border-black py-1 pl-1 pr-1.5 transition-colors hover:border-theme"
                  >
                    <div className="ml-2 flex flex-col leading-tight">
                      <span className="text-xs font-semibold text-black">
                        {employeeName(employee)}
                      </span>
                      {/* <span className="text-[10px] text-black">
                      {employee.email || '-'}
                    </span> */}
                    </div>
                    <button
                      type="button"
                      title="Remove employee"
                      className="ml-1 rounded-full p-1 text-black transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => setEmployeeToRemove(employee)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs italic text-black">
                  No employee assigned yet.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks, grouped by task date */}
      <div className="">
        {loading ? (
          <div className="flex justify-center py-10">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : groupedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme/10">
              <ClipboardList className="h-6 w-6 text-theme" />
            </div>
            <p className="text-sm font-extrabold text-black">
              No task in this date range
            </p>
            <p className="max-w-lg text-xs font-medium text-black">
              Pick another range with the arrows above, or add a task to this
              job board.
            </p>
          </div>
        ) : (
          <ScrollArea
            ref={scrollAreaRef}
            className="h-[calc(100vh-170px)] min-h-[450px] pr-3"
          >
            <div className="relative space-y-2 ">
              {groupedTasks.map(([dateKey, dateTasks]) => {
                const isToday = dateKey === todayKey;
                const date = moment(dateKey, 'YYYY-MM-DD');

                return (
                  <div
                    key={dateKey}
                    ref={(node) => {
                      dayRefs.current[dateKey] = node;
                    }}
                    className={cn('relative space-y-3',)}
                  >
                    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg bg-gray-200 p-2', isToday ? 'bg-theme text-white' : 'border-gray-200')}>
                      <span className="text-sm font-medium tracking-[0.12em] ">
                        {date.format('DD MMM YYYY')}
                      </span>

                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-sm font-medium  tracking-[0.12em]',
                         
                        )}
                      >
                        {isToday ? 'Today' : date.format('dddd')}
                      </span>

                      <span className="text-sm font-semibold ">
                        {dateTasks.length}{' '}
                        {dateTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {dateTasks.length === 0 ? (
                        <p className="px-2 pb-1 text-sm font-medium italic text-black">
                          No task on this day
                        </p>
                      ) : (
                        dateTasks.map((task) => renderTaskCard(task))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* --- Task dialog --- */}
      <Dialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) resetTaskForm();
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-lg font-bold">
              {editingTask ? 'Edit Task' : 'Add Task'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-black">
                  Task Name*
                </Label>
                <Input
                  value={taskName}
                  onChange={(e) => {
                    setTaskName(e.target.value);
                    setFormErrors((prev) => ({ ...prev, taskName: '' }));
                  }}
                  placeholder="Enter task name"
                  className={cn(formErrors.taskName && 'border-red-500')}
                />
                {formErrors.taskName && (
                  <p className="text-xs font-medium text-red-500">
                    {formErrors.taskName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-black">
                  Task Date* (DD-MM-YYYY)
                </Label>
                <DatePicker
                  selected={taskDate}
                  onChange={(date: Date | null) => {
                    setTaskDate(date);
                    setFormErrors((prev) => ({ ...prev, taskDate: '' }));
                  }}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className={cn(
                    'flex h-10 w-full rounded-md border px-3 text-sm focus:outline-none',
                    formErrors.taskDate
                      ? 'border-red-500'
                      : 'border-gray-200 focus:border-theme'
                  )}
                />
                {formErrors.taskDate && (
                  <p className="text-xs font-medium text-red-500">
                    {formErrors.taskDate}
                  </p>
                )}
              </div>
            </div>

        

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">Note</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this task..."
                className="min-h-[80px] resize-none"
              />
            </div>
   
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">
                Documents
              </Label>
              <div className="rounded-lg border border-dashed border-gray-200 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </Button>
                <p className="mt-2 text-[11px] text-black">
                  You can attach as many documents as you need. Max 20MB each.
                </p>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={`${file.url}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-black">
                          <FileText className="h-4 w-4" />
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="rounded p-1 text-black hover:bg-red-100 hover:text-red-600"
                          onClick={() =>
                            setUploadedFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


             {editingTask?.isCompleted && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-black">
                  Worked By*
                </Label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
                  <Input
                    value={editDoneBySearch}
                    onChange={(e) => setEditDoneBySearch(e.target.value)}
                    placeholder="Search employee by name or email..."
                    className="h-9 pl-9"
                  />
                </div>

                {editDoneByIds.length > 0 && (
                  <p className="text-[11px] font-semibold text-black">
                    {editDoneByIds.length} selected
                  </p>
                )}

                <div
                  className={cn(
                    'max-h-[180px] space-y-1 overflow-y-auto rounded-md border p-2',
                    formErrors.taskDoneBy ? 'border-red-500' : 'border-gray-200'
                  )}
                >
                  {(employees || []).length === 0 ? (
                    <p className="p-2 text-sm italic text-black">
                      No employee is assigned to this job board yet.
                    </p>
                  ) : editDoneByEmployees.length === 0 ? (
                    <p className="p-2 text-sm italic text-black">
                      No employee matches this search.
                    </p>
                  ) : (
                    editDoneByEmployees.map((employee) => (
                      <label
                        key={employee._id}
                        className="flex cursor-pointer items-center gap-3 rounded-sm p-2 transition-colors hover:bg-theme/5"
                      >
                        <Checkbox
                          checked={editDoneByIds.includes(employee._id)}
                          onCheckedChange={() => {
                            setFormErrors((prev) => ({
                              ...prev,
                              taskDoneBy: ''
                            }));
                            setEditDoneByIds((prev) =>
                              prev.includes(employee._id)
                                ? prev.filter((item) => item !== employee._id)
                                : [...prev, employee._id]
                            );
                          }}
                        />

                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-black">
                            {employeeName(employee)}
                          </span>
                          <span className="text-[11px] text-black">
                            {employee.email || '-'}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {formErrors.taskDoneBy && (
                  <p className="text-xs font-medium text-red-500">
                    {formErrors.taskDoneBy}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isSubmitting || isUploading}
              onClick={handleSaveTask}
            >
              {isSubmitting
                ? 'Saving...'
                : editingTask
                  ? 'Update Task'
                  : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Assign employee dialog --- */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-lg font-bold">
              Add Employee to {jobBoard?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Input
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              placeholder="Search employee..."
              className="h-9"
            />

            <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {assignableEmployees.length === 0 ? (
                <p className="p-2 text-sm italic text-black">
                  Every employee is already assigned.
                </p>
              ) : (
                assignableEmployees.map((employee) => (
                  <label
                    key={employee._id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={assignIds.includes(employee._id)}
                      onCheckedChange={() =>
                        setAssignIds((prev) =>
                          prev.includes(employee._id)
                            ? prev.filter((item) => item !== employee._id)
                            : [...prev, employee._id]
                        )
                      }
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {employeeName(employee)}
                      </span>
                      <span className="text-[11px] text-black">
                        {employee.email || '-'}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isAssigning || assignIds.length === 0}
              onClick={handleAssignEmployees}
            >
              {isAssigning
                ? 'Assigning...'
                : `Assign ${assignIds.length || ''} Employee`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Remove employee confirmation --- */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => {
          if (!open) setEmployeeToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              Remove{' '}
              <span className="font-semibold">
                {employeeName(employeeToRemove || undefined)}
              </span>{' '}
              from <span className="font-semibold">{jobBoard?.title}</span>?
              They will no longer be assigned to this job board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isRemoving}
              onClick={(e) => {
                e.preventDefault();
                handleRemoveEmployee();
              }}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Who completed the task / reopen --- */}
      <Dialog
        open={!!taskToToggle}
        onOpenChange={(open) => {
          if (!open) closeDoneDialog();
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {taskToToggle?.isCompleted
                ? 'Reopen Task'
                : 'Who has completed this task?'}
            </DialogTitle>
          </DialogHeader>

          {taskToToggle?.isCompleted ? (
            <p className="py-2 text-sm text-black">
              Reopen{' '}
              <span className="font-semibold">{taskToToggle?.taskName}</span>?
              The sign-off on it will be cleared.
            </p>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-black">
                Select everyone who worked on{' '}
                <span className="font-semibold text-black">
                  {taskToToggle?.taskName}
                </span>
                . You can pick more than one person.
              </p>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
                <Input
                  value={doneBySearch}
                  onChange={(e) => setDoneBySearch(e.target.value)}
                  placeholder="Search employee by name or email..."
                  className="h-9 pl-9"
                />
              </div>

              {doneByIds.length > 0 && (
                <p className="text-[11px] font-semibold text-black">
                  {doneByIds.length} selected
                </p>
              )}

              <div className="max-h-[260px] space-y-1 overflow-y-auto rounded-sm border border-gray-200 p-2">
                {(employees || []).length === 0 ? (
                  <p className="p-2 text-sm italic text-black">
                    No employee is assigned to this job board yet.
                  </p>
                ) : doneByEmployees.length === 0 ? (
                  <p className="p-2 text-sm italic text-black">
                    No employee matches this search.
                  </p>
                ) : (
                  doneByEmployees.map((employee) => (
                    <label
                      key={employee._id}
                      className="flex cursor-pointer items-center gap-3 rounded-sm p-2 transition-colors hover:bg-theme/5"
                    >
                      <Checkbox
                        checked={doneByIds.includes(employee._id)}
                        onCheckedChange={() => {
                          setDoneByError('');
                          setDoneByIds((prev) =>
                            prev.includes(employee._id)
                              ? prev.filter((item) => item !== employee._id)
                              : [...prev, employee._id]
                          );
                        }}
                      />

                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-black">
                          {employeeName(employee)}
                        </span>
                        <span className="text-[11px] text-black">
                          {employee.email || '-'}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {doneByError && (
                <p className="text-xs font-medium text-red-500">
                  {doneByError}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isToggling}
              onClick={closeDoneDialog}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isToggling}
              onClick={handleToggleComplete}
            >
              {isToggling
                ? 'Saving...'
                : taskToToggle?.isCompleted
                  ? 'Reopen Task'
                  : 'Mark as Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Task details --- */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => {
          if (!open) setViewingTask(null);
        }}
      >
        <DialogContent className="flex h-[85vh] max-h-[85vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:rounded-xl">
          <DialogHeader className="shrink-0 space-y-0 border-b border-gray-200 px-5 py-3.5 pr-14 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate text-[17px] font-bold leading-tight text-black">
                  {viewingTask?.taskName}
                </DialogTitle>
               
              </div>

              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]',
                  viewingTask?.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                )}
              >
                {viewingTask?.isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {viewingTask?.isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:overflow-hidden">
            <div className="grid grid-cols-1 md:h-full md:grid-cols-12 md:divide-x md:divide-gray-200">
              {/* Details */}
              <div className="min-h-0 space-y-3 px-5 py-4 md:col-span-5 md:h-full md:overflow-y-auto md:overscroll-contain">
                {renderSectionLabel('Details', ClipboardList)}

                <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  {renderDetail(
                    'Task Date',
                    viewingTask
                      ? moment(viewingTask.taskDate).format('DD MMM YYYY')
                      : '-'
                  )}
                  {renderDetail(
                    'Created At',
                    viewingTask
                      ? moment(viewingTask.createdAt).format('DD MMM YYYY')
                      : '-'
                  )}
                  {viewingTask?.isCompleted &&
                    renderDetail(
                      'Completed At',
                      viewingTask?.completedAt
                        ? moment(viewingTask.completedAt).format('DD MMM YYYY')
                        : '-'
                    )}
                  {viewingTask?.isCompleted &&
                    renderDetail(
                      'Completed By',
                      viewingTask?.completedBy
                        ? employeeName(viewingTask.completedBy)
                        : '-'
                    )}
                  {viewingTask?.isCompleted &&
                    renderDetail(
                      'Worked By',
                      viewingTask?.taskDoneBy?.length
                        ? viewingTask.taskDoneBy
                            .map((employee) => employeeName(employee))
                            .join(', ')
                        : '-',
                      true
                    )}
                  {renderDetail('Note', viewingTask?.note || '-', true)}
                </div>
              </div>

              {/* Documents */}
              <div className="min-h-0 space-y-3 px-5 py-4 md:col-span-2 md:h-full md:overflow-y-auto md:overscroll-contain">
                {renderSectionLabel(
                  'Documents (' + (viewingTask?.documents?.length || 0) + ')',
                  Paperclip
                )}

                {viewingTask?.documents?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingTask.documents.map((doc, index) => (
                      <button
                        key={viewingTask._id + '-view-doc-' + index}
                        type="button"
                        title={docFileName(doc)}
                        onClick={() => openDocument(doc)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2',
                          'bg-gray-50 text-xs font-semibold text-black',
                          'ring-1 ring-inset ring-gray-200',
                          'transition-all duration-150',
                          'hover:bg-theme hover:text-white hover:ring-theme',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-1'
                        )}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Doc {index + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm italic text-black">
                    No document attached.
                  </p>
                )}
              </div>

              {/* Activity */}
              <div className="min-h-0 space-y-3 px-5 py-4 md:col-span-5 md:h-full md:overflow-y-auto md:overscroll-contain">
                {renderSectionLabel(
                  'Activity (' + taskLogs.length + ')',
                  History
                )}

                {taskLogs.length ? (
                  <ol className="-mx-2">
                    {taskLogs.map((log, index) => (
                      <li
                        key={log._id || `${log.date}-${index}`}
                        className="flex items-start gap-2.5 rounded-md border-b border-gray-100 px-2 py-2 transition-colors last:border-0 hover:bg-gray-50"
                      >
                        <span
                          className={cn(
                            'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                            LOG_ACTION_DOT[log.action] || LOG_ACTION_DOT.update
                          )}
                        />
                        <span className="min-w-0 flex-1 break-words text-[11px] font-medium leading-relaxed text-black">
                          {logLine(log)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm italic text-black">
                    No activity recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-gray-200 px-5 py-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewingTask(null)}
            >
              Close
            </Button>

            {viewingTask && !viewingTask.isCompleted && (
              <Button
                size="sm"
                className="gap-1.5 bg-theme text-white hover:bg-theme/90"
                onClick={() => {
                  const task = viewingTask;
                  setViewingTask(null);
                  openDoneDialog(task);
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Complete
              </Button>
            )}

            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const task = viewingTask;
                setViewingTask(null);
                if (task) openEditTask(task);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- Document preview --- */}
        <Dialog
          open={!!viewingDoc}
          onOpenChange={(open) => {
            if (!open) {
              setViewingDoc(null);
              setPreviewFailed(false);
            }
          }}
        >
        <DialogContent className="flex h-[85vh] w-[95vw] max-w-5xl flex-col gap-0 p-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
            <DialogTitle className="truncate text-sm font-semibold">
              {viewingDoc ? docFileName(viewingDoc) : 'Document'}
            </DialogTitle>

            <Button
              size="sm"
              className="mr-6 gap-1.5 bg-theme text-white hover:bg-theme/90"
              onClick={() => viewingDoc && handleDownloadDoc(viewingDoc)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogHeader>

          <div className="flex flex-1 items-center justify-center overflow-auto bg-black/5 p-4">
            {!viewingDoc ? null : previewFailed ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-theme/10">
                  <FileText className="h-6 w-6 text-theme" />
                </div>
                <p className="text-sm font-semibold text-black">
                  This document cannot be previewed
                </p>
                <p className="max-w-sm text-xs text-black">
                  Download it to open the file on your device.
                </p>
                <Button
                  size="sm"
                  className="gap-1.5 bg-theme text-white hover:bg-theme/90"
                  onClick={() => handleDownloadDoc(viewingDoc)}
                >
                  <Download className="h-4 w-4" />
                  Download Document
                </Button>
              </div>
            ) : docKind(viewingDoc) === 'image' ? (
              <img
                src={viewingDoc}
                alt={docFileName(viewingDoc)}
                className="max-h-full max-w-full object-contain"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <iframe
                src={viewingDoc}
                title={docFileName(viewingDoc)}
                className="h-full w-full rounded-sm border border-gray-200 bg-white"
                onError={() => setPreviewFailed(true)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Delete task confirmation --- */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will delete{' '}
              <span className="font-semibold">{taskToDelete?.taskName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTask();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
