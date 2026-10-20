import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import {
  CalendarDays,
  CalendarRange,
  Check,
  CheckCheck,
  CheckCircle2,
  DoorOpen,
  Lock,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Timer,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
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
import {
  apiError,
  CLEANING_TYPE_LABEL,
  CleaningArea,
  CleaningEmployee,
  CleaningLogRecord,
  CleaningLogStatus,
  CleaningType,
  formatDateTime,
  LOG_STATUS_LABEL,
  personName,
  SelectOption,
  selectStyles,
  sortAreasByRoom
} from '../shared';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';
import { CleaningSession, SessionAction, StatusBadge } from './CleaningSession';

interface ChecklistRow {
  elementId: string;
  element: string;
  performanceParameter: string;
}

interface CleaningLogWizardProps {
  companyId: string;
  // An admin works on behalf of an employee and picks the type in the form;
  // an employee arrives with the type already chosen
  mode: 'admin' | 'employee';
  type?: CleaningType;
  // A completed log being corrected from the company side
  log?: CleaningLogRecord | null;
  // An unfinished session to pick straight back up
  draft?: CleaningLogRecord | null;
  onSubmitted: (log: CleaningLogRecord) => void;
  // Any start / pause / resume / stop with the log as it now stands, or null
  // once it is discarded or completed, so the page can update without a reload
  onSessionChange?: (logId: string, log: CleaningLogRecord | null) => void;
  // The session on screen right now, or null when none is open
  onOpenDraftChange?: (logId: string | null) => void;
  onCancel?: () => void;
}

const SESSION_TOAST: Record<SessionAction, string> = {
  start: 'Cleaning started',
  pause: 'Cleaning paused. Finish it any time from your unfinished areas.',
  resume: 'Cleaning resumed',
  stop: 'Cleaning stopped. Sign and submit.',
  discard: 'Session discarded'
};

type TimeField = 'startTime' | 'endTime';

const TIME_LABEL: Record<TimeField, string> = {
  startTime: 'Start time',
  endTime: 'End time'
};

// A 24-hour clock time, e.g. 09:00 or 17:30
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Both times are required on the company side and must be valid. `strict`
// off lets an empty field pass while it is still being filled in.
const validateTimes = (times: Record<TimeField, string>, strict = true) => {
  const check = (field: TimeField) => {
    const value = times[field].trim();
    if (!value) return strict ? `${TIME_LABEL[field]} is required` : '';
    return TIME_PATTERN.test(value)
      ? ''
      : `${TIME_LABEL[field]} is invalid (HH:MM)`;
  };
  const startTime = check('startTime');
  let endTime = check('endTime');
  // HH:MM strings sort the same way the times do
  if (
    !startTime &&
    !endTime &&
    times.startTime &&
    times.endTime &&
    times.endTime < times.startTime
  )
    endTime = 'End time cannot be earlier than start time';
  return { startTime, endTime };
};

// Completes a typed time on blur, e.g. 9 -> 09:00, 930 -> 09:30
const formatTime = (value: string) => {
  const clean = value.trim();
  if (!clean) return clean;
  const m = moment(clean, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H'], true);
  return m.isValid() ? m.format('HH:mm') : clean;
};

// Times an open log can keep for now: valid ones, or empty to clear. A half
// typed one is left out until it is fixed.
const savableTimes = (times: Record<TimeField, string>) => {
  const result: Partial<Record<TimeField, string>> = {};
  (['startTime', 'endTime'] as TimeField[]).forEach((field) => {
    const value = times[field].trim();
    if (!value || TIME_PATTERN.test(value)) result[field] = value;
  });
  return result;
};

const checkedIdsOf = (record?: CleaningLogRecord | null) =>
  new Set(
    (record?.items || [])
      .filter((item) => item.checked && item.elementId)
      .map((item) => String(item.elementId))
  );

export function CleaningLogWizard({
  companyId,
  mode,
  type: fixedType,
  log,
  draft: initialDraft,
  onSubmitted,
  onSessionChange,
  onOpenDraftChange
}: CleaningLogWizardProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const signatureRef = useRef<SignaturePadHandle>(null);

  const seed = log || initialDraft;
  const [employeeId, setEmployeeId] = useState(seed?.employeeId?._id || '');
  const [type, setType] = useState<CleaningType | ''>(
    seed?.type || fixedType || ''
  );
  const [areaId, setAreaId] = useState(seed?.areaId || '');
  // Once an area is picked the list folds away; "Change" brings it back
  const [pickingArea, setPickingArea] = useState(!seed?.areaId);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(checkedIdsOf(seed));
  const [note, setNote] = useState(seed?.note || '');
  // Typed in by hand, or stamped by an employee's timer and still editable
  const [times, setTimes] = useState<Record<TimeField, string>>({
    startTime: seed?.startTime || '',
    endTime: seed?.endTime || ''
  });
  const [timeErrors, setTimeErrors] = useState<Record<TimeField, string>>({
    startTime: '',
    endTime: ''
  });

  // The session for the picked area, once it has been started
  const [draft, setDraft] = useState<CleaningLogRecord | null>(
    initialDraft || null
  );
  const [busyAction, setBusyAction] = useState<SessionAction | null>(null);
  // Stop and discard cannot be undone, so both ask first
  const [confirmAction, setConfirmAction] = useState<'stop' | 'discard' | null>(
    null
  );
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [areasVersion, setAreasVersion] = useState(0);
  // An employee's unfinished session the company side is about to clear
  const [clearTarget, setClearTarget] = useState<CleaningArea | null>(null);
  const [clearing, setClearing] = useState(false);
  // Ticks and times waiting to be saved on an employee's open log
  const tickTimer = useRef<number>();
  const [tickSave, setTickSave] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [areaSearch, setAreaSearch] = useState('');
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The company side fills the whole log in by hand; an employee can too, or
  // run the timer
  const isAdmin = mode === 'admin';
  // Whose sessions this form can pick back up. None on the company side, so
  // an area someone is working on stays locked there.
  const actorId = isAdmin ? null : user?._id;
  // Creating from the company side can finish an employee's open session
  const canTakeOver = isAdmin && !log;

  const resetArea = () => {
    setAreaId('');
    setDraft(null);
    setCheckedIds(new Set());
    setNote('');
    if (!log) setTimes({ startTime: '', endTime: '' });
    setPickingArea(true);
  };

  // The type buttons outside the form can change it for an employee
  useEffect(() => {
    if (fixedType && fixedType !== type) {
      setType(fixedType);
      resetArea();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedType]);

  useEffect(() => {
    if (mode !== 'admin') return;
    axiosInstance
      .get('/cleaning-access', { params: { companyId } })
      .then((res) => setEmployees(res.data?.data?.employeeId || []))
      .catch(() => setEmployees([]));
  }, [mode, companyId]);

  useEffect(() => {
    if (!type) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    axiosInstance
      .get('/cleaning-area', {
        params: {
          companyId,
          type,
          limit: 'all',
          sort: 'areaName',
          // Marks areas already done or being worked on this day / month; a
          // log being edited is judged against its own period and does not
          // block itself
          withCompletion: true,
          ...(log
            ? { completionDate: log.createdAt, excludeLogId: log._id }
            : {})
        }
      })
      .then((res) => setAreas(sortAreasByRoom(res.data?.data?.result || [])))
      .catch(() => setAreas([]))
      .finally(() => setLoadingAreas(false));
  }, [companyId, type, log, areasVersion]);

  // A session works through the checklist it was started with, and a log
  // being edited keeps the one it was signed against. Only an edit moved to
  // a new area reads that area's current elements.
  const checklistSource =
    draft || (log && String(log.areaId) === String(areaId) ? log : null);

  useEffect(() => {
    // Shown as soon as an area is picked: the timer is not needed to work
    if (!areaId) {
      setRows([]);
      return;
    }

    if (checklistSource) {
      setRows(
        checklistSource.items.map((item, index) => ({
          elementId: String(item.elementId || index),
          element: item.element,
          performanceParameter: item.performanceParameter
        }))
      );
      return;
    }

    setLoadingRows(true);
    axiosInstance
      .get('/cleaning-element', { params: { areaId, limit: 'all' } })
      .then((res) =>
        setRows(
          (res.data?.data?.result || []).map((element: any) => ({
            elementId: element._id,
            element: element.element,
            performanceParameter: element.performanceParameter
          }))
        )
      )
      .catch(() => setRows([]))
      .finally(() => setLoadingRows(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, log, draft?._id]);

  const employeeOptions: SelectOption[] = employees.map((employee) => ({
    value: employee._id,
    label: personName(employee)
  }));

  const selectedArea = areas.find((area) => area._id === areaId);
  const selectedAreaName =
    selectedArea?.areaName || draft?.areaName || log?.areaName || '';
  const selectedRoom = selectedArea
    ? selectedArea.roomNumber
    : draft?.roomNumber || log?.roomNumber;
  const selectedTotal = selectedArea?.totalElement ?? rows.length;

  const filteredAreas = useMemo(() => {
    const needle = areaSearch.trim().toLowerCase();
    if (!needle) return areas;
    return areas.filter(
      (area) =>
        area.areaName.toLowerCase().includes(needle) ||
        (area.roomNumber || '').toLowerCase().includes(needle)
    );
  }, [areas, areaSearch]);

  const areaPicked = Boolean(areaId) && !pickingArea;

  // Lets the page mark which unfinished session is the one on screen
  const openDraftId = areaPicked && draft ? draft._id : null;
  useEffect(() => {
    onOpenDraftChange?.(openDraftId);
    // Cleared when the form closes, so no card claims to be open below
    return () => onOpenDraftChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDraftId]);
  const draftStatus = draft?.status as CleaningLogStatus | undefined;
  // The company side goes straight to the checklist, times and signature. An
  // employee presses Start to see the checklist, and signs once stopped.
  const showChecklist = areaPicked && (isAdmin || Boolean(draft));
  const showSign = areaPicked && (isAdmin || draftStatus === 'stopped');
  const busy = isSubmitting || busyAction !== null;

  // An employee's ticks and times are saved as they go once the log exists,
  // so a reload, another device or an admin finishing it all see them. A
  // short pause lets quick taps go out as one save.
  const autoSavesTicks = !isAdmin && Boolean(draft);

  const queueTickSave = (
    next: Set<string>,
    nextTimes: Record<TimeField, string> = times
  ) => {
    if (!autoSavesTicks || !draft) return;
    window.clearTimeout(tickTimer.current);
    setTickSave('saving');
    const logId = draft._id;
    const items = rows.map((row) => ({
      elementId: row.elementId,
      checked: next.has(row.elementId)
    }));
    const body = { items, ...savableTimes(nextTimes) };
    tickTimer.current = window.setTimeout(async () => {
      try {
        const res = await axiosInstance.patch(
          `/cleaning-log/${logId}/items`,
          body
        );
        setTickSave('saved');
        // Keeps the unfinished-areas cards in step without a reload
        const saved = { ...draft, ...res.data?.data } as CleaningLogRecord;
        setDraft((current) => (current?._id === logId ? saved : current));
        onSessionChange?.(logId, saved);
      } catch (err) {
        setTickSave('error');
        toast({
          title: apiError(err, 'Failed to save your ticks. Please try again.'),
          className: 'bg-red-500 border-none text-white'
        });
      }
    }, 500);
  };

  // Pause, stop and complete send the ticks themselves, so a save still
  // waiting is dropped rather than racing them
  const cancelTickSave = () => {
    window.clearTimeout(tickTimer.current);
    setTickSave('idle');
  };

  useEffect(() => () => window.clearTimeout(tickTimer.current), []);

  const updateChecked = (next: Set<string>) => {
    setCheckedIds(next);
    queueTickSave(next);
  };

  const toggleRow = (elementId: string) => {
    const next = new Set(checkedIds);
    if (next.has(elementId)) next.delete(elementId);
    else next.add(elementId);
    updateChecked(next);
  };

  const allChecked =
    rows.length > 0 && rows.every((row) => checkedIds.has(row.elementId));

  const toggleAll = () =>
    updateChecked(
      allChecked ? new Set() : new Set(rows.map((row) => row.elementId))
    );

  const itemsPayload = () =>
    rows.map((row) => ({
      elementId: row.elementId,
      checked: checkedIds.has(row.elementId)
    }));

  // A session already open on the area is picked back up: by its own
  // employee to carry on, or by the company side to finish it off
  const selectArea = async (area: CleaningArea) => {
    setError('');
    setAreaSearch('');
    setPickingArea(false);
    if (area._id === areaId) return;

    setAreaId(area._id);
    setDraft(null);
    setCheckedIds(new Set());
    setNote('');
    // A save still on its way finishes for the area it belongs to; the label
    // starts fresh for the new one
    setTickSave('idle');
    if (!log) setTimes({ startTime: '', endTime: '' });

    const open = area.inProgress;
    const ownSession =
      Boolean(actorId) && String(open?.employeeId?._id) === String(actorId);
    if (!open || !(ownSession || canTakeOver)) return;

    try {
      setLoadingDraft(true);
      const res = await axiosInstance.get(`/cleaning-log/${open.logId}`);
      const record: CleaningLogRecord = res.data?.data;
      setDraft(record);
      setCheckedIds(checkedIdsOf(record));
      setNote(record?.note || '');
      // The times clocked or typed so far carry over
      setTimes({
        startTime: record.startTime || '',
        endTime: record.endTime || ''
      });
      // The log stays the employee's
      if (canTakeOver) setEmployeeId(record.employeeId?._id || '');
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to load this session'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setLoadingDraft(false);
    }
  };

  // Only an employee runs a session; the company side never sees these
  const runSession = async (action: SessionAction) => {
    if (
      (action === 'stop' || action === 'discard') &&
      confirmAction !== action
    ) {
      setConfirmAction(action);
      return;
    }

    cancelTickSave();
    setError('');
    try {
      setBusyAction(action);
      let record: CleaningLogRecord | null = null;

      // The ticks so far travel with every pause, so nothing is lost when
      // the employee switches area
      const progress = { items: itemsPayload() };

      if (!draft && action === 'start') {
        const res = await axiosInstance.post('/cleaning-log/start', {
          companyId,
          areaId
        });
        record = res.data?.data;
      } else if (action === 'discard') {
        await axiosInstance.delete(`/cleaning-log/${draft!._id}/discard`);
      } else {
        const res = await axiosInstance.patch(
          `/cleaning-log/${draft!._id}/${action}`,
          progress
        );
        record = res.data?.data;
      }

      toast({
        title: SESSION_TOAST[action],
        className: 'bg-theme border-none text-white'
      });

      setConfirmAction(null);
      if (action === 'discard') {
        onSessionChange?.(draft!._id, null);
        resetArea();
        // The area list is back on screen, with this area free again
        setAreasVersion((version) => version + 1);
      } else if (record) {
        setDraft(record);
        // The timer stamps a start or stop time the inputs should show
        setTimes((current) => ({
          startTime: record!.startTime || current.startTime,
          endTime: record!.endTime || current.endTime
        }));
        // The area list stays folded away and reloads on "Change area", so
        // it is not fetched again here
        onSessionChange?.(record._id, record);
      }
    } catch (err) {
      toast({
        title: apiError(err, 'Something went wrong. Please try again.'),
        className: 'bg-red-500 border-none text-white'
      });
      // The area may have just been taken, or the session moved elsewhere
      setAreasVersion((version) => version + 1);
    } finally {
      setBusyAction(null);
    }
  };

  const clearSession = async () => {
    const open = clearTarget?.inProgress;
    if (!open) return;
    try {
      setClearing(true);
      await axiosInstance.delete(`/cleaning-log/${open.logId}/discard`);
      toast({
        title: `${clearTarget!.areaName} is free again`,
        className: 'bg-theme border-none text-white'
      });
      setClearTarget(null);
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to clear the session'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setClearing(false);
      // Reloaded either way: the session may have been completed meanwhile
      setAreasVersion((version) => version + 1);
    }
  };

  const validate = (): string => {
    if (mode === 'admin' && !employeeId) return 'Please select an employee';
    if (!type) return 'Please choose daily or monthly';
    if (!areaId) return 'Please select an area';
    if (rows.length === 0)
      return 'This area has no elements yet. Ask an admin to add them first.';
    // Required, and typed in on the company side; an employee's come from
    // the timer
    if (isAdmin) {
      const nextTimeErrors = validateTimes(times);
      setTimeErrors(nextTimeErrors);
      if (nextTimeErrors.startTime || nextTimeErrors.endTime)
        return 'Please enter a valid start and end time';
    }

    if (signatureRef.current?.isEmpty() ?? true) {
      setSignatureError('Please sign inside the box');
      return 'Please sign before completing';
    }
    return '';
  };

  const handleComplete = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    cancelTickSave();
    setError('');
    setSignatureError('');

    try {
      setIsSubmitting(true);

      // The signature is uploaded first; the log is only saved once its url
      // is back
      let signature;
      try {
        signature = await signatureRef.current!.save();
      } catch {
        toast({
          title: 'Failed to save the signature. Please try again.',
          className: 'bg-red-500 border-none text-white'
        });
        return;
      }

      const payload = {
        items: itemsPayload(),
        note: note.trim(),
        signatureUrl: signature.signatureUrl,
        signedAt: signature.signedAt,
        startTime: times.startTime,
        endTime: times.endTime
      };

      const newLogPayload = {
        ...payload,
        areaId,
        // An employee always files for themselves
        ...(isAdmin ? { employeeId } : {})
      };

      // Edit a finished log, complete an open one (paused, stopped or the
      // company side finishing it), or file a new log in one go
      const response = log
        ? await axiosInstance.patch(`/cleaning-log/${log._id}`, newLogPayload)
        : draft
          ? await axiosInstance.patch(
              `/cleaning-log/${draft._id}/complete`,
              payload
            )
          : await axiosInstance.post('/cleaning-log', {
              ...newLogPayload,
              companyId
            });

      toast({
        title: log
          ? 'Cleaning log updated successfully'
          : isAdmin
            ? draft
              ? 'Cleaning log completed successfully'
              : 'Cleaning log created successfully'
            : 'Cleaning log submitted successfully',
        className: 'bg-theme border-none text-white'
      });
      if (draft) onSessionChange?.(draft._id, null);
      onSubmitted(response.data?.data);
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to save the cleaning log'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-black sm:text-base">{title}</h3>
      {children}
    </section>
  );

  const renderTypeCard = (value: CleaningType) => {
    const Icon = value === 'daily' ? CalendarDays : CalendarRange;
    const active = type === value;
    return (
      <button
        key={value}
        type="button"
        // Only shown on the company side, which is never held up by an
        // employee's running timer
        disabled={busy}
        onClick={() => {
          if (type !== value) {
            setType(value);
            resetArea();
          }
          setError('');
        }}
        className={cn(
          'flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed',
          active
            ? 'border-theme bg-theme/5 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60'
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            active ? 'bg-theme text-white' : 'bg-gray-100 text-black'
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-black">
            {CLEANING_TYPE_LABEL[value]} Cleaning
          </span>
          <span className="block text-xs text-black">
            {value === 'daily'
              ? 'Routine checks done every day'
              : 'Deep cleaning done once a month'}
          </span>
        </span>
        {active && <Check className="ml-auto h-5 w-5 text-theme" />}
      </button>
    );
  };

  const renderAreaCard = (
    area: Pick<
      CleaningArea,
      'areaName' | 'roomNumber' | 'totalElement' | 'completion' | 'inProgress'
    > & {
      _id?: string;
    },
    active: boolean,
    onClick?: () => void
  ) => {
    // Done for this day / month: shown, but it cannot be picked again
    const completed = Boolean(area.completion);
    // Someone else's session holds the area until they complete or discard it
    const open = area.inProgress;
    const mine =
      Boolean(open) &&
      Boolean(actorId) &&
      String(open?.employeeId?._id) === String(actorId);
    const held = Boolean(open) && !mine;
    // The employee's own paused log stands out as work still to finish
    const minePaused = mine && open?.status === 'paused';
    // The company side can open someone else's session to finish it
    const finishable = held && canTakeOver;
    const locked = completed || (held && !finishable);
    return (
      <button
        key={area._id}
        type="button"
        onClick={locked ? undefined : onClick}
        disabled={!onClick || locked}
        title={
          completed
            ? `Completed by ${personName(area.completion?.employeeId)} · ${formatDateTime(area.completion?.completedAt)}`
            : held
              ? `${LOG_STATUS_LABEL[open!.status]} · ${personName(open?.employeeId)}`
              : undefined
        }
        className={cn(
          'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-default',
          completed
            ? 'cursor-not-allowed border-emerald-200 bg-emerald-50/60 opacity-80'
            : held
              ? finishable
                ? 'border-amber-300 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-50'
                : 'cursor-not-allowed border-amber-200 bg-amber-50/60'
              : active
                ? 'border-theme bg-theme/5 shadow-sm'
                : minePaused
                  ? 'border-orange-400 bg-orange-50 ring-4 ring-orange-100 hover:border-orange-500'
                  : mine
                    ? 'border-theme/40 bg-theme/5 hover:border-theme'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            completed
              ? 'bg-emerald-100 text-emerald-700'
              : held
                ? 'bg-amber-100 text-amber-700'
                : minePaused && !active
                  ? 'bg-orange-500 text-white'
                  : active || mine
                    ? 'bg-theme text-white'
                    : 'bg-gray-100 text-black'
          )}
        >
          {locked ? (
            <Lock className="h-5 w-5" />
          ) : mine || finishable ? (
            <Timer className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold text-black">
            {area.areaName}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-black">
            {area.roomNumber && (
              <span className="inline-flex items-center gap-1">
                <DoorOpen className="h-3 w-3" /> Room {area.roomNumber}
              </span>
            )}
            <span>
              {area.totalElement || 0}{' '}
              {area.totalElement === 1 ? 'element' : 'elements'}
            </span>
          </span>
          {completed && (
            <span className="mt-1 block text-xs text-black">
              By {personName(area.completion?.employeeId)}
            </span>
          )}
          {open && (
            <span className="mt-1 block text-xs text-black">
              {minePaused
                ? 'Paused, not submitted · tap to finish'
                : mine
                  ? 'Your session · tap to continue'
                  : finishable
                    ? `By ${personName(open.employeeId)} · tap to finish`
                    : `By ${personName(open.employeeId)}`}
            </span>
          )}
        </span>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        ) : open ? (
          <StatusBadge status={open.status} />
        ) : (
          active && <Check className="h-5 w-5 shrink-0 text-theme" />
        )}
      </button>
    );
  };

  const renderAreaPicker = () => {
    if (!type) {
      return (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-black">
          Choose daily or monthly to see its areas.
        </div>
      );
    }

    // Picked: only the chosen area stays on screen
    if (areaPicked) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 sm:max-w-md">
            {renderAreaCard(
              {
                areaName: selectedAreaName,
                roomNumber: selectedRoom,
                totalElement: selectedTotal
              },
              true
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              // An employee pauses their running session before moving on
              disabled={busy || (!isAdmin && draftStatus === 'in_progress')}
              onClick={() => {
                setPickingArea(true);
                setAreasVersion((version) => version + 1);
              }}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" /> Change area
            </Button>
            {!isAdmin && draftStatus === 'in_progress' && (
              <span className="text-center text-[11px] text-black sm:text-left">
                Pause to switch area
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
          <Input
            value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            placeholder="Search area or room..."
            className="pl-9"
          />
        </div>

        {loadingAreas ? (
          <div className="flex justify-center py-10">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-black">
            {areas.length === 0
              ? `No ${CLEANING_TYPE_LABEL[type].toLowerCase()} area has been set up yet.`
              : 'No area matches this search.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAreas.map((area) => {
              const card = renderAreaCard(area, area._id === areaId, () =>
                selectArea(area)
              );
              // The company side can free an area held by a session that was
              // left running or forgotten
              if (!isAdmin || !area.inProgress) return card;
              return (
                <div key={area._id} className="flex flex-col gap-1.5">
                  {card}
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => setClearTarget(area)}
                    className="border border-red-200 bg-white text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear session
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderElements = () =>
    loadingRows ? (
      <div className="flex justify-center py-10">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    ) : rows.length === 0 ? (
      <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-black">
        This area has no elements yet.
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-black">
            <span className="font-semibold">{checkedIds.size}</span> of{' '}
            {rows.length} checked
            <span className="ml-1 text-xs text-black">
              (tick the elements you have cleaned)
            </span>
            {autoSavesTicks && tickSave !== 'idle' && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center gap-1 text-xs font-medium',
                  tickSave === 'error' ? 'text-red-600' : 'text-emerald-700'
                )}
              >
                {tickSave === 'saving' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </>
                ) : tickSave === 'saved' ? (
                  <>
                    <Check className="h-3 w-3" /> Saved
                  </>
                ) : (
                  'Not saved'
                )}
              </span>
            )}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            {allChecked ? 'Uncheck all' : 'Check all'}
          </Button>
        </div>

        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {rows.map((row) => {
            const checked = checkedIds.has(row.elementId);
            return (
              <li
                key={row.elementId}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors',
                  checked
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleRow(row.elementId)}
                  />
                  <span className="break-words text-sm font-semibold text-black">
                    {row.element}
                  </span>
                </label>

                {row.performanceParameter && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Performance parameter for ${row.element}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black transition-colors hover:bg-theme/10 hover:text-theme"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="end"
                      className="w-72 max-w-[calc(100vw-2rem)] bg-white p-3 text-black"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-black">
                        Performance Parameter
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-black">
                        {row.performanceParameter}
                      </p>
                    </PopoverContent>
                  </Popover>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );

  const updateTime = (field: TimeField, value: string) => {
    const next = { ...times, [field]: value };
    setTimes(next);
    // Once an error shows, it clears as soon as the value turns valid
    if (timeErrors.startTime || timeErrors.endTime) {
      const errors = validateTimes(next, false);
      setTimeErrors((current) => ({
        startTime: current.startTime && errors.startTime,
        endTime: current.endTime && errors.endTime
      }));
    }
  };

  const blurTime = (field: TimeField) => {
    const next = { ...times, [field]: formatTime(times[field]) };
    setTimes(next);
    // An employee's open log keeps the typed times too
    if (next[field] !== (draft?.[field] || '')) queueTickSave(checkedIds, next);
    const errors = validateTimes(next, false);
    // The end time is only flagged once it has been filled in
    setTimeErrors((current) => ({
      ...current,
      [field]: errors[field],
      endTime:
        field === 'endTime' || next.endTime ? errors.endTime : current.endTime
    }));
  };

  const renderTimeInput = (
    field: TimeField,
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">{label}</p>
      <Input
        value={times[field]}
        placeholder={placeholder}
        maxLength={5}
        inputMode="numeric"
        disabled={busy}
        className={cn('font-mono', timeErrors[field] && 'border-red-500')}
        onChange={(e) => {
          let val = e.target.value.replace(/[^0-9:]/g, '').slice(0, 5);
          if (
            val.length === 2 &&
            times[field].length === 1 &&
            !val.includes(':')
          )
            val += ':';
          updateTime(field, val);
        }}
        onBlur={() => blurTime(field)}
      />
      {timeErrors[field] && (
        <p className="text-xs font-medium text-red-500">{timeErrors[field]}</p>
      )}
    </div>
  );

  const renderSignature = () => (
    <div className="space-y-4">
      {/* {isAdmin && draft && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-black sm:text-sm">
          <StatusBadge
            status={(draft.status || 'in_progress') as CleaningLogStatus}
          />
          <span>
            Finishing{' '}
            <span className="font-semibold">
              {personName(draft.employeeId)}
            </span>
            &apos;s session, started at{' '}
            <span className="font-semibold">{draft.startTime || '-'}</span>.
            Enter the end time, sign and complete.
          </span>
        </p>
      )} */}
      {/* Required, and only on the company side */}
      {isAdmin && (
        <div className="max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {renderTimeInput('startTime', 'Start Time (HH:MM)*', '09:00')}
            {renderTimeInput('endTime', 'End Time (HH:MM)*', '10:00')}
          </div>
        </div>
      )}

      <div className="max-w-xl space-y-2">
        <p className="text-sm font-semibold text-black">Note</p>
        <Textarea
          value={note}
          placeholder="Add a note (optional)..."
          disabled={busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="max-w-xl space-y-2">
        <p className="text-sm font-semibold text-black">Signature*</p>
        <SignaturePad
          ref={signatureRef}
          entityId={user?._id || companyId}
          signatureUrl={log?.signatureUrl || ''}
          signedAt={log?.signedAt || null}
          disabled={busy}
          error={signatureError}
          onDraw={() => setSignatureError('')}
        />
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="space-y-6 px-4 py-5 sm:px-6">
        {mode === 'admin' && (
          <>
            {renderSection(
              'Employee*',
              <div className="max-w-lg space-y-2">
                <Select
                  options={employeeOptions}
                  value={
                    employeeOptions.find((opt) => opt.value === employeeId) ||
                    null
                  }
                  onChange={(option: any) => {
                    // The picked area, ticks, times and note all stay: the
                    // company side runs no session, so nothing here belongs
                    // to the previous employee
                    setEmployeeId(option?.value || '');
                    setError('');
                  }}
                  // A session being finished stays with the employee who
                  // started it
                  isDisabled={busy || Boolean(draft)}
                  placeholder="Search and select an employee..."
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  noOptionsMessage={() =>
                    'No employee is assigned to the cleaning module yet'
                  }
                />
                <p className="text-xs text-black">
                  Only employees added to the cleaning module are listed.
                </p>
              </div>
            )}

            {renderSection(
              'Cleaning Type*',
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderTypeCard('daily')}
                {renderTypeCard('monthly')}
              </div>
            )}
          </>
        )}

        {renderSection('Area*', renderAreaPicker())}

        {/* No heading: the slim bar explains itself and saves the space */}
        {areaPicked &&
          !isAdmin &&
          (loadingDraft ? (
            <div className="flex justify-center py-4">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <CleaningSession
              draft={draft}
              busy={busyAction}
              onAction={runSession}
            />
          ))}

        {showChecklist && renderSection('Check Elements', renderElements())}

        {showSign &&
          rows.length > 0 &&
          renderSection('Sign & Complete', renderSignature())}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
            {error}
          </p>
        )}
      </div>

      {showSign && rows.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            className="h-11 bg-theme text-white hover:bg-theme/90 sm:h-10"
            disabled={busy}
            onClick={handleComplete}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />{' '}
                {isAdmin ? 'Complete' : 'Submit'}
              </>
            )}
          </Button>
        </div>
      )}

      <AlertDialog
        open={clearTarget !== null}
        onOpenChange={(open) => !open && !clearing && setClearTarget(null)}
      >
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this session?</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              <span className="font-semibold">
                {personName(clearTarget?.inProgress?.employeeId)}
              </span>
              &apos;s{' '}
              {clearTarget?.inProgress
                ? LOG_STATUS_LABEL[clearTarget.inProgress.status].toLowerCase()
                : ''}{' '}
              session on{' '}
              <span className="font-semibold">{clearTarget?.areaName}</span>{' '}
              will be deleted, with its time and ticks. The area will be free
              for anyone to start again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={clearing}
              onClick={(e) => {
                e.preventDefault();
                clearSession();
              }}
            >
              {clearing ? 'Clearing...' : 'Clear session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) =>
          !open && busyAction === null && setConfirmAction(null)
        }
      >
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'stop'
                ? 'Stop this area?'
                : 'Discard this session?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              {confirmAction === 'stop' ? (
                <>
                  The timer for{' '}
                  <span className="font-semibold">{selectedAreaName}</span> will
                  end and{' '}
                  <span className="font-semibold">cannot be resumed</span>. You
                  will then sign and submit it. To take a break instead, use
                  Pause.
                </>
              ) : (
                <>
                  The time and ticks recorded for{' '}
                  <span className="font-semibold">{selectedAreaName}</span> will
                  be thrown away and the area will be free for anyone to start.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyAction !== null}>
              Keep working
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={busyAction !== null}
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction) runSession(confirmAction);
              }}
            >
              {confirmAction === 'stop'
                ? busyAction === 'stop'
                  ? 'Stopping...'
                  : 'Yes, stop'
                : busyAction === 'discard'
                  ? 'Discarding...'
                  : 'Discard'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
