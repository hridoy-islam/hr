import moment from '@/lib/moment-setup';
import { personName } from '@/pages/company/cleaningLog/shared';
import {
  DEEP_CLEAN_ITEMS,
  EQUIPMENT_TEMPERATURE_FIELDS,
  KITCHEN_CLEANING_DISCLAIMER,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_CLEANING_START_CHECK,
  KITCHEN_DEEP_CLEAN_SCHEDULE,
  KITCHEN_MODULES,
  KITCHEN_SHIFT_KEYS,
  KITCHEN_SHIFTS,
  KitchenModule,
  PROBE_CALIBRATION_NOTE
} from '../constants';
import { KitchenLogRecord } from '../shared';

// One table cell: text, a signature image, or both. `label` is a bold lead-in
// such as "Notes:".
export interface ReportCell {
  text?: string;
  image?: string;
  label?: string;
  span?: number;
  strong?: boolean;
  // A column heading, printed smaller than the rest of the sheet
  heading?: boolean;
  align?: 'left' | 'center' | 'right';
  tall?: boolean;
  // Shown on screen only; the PDF leaves the cell blank, like the paper sheet
  screenOnly?: boolean;
}

export interface ReportSection {
  title?: string;
  columns: { label: string; width: number }[];
  rows: ReportCell[][];
  // A ruled block like the paper sheet: no head row, kept on one page
  sheet?: boolean;
  // A sheet long enough that it may run onto the next page between rows
  breakable?: boolean;
  // Printed under the table, like the NOTE on the probe calibration sheet
  note?: string;
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
}

// Where the paper sheet only names the day, the report gives the date and day,
// e.g. 15-10-2026, Thursday
const dayAndDate = (date: string) => moment(date).format('DD-MM-YYYY, dddd');

const text = (value?: string | number | null): ReportCell => ({
  text:
    value === undefined || value === null || value === '' ? '-' : String(value)
});

const timeSpan = (log?: KitchenLogRecord) =>
  log?.startTime ? `${log.startTime} - ${log.endTime || '-'}` : '';

// The day and date, with the log's start and end time under them
const dateCell = (date: string, log?: KitchenLogRecord): ReportCell =>
  text([dayAndDate(date), timeSpan(log)].filter(Boolean).join('\n'));

// e.g. Sign at: 12:26
const signedAtText = (date?: string) =>
  date ? `Sign at: ${moment(date).format('HH:mm')}` : '';

// The signature, then who signed and when, centred in the cell
const signedBy = (
  url: string | undefined,
  who: string,
  at: string,
  extra?: string
): ReportCell => ({
  image: url,
  align: 'center',
  text: [who, at, extra].filter(Boolean).join('\n')
});

const employeeSign = (log: KitchenLogRecord) =>
  signedBy(
    log.signatureUrl,
    personName(log.employeeId),
    signedAtText(log.signedAt)
  );

const managementSign = (log: KitchenLogRecord): ReportCell =>
  log.approvedAt
    ? signedBy(
        log.approvalSignature,
        personName(log.approvedBy),
        signedAtText(log.approvedAt),
        log.approvalComment
      )
    : { text: 'Awaiting approval', align: 'center', screenOnly: true };

const temperature = (value?: number): ReportCell => ({
  text: typeof value === 'number' ? `${value}°C` : ''
});

const head = (label: string): ReportCell => ({
  text: label,
  strong: true,
  heading: true
});

const empty: ReportCell = { text: '' };

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

// The picked days split into Monday-to-Sunday weeks, one paper sheet each
const weeksBetween = (from: Date, to: Date) => {
  const weeks = new Map<string, string[]>();
  daysBetween(from, to).forEach((key) => {
    const monday = moment(key).startOf('isoWeek').format('YYYY-MM-DD');
    weeks.set(monday, [...(weeks.get(monday) || []), key]);
  });
  return Array.from(weeks.entries());
};

const dayKey = (log: KitchenLogRecord) =>
  moment(log.logDate).format('YYYY-MM-DD');

const logOn = (logs: KitchenLogRecord[], key: string) =>
  logs.find((log) => dayKey(log) === key);

const weekCommencing = (monday: string) =>
  `Week commencing ${moment(monday).format('DD-MM-YYYY, dddd')}`;

// The days the logs fall on when no range was given
const logRange = (logs: KitchenLogRecord[]) => {
  const keys = logs.map(dayKey).sort();
  const at = (key?: string) => (key ? moment(key).toDate() : new Date());
  return { fromDate: at(keys[0]), toDate: at(keys[keys.length - 1]) };
};

