import moment from '@/lib/moment-setup';
import {
  durationLabel,
  tableToCsv
} from '@/pages/company/kitchenLog/csvReport/components/reportCsv';
import { CleaningReport } from '../../report/reportData';

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
