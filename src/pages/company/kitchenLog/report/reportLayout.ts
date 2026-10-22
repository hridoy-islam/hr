import moment from '@/lib/moment-setup';
import { personName } from '@/pages/company/cleaningLog/shared';
import {
  EQUIPMENT_TEMPERATURE_FIELDS,
  KITCHEN_CLEANING_DISCLAIMER,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_CLEANING_START_CHECK,
  KITCHEN_MODULES,
  KITCHEN_SHIFT_KEYS,
  KITCHEN_SHIFTS,
  KitchenModule,
  PROBE_CALIBRATION_NOTE
} from '../constants';
import { KitchenLogRecord } from '../shared';

// One table cell: text, a signature image, or both. `flag` marks a reading
// outside its range; `label` is a bold lead-in such as "Notes:".
export interface ReportCell {
  text?: string;
  image?: string;
  flag?: boolean;
  label?: string;
  span?: number;
  strong?: boolean;
  large?: boolean;
  align?: 'left' | 'center' | 'right';
  tall?: boolean;
}

export interface ReportSection {
  title?: string;
  columns: { label: string; width: number }[];
  rows: ReportCell[][];
  // A ruled block like the paper sheet: no head row, kept on one page
  sheet?: boolean;
}

// The instruction page printed after the kitchen cleaning sheet
export interface ReportInstructions {
  title: string;
  heading: string;
  groups: { title: string; intro?: string; items: string[] }[];
  footer: string;
}

export interface KitchenReportLayout {
  title: string;
  sections: ReportSection[];
  notes: string[];
  logCount: number;
  orientation: 'portrait' | 'landscape';
  instructions?: ReportInstructions;
}

type LayoutBody = Omit<KitchenReportLayout, 'logCount' | 'orientation'> &
  Partial<Pick<KitchenReportLayout, 'orientation'>>;

// What the report was generated for, kept apart from the live filters so the
// PDF matches what is on screen
export interface KitchenReportMeta {
  companyName: string;
  module: KitchenModule;
  fromDate: Date;
  toDate: Date;
  employeeName: string;
}

const day = (date: string) => moment(date).format('ddd DD MMM YYYY');
const weekOf = (date: string) =>
  moment(date).startOf('isoWeek').format('DD MMM YYYY');

const text = (value?: string | number | null): ReportCell => ({
  text:
    value === undefined || value === null || value === '' ? '-' : String(value)
});

const signedBy = (
  url: string | undefined,
  who: string,
  extra?: string
): ReportCell => ({
  image: url,
  text: [who, extra].filter(Boolean).join(' · ')
});

const employeeSign = (log: KitchenLogRecord) =>
  signedBy(
    log.signatureUrl,
    personName(log.employeeId),
    log.startTime ? `${log.startTime} - ${log.endTime || '-'}` : ''
  );

const managementSign = (log: KitchenLogRecord): ReportCell =>
  log.approvedAt
    ? signedBy(
        log.approvalSignature,
        personName(log.approvedBy),
        log.approvalComment
      )
    : { text: 'Awaiting approval', flag: true };

const temperature = (value?: number, flagged?: boolean) => ({
  text: typeof value === 'number' ? `${value}°C` : '-',
  flag: flagged
});

