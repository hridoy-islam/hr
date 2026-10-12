import moment from '@/lib/moment-setup';
import { CleaningType } from '../shared';

export interface CleaningReportCell {
  logId: string;
  employeeName: string;
  startTime?: string;
  endTime?: string;
}

export interface CleaningReportRow {
  areaId?: string;
  areaName: string;
  roomNumber?: string;
  // Keyed by day, YYYY-MM-DD
  cells: Record<string, CleaningReportCell>;
}

// The type picks which areas are listed; the columns are always days
export interface CleaningReport {
  type: CleaningType;
  columns: string[];
  rows: CleaningReportRow[];
}

// What the report was generated for, kept apart from the live filters so
// the PDF matches what is on screen
export interface CleaningReportMeta {
  companyName: string;
  type: CleaningType;
  fromDate: Date;
  toDate: Date;
  employeeName: string;
}

const columnMoment = (key: string) => moment(key, 'YYYY-MM-DD');

// Two lines per column, e.g. Mon / 12
export const columnLabel = (key: string) => {
  const date = columnMoment(key);
  return { top: date.format('ddd'), bottom: date.format('DD') };
};

// Day columns grouped under their month, e.g. "October 2026" over 31 days
export const monthGroups = (columns: string[]) => {
  const groups: { label: string; span: number }[] = [];
  columns.forEach((key) => {
    const label = columnMoment(key).format('MMMM YYYY');
    const last = groups[groups.length - 1];
    if (last?.label === label) last.span += 1;
    else groups.push({ label, span: 1 });
  });
  return groups;
};

// The picked dates are local midnights. The app's moment defaults to UK
// time, which would move them back a day for anyone ahead of the UK, so
// they are formatted from their own date parts instead.
export const formatPickedDate = (date: Date) =>
  [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear()
  ].join('-');

export const cellTitle = (cell: CleaningReportCell) =>
  [
    `Completed by ${cell.employeeName}`,
    cell.startTime || cell.endTime
      ? `${cell.startTime || '-'} - ${cell.endTime || '-'}`
      : ''
  ]
    .filter(Boolean)
    .join(' · ');

export const rangeLabel = (meta: CleaningReportMeta) =>
  `${formatPickedDate(meta.fromDate)} to ${formatPickedDate(meta.toDate)}`;
