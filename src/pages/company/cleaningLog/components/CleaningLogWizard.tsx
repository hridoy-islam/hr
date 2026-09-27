import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCheck,
  DoorOpen,
  Loader2,
  MapPin,
  Search,
  Send
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
  personName,
  SelectOption,
  selectStyles
} from '../shared';
import { SignaturePad } from './SignaturePad';

type StepKey =
  | 'details'
  | 'employee'
  | 'type'
  | 'area'
  | 'elements'
  | 'signature';

const STEP_LABEL: Record<StepKey, string> = {
  details: 'Employee, Type & Area',
  employee: 'Select Employee',
  type: 'Cleaning Type',
  area: 'Select Area',
  elements: 'Check Elements',
  signature: 'Sign & Submit'
};

interface ChecklistRow {
  elementId: string;
  element: string;
  performanceParameter: string;
}

interface CleaningLogWizardProps {
  companyId: string;
  // An admin logs on behalf of an employee and picks the type in the wizard;
  // an employee arrives with the type already chosen
  mode: 'admin' | 'employee';
  type?: CleaningType;
  log?: CleaningLogRecord | null;
  onSubmitted: (log: CleaningLogRecord) => void;
  onCancel?: () => void;
}

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
  const isEdit = Boolean(log);

  const steps: StepKey[] =
    mode === 'admin'
      ? ['details', 'elements', 'signature']
      : ['area', 'elements', 'signature'];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const [employeeId, setEmployeeId] = useState(log?.employeeId?._id || '');
  const [type, setType] = useState<CleaningType | ''>(
    log?.type || fixedType || ''
  );
  const [areaId, setAreaId] = useState(log?.areaId || '');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(
      (log?.items || [])
        .filter((item) => item.checked && item.elementId)
        .map((item) => String(item.elementId))
    )
  );
  const [signatureUrl, setSignatureUrl] = useState(log?.signatureUrl || '');
  const [signedAt, setSignedAt] = useState<string | null>(
    log?.signedAt || null
  );

  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [areaSearch, setAreaSearch] = useState('');
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The type buttons outside the wizard can change it for an employee
  useEffect(() => {
    if (fixedType && fixedType !== type) {
      setType(fixedType);
      setAreaId('');
      setCheckedIds(new Set());
      setStepIndex(0);
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
        params: { companyId, type, limit: 'all', sort: 'areaName' }
      })
      .then((res) => setAreas(res.data?.data?.result || []))
      .catch(() => setAreas([]))
      .finally(() => setLoadingAreas(false));
  }, [companyId, type]);

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

  const selectedEmployee = employees.find((emp) => emp._id === employeeId);
  const selectedArea = areas.find((area) => area._id === areaId);
  const selectedAreaName = selectedArea?.areaName || log?.areaName || '';
  const selectedRoom = selectedArea ? selectedArea.roomNumber : log?.roomNumber;

  const filteredAreas = useMemo(() => {
    const needle = areaSearch.trim().toLowerCase();
    if (!needle) return areas;
    return areas.filter(
      (area) =>
        area.areaName.toLowerCase().includes(needle) ||
        (area.roomNumber || '').toLowerCase().includes(needle)
    );
  }, [areas, areaSearch]);

  const toggleRow = (elementId: string) =>
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(elementId)) next.delete(elementId);
      else next.add(elementId);
      return next;
    });

  const allChecked = rows.length > 0 && rows.every((row) => checkedIds.has(row.elementId));

  const toggleAll = () =>
    setCheckedIds(allChecked ? new Set() : new Set(rows.map((row) => row.elementId)));

  const validateStep = (key: StepKey): string => {
    // The admin's first step holds the employee, the type and the area
    if (key === 'details')
      return (
        validateStep('employee') || validateStep('type') || validateStep('area')
      );
    if (key === 'employee' && !employeeId) return 'Please select an employee';
    if (key === 'type' && !type) return 'Please choose daily or monthly';
    if (key === 'area' && !areaId) return 'Please select an area';
    if (key === 'elements' && rows.length === 0)
      return 'This area has no elements yet. Ask an admin to add them first.';
    if (key === 'signature' && !signatureUrl)
      return 'Please sign and save your signature';
    return '';
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const goBack = () => {
    setError('');
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    for (const key of steps) {
      const message = validateStep(key);
      if (message) {
        setError(message);
        setStepIndex(steps.indexOf(key));
        return;
      }
    }

    const payload = {
      companyId,
      ...(mode === 'admin' ? { employeeId } : {}),
      areaId,
      items: rows.map((row) => ({
        elementId: row.elementId,
        checked: checkedIds.has(row.elementId)
      })),
      signatureUrl,
      signedAt
    };

    try {
      setIsSubmitting(true);
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

  const renderStepper = () => (
    <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
      {/* Phones get a compact progress bar, wider screens the full stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-semibold text-black">
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
          <span className="text-theme">{STEP_LABEL[step]}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-theme transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((key, index) => {
          const isDone = index < stepIndex;
          const isCurrent = index === stepIndex;
          return (
            <li
              key={key}
              className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}
            >
              <button
                type="button"
                disabled={index > stepIndex}
                onClick={() => {
                  setError('');
                  setStepIndex(index);
                }}
                className="flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isDone && 'bg-theme text-white',
                    isCurrent && 'bg-theme text-white ring-4 ring-theme/20',
                    !isDone && !isCurrent && 'bg-gray-100 text-black'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap text-xs font-semibold lg:text-sm',
                    isCurrent || isDone ? 'text-black' : 'text-black'
                  )}
                >
                  {STEP_LABEL[key]}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-0.5 flex-1 rounded-full',
                    isDone ? 'bg-theme' : 'bg-gray-200'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
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
            setAreaId('');
            setCheckedIds(new Set());
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

  const renderStepBody = (key: StepKey = step): React.ReactNode => {
    switch (key) {
      case 'details':
        return (
          <div className="space-y-6">
            {renderStepBody('employee')}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-black">Cleaning Type*</p>
              {renderStepBody('type')}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-black">Area*</p>
              {type ? (
                renderStepBody('area')
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-black">
                  Choose daily or monthly to see its areas.
                </div>
              )}
            </div>
          </div>
        );

      case 'employee':
        return (
          <div className="max-w-lg space-y-2">
            <p className="text-sm font-semibold text-black">Employee*</p>
            <Select
              options={employeeOptions}
              value={employeeOptions.find((opt) => opt.value === employeeId) || null}
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
        );

      case 'type':
        return (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderTypeCard('daily')}
            {renderTypeCard('monthly')}
          </div>
        );

      case 'area':
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
                  ? `No ${type ? CLEANING_TYPE_LABEL[type].toLowerCase() : ''} area has been set up yet.`
                  : 'No area matches this search.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAreas.map((area) => {
                  const active = area._id === areaId;
                  return (
                    <button
                      key={area._id}
                      type="button"
                      onClick={() => {
                        if (area._id !== areaId) {
                          setAreaId(area._id);
                          setCheckedIds(new Set());
                        }
                        setError('');
                      }}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                        active
                          ? 'border-theme bg-theme/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          active ? 'bg-theme text-white' : 'bg-gray-100 text-black'
                        )}
                      >
                        <MapPin className="h-5 w-5" />
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
                      </span>
                      {active && <Check className="h-5 w-5 shrink-0 text-theme" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'elements':
        return loadingRows ? (
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

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="hidden grid-cols-[48px_minmax(0,2fr)_minmax(0,3fr)] bg-gray-50 text-xs font-bold uppercase tracking-wider text-black md:grid">
                <span className="px-3 py-2.5" />
                <span className="px-3 py-2.5">Element</span>
                <span className="px-3 py-2.5">Performance Parameter</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const checked = checkedIds.has(row.elementId);
                  return (
                    <li key={row.elementId}>
                      <label
                        className={cn(
                          'grid cursor-pointer grid-cols-[40px_minmax(0,1fr)] gap-y-1 px-1 py-3 transition-colors md:grid-cols-[48px_minmax(0,2fr)_minmax(0,3fr)] md:px-0',
                          checked ? 'bg-emerald-50/60' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="flex justify-center pt-0.5">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleRow(row.elementId)}
                          />
                        </span>
                        <span className="px-2 text-sm font-semibold text-black md:px-3">
                          {row.element}
                        </span>
                        <span className="col-start-2 whitespace-pre-wrap px-2 text-xs leading-relaxed text-black md:col-start-3 md:px-3 md:text-sm">
                          {row.performanceParameter}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-black">
                Summary
              </p>
              <dl className="space-y-2 text-sm">
                {mode === 'admin' && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-black">Employee</dt>
                    <dd className="text-right font-medium text-black">
                      {selectedEmployee
                        ? personName(selectedEmployee)
                        : personName(log?.employeeId)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-black">Type</dt>
                  <dd className="font-medium text-black">
                    {type ? CLEANING_TYPE_LABEL[type] : '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-black">Area</dt>
                  <dd className="text-right font-medium text-black">
                    {selectedAreaName || '-'}
                  </dd>
                </div>
                {selectedRoom && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-black">Room</dt>
                    <dd className="font-medium text-black">{selectedRoom}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-black">Checked</dt>
                  <dd className="font-medium text-black">
                    {checkedIds.size} / {rows.length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-black">Signature*</p>
              <SignaturePad
                entityId={user?._id || companyId}
                signatureUrl={signatureUrl}
                signedAt={signedAt}
                onChange={(url, at) => {
                  setSignatureUrl(url);
                  setSignedAt(at);
                  setError('');
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {renderStepper()}

      <div className="px-4 py-5 sm:px-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-black sm:text-lg">
            {STEP_LABEL[step]}
          </h3>
          {selectedAreaName && (step === 'elements' || step === 'signature') && (
            <p className="text-xs text-black sm:text-sm">
              {selectedAreaName}
              {selectedRoom ? ` · Room ${selectedRoom}` : ''}
              {type ? ` · ${CLEANING_TYPE_LABEL[type]}` : ''}
            </p>
          )}
        </div>

        {renderStepBody()}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-2">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={goBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          ) : (
            onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )
          )}
        </div>

        {isLastStep ? (
          <Button
            type="button"
            className="bg-theme text-white hover:bg-theme/90"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                {isEdit ? 'Update Log' : 'Submit Log'}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-theme text-white hover:bg-theme/90"
            onClick={goNext}
          >
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
