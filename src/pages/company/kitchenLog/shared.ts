import moment from '@/lib/moment-setup';
import { CleaningEmployee } from '@/pages/company/cleaningLog/shared';
import {
  EQUIPMENT_TEMPERATURE_FIELDS,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_MODULES,
  KITCHEN_SHIFTS,
  KitchenFrequency,
  KitchenModule,
  KitchenShift
} from './constants';

export type KitchenLogStatus = 'in_progress' | 'stopped' | 'completed';

export interface KitchenLogHistory {
  _id?: string;
  title: string;
  action: 'start' | 'stop' | 'complete' | 'create' | 'update' | 'approve';
  updatedBy?: CleaningEmployee;
  date: string;
}

// One shape for every module; each module only fills in its own fields
export interface KitchenLogRecord {
  _id: string;
  companyId: string;
  employeeId?: CleaningEmployee;
  module: KitchenModule;
  frequency: KitchenFrequency;
  status: KitchenLogStatus;
  logDate: string;
  periodKey: string;
  startTime?: string;
  endTime?: string;
  startedAt?: string;
  stoppedAt?: string;
  durationSeconds?: number;
  signatureUrl?: string;
  signedAt?: string;
  note?: string;
  completedAt?: string;
  createdBy?: CleaningEmployee;
  updatedBy?: CleaningEmployee;
  logs?: KitchenLogHistory[];
  createdAt: string;
  updatedAt: string;
  // Approval, on the deep clean modules
  approvedBy?: CleaningEmployee;
  approvalSignature?: string;
  approvedAt?: string;
  approvalComment?: string;
  // Kitchen Cleaning Logs
  shift?: KitchenShift;
  checklist?: { key: string; label: string; checked: boolean }[];
  readings?: { key: string; label: string; value: string }[];
  // Kitchen Deep Clean / Equipment Temperature Record
  area?: string;
  temperatures?: {
    key: string;
    label: string;
    range: string;
    time?: string;
    temperature?: number;
    outOfRange: boolean;
    reportedToManagement: boolean;
  }[];
  // Larder / Servery / Mini Kitchen Deep Clean
  itemKey?: string;
  item?: string;
  action?: string;
  itemFrequency?: string;
  // Probe Thermometer Calibration Log
  probeDetails?: string;
  icedWaterReading?: number;
  boilingWaterReading?: number;
  icedWaterInRange?: boolean;
  boilingWaterInRange?: boolean;
}

// What the board sends for each shift / item of the current period
export interface KitchenBoardEntry {
  _id: string;
  status: KitchenLogStatus;
  employeeId?: CleaningEmployee;
  startTime?: string;
  endTime?: string;
  completedAt?: string;
  approvedAt?: string;
}

export interface KitchenBoardTarget {
  key: string;
  label: string;
  description?: string;
  required: number;
  done: number;
  isDone: boolean;
  entries: KitchenBoardEntry[];
}

export interface KitchenBoardModule {
  module: KitchenModule;
  label: string;
  requiresApproval: boolean;
  timed: boolean;
  left: number;
  targets: KitchenBoardTarget[];
}

export interface KitchenBoard {
  frequency: KitchenFrequency;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  modules: KitchenBoardModule[];
}

export type ApprovalCounts = Record<KitchenFrequency | 'total', number>;

export const LOG_STATUS_LABEL: Record<KitchenLogStatus, string> = {
  in_progress: 'In Progress',
  stopped: 'Awaiting Completion',
  completed: 'Completed'
};

export const LOG_STATUS_BADGE: Record<KitchenLogStatus, string> = {
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  stopped: 'bg-sky-50 text-sky-700 ring-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

export const needsApproval = (log: KitchenLogRecord) =>
  KITCHEN_MODULES[log.module]?.requiresApproval &&
  log.status === 'completed' &&
  !log.approvedAt;

// What the log is for, e.g. "Morning (8-2)", "Fridge", "Deep Fat Fryer"
export const logTarget = (log: KitchenLogRecord) => {
  if (log.module === 'kitchen_cleaning' && log.shift) {
    const shift = KITCHEN_SHIFTS[log.shift];
    return shift ? `${shift.label} (${shift.hours})` : log.shift;
  }
  return log.item || log.area || '';
};

export const formatLogDate = (date?: string) =>
  date ? moment(date).format('ddd, DD MMM YYYY') : '-';

export const nowTime = () => moment().format('HH:mm');

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Tidies a typed time once the field is left, e.g. 9 -> 09:00, 930 -> 09:30
export const formatTime = (value: string) => {
  const clean = value.trim();
  if (!clean) return clean;
  const m = moment(clean, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H'], true);
  return m.isValid() ? m.format('HH:mm') : clean;
};

// Keeps digits and a colon, adding the colon after the hour is typed
export const typeTime = (previous: string, typed: string) => {
  let val = typed.replace(/[^0-9:]/g, '').slice(0, 5);
  if (val.length === 2 && previous.length === 1 && !val.includes(':'))
    val += ':';
  return val;
};

// ---- Values the forms are filled in with ----------------------------------

export interface TemperatureValue {
  time: string;
  temperature: string;
  reportedToManagement: boolean;
}

export interface KitchenFieldValues {
  checklist: Record<string, boolean>;
  readings: Record<string, string>;
  temperatures: Record<string, TemperatureValue>;
  probeDetails: string;
  icedWaterReading: string;
  boilingWaterReading: string;
  note: string;
}

export const emptyValues = (): KitchenFieldValues => ({
  checklist: {},
  readings: {},
  temperatures: Object.fromEntries(
    EQUIPMENT_TEMPERATURE_FIELDS.map((field) => [
      field.key,
      { time: '', temperature: '', reportedToManagement: false }
    ])
  ),
  probeDetails: '',
  icedWaterReading: '',
  boilingWaterReading: '',
  note: ''
});

const numberText = (value?: number) =>
  typeof value === 'number' ? String(value) : '';

export const valuesFromLog = (log?: KitchenLogRecord | null) => {
  const values = emptyValues();
  if (!log) return values;

  (log.checklist || []).forEach(
    (item) => (values.checklist[item.key] = item.checked)
  );
  (log.readings || []).forEach(
    (reading) => (values.readings[reading.key] = reading.value || '')
  );
  (log.temperatures || []).forEach(
    (reading) =>
      (values.temperatures[reading.key] = {
        time: reading.time || '',
        temperature: numberText(reading.temperature),
        reportedToManagement: Boolean(reading.reportedToManagement)
      })
  );
  values.probeDetails = log.probeDetails || '';
  values.icedWaterReading = numberText(log.icedWaterReading);
  values.boilingWaterReading = numberText(log.boilingWaterReading);
  values.note = log.note || '';
  return values;
};

// Only the module's own fields go to the API
export const payloadFromValues = (
  module: KitchenModule,
  values: KitchenFieldValues
) => {
  const payload: Record<string, unknown> = { note: values.note };

  if (module === 'kitchen_cleaning') {
    payload.checklist = Object.entries(values.checklist).map(
      ([key, checked]) => ({ key, checked })
    );
    payload.readings = KITCHEN_CLEANING_READINGS.map((reading) => ({
      key: reading.key,
      value: values.readings[reading.key] || ''
    }));
  }

  if (module === 'equipment_temperature') {
    payload.temperatures = EQUIPMENT_TEMPERATURE_FIELDS.map((field) => ({
      key: field.key,
      ...values.temperatures[field.key]
    }));
  }

  if (module === 'probe_calibration') {
    payload.probeDetails = values.probeDetails;
    payload.icedWaterReading = values.icedWaterReading;
    payload.boilingWaterReading = values.boilingWaterReading;
  }

  return payload;
};

// The same checks the API runs on completion, so the form can say so first
export const missingField = (
  module: KitchenModule,
  values: KitchenFieldValues,
  shift?: KitchenShift
) => {
  if (module === 'kitchen_cleaning' && shift) {
    const unticked = KITCHEN_SHIFTS[shift].checklist.find(
      (item) => !values.checklist[item.key]
    );
    if (unticked) return `Tick every check before finishing: ${unticked.label}`;
  }
  if (module === 'equipment_temperature') {
    for (const field of EQUIPMENT_TEMPERATURE_FIELDS) {
      const value = values.temperatures[field.key];
      if (!value?.time) return `${field.label} time is required`;
      if (!TIME_PATTERN.test(value.time))
        return `${field.label} time is invalid (HH:MM)`;
      if (value.temperature === '')
        return `${field.label} temperature is required`;
    }
  }
  if (module === 'probe_calibration') {
    if (values.icedWaterReading === '') return 'Iced water reading is required';
    if (values.boilingWaterReading === '')
      return 'Boiling water reading is required';
  }
  return '';
};
