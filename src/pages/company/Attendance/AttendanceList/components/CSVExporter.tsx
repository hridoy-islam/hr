import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import moment from '@/lib/moment-setup';

interface CSVExporterProps {
  data: any[];
  filename?: string;
}

// Format a total-minutes number into "7h 28m".
// Rounds (not floors) so fractional minutes don't get silently dropped.
const formatDurationFromMinutes = (totalMinutes: number) => {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) return '--';
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return `${hours}h ${minutes}m`;
};

const fixTime = (t: string) => {
  if (!t) return '00:00:00.000';
  if (t.length === 5) return t + ':00.000';
  return t;
};

// Build a moment from a date + time pair, UTC-based so results don't
// shift depending on the browser's local timezone.
const buildMoment = (date: string, time: string) => {
  if (!date || !time) return null;
  // If time is already a full ISO string, parse it directly as UTC.
  if (time.includes('T')) return moment.utc(time);
  return moment.utc(`${date}T${fixTime(time)}`, 'YYYY-MM-DDTHH:mm:ss.SSS');
};

// Single source of truth for duration: always computed live from the
// actual start/end date+time, so it can never drift from whatever the
// frontend shows. The pre-computed `serverDurationMinutes` is only used
// as a fallback when start/end times aren't available at all.
const calculateDurationMinutes = (
  sDate: string,
  sTime: string,
  eDate: string,
  eTime: string,
  serverDurationMinutes?: number
): number | null => {
  const start = buildMoment(sDate, sTime);
  const end = buildMoment(eDate, eTime);

  if (start && end && start.isValid() && end.isValid()) {
    const diffMinutes = end.diff(start, 'minutes', true); // true = keep fractional
    return diffMinutes;
  }

  if (typeof serverDurationMinutes === 'number' && !isNaN(serverDurationMinutes)) {
    return serverDurationMinutes;
  }

  return null;
};

const CSVExporter = ({ data, filename = 'attendance_export.csv' }: CSVExporterProps) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // 1. Headers
    const headers = [
      'Employee Name',
      'Email',
      'Start Date',
      'Start Time',
      'End Date',
      'End Time',
      'Duration',
      'Status',
    ];
    const csvRows = [headers.join(',')];

    // 2. Body
    data.forEach((row) => {
      const firstName = row.userId?.firstName || '';
      const lastName = row.userId?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown';
      const email = row.userId?.email || 'N/A';

      // --- Date Logic ---
      // Prioritize startDate/endDate, fallback to createdAt.
      // Use UTC formatting so the date shown matches the stored value
      // regardless of the exporting browser's local timezone.
      const rawStartDate = row.startDate
        ? moment.utc(row.startDate).format('YYYY-MM-DD')
        : moment.utc(row.createdAt).format('YYYY-MM-DD');

      const rawEndDate = row.endDate
        ? moment.utc(row.endDate).format('YYYY-MM-DD')
        : rawStartDate;

      const displayStartDate = moment.utc(rawStartDate).format('DD-MM-YYYY');
      const displayEndDate = moment.utc(rawEndDate).format('DD-MM-YYYY');

      // --- Time Logic ---
      const rawStartTime = row.startTime || row.clockIn || '';
      const rawEndTime = row.endTime || row.clockOut || '';

      const formatTime = (t: string) => {
        if (!t || t === '--') return '--';
        if (t.includes('T')) return moment.utc(t).format('HH:mm');
        const m = moment.utc(t, ['HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm']);
        return m.isValid() ? m.format('HH:mm') : t;
      };

      const displayStartTime = formatTime(rawStartTime);
      const displayEndTime = formatTime(rawEndTime);

      // --- Duration Logic ---
      // Always calculated the same way, from the same start/end values
      // used above — this is what keeps it in sync with the frontend.
      const durationMinutes = calculateDurationMinutes(
        rawStartDate,
        rawStartTime,
        rawEndDate,
        rawEndTime,
        typeof row.duration === 'number' ? row.duration : undefined
      );
      const duration =
        durationMinutes !== null ? formatDurationFromMinutes(durationMinutes) : '--';

      const status = row.approvalStatus || 'N/A';

      const values = [
        name,
        email,
        displayStartDate,
        displayStartTime,
        displayEndDate,
        displayEndTime,
        duration,
        status,
      ];

      // Escape commas and wrap in quotes
      const escapedValues = values.map((v) => `"${String(v).replace(/"/g, '""')}"`);
      csvRows.push(escapedValues.join(','));
    });

    // 3. Create Blob with UTF-8 BOM
    const csvString = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });

    // 4. Download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Button
      size="sm"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="h-10"
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default CSVExporter;