import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import moment from 'moment';

interface CSVExporterProps {
  data: any[];
  filename?: string;
}

const CSVExporter = ({ data, filename = 'attendance_export.csv' }: CSVExporterProps) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // 1. Headers
    const headers = ['Employee Name', 'Email', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Status'];
    const csvRows = [headers.join(',')];

    // 2. Body
    data.forEach((row) => {
      const name = `${row.userId?.firstName || ''} ${row.userId?.lastName || ''}`.trim();
      const email = row.userId?.email || 'N/A';
      
      // Since clockIn/Out are strings like "01:12", we use the timestamp for the date
      const date = row.timestamp ? moment(row.timestamp).format('DD-MM-YYYY') : '--';
      
      const clockIn = row.clockIn || '--';
      const clockOut = row.clockOut || '--';
      
      // Calculate duration from HH:mm strings
      let duration = '--';
      if (row.clockIn && row.clockOut) {
        const start = moment(row.clockIn, 'HH:mm');
        const end = moment(row.clockOut, 'HH:mm');
        
        if (start.isValid() && end.isValid()) {
          const diffMs = end.diff(start);
          const durationObj = moment.duration(diffMs);
          
          // Format as "8h 30m" or "08:31"
          const hours = Math.floor(durationObj.asHours());
          const minutes = durationObj.minutes();
          duration = `${hours}h ${minutes}m`;
        }
      }

      const status = row.approvalStatus || 'N/A';

      const values = [name, email, date, clockIn, clockOut, duration, status];
      
      // Escape commas and wrap in quotes
      const escapedValues = values.map(v => `"${String(v).replace(/"/g, '""')}"`);
      csvRows.push(escapedValues.join(','));
    });

    // 3. Create Blob with UTF-8 BOM for Excel compatibility
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
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default CSVExporter;