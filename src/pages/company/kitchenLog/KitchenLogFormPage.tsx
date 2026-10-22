import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ArrowLeft, CalendarDays, ChefHat, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  apiError,
  CleaningEmployee,
  personName,
  SelectOption,
  selectStyles,
  toApiDate,
  today
} from '@/pages/company/cleaningLog/shared';
import {
  SignaturePad,
  SignaturePadHandle
} from '@/pages/company/cleaningLog/components/SignaturePad';
import {
  DEEP_CLEAN_ITEMS,
  KITCHEN_DEEP_CLEAN_SCHEDULE,
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULES,
  KITCHEN_SHIFT_KEYS,
  KITCHEN_SHIFTS,
  KitchenModule,
  KitchenShift,
  modulesOf
} from './constants';
import {
  emptyValues,
  KitchenFieldValues,
  KitchenLogRecord,
  logTarget,
  formatTime,
  missingField,
  TIME_PATTERN,
  typeTime,
  payloadFromValues,
  valuesFromLog
} from './shared';
import { KitchenLogFields } from './components/KitchenLogFields';
import { logPeriodLabel } from './components/KitchenLogTable';

const MODULE_OPTIONS = KITCHEN_FREQUENCIES.map(({ key, label }) => ({
  label,
  options: modulesOf(key).map((module) => ({
    value: module,
    label: KITCHEN_MODULES[module].label
  }))
}));

const pickerClass =
  'h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm text-black focus:border-theme focus:outline-none';

// ISO weekday of a picked local date, 1 = Monday
const isoWeekday = (date: Date) => date.getDay() || 7;

// Start and end time work like the cleaning log form: typed as HH:MM,
// completed on blur and checked field by field
type TimeField = 'startTime' | 'endTime';

const TIME_LABEL: Record<TimeField, string> = {
  startTime: 'Start time',
  endTime: 'End time'
};