// Equipment Temperatures Record Larder: a week a sheet, each day a Time, Temp
// and Sign row under the fridge, freezer and room columns
const equipmentTemperatureLayout = (
  title: string,
  logs: KitchenLogRecord[],
  range: { fromDate: Date; toDate: Date }
): LayoutBody => {
  const fieldHead = (field: (typeof EQUIPMENT_TEMPERATURE_FIELDS)[number]) =>
    head(`${field.label} (${field.range})\n${field.instruction}`);
  const reading = (log: KitchenLogRecord | undefined, key: string) =>
    log?.temperatures?.find((entry) => entry.key === key);

  return {
    title,
    notes: [],
    orientation: 'portrait',
    sections: weeksBetween(range.fromDate, range.toDate).map(
      ([monday, days]) => ({
        title: weekCommencing(monday),
        sheet: true,
        breakable: true,
        columns: [
          { label: '', width: 1.6 },
          { label: '', width: 1 },
          ...EQUIPMENT_TEMPERATURE_FIELDS.map(() => ({ label: '', width: 2 }))
        ],
        rows: [
          [head('Day'), empty, ...EQUIPMENT_TEMPERATURE_FIELDS.map(fieldHead)],
          ...days.flatMap((key) => {
            const log = logOn(logs, key);
            return [
              [
                dateCell(key, log),
                text('Time'),
                ...EQUIPMENT_TEMPERATURE_FIELDS.map(
                  (field): ReportCell => ({
                    text: reading(log, field.key)?.time || ''
                  })
                )
              ],
              [
                empty,
                text('Temp'),
                ...EQUIPMENT_TEMPERATURE_FIELDS.map((field): ReportCell => {
                  const entry = reading(log, field.key);
                  const cell = temperature(entry?.temperature);
                  return entry?.outOfRange && entry.reportedToManagement
                    ? { ...cell, text: `${cell.text} (reported)` }
                    : cell;
                })
              ],
              [
                empty,
                text('Sign'),
                log
                  ? {
                      ...employeeSign(log),
                      span: EQUIPMENT_TEMPERATURE_FIELDS.length
                    }
                  : { ...empty, span: EQUIPMENT_TEMPERATURE_FIELDS.length }
              ]
            ];
          })
        ]
      })
    )
  };
};

// Kitchen Deep Cleaning Schedule: a week a sheet, a row a day with its area
const kitchenDeepCleanLayout = (
  title: string,
  logs: KitchenLogRecord[],
  range: { fromDate: Date; toDate: Date }
): LayoutBody => ({
  title,
  notes: [],
  orientation: 'landscape',
  sections: weeksBetween(range.fromDate, range.toDate).map(
    ([monday, days]) => ({
      title: weekCommencing(monday),
      sheet: true,
      breakable: true,
      columns: [
        { label: '', width: 2 },
        { label: '', width: 3 },
        { label: '', width: 3 },
        { label: '', width: 3 }
      ],
      rows: [
        [
          head('WEEK COMMENCING'),
          head('AREA'),
          head('KITCHEN ASSISTANT SIGN WHEN COMPLETED'),
          head('AREA CHECKED BY MANAGEMENT SIGN/COMMENT')
        ],
        ...days.map((key) => {
          const log = logOn(logs, key);
          return [
            { text: dateCell(key, log).text?.toUpperCase() },
            {
              text: (
                log?.area ||
                KITCHEN_DEEP_CLEAN_SCHEDULE[moment(key).isoWeekday()] ||
                ''
              ).toUpperCase()
            },
            log ? employeeSign(log) : empty,
            log ? managementSign(log) : empty
          ];
        })
      ]
    })
  )
});

// Larder, Servery and Mini Kitchen Deep Clean: every item on the sheet, a row
// for each time it was done that week (twice a week for the mini kitchen)
const itemDeepCleanLayout = (
  module: KitchenModule,
  title: string,
  logs: KitchenLogRecord[]
): LayoutBody => {
  const items = DEEP_CLEAN_ITEMS[module] || [];
  // The larder sheet has no week commencing column: its day, date and times
  // take the place of the item's frequency
  const larder = module === 'larder_deep_clean';

  const rows = items.flatMap((item) => {
    const done = logs
      .filter((log) => log.itemKey === item.key)
      .sort((a, b) => a.logDate.localeCompare(b.logDate));
    return (done.length ? done : [undefined]).map((log) => {
      const date = log ? dateCell(log.logDate, log) : empty;
      return [
        ...(larder ? [] : [date]),
        text(log?.item || item.item),
        text(log?.action || item.action),
        larder ? date : text(log?.itemFrequency || item.frequency),
        log ? employeeSign(log) : empty,
        log ? managementSign(log) : empty
      ];
    });
  });

  return {
    title,
    notes: [],
    orientation: 'portrait',
    sections: [
      {
        sheet: true,
        breakable: true,
        columns: [
          ...(larder ? [] : [{ label: '', width: 1.6 }]),
          { label: '', width: 1.7 },
          { label: '', width: 2.2 },
          { label: '', width: 1.3 },
          { label: '', width: 2.2 },
          { label: '', width: 2.2 }
        ],
        rows: [
          [
            ...(larder ? [] : [head('Week commencing')]),
            head(larder ? 'ITEM' : 'AREA'),
            head(larder ? 'ACTION' : ''),
            larder ? head('DATE') : empty,
            head('SIGN'),
            head('MANAGEMENT SIGN')
          ],
          ...rows
        ]
      }
    ]
  };
};

