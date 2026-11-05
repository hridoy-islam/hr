import moment from '@/lib/moment-setup';
import {
  CleaningElement,
  CleaningEmployee,
  CleaningLogRecord,
  CleaningType,
  personName,
  toApiDate
} from '../../shared';
import { CleaningReport, cellTitle } from '../reportData';

// A cell is there only when its box is ticked
export interface CleaningGridRow {
  key: string;
  title: string;
  subtitle?: string;
  // Keyed by day, YYYY-MM-DD
  cells: Record<string, { tip?: string }>;
}

// What the screen and the PDF draw: a row per area, employee or element under
// a column per day
export interface CleaningGrid {
  firstColumn: string;
  emptyText: string;
  columns: string[];
  rows: CleaningGridRow[];
}

const daysBetween = (from: Date, to: Date) => {
  const days: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    days.push(toApiDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// The UK day the cleaning was done, as the area report ticks it
const logDay = (log: CleaningLogRecord) =>
  moment(log.createdAt).format('YYYY-MM-DD');

const timeTip = (log: CleaningLogRecord) =>
  log.startTime || log.endTime
    ? `${log.startTime || '-'} - ${log.endTime || '-'}`
    : undefined;

// All areas: a row per area
export const areaGrid = (
  report: CleaningReport,
  type: CleaningType
): CleaningGrid => ({
  firstColumn: 'Area',
  emptyText: `No ${type} area has been set up yet.`,
  columns: report.columns,
  rows: report.rows.map((row, index) => ({
    key: `${row.areaId || row.areaName}-${index}`,
    title: row.areaName,
    subtitle: row.roomNumber ? `Room ${row.roomNumber}` : undefined,
    cells: Object.fromEntries(
      Object.entries(row.cells).map(([day, cell]) => [
        day,
        { tip: cellTitle(cell) }
      ])
    )
  }))
});

// One area, all employees: a row per employee on cleaning, and anyone since
// removed who still has a log in the period
export const employeeGrid = (
  logs: CleaningLogRecord[],
  employees: CleaningEmployee[],
  from: Date,
  to: Date
): CleaningGrid => {
  const columns = daysBetween(from, to);
  const rows = new Map<string, CleaningGridRow>();
  const addRow = (employee: CleaningEmployee) => {
    if (!rows.has(employee._id)) {
      rows.set(employee._id, {
        key: employee._id,
        title: personName(employee),
        subtitle: employee.email,
        cells: {}
      });
    }
    return rows.get(employee._id)!;
  };

  employees.forEach(addRow);
  logs.forEach((log) => {
    const day = logDay(log);
    if (log.employeeId && columns.includes(day)) {
      addRow(log.employeeId).cells[day] = { tip: timeTip(log) };
    }
  });

  return {
    firstColumn: 'Employee',
    emptyText: 'No employee is on cleaning yet.',
    columns,
    rows: Array.from(rows.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  };
};

// One area, one employee: a row per element of the area, and any element since
// removed that a log in the period still holds
export const elementGrid = (
  logs: CleaningLogRecord[],
  elements: CleaningElement[],
  from: Date,
  to: Date
): CleaningGrid => {
  const columns = daysBetween(from, to);
  const rows = new Map<string, CleaningGridRow>();
  const addRow = (key: string, title: string) => {
    if (!rows.has(key)) rows.set(key, { key, title, cells: {} });
    return rows.get(key)!;
  };

  elements.forEach((item) => addRow(item._id, item.element));
  logs.forEach((log) => {
    const day = logDay(log);
    if (!columns.includes(day)) return;
    log.items.forEach((item) => {
      const row = addRow(item.elementId || item.element, item.element);
      if (item.checked) row.cells[day] = { tip: timeTip(log) };
    });
  });

  return {
    firstColumn: 'Element',
    emptyText: 'No element has been set up for this area yet.',
    columns,
    rows: Array.from(rows.values())
  };
};
