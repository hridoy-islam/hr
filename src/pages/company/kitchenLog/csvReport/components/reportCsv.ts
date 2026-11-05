import moment from '@/lib/moment-setup';
import { personName } from '@/pages/company/cleaningLog/shared';
import {
  DEEP_CLEAN_ITEMS,
  EQUIPMENT_TEMPERATURE_FIELDS,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_DEEP_CLEAN_SCHEDULE,
  KITCHEN_MODULES,
  KitchenModule
} from '../../constants';
import { KitchenLogRecord, logTarget } from '../../shared';

export interface KitchenCsvTable {
  headers: string[];
  rows: string[][];
}

type CsvValue = string | number | undefined;
type CsvColumn = [header: string, value: (log: KitchenLogRecord) => CsvValue];

const yesNo = (value?: boolean) =>
  value === undefined ? '' : value ? 'Yes' : 'No';

const dateTime = (date?: string) =>
  date ? moment(date).format('DD-MM-YYYY HH:mm') : '';

// 5100 -> 1h 25m, to the nearest minute
const hoursAndMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// The timer's total is used unless it would read as 0h 0m: older logs hold 0,
// and a timer paused straight after starting holds a few seconds. Those fall
// back to the start and end times, which then include any paused time.
export const durationLabel = (cell: {
  durationSeconds?: number;
  startTime?: string;
  endTime?: string;
}) => {
  const timer = cell.durationSeconds || 0;
  const span =
    cell.startTime && cell.endTime
      ? (minutesOf(cell.endTime) - minutesOf(cell.startTime)) * 60
      : 0;
  const seconds = timer >= 30 ? timer : Math.max(timer, span);
  return seconds > 0 ? hoursAndMinutes(seconds) : '';
};

const COMMON_COLUMNS: CsvColumn[] = [
  ['Date', (log) => moment(log.logDate).format('DD-MM-YYYY')],
  ['Day', (log) => moment(log.logDate).format('dddd')],
  ['Employee Name', (log) => personName(log.employeeId)],
  ['Employee Email', (log) => log.employeeId?.email],
  ['Start Time', (log) => log.startTime],
  ['End Time', (log) => log.endTime],
  [
    'Duration',
    (log) =>
      log.startTime && log.startTime === log.endTime
        ? '0h 0m'
        : durationLabel(log)
  ],
  ['Signed At', (log) => dateTime(log.signedAt)]
];

const APPROVAL_COLUMNS: CsvColumn[] = [
  ['Approved By', (log) => (log.approvedAt ? personName(log.approvedBy) : '')],
  ['Approved At', (log) => dateTime(log.approvedAt)],
  ['Approval Comment', (log) => log.approvalComment]
];

// Separate number columns, as a cell like 5/5 would open as a date in Excel.
// A log without a checklist stays blank rather than reading as 0.
const CHECKLIST_SUMMARY_COLUMNS: CsvColumn[] = [
  ['Total Checklist Items', (log) => log.checklist?.length || undefined],
  [
    'Completed Checklist Items',
    (log) =>
      log.checklist?.length
        ? log.checklist.filter((item) => item.checked).length
        : undefined
  ]
];

const kitchenCleaningColumns = (): CsvColumn[] => [
  ['Shift', logTarget],
  ...CHECKLIST_SUMMARY_COLUMNS,
  ...KITCHEN_CLEANING_READINGS.map(
    ({ key, label }): CsvColumn => [
      label,
      (log) => log.readings?.find((entry) => entry.key === key)?.value
    ]
  )
];

const equipmentTemperatureColumns = (): CsvColumn[] =>
  EQUIPMENT_TEMPERATURE_FIELDS.flatMap(({ key, label }): CsvColumn[] => {
    const reading = (log: KitchenLogRecord) =>
      log.temperatures?.find((entry) => entry.key === key);
    return [
      [`${label} Time`, (log) => reading(log)?.time],
      [`${label} Temp (°C)`, (log) => reading(log)?.temperature],
      [`${label} Out of Range`, (log) => yesNo(reading(log)?.outOfRange)],
      [
        `${label} Reported`,
        (log) => yesNo(reading(log)?.reportedToManagement)
      ]
    ];
  });

const itemColumns = (module: KitchenModule): CsvColumn[] => {
  const config = (log: KitchenLogRecord) =>
    DEEP_CLEAN_ITEMS[module]?.find((item) => item.key === log.itemKey);
  return [
    ['Item', (log) => log.item || config(log)?.item],
    ['Action', (log) => log.action || config(log)?.action],
    ['Frequency', (log) => log.itemFrequency || config(log)?.frequency]
  ];
};

const PROBE_COLUMNS: CsvColumn[] = [
  ['Probe Details', (log) => log.probeDetails],
  ['Iced Water (°C)', (log) => log.icedWaterReading],
  ['Iced Water In Range', (log) => yesNo(log.icedWaterInRange)],
  ['Boiling Water (°C)', (log) => log.boilingWaterReading],
  ['Boiling Water In Range', (log) => yesNo(log.boilingWaterInRange)]
];

const moduleColumns = (module: KitchenModule): CsvColumn[] => {
  if (module === 'kitchen_cleaning') return kitchenCleaningColumns();
  if (module === 'equipment_temperature') return equipmentTemperatureColumns();
  if (module === 'probe_calibration') return PROBE_COLUMNS;
  if (module === 'kitchen_deep_clean')
    return [
      [
        'Area',
        (log) =>
          log.area ||
          KITCHEN_DEEP_CLEAN_SCHEDULE[moment(log.logDate).isoWeekday()]
      ]
    ];
  return itemColumns(module);
};

// One row per log, earliest date first, then by start time
export const buildCsvTable = (
  module: KitchenModule,
  logs: KitchenLogRecord[]
): KitchenCsvTable => {
  const columns: CsvColumn[] = [
    ...COMMON_COLUMNS,
    ...moduleColumns(module),
    ...(KITCHEN_MODULES[module].requiresApproval ? APPROVAL_COLUMNS : []),
    ['Note', (log) => log.note]
  ];

  const sorted = [...logs].sort(
    (a, b) =>
      moment(a.logDate).format('YYYY-MM-DD').localeCompare(
        moment(b.logDate).format('YYYY-MM-DD')
      ) || (a.startTime || '').localeCompare(b.startTime || '')
  );

  return {
    headers: columns.map(([header]) => header),
    rows: sorted.map((log) =>
      columns.map(([, value]) => String(value(log) ?? ''))
    )
  };
};

// Free text such as notes must not run as a formula when opened in a
// spreadsheet. Negative readings like -18 or -18°C are left as they are.
const FORMULA_START = /^[=+@\t\r]|^-(?!$|\d+(\.\d+)?(°C)?$)/;

const DATE_VALUE = /^\d{2}-\d{2}-\d{4}( \d{2}:\d{2})?$/;

const toField = (value: string) => {
  // Excel turns a bare 01-06-2026 into its own date, shown as 1/6/2026, but
  // leaves 13-09-2026 alone when it can't read it as one. As ="..." it stays
  // the text it was given, so every date reads the same.
  if (DATE_VALUE.test(value)) return `"=""${value}"""`;
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const tableToCsv = ({ headers, rows }: KitchenCsvTable) =>
  [headers, ...rows].map((row) => row.map(toField).join(',')).join('\r\n');