// A 24-hour clock time, e.g. 09:00 or 17:30
// `strict` off lets an empty field pass while it is still being filled in
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
// The company side records a finished log for an employee in one go, or
// corrects one already completed
export default function KitchenLogFormPage() {
  const { id, lid } = useParams(); // companyId, logId (edit)
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(lid);

  const [existing, setExisting] = useState<KitchenLogRecord | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [module, setModule] = useState<KitchenModule | null>(null);
  const [logDate, setLogDate] = useState<Date | null>(today());
  const [targetKey, setTargetKey] = useState('');
  const [times, setTimes] = useState<Record<TimeField, string>>({
    startTime: '',
    endTime: ''
  });
  const [timeErrors, setTimeErrors] = useState<Record<TimeField, string>>({
    startTime: '',
    endTime: ''
  });
  const [values, setValues] = useState<KitchenFieldValues>(emptyValues());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const signatureRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    axiosInstance
      .get('/kitchen-access', { params: { companyId: id } })
      .then((res) => setEmployees(res.data?.data?.employeeId || []))
      .catch(() => setEmployees([]));
  }, [id]);

  useEffect(() => {
    if (!lid) return;
    axiosInstance
      .get(`/kitchen-log/${lid}`)
      .then((res) => {
        const log: KitchenLogRecord = res.data?.data;
        setExisting(log);
        setEmployeeId(log.employeeId?._id || '');
        setModule(log.module);
        setTargetKey(log.shift || log.itemKey || '');
        setTimes({
          startTime: log.startTime || '',
          endTime: log.endTime || ''
        });
        setValues(valuesFromLog(log));
      })
      .catch((err) =>
        toast({
          title: apiError(err, 'Failed to load the log'),
          className: 'bg-red-500 border-none text-white'
        })
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lid]);

  const config = module ? KITCHEN_MODULES[module] : null;
  const items = module ? DEEP_CLEAN_ITEMS[module] : undefined;
  const targetOptions: SelectOption[] =
    module === 'kitchen_cleaning'
      ? KITCHEN_SHIFT_KEYS.map((key) => ({
          value: key,
          label: `${KITCHEN_SHIFTS[key].label} (${KITCHEN_SHIFTS[key].hours})`
        }))
      : (items || []).map((item) => ({ value: item.key, label: item.item }));
  const selectedItem = items?.find((item) => item.key === targetKey);

  const employeeOptions: SelectOption[] = employees.map((emp) => ({
    value: emp._id,
    label: personName(emp)
  }));
  // A log keeps its employee even if they have since left the module
  if (
    existing?.employeeId &&
    !employees.some((emp) => emp._id === employeeId)
  ) {
    employeeOptions.push({
      value: existing.employeeId._id,
      label: personName(existing.employeeId)
    });
  }

  const validate = () => {
    if (!employeeId) return 'Please select an employee';
    if (!module) return 'Please select a log';
    if (!isEdit && !logDate) return 'Please select a date';
    if (targetOptions.length && !targetKey)
      return module === 'kitchen_cleaning'
        ? 'Please select a shift'
        : 'Please select an item';
    return missingField(
      module,
      values,
      module === 'kitchen_cleaning' ? (targetKey as KitchenShift) : undefined
    );
  };

  const submit = async () => {
    const message = validate();
    const nextTimeErrors = validateTimes(times);
    setTimeErrors(nextTimeErrors);
    if (message) {
      setError(message);
      return;
    }
    if (nextTimeErrors.startTime || nextTimeErrors.endTime) {
      setError('');
      return;
    }
    if (signatureRef.current?.isEmpty()) {
      setSignatureError('Employee signature is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const signature = await signatureRef.current!.save();
      const payload = {
        ...payloadFromValues(module!, values),
        employeeId,
        startTime: times.startTime,
        endTime: times.endTime,
        // Only a new drawing replaces the signature on an edit
        ...(!isEdit || signature.signatureUrl !== existing?.signatureUrl
          ? signature
          : {})
      };

      if (isEdit) {
        await axiosInstance.patch(`/kitchen-log/${lid}`, payload);
      } else {
        await axiosInstance.post('/kitchen-log', {
          ...payload,
          companyId: id,
          module,
          logDate: toApiDate(logDate!),
          ...(module === 'kitchen_cleaning' ? { shift: targetKey } : {}),
          ...(items ? { itemKey: targetKey } : {})
        });
      }

      toast({
        title: isEdit ? 'Kitchen log updated' : 'Kitchen log created',
        className: 'bg-theme border-none text-white'
      });
      navigate(`/company/${id}/kitchen-log`);
    } catch (err) {
      setError(apiError(err, 'Failed to save the log'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[97vh] justify-center rounded-md bg-white py-24">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

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
    text: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">{text}</p>
      <Input
        value={times[field]}
        placeholder={placeholder}
        maxLength={5}
        inputMode="numeric"
        disabled={saving}
        className={cn('font-mono', timeErrors[field] && 'border-red-500')}
        onChange={(e) =>
          updateTime(field, typeTime(times[field], e.target.value))
        }
        onBlur={() => blurTime(field)}
      />
      {timeErrors[field] && (
        <p className="text-xs font-medium text-red-500">{timeErrors[field]}</p>
      )}
    </div>
  );

  const label = (text: string) => (
    <p className="text-sm font-semibold text-black">{text}</p>
  );

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
          <ChefHat className="h-5 w-5 lg:h-6 lg:w-6" />
          {isEdit ? 'Edit Kitchen Log' : 'Create Kitchen Log'}
        </h2>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/company/${id}/kitchen-log`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
        <div className="space-y-1.5">
          {label('Employee*')}
          <Select
            options={employeeOptions}
            value={
              employeeOptions.find((opt) => opt.value === employeeId) || null
            }
            onChange={(option: any) => setEmployeeId(option?.value || '')}
            placeholder="Select employee"
            styles={selectStyles}
            menuPortalTarget={document.body}
          />
        </div>

        <div className="space-y-1.5">
          {label('Log*')}
          {isEdit ? (
            <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-black">
              {config?.label}
            </p>
          ) : (
            <Select
              options={MODULE_OPTIONS}
              value={
                module
                  ? { value: module, label: KITCHEN_MODULES[module].label }
                  : null
              }
              onChange={(option: any) => {
                setModule(option?.value || null);
                setTargetKey('');
                setValues(emptyValues());
                setError('');
              }}
              placeholder="Select log"
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          )}
        </div>

        <div className="space-y-1.5">
          {label('Date*')}
          {isEdit && existing ? (
            <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-black">
              {logPeriodLabel(existing)}
            </p>
          ) : (
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-theme" />
              <DatePicker
                selected={logDate}
                onChange={(date) => setLogDate(date)}
                maxDate={today()}
                dateFormat="dd-MM-yyyy"
                placeholderText="Select date"
                wrapperClassName="w-full"
                className={pickerClass}
              />
            </div>
          )}
        </div>

        {targetOptions.length > 0 && (
          <div className="space-y-1.5">
            {label(module === 'kitchen_cleaning' ? 'Shift*' : 'Item*')}
            {isEdit && existing ? (
              <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-black">
                {logTarget(existing)}
              </p>
            ) : (
              <Select
                options={targetOptions}
                value={
                  targetOptions.find((opt) => opt.value === targetKey) || null
                }
                onChange={(option: any) => setTargetKey(option?.value || '')}
                placeholder={
                  module === 'kitchen_cleaning' ? 'Select shift' : 'Select item'
                }
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            )}
          </div>
        )}

        {module === 'kitchen_deep_clean' && (
          <div className="space-y-1.5">
            {label('Area')}
            <p className="flex min-h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black">
              {existing?.area ||
                (logDate
                  ? KITCHEN_DEEP_CLEAN_SCHEDULE[isoWeekday(logDate)]
                  : '-')}
            </p>
          </div>
        )}
      </div>

      {selectedItem && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black">
          <span className="font-semibold">Action:</span> {selectedItem.action} ·{' '}
          {selectedItem.frequency}
        </p>
      )}

      {module && (
        <div className="space-y-4">
          {/* Required, and only on the company side */}
          <div className="max-w-md">
            <div className="grid grid-cols-2 gap-3">
              {renderTimeInput('startTime', 'Start Time (HH:MM)*', '09:00')}
              {renderTimeInput('endTime', 'End Time (HH:MM)*', '10:00')}
            </div>
          </div>

          <KitchenLogFields
            module={module}
            shift={
              (module === 'kitchen_cleaning' ? targetKey : undefined) as
                | KitchenShift
                | undefined
            }
            values={values}
            onChange={(next) => {
              setValues(next);
              setError('');
            }}
            disabled={saving}
          />

          <div className="w-full space-y-1.5 md:max-w-md">
            {label('Employee Signature*')}
            <SignaturePad
              ref={signatureRef}
              entityId={employeeId || id || ''}
              signatureUrl={existing?.signatureUrl || ''}
              signedAt={existing?.signedAt || null}
              disabled={saving}
              onDraw={() => setSignatureError('')}
              error={signatureError}
              height={200}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          className="w-full bg-theme text-white hover:bg-theme/90 sm:w-auto"
          disabled={saving || !module}
          onClick={submit}
        >
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          {isEdit ? 'Update Log' : 'Create Log'}
        </Button>
      </div>
    </div>
  );
}
