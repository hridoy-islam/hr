import moment from '@/lib/moment-setup';
import { tableToCsv } from '@/pages/company/kitchenLog/report/reportCsv';
import { CleaningReport, CleaningReportCell } from '../../report/reportData';

const HEADERS = [
  'Date',
  'Day',
  'Employee Name',
  'Employee Email',
  'Area',
  'Room Number',
  'Total Element',
  'Completed Element',
  'Start Time',
  'End Time',
  'Duration'
];

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
const durationLabel = (cell: CleaningReportCell) => {
  const timer = cell.durationSeconds || 0;
  const span =
    cell.startTime && cell.endTime
      ? (minutesOf(cell.endTime) - minutesOf(cell.startTime)) * 60
      : 0;
  const seconds = timer >= 30 ? timer : Math.max(timer, span);
  return seconds > 0 ? hoursAndMinutes(seconds) : '';
};

// One row per completed area per day, earliest date first
export const buildCsv = ({ columns, rows }: CleaningReport) =>
  tableToCsv({
    headers: HEADERS,
    rows: columns.flatMap((key) => {
      const date = moment(key, 'YYYY-MM-DD');
      return rows
        .filter((row) => row.cells[key])
        .map((row) => {
          const cell = row.cells[key];
          return [
            date.format('DD-MM-YYYY'),
            date.format('dddd'),
            cell.employeeName,
            cell.employeeEmail || '',
            row.areaName,
            row.roomNumber || '',
            String(cell.totalElement ?? ''),
            String(cell.checkedElement ?? ''),
            cell.startTime || '',
            cell.endTime || '',
            durationLabel(cell)
          ];
        });
    })
  });
