import React, { useEffect, useState, useRef } from 'react';
import { 
  ClipboardCheck, 
  History, 
  AlertCircle, 
  CalendarClock, 
  FileText, 
  Upload, 
  X, 
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Interfaces ---

interface LogEntry {
  _id?: string;
  title: string;
  date: string;
  document?: string;
  note?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface QACheckData {
  _id: string;
  employeeId: string;
  scheduledDate: string;
  completionDate?: string;
  QACheckNote?: string;
  logs?: LogEntry[];
}

// --- Main Component ---

function QACheckTab() {
  const { id } = useParams(); // employeeId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth); 
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Data
  const [qaCheckId, setQaCheckId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string>('');
  const [history, setHistory] = useState<LogEntry[]>([]);
  
  // Settings & Status (Using qaCheckDate from ScheduleCheck model)
  const [scheduleInterval, setScheduleInterval] = useState<number>(0);
  const [complianceStatus, setComplianceStatus] = useState<string>('not-scheduled');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form Inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // --- Fetch Data ---

  const fetchSettings = async () => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${user._id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        // Using qaCheckDate or qaCheckDuration based on your ScheduleCheck model
        setScheduleInterval(result[0].qaCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching QA schedule settings:', err);
    }
  };

  const fetchQACheckData = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/qa?employeeId=${id}`);
      const result: QACheckData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setQaCheckId(data._id);
        setScheduledDate(data.scheduledDate);
        setCompletionDate(data.completionDate || null);
        setSavedNote(data.QACheckNote || ''); 
        setHistory(data.logs || []);
      } else {
        setQaCheckId(null);
        setScheduledDate(null);
        setCompletionDate(null);
        setSavedNote('');
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching QA Check data:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchQACheckData()]);
      setIsLoading(false);
    };
    loadData();
  }, [id, user?._id]);

  // --- Status Logic ---

  useEffect(() => {
    if (!scheduledDate) {
      setComplianceStatus('not-scheduled');
      return;
    }

    const isCycleOpen = !completionDate || moment(scheduledDate).isAfter(moment(completionDate));

    if (!isCycleOpen) {
      setComplianceStatus('completed');
      return;
    }

    const now = moment().startOf('day');
    const target = moment(scheduledDate).startOf('day');
    const diffDays = target.diff(now, 'days');

    if (now.isAfter(target, 'day')) {
      setComplianceStatus('overdue');
    } 
    else if (scheduleInterval > 0 && diffDays <= 7 && diffDays >= 0) {
      setComplianceStatus('due-soon');
    } 
    else {
      setComplianceStatus('scheduled');
    }
  }, [scheduledDate, completionDate, scheduleInterval]);

  const renderStatusBadge = () => {
    switch (complianceStatus) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due Soon</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">Not Scheduled</Badge>;
    }
  };

  // --- Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('entityId', user._id);
    formData.append('file_type', 'document');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFileUrl(res.data?.data?.fileUrl);
    } catch (err) {
      setUploadError('Failed to upload document.');
      setUploadedFileUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenSchedule = () => {
    setInputDate(null); 
    setInputNote(''); 
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setShowScheduleModal(true);
  };

  const handleOpenComplete = () => {
    setInputDate(null);
    setInputNote(savedNote); 
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setShowCompleteModal(true);
  };

  const submitSchedule = async () => {
    if (!inputDate || !user?._id) return;
    setIsSubmitting(true);

    try {
      const payload = {
        scheduledDate: moment(inputDate).toISOString(),
        updatedBy: user._id,
        note: inputNote,
        document: uploadedFileUrl
      };

      if (!qaCheckId) {
        await axiosInstance.post('/qa', {
            ...payload,
            employeeId: id,
        });
      } else {
        await axiosInstance.patch(`/qa/${qaCheckId}`, {
          ...payload,
          completionDate: null,
          title: `QA Check Scheduled for ${moment(inputDate).format('DD/MM/YYYY')}`,
        });
      }

      await fetchQACheckData();
      toast({ title: 'QA check scheduled successfully', className: 'bg-theme text-white' });
      setShowScheduleModal(false);
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to schedule', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCompletion = async () => {
    if (!inputDate || !uploadedFileUrl || !qaCheckId || !user?._id) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/qa/${qaCheckId}`, {
        completionDate: moment(inputDate).toISOString(),
        document: uploadedFileUrl,
        note: inputNote,
        updatedBy: user._id
      });

      await fetchQACheckData(); 
      toast({ title: 'QA check marked as completed', className: 'bg-theme text-white' });
      setShowCompleteModal(false);
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to complete', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCompleteButton = scheduledDate && (!completionDate || moment(scheduledDate).isAfter(moment(completionDate)));

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const renderFileInput = (isOptional: boolean = false) => (
    <div className="space-y-2 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Proof Document <span className={isOptional ? "text-gray-400 font-normal" : "text-red-500"}>
          {isOptional ? "(Optional)" : "*"}
        </span>
      </Label>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          uploadedFileUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-xs text-blue-600">Uploading...</p>
          </div>
        ) : uploadedFileUrl ? (
          <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="truncate text-sm font-medium text-green-700">{selectedFileName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>
                <X className="h-4 w-4" />
              </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Upload Document</span>
          </div>
        )}
      </div>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
       <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <ClipboardCheck className="h-5 w-5 text-theme" />
              QA Check Status
            </h2>

            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Scheduled Date
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {scheduledDate ? moment(scheduledDate).format('DD MMMM YYYY') : 'Not Set'}
                </div>
              </div>

              {savedNote && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    QA Note
                  </Label>
                  <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100 whitespace-pre-wrap">
                    {savedNote}
                  </div>
                </div>
              )}

              <div className="pt-1">{renderStatusBadge()}</div>

              {!showCompleteButton && completionDate && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <p>Last QA completed on <strong>{moment(completionDate).format('DD MMM YYYY')}</strong></p>
                </div>
              )}
              
              {(complianceStatus === 'overdue' || complianceStatus === 'due-soon') && (
                <div className={cn(
                  "rounded-md p-3 text-sm flex items-start gap-2",
                  complianceStatus === 'overdue' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                )}>
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <p>
                    {complianceStatus === 'overdue' 
                      ? 'QA check is overdue.' 
                      : 'QA check is due soon.'}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-6 space-y-3">
                {showCompleteButton ? (
                   <div className="space-y-3">
                     <Button onClick={handleOpenComplete} className="w-full bg-green-600 text-white hover:bg-green-700">
                       <CheckCircle2 className="mr-2 h-4 w-4" />
                       Complete QA Check
                     </Button>
                   </div>
                ) : (
                  <Button onClick={handleOpenSchedule} className="w-full bg-theme text-white hover:bg-theme/90">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {scheduledDate ? 'Update QA Date' : 'Create First QA Date'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <History className="h-5 w-5 text-theme" />
              History Log
            </h2>

            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center italic text-gray-500">
                        No QA history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry) => (
                        <TableRow key={entry._id || Math.random()} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            {entry.title || 'Update'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {entry.updatedBy && typeof entry.updatedBy === 'object'
                                  ? entry.updatedBy.name || `${entry.updatedBy.firstName ?? ''} ${entry.updatedBy.lastName ?? ''}`.trim()
                                  : 'System'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {moment(entry.date).format('DD MMM YYYY')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-sm text-gray-600" title={entry.note}>
                              {entry.note || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.document ? (
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => window.open(entry.document, '_blank')}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{scheduledDate ? 'Update QA Schedule' : 'Schedule QA Check'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Scheduled Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select date..."
                minDate={new Date()} 
                showYearDropdown
                dropdownMode='select'
                preventOpenOnFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Note <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Add a note about this QA schedule..." 
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
                className='h-[20vh]'
              />
            </div>
            {renderFileInput(true)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button className="bg-theme text-white" onClick={submitSchedule} disabled={!inputDate || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete QA Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Completion Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode='select'
                preventOpenOnFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Note / Observation <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Enter details about the QA check..." 
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
              />
            </div>
            {renderFileInput(false)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700" 
              onClick={submitCompletion} 
              disabled={isSubmitting || !inputDate || !uploadedFileUrl}
            >
              {isSubmitting ? 'Saving...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QACheckTab;