import { useState } from 'react';
import { Calendar, Clock, FileText, DollarSign, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from 'react-datepicker';
import moment from 'moment';

interface ReportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: any) => void;
}

export const ReportRequestModal = ({ isOpen, onClose, onSubmit }: ReportRequestModalProps) => {
  const [reportType, setReportType] = useState<'attendance' | 'payroll' | 'hours' | 'timesheet' | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(moment().startOf('month').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().endOf('month').toDate());
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = () => {
    if (!reportType || !startDate || !endDate || !reason.trim()) return;

    const newRequest = {
      id: `REQ${Date.now()}`,
      requesterId: 'EMP001',
      requesterName: 'Current User',
      requesterEmail: 'current.user@company.com',
      department: 'Current Department',
      reportType,
      dateRange: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
      status: 'pending' as const,
      requestDate: moment().format('YYYY-MM-DD'),
      reason: reason.trim(),
      priority,
      employeeIds: ['current-user'],
      includeBreakdowns: reportType === 'attendance' ? false : undefined
    };

    onSubmit(newRequest);
    
    // Reset form
    setReportType('');
    setStartDate(moment().startOf('month').toDate());
    setEndDate(moment().endOf('month').toDate());
    setReason('');
    setPriority('medium');
    
    onClose();
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'attendance': return Clock;
      case 'payroll': return DollarSign;
      case 'hours': return FileText;
      case 'timesheet': return CheckSquare;
      default: return FileText;
    }
  };

  const IconComponent = getReportIcon(reportType);

  // Custom Input Component for DatePicker (styled like shadcn Input)
  const DateInput = ({ value, onClick, placeholder }: { value?: string; onClick?: () => void; placeholder: string }) => (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm bg-white hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
    >
      <Calendar className="h-4 w-4 text-gray-500" />
      <span className={value ? 'text-gray-900' : 'text-gray-500'}>
        {value || placeholder}
      </span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reportType && <IconComponent className="h-5 w-5 text-blue-600" />}
            Request Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type *</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Attendance Report (PDF)
                  </div>
                </SelectItem>
                <SelectItem value="payroll">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payroll Report (PDF)
                  </div>
                </SelectItem>
              
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                customInput={<DateInput placeholder="Start date" />}
                dateFormat="MMM d, yyyy"
                maxDate={endDate || undefined}
                selectsStart
                startDate={startDate}
                endDate={endDate}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                customInput={<DateInput placeholder="End date" />}
                dateFormat="MMM d, yyyy"
                minDate={startDate || undefined}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Business Justification *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                reportType === 'attendance'
                  ? 'Please explain why you need this attendance report (e.g., performance review, compliance)...'
                  : 'Explain why this report is needed and how it will be used...'
              }
              className="min-h-[80px] border-gray-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reportType || !startDate || !endDate || !reason.trim()}
            className="bg-supperagent hover:bg-supperagent/90"
          >
            Submit {reportType ? `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} ` : ''}Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};