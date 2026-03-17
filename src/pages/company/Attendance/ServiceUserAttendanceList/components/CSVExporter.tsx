import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import moment from 'moment';

interface CSVExporterProps {
  data: any[];
  filename?: string;
}

// Helper: Format minutes (e.g., 448) into "7h 28m"
const formatDurationFromMinutes = (totalMinutes: number) => {
  if (typeof totalMinutes !== 'number') return '--';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
};

// Helper: Client-side calculation fallback
const calculateDurationString = (sDate: string, sTime: string, eDate: string, eTime: string) => {
  const fixTime = (t: string) => {
    if (!t) return '00:00:00.000';
    if (t.length === 5) return t + ":00.000"; 
    return t;
  };

  const buildMoment = (date: string, time: string) => {
    if (!time) return null;
    // If time is already ISO (e.g. from DB sometimes), parse it directly
    if (time.includes('T')) return moment(time);
    // Explicit format to avoid ambiguity
    return moment(`${date}T${fixTime(time)}`, 'YYYY-MM-DDTHH:mm:ss.SSS');
  };

  const start = buildMoment(sDate, sTime);
  const end = buildMoment(eDate, eTime);

  if (!start || !end || !start.isValid() || !end.isValid()) {
    return '--';
  }

  const diffMs = end.diff(start);
  const duration = moment.duration(diffMs);

  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();
  
  return `${hours}h ${mins}m`;
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
      'Status'
    ];
    const csvRows = [headers.join(',')];

    // 2. Body
    data.forEach((row) => {
      const firstName = row.userId?.firstName || '';
      const lastName = row.userId?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown';
      const email = row.userId?.email || 'N/A';
      
      // --- Date Logic ---
      // Prioritize startDate/endDate, fallback to createdAt
      const rawStartDate = row.startDate 
        ? moment(row.startDate).format('YYYY-MM-DD') 
        : moment(row.createdAt).format('YYYY-MM-DD');
      
      const rawEndDate = row.endDate 
        ? moment(row.endDate).format('YYYY-MM-DD') 
        : rawStartDate;

      const displayStartDate = moment(rawStartDate).format('DD-MM-YYYY');
      const displayEndDate = moment(rawEndDate).format('DD-MM-YYYY');

      // --- Time Logic ---
      const rawStartTime = row.startTime || row.clockIn || '';
      const rawEndTime = row.endTime || row.clockOut || '';

      // Format time for CSV (e.g., "09:00:00.000" -> "09:00")
      const formatTime = (t: string) => {
        if (!t || t === '--') return '--';
        // Handle full ISO string
        if (t.includes('T')) return moment(t).format('HH:mm');
        // Handle HH:mm:ss.SSS
        const m = moment(t, ['HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm']);
        return m.isValid() ? m.format('HH:mm') : t;
      };

      const displayStartTime = formatTime(rawStartTime);
      const displayEndTime = formatTime(rawEndTime);

      // --- Duration Logic ---
      let duration = '--';
      // Use server calculation if available (most accurate)
      if (typeof row.duration === 'number') {
        duration = formatDurationFromMinutes(row.duration);
      } else {
        // Fallback to client-side calc
        duration = calculateDurationString(
          rawStartDate, 
          rawStartTime, 
          rawEndDate, 
          rawEndTime
        );
      }

      const status = row.approvalStatus || 'N/A';

      const values = [
        name, 
        email, 
        displayStartDate, 
        displayStartTime, 
        displayEndDate, 
        displayEndTime, 
        duration, 
        status
      ];
      
      // Escape commas and wrap in quotes
      const escapedValues = values.map(v => `"${String(v).replace(/"/g, '""')}"`);
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