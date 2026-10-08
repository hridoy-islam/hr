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
  Search
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
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  apiError,
  CLEANING_TYPE_LABEL,
  CleaningArea,
  CleaningEmployee,
  CleaningLogRecord,
  CleaningType,
  formatDateTime,
  formatTime,
  personName,
  SelectOption,
  selectStyles,
  sortAreasByRoom,
  timeSchema
} from '../shared';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';

interface ChecklistRow {
  elementId: string;
  element: string;
  performanceParameter: string;
}

type TimeField = 'startTime' | 'endTime';

interface CleaningLogWizardProps {
  companyId: string;
  // An admin logs on behalf of an employee and picks the type in the form;
  // an employee arrives with the type already chosen
  mode: 'admin' | 'employee';
  type?: CleaningType;
  log?: CleaningLogRecord | null;
  onSubmitted: (log: CleaningLogRecord) => void;
  onCancel?: () => void;
}

const TIME_LABEL: Record<TimeField, string> = {
  startTime: 'Start time',
  endTime: 'End time'
};

const validateTime = (field: TimeField, value: string) => {
  if (!value.trim()) return `${TIME_LABEL[field]} is required`;
  const result = timeSchema.safeParse(value);
  return result.success ? '' : result.error.issues[0].message;
};

// Both fields together, so the end time can be checked against the start
const validateTimes = (
  times: Record<TimeField, string>
): Record<TimeField, string> => {
  const startTime = validateTime('startTime', times.startTime);
  let endTime = validateTime('endTime', times.endTime);
  // HH:MM strings sort the same way the times do
  if (!startTime && !endTime && times.endTime < times.startTime)
    endTime = 'End time cannot be earlier than start time';
  return { startTime, endTime };
};