// Probe Thermometer Calibration Log: a block per probe, its readings running
// across under the Date, Iced Water, Boiling Water and Signature rows
const PROBE_COLUMNS = 6;

const probeCalibrationLayout = (
  title: string,
  logs: KitchenLogRecord[]
): LayoutBody => {
  const byProbe = new Map<string, KitchenLogRecord[]>();
  [...logs]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .forEach((log) => {
      const probe = (log.probeDetails || '').trim();
      byProbe.set(probe, [...(byProbe.get(probe) || []), log]);
    });

  const blocks: { probe: string; logs: KitchenLogRecord[] }[] = [];
  byProbe.forEach((probeLogs, probe) => {
    for (let i = 0; i < probeLogs.length; i += PROBE_COLUMNS)
      blocks.push({ probe, logs: probeLogs.slice(i, i + PROBE_COLUMNS) });
  });

  const row = (
    label: string,
    blockLogs: KitchenLogRecord[],
    cell: (log: KitchenLogRecord) => ReportCell
  ): ReportCell[] => [
    { text: label, strong: true },
    ...blockLogs.map((log) => ({ ...cell(log), align: 'center' as const }))
  ];

  return {
    title,
    notes: [],
    orientation: 'landscape',
    sections: blocks.map((block, index) => ({
      title: `Probe Thermometer Details: ${block.probe || '-'}`,
      sheet: true,
      columns: [
        { label: '', width: 3 },
        ...block.logs.map(() => ({ label: '', width: 2 }))
      ],
      rows: [
        row('Date', block.logs, (log) => dateCell(log.logDate, log)),
        row('Thermometer Reading Iced Water', block.logs, (log) =>
          temperature(log.icedWaterReading)
        ),
        row('Thermometer Reading Boiling Water', block.logs, (log) =>
          temperature(log.boilingWaterReading)
        ),
        row('Signature', block.logs, employeeSign)
      ],
      note:
        index === 0 ? `NOTE: ${PROBE_CALIBRATION_NOTE.join('\n')}` : undefined
    }))
  };
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
    const sign = (log?: KitchenLogRecord) => (log ? employeeSign(log) : empty);
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
            text: moment(key).format('DD-MM-YYYY, dddd'),
            strong: true,
            align: 'right'
          },
          ...KITCHEN_SHIFT_KEYS.map(
            (shift): ReportCell => ({
              text: `${KITCHEN_SHIFTS[shift].label} ${KITCHEN_SHIFTS[shift].hours}`,
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
      title: 'Kitchen Cleaning Logs',
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
    return kitchenDeepCleanLayout(title, logs, range || logRange(logs));
  }

  if (module === 'equipment_temperature') {
    return equipmentTemperatureLayout(title, logs, range || logRange(logs));
  }

  if (module === 'probe_calibration') {
    // The sheet is headed with the month it covers
    return probeCalibrationLayout(
      range
        ? `${title} - ${picked(range.fromDate).format('MMMM YYYY')}`
        : title,
      logs
    );
  }

  // Larder, servery and mini kitchen deep clean
  return itemDeepCleanLayout(module, title, logs);
};

// The picked dates are local midnights; read from their own parts so the UK
// default timezone cannot move them a day
const picked = (date: Date) =>
  moment([date.getFullYear(), date.getMonth(), date.getDate()]);

// The period as the report's frequency picks it: a range of days, a Monday to
// Sunday week or a month
export const rangeLabel = (meta: KitchenReportMeta) => {
  const from = picked(meta.fromDate);
  const to = picked(meta.toDate);
  const frequency = KITCHEN_MODULES[meta.module].frequency;

  if (frequency === 'monthly') return from.format('MMMM YYYY');
  if (frequency === 'weekly' || frequency === 'twice_weekly')
    return `${from.format('ddd DD-MM-YYYY')} to ${to.format('ddd DD-MM-YYYY')}`;
  return `${from.format('DD-MM-YYYY')} to ${to.format('DD-MM-YYYY')}`;
};
