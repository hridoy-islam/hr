import moment from '@/lib/moment-setup';
import { personName } from '@/pages/company/cleaningLog/shared';
import {
  DEEP_CLEAN_ITEMS,
  EQUIPMENT_TEMPERATURE_FIELDS,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_DEEP_CLEAN_SCHEDULE,
  KITCHEN_MODULES,
  KITCHEN_SHIFT_KEYS,
  KITCHEN_SHIFTS,
  KitchenModule
} from '../constants';
import { KitchenLogRecord, LOG_STATUS_LABEL, logTarget } from '../shared';

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

const COMMON_COLUMNS: CsvColumn[] = [
  ['Date', (log) => moment(log.logDate).format('DD-MM-YYYY')],
  ['Day', (log) => moment(log.logDate).format('dddd')],
  ['Employee', (log) => personName(log.employeeId)],
  ['Start Time', (log) => log.startTime],
  ['End Time', (log) => log.endTime],
  ['Status', (log) => LOG_STATUS_LABEL[log.status] || log.status],
  ['Signed At', (log) => dateTime(log.signedAt)]
];

const APPROVAL_COLUMNS: CsvColumn[] = [
  ['Approved By', (log) => (log.approvedAt ? personName(log.approvedBy) : '')],
  ['Approved At', (log) => dateTime(log.approvedAt)],
  ['Approval Comment', (log) => log.approvalComment]
];

// A check belongs to one shift, so it stays blank on the other shift's rows
const kitchenCleaningColumns = (): CsvColumn[] => [
  ['Shift', logTarget],
  ...KITCHEN_CLEANING_READINGS.map(
    ({ key, label }): CsvColumn => [
      label,
      (log) => log.readings?.find((entry) => entry.key === key)?.value
    ]
  ),
  ...KITCHEN_SHIFT_KEYS.flatMap((shift) =>
    KITCHEN_SHIFTS[shift].checklist.map(
      ({ key, label }): CsvColumn => [
        label,
        (log) =>
          log.shift === shift
            ? yesNo(
                Boolean(log.checklist?.find((item) => item.key === key)?.checked)
              )
            : ''
      ]
    )
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

const toField = (value: string) => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const tableToCsv = ({ headers, rows }: KitchenCsvTable) =>
  [headers, ...rows].map((row) => row.map(toField).join(',')).join('\r\n');