export function CleaningLogWizard({
  companyId,
  mode,
  type: fixedType,
  log,
  onSubmitted,
  onCancel
}: CleaningLogWizardProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const signatureRef = useRef<SignaturePadHandle>(null);

  const [employeeId, setEmployeeId] = useState(log?.employeeId?._id || '');
  const [type, setType] = useState<CleaningType | ''>(
    log?.type || fixedType || ''
  );
  const [areaId, setAreaId] = useState(log?.areaId || '');
  // Once an area is picked the list folds away; "Change" brings it back
  const [pickingArea, setPickingArea] = useState(!log?.areaId);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(
      (log?.items || [])
        .filter((item) => item.checked && item.elementId)
        .map((item) => String(item.elementId))
    )
  );
  const [times, setTimes] = useState<Record<TimeField, string>>({
    startTime: log?.startTime || '',
    endTime: log?.endTime || ''
  });
  const [note, setNote] = useState(log?.note || '');
  const [timeErrors, setTimeErrors] = useState<Record<TimeField, string>>({
    startTime: '',
    endTime: ''
  });

  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [areaSearch, setAreaSearch] = useState('');
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetArea = () => {
    setAreaId('');
    setCheckedIds(new Set());
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
          // Marks areas already done this day / month; a log being edited
          // is judged against its own period and does not block itself
          withCompletion: true,
          ...(log
            ? { completionDate: log.createdAt, excludeLogId: log._id }
            : {})
        }
      })
      .then((res) => setAreas(sortAreasByRoom(res.data?.data?.result || [])))
      .catch(() => setAreas([]))
      .finally(() => setLoadingAreas(false));
  }, [companyId, type, log]);

  // A log being edited keeps the checklist it was signed against; a new
  // area always reads its current elements
  useEffect(() => {
    if (!areaId) {
      setRows([]);
      return;
    }

    if (log && String(log.areaId) === String(areaId)) {
      setRows(
        log.items.map((item, index) => ({
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
  }, [areaId, log]);

  const employeeOptions: SelectOption[] = employees.map((employee) => ({
    value: employee._id,
    label: personName(employee)
  }));

  const selectedArea = areas.find((area) => area._id === areaId);
  const selectedAreaName = selectedArea?.areaName || log?.areaName || '';
  const selectedRoom = selectedArea ? selectedArea.roomNumber : log?.roomNumber;
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

  const showChecklist = Boolean(areaId) && !pickingArea;

  const toggleRow = (elementId: string) =>
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(elementId)) next.delete(elementId);
      else next.add(elementId);
      return next;
    });

  const allChecked =
    rows.length > 0 && rows.every((row) => checkedIds.has(row.elementId));

  const toggleAll = () =>
    setCheckedIds(
      allChecked ? new Set() : new Set(rows.map((row) => row.elementId))
    );

  const updateTime = (field: TimeField, value: string) => {
    const next = { ...times, [field]: value };
    setTimes(next);
    // Once an error shows, it clears as soon as the value turns valid
    if (timeErrors.startTime || timeErrors.endTime) {
      const errors = validateTimes(next);
      setTimeErrors((current) => ({
        startTime: current.startTime && errors.startTime,
        endTime: current.endTime && errors.endTime
      }));
    }
  };

  const blurTime = (field: TimeField, value: string) => {
    const next = { ...times, [field]: formatTime(value) };
    setTimes(next);
    const errors = validateTimes(next);
    // The other field is only flagged once it has been filled in
    setTimeErrors((current) => ({
      ...current,
      [field]: errors[field],
      endTime:
        field === 'endTime' || next.endTime ? errors.endTime : current.endTime
    }));
  };

  const validate = (): string => {
    if (mode === 'admin' && !employeeId) return 'Please select an employee';
    if (!type) return 'Please choose daily or monthly';
    if (!areaId) return 'Please select an area';
    if (rows.length === 0)
      return 'This area has no elements yet. Ask an admin to add them first.';

    const nextTimeErrors = validateTimes(times);
    setTimeErrors(nextTimeErrors);
    if (nextTimeErrors.startTime || nextTimeErrors.endTime)
      return 'Please enter a valid start and end time';

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
        companyId,
        ...(mode === 'admin' ? { employeeId } : {}),
        areaId,
        items: rows.map((row) => ({
          elementId: row.elementId,
          checked: checkedIds.has(row.elementId)
        })),
        startTime: times.startTime,
        endTime: times.endTime,
        note: note.trim(),
        signatureUrl: signature.signatureUrl,
        signedAt: signature.signedAt
      };

      const response = log
        ? await axiosInstance.patch(`/cleaning-log/${log._id}`, payload)
        : await axiosInstance.post('/cleaning-log', payload);

      toast({
        title: log
          ? 'Cleaning log updated successfully'
          : 'Cleaning log submitted successfully',
        className: 'bg-theme border-none text-white'
      });
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
        onClick={() => {
          if (type !== value) {
            setType(value);
            resetArea();
          }
          setError('');
        }}
        className={cn(
          'flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
          active
            ? 'border-theme bg-theme/5 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
      'areaName' | 'roomNumber' | 'totalElement' | 'completion'
    > & {
      _id?: string;
    },
    active: boolean,
    onClick?: () => void
  ) => {
    // Done for this day / month: shown, but it cannot be picked again
    const completed = Boolean(area.completion);
    return (
      <button
        key={area._id}
        type="button"
        onClick={completed ? undefined : onClick}
        disabled={!onClick || completed}
        title={
          completed
            ? `Completed by ${personName(area.completion?.employeeId)} · ${formatDateTime(area.completion?.completedAt)}`
            : undefined
        }
        className={cn(
          'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-default',
          completed
            ? 'cursor-not-allowed border-emerald-200 bg-emerald-50/60 opacity-80'
            : active
              ? 'border-theme bg-theme/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            completed
              ? 'bg-emerald-100 text-emerald-700'
              : active
                ? 'bg-theme text-white'
                : 'bg-gray-100 text-black'
          )}
        >
          {completed ? (
            <Lock className="h-5 w-5" />
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
        </span>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
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
    if (showChecklist) {
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => setPickingArea(true)}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" /> Change area
          </Button>
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
            {filteredAreas.map((area) =>
              renderAreaCard(area, area._id === areaId, () => {
                if (area._id !== areaId) {
                  setAreaId(area._id);
                  setCheckedIds(new Set());
                }
                setPickingArea(false);
                setAreaSearch('');
                setError('');
              })
            )}
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

  const renderTimeInput = (
    field: TimeField,
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">{label}*</p>
      <Input
        value={times[field]}
        placeholder={placeholder}
        maxLength={5}
        disabled={isSubmitting}
        className={`mt-1 font-mono ${timeErrors[field] ? 'border-red-500' : ''}`}
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
        onBlur={(e) => blurTime(field, e.target.value)}
      />
      {timeErrors[field] && (
        <p className="text-xs font-medium text-red-500">{timeErrors[field]}</p>
      )}
    </div>
  );

  const renderSignature = () => (
    <div className="space-y-4">
      <div className="grid max-w-md grid-cols-2 gap-3">
        {renderTimeInput('startTime', 'Start Time (HH:MM)', '09:00')}
        {renderTimeInput('endTime', 'End Time (HH:MM)', '10:00')}
      </div>

      <div className="max-w-xl space-y-2">
        <p className="text-sm font-semibold text-black">Note</p>
        <Textarea
          value={note}
          placeholder="Add a note (optional)..."
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
                    setEmployeeId(option?.value || '');
                    setError('');
                  }}
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

        {showChecklist && renderSection('Check Elements', renderElements())}

        {showChecklist &&
          rows.length > 0 &&
          renderSection('Sign & Complete', renderSignature())}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-2">
          {/* {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )} */}
        </div>

        {showChecklist && rows.length > 0 && (
          <Button
            type="button"
            className="bg-theme text-white hover:bg-theme/90"
            disabled={isSubmitting}
            onClick={handleComplete}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