// Every day from the first picked date to the last, as YYYY-MM-DD
const daysBetween = (from: Date, to: Date) => {
  const days: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor <= last) {
    days.push(
      [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, '0'),
        String(cursor.getDate()).padStart(2, '0')
      ].join('-')
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// One block per day, laid out like the paper sheet: name and sign, then the
// morning and afternoon readings side by side, then the notes
const kitchenCleaningLayout = (
  title: string,
  logs: KitchenLogRecord[],
  range?: { fromDate: Date; toDate: Date }
): LayoutBody => {
  const byDay = new Map<string, KitchenLogRecord[]>();
  logs.forEach((log) => {
    const key = moment(log.logDate).format('YYYY-MM-DD');
    byDay.set(key, [...(byDay.get(key) || []), log]);
  });
  const days = range
    ? daysBetween(range.fromDate, range.toDate)
    : Array.from(byDay.keys()).sort();

  const sections: ReportSection[] = days.map((key) => {
    const [morning, afternoon] = KITCHEN_SHIFT_KEYS.map((shift) =>
      byDay.get(key)?.find((log) => log.shift === shift)
    );
    const signedOff = (log?: KitchenLogRecord) =>
      log
        ? `${personName(log.employeeId)} (${log.startTime || '-'} - ${log.endTime || '-'})`
        : '';
    const sign = (log?: KitchenLogRecord): ReportCell => ({
      image: log?.signatureUrl
    });
    const reading = (log: KitchenLogRecord | undefined, readingKey: string) =>
      ({
        text:
          log?.readings?.find((entry) => entry.key === readingKey)?.value || '',
        align: 'center'
      }) as ReportCell;
    const notes = KITCHEN_SHIFT_KEYS.map((shift, index) => {
      const note = [morning, afternoon][index]?.note;
      return note ? `${KITCHEN_SHIFTS[shift].label}: ${note}` : '';
    })
      .filter(Boolean)
      .join('   ');

    return {
      sheet: true,
      columns: [
        { label: '', width: 3 },
        { label: '', width: 3.2 },
        { label: '', width: 3.2 }
      ],
      rows: [
        [
          { text: 'Name', strong: true },
          { label: 'Opening checks: ', text: signedOff(morning) },
          { label: 'Closing checks: ', text: signedOff(afternoon) }
        ],
        [{ text: 'Sign', strong: true }, sign(morning), sign(afternoon)],
        [
          {
            text: moment(key).format('dddd'),
            strong: true,
            large: true,
            align: 'right'
          },
          ...KITCHEN_SHIFT_KEYS.map(
            (shift): ReportCell => ({
              text: `${KITCHEN_SHIFTS[shift].label} ${KITCHEN_SHIFTS[shift].hours}`,
              large: true,
              align: 'center'
            })
          )
        ],
        ...KITCHEN_CLEANING_READINGS.map((entry) => [
          { text: entry.label, strong: true },
          reading(morning, entry.key),
          reading(afternoon, entry.key)
        ]),
        [{ label: 'Notes: ', text: notes, span: 3, tall: true }]
      ],
      title: moment(key).format('DD MMMM YYYY')
    };
  });

  return {
    title,
    sections,
    notes: [],
    orientation: 'portrait',
    instructions: {
      title: 'Kitchen Daily cleaning',
      heading: KITCHEN_CLEANING_START_CHECK,
      groups: KITCHEN_SHIFT_KEYS.map((shift, index) => ({
        title: KITCHEN_SHIFTS[shift].checklistTitle,
        intro: index === 0 ? 'Ensure the following tasks are completed' : '',
        items: KITCHEN_SHIFTS[shift].checklist.map((item) => item.label)
      })),
      footer: KITCHEN_CLEANING_DISCLAIMER
    }
  };
};

// The logs laid out like the paper sheet of their module
export const buildReportLayout = (
  module: KitchenModule,
  logs: KitchenLogRecord[],
  range?: { fromDate: Date; toDate: Date }
): KitchenReportLayout => {
  const body = layoutBody(module, logs, range);
  return {
    ...body,
    orientation: body.orientation || 'landscape',
    logCount: logs.length
  };
};

const layoutBody = (
  module: KitchenModule,
  logs: KitchenLogRecord[],
  range?: { fromDate: Date; toDate: Date }
): LayoutBody => {
  const title = KITCHEN_MODULES[module].sheetTitle;

  if (module === 'kitchen_cleaning') {
    return kitchenCleaningLayout(title, logs, range);
  }

  if (module === 'kitchen_deep_clean') {
    return {
      title,
      notes: [],
      sections: [
        {
          columns: [
            { label: 'Date', width: 2 },
            { label: 'Area', width: 3 },
            { label: 'Kitchen Assistant Sign When Completed', width: 3 },
            { label: 'Area Checked By Management Sign / Comment', width: 3 }
          ],
          rows: logs.map((log) => [
            text(day(log.logDate)),
            text(log.area),
            employeeSign(log),
            managementSign(log)
          ])
        }
      ]
    };
  }

  if (module === 'equipment_temperature') {
    const reading = (log: KitchenLogRecord, key: string) =>
      log.temperatures?.find((entry) => entry.key === key);
    const fields = EQUIPMENT_TEMPERATURE_FIELDS.map((field) => field.key);
    const heading = (key: string) => {
      const field = EQUIPMENT_TEMPERATURE_FIELDS.find(
        (item) => item.key === key
      );
      return field ? `${field.label} (${field.range})` : key;
    };

    return {
      title,
      notes: EQUIPMENT_TEMPERATURE_FIELDS.map(
        (field) => `${field.label} (${field.range}): ${field.instruction}.`
      ),
      sections: [
        {
          columns: [
            { label: 'Day', width: 2 },
            ...fields.flatMap((key) => [
              { label: `${heading(key)} Time`, width: 1.3 },
              { label: `${heading(key)} Temp`, width: 1.5 }
            ]),
            { label: 'Sign', width: 2.5 }
          ],
          rows: logs.map((log) => [
            text(day(log.logDate)),
            ...fields.flatMap((key) => {
              const entry = reading(log, key);
              return [
                text(entry?.time),
                temperature(entry?.temperature, entry?.outOfRange)
              ];
            }),
            employeeSign(log)
          ])
        }
      ]
    };
  }

  if (module === 'probe_calibration') {
    return {
      title,
      notes: [`NOTE: ${PROBE_CALIBRATION_NOTE.join(' ')}`],
      sections: [
        {
          columns: [
            { label: 'Date', width: 2 },
            { label: 'Probe Thermometer Details', width: 2.5 },
            { label: 'Thermometer Reading Iced Water', width: 2 },
            { label: 'Thermometer Reading Boiling Water', width: 2 },
            { label: 'Signature', width: 3 }
          ],
          rows: logs.map((log) => [
            text(day(log.logDate)),
            text(log.probeDetails),
            temperature(log.icedWaterReading, log.icedWaterInRange === false),
            temperature(
              log.boilingWaterReading,
              log.boilingWaterInRange === false
            ),
            employeeSign(log)
          ])
        }
      ]
    };
  }

  // Larder, servery and mini kitchen deep clean
  return {
    title,
    notes: [],
    sections: [
      {
        columns: [
          { label: 'Week Commencing', width: 1.8 },
          { label: 'Date', width: 1.8 },
          { label: 'Item', width: 1.8 },
          { label: 'Action', width: 3 },
          { label: 'Frequency', width: 1.3 },
          { label: 'Sign', width: 2.6 },
          { label: 'Management Sign', width: 2.6 }
        ],
        rows: logs.map((log) => [
          text(weekOf(log.logDate)),
          text(day(log.logDate)),
          text(log.item),
          text(log.action),
          text(log.itemFrequency),
          employeeSign(log),
          managementSign(log)
        ])
      }
    ]
  };
};

// The picked dates are local midnights; formatted from their own parts so
// the UK default timezone cannot move them a day
const formatPickedDate = (date: Date) =>
  [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear()
  ].join('-');

export const rangeLabel = (meta: KitchenReportMeta) =>
  `${formatPickedDate(meta.fromDate)} to ${formatPickedDate(meta.toDate)}`;
