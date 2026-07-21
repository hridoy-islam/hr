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
  CheckCircle2,
  Download,
  Pen,
  Lock,
  LockOpen
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
import moment from '@/lib/moment-setup';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Interfaces ---

interface LogEntry {
  _id?: string;
  title: string;
  date: string;
  document?: string[] | string;
  note?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
  createdAt?: string;
  scheduledDate?: string;
  completionDate?: string;
}

interface QACheckData {
  _id: string;
  employeeId: string;
  scheduledDate: string;
  completionDate?: string;
  QACheckNote?: string;
  logs?: LogEntry[];
  isClosed?: boolean;
}

interface UploadedFile {
  name: string;
  url: string;
}

// --- Main Component ---

function QACheckTab() {
  const { id, eid } = useParams(); // employeeId
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
  const [isClosed, setIsClosed] = useState(false);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Settings & Status (Using qaCheckDate from ScheduleCheck model)
  const [scheduleInterval, setScheduleInterval] = useState<number>(0);
  const [complianceStatus, setComplianceStatus] =
    useState<string>('not-scheduled');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form Inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview Dialog State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit Log States
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editLogFiles, setEditLogFiles] = useState<UploadedFile[]>([]);
  const [editLogRemovedUrls, setEditLogRemovedUrls] = useState<string[]>([]);
  const [isEditLogSubmitting, setIsEditLogSubmitting] = useState(false);
  const [editCreatedAt, setEditCreatedAt] = useState<Date | null>(null);
  const [editScheduledDate, setEditScheduledDate] = useState<Date | null>(null);
  const [editCompletionDate, setEditCompletionDate] = useState<Date | null>(null);
  const [editNote, setEditNote] = useState('');
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<{
    type: 'existing' | 'new';
    index: number;
  } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewDialogOpen(true);
  };
  const[leaverData,setLeaverData] = useState([]);

  // Robust Force Download Mechanism
  const handleForceDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      let fileName = url.split('/').pop() || 'document_download';
      fileName = fileName.split('?')[0];

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        'Blob fetch failed, falling back to direct anchor download',
        error
      );
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.setAttribute('download', '');
      fallbackLink.setAttribute('target', '_blank');
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  // Helper to render appropriate viewer inside dialog
  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    const lowerUrl = previewUrl.toLowerCase();
    const isImage = lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/) != null;
    const isPdf = lowerUrl.match(/\.(pdf)(\?.*)?$/) != null;
    const isWord = lowerUrl.match(/\.(docx|doc)(\?.*)?$/) != null;

    if (isImage) {
      return (
        <img
          src={previewUrl}
          alt="Document Preview"
          className="max-h-full max-w-full rounded-md object-contain shadow-sm"
        />
      );
    }

    if (isWord) {
      // Encodes the document's cloud URL into Microsoft's official high-fidelity web viewer iframe format
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
      return (
        <iframe
          src={officeViewerUrl}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="Word Document Preview"
        />
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="PDF Preview"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileText className="mb-4 h-16 w-16 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Preview not available
        </h3>
        <p className="mb-6 mt-2 text-sm text-gray-500">
          This file format cannot be safely previewed in the browser.
        </p>
        <Button
          onClick={() => handleForceDownload(previewUrl)}
          className="bg-theme text-white hover:bg-theme/90"
        >
          <Download className="mr-2 h-4 w-4" /> Download to View
        </Button>
      </div>
    );
  };

  // --- Fetch Data ---

  const fetchSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        // Using qaCheckDate or qaCheckDuration based on your ScheduleCheck model
        setScheduleInterval(result[0].qaCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching QA schedule settings:', err);
    }
  };


    const fetchLeaverData = async () => {
    if (!eid) return;
    try {
      const leaverData = await axiosInstance.get(`/leaver?companyId=${id}&userId=${eid}`)
        setLeaverData(leaverData.data.data.result);
    } catch (err) {
      console.error('Error fetching Appraisal data:', err);
      toast({
        title: 'Failed to load leaver data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  const fetchQACheckData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/qa?employeeId=${eid}`);
      const result: QACheckData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setQaCheckId(data._id);
        setScheduledDate(data.scheduledDate);
        setCompletionDate(data.completionDate || null);
        setSavedNote(data.QACheckNote || '');
        setIsClosed(data.isClosed || false);
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
      await Promise.all([fetchSettings(), fetchQACheckData(),fetchLeaverData()]);
      setIsLoading(false);
    };
    loadData();
  }, [eid, id]);

  // --- Status Logic ---

  useEffect(() => {
    if (!scheduledDate || leaverData.length > 0) {
      setComplianceStatus('not-scheduled');
      return;
    }

    // const isCycleOpen =
    //   !completionDate || moment(scheduledDate).isAfter(moment(completionDate));

    // if (!isCycleOpen) {
    //   setComplianceStatus('completed');
    //   return;
    // }

    const now = moment().startOf('day');
    const target = moment(scheduledDate).startOf('day');
    const diffDays = target.diff(now, 'days');

    if (now.isAfter(target, 'day')) {
      setComplianceStatus('overdue');
    } else if (scheduleInterval > 0 && diffDays <= 7 && diffDays >= 0) {
      setComplianceStatus('due-soon');
    } else {
      setComplianceStatus('scheduled');
    }
  }, [scheduledDate, completionDate, scheduleInterval]);

  const renderStatusBadge = () => {
    switch (complianceStatus) {
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Due Soon
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Scheduled
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Scheduled</Badge>;
    }
  };

  // --- Handlers ---

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    // Validate all files first
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setUploadError(
          `Invalid file type: ${file.name}. Only PDF, JPEG, or PNG allowed.`
        );
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user._id);
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedResults]);
    } catch (err) {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleOpenSchedule = () => {
    setInputDate(scheduledDate ? new Date(moment.utc(scheduledDate).year(), moment.utc(scheduledDate).month(), moment.utc(scheduledDate).date()) : null);
    setInputNote('');
    setUploadedFiles([]);
    setUploadError(null);
    setShowScheduleModal(true);
  };

  const handleOpenComplete = () => {
    setInputDate(null);
    setInputNote(savedNote);
    setUploadedFiles([]);
    setUploadError(null);
    setShowCompleteModal(true);
  };

  const submitSchedule = async () => {
    if (!inputDate || !id) return;
    setIsSubmitting(true);

    try {
      const payload = {
        scheduledDate: new Date(
          Date.UTC(
            inputDate!.getFullYear(),
            inputDate!.getMonth(),
            inputDate!.getDate()
          )
        ).toISOString(),
        updatedBy: user._id,
        note: inputNote,
        document: uploadedFiles.map((f) => f.url) // Passed as Array
      };

      if (!qaCheckId) {
        await axiosInstance.post('/qa', {
          ...payload,
          employeeId: eid
        });
      } else {
        await axiosInstance.patch(`/qa/${qaCheckId}`, {
          ...payload,
          completionDate: null,
          title: `QA Check Scheduled for ${moment(inputDate).format('DD/MM/YYYY')}`
        });
      }

      await fetchQACheckData();
      toast({
        title: 'QA check scheduled successfully',
        className: 'bg-theme text-white'
      });
      setShowScheduleModal(false);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to schedule',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCompletion = async () => {
    if (!inputDate || uploadedFiles.length === 0 || !qaCheckId || !id) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/qa/${qaCheckId}`, {
        completionDate: new Date(
          Date.UTC(
            inputDate!.getFullYear(),
            inputDate!.getMonth(),
            inputDate!.getDate()
          )
        ).toISOString(),
        document: uploadedFiles.map((f) => f.url), // Array submission
        note: inputNote,
        updatedBy: user._id
      });

      await fetchQACheckData();
      toast({
        title: 'QA check marked as completed',
        className: 'bg-theme text-white'
      });
      setShowCompleteModal(false);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to complete',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleClose = async () => {
    if (!qaCheckId) return;
    setIsToggling(true);
    try {
      await axiosInstance.patch(`/qa/${qaCheckId}`, {
        isClosed: !isClosed,
        updatedBy: user._id,
      });
      await fetchQACheckData();
      toast({
        title: isClosed ? 'QA Check reopened successfully!' : 'QA Check closed successfully!',
        className: 'bg-theme text-white'
      });
      setShowToggleConfirm(false);
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Toggle failed.',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsToggling(false);
    }
  };

  // Log Edit Functions
  const openEditLogModal = (entry: LogEntry) => {
    setEditingLog(entry);
    setEditLogFiles([]);
    setEditLogRemovedUrls([]);
    setEditCreatedAt(entry.createdAt ? new Date(moment.utc(entry.createdAt).year(), moment.utc(entry.createdAt).month(), moment.utc(entry.createdAt).date()) : entry.date ? new Date(moment.utc(entry.date).year(), moment.utc(entry.date).month(), moment.utc(entry.date).date()) : null);
    setEditScheduledDate(entry.scheduledDate ? new Date(moment.utc(entry.scheduledDate).year(), moment.utc(entry.scheduledDate).month(), moment.utc(entry.scheduledDate).date()) : null);
    setEditCompletionDate(entry.completionDate ? new Date(moment.utc(entry.completionDate).year(), moment.utc(entry.completionDate).month(), moment.utc(entry.completionDate).date()) : null);
    setEditNote(entry.note || '');
    setShowEditLogModal(true);
  };



  const handleEditLogFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 20MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user._id);
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const results = await Promise.all(uploadPromises);
      setEditLogFiles((prev) => [...prev, ...results]);
    } catch {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const requestRemoveDocument = (type: 'existing' | 'new', index: number) => {
    setPendingRemoveIndex({ type, index });
    setShowRemoveWarning(true);
  };

  const confirmRemoveDocument = () => {
    if (!pendingRemoveIndex) return;

    if (pendingRemoveIndex.type === 'existing' && editingLog) {
      const existingDocs = Array.isArray(editingLog.document)
        ? editingLog.document
        : editingLog.document
          ? [editingLog.document]
          : [];
      const urlToRemove = existingDocs[pendingRemoveIndex.index];
      setEditLogRemovedUrls((prev) => [...prev, urlToRemove]);
      setEditingLog({
        ...editingLog,
        document: existingDocs.filter((_, i) => i !== pendingRemoveIndex.index)
      });
    } else if (pendingRemoveIndex.type === 'new') {
      setEditLogFiles((prev) =>
        prev.filter((_, i) => i !== pendingRemoveIndex.index)
      );
    }

    setShowRemoveWarning(false);
    setPendingRemoveIndex(null);
  };

  const handleSubmitEditLog = async () => {
    if (!qaCheckId || !editingLog || !editingLog._id) return;

    setIsEditLogSubmitting(true);

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
        ? [editingLog.document]
        : [];

    const finalDocuments = [...existingDocs, ...editLogFiles.map((f) => f.url)];

    try {
      await axiosInstance.patch(`/qa/${qaCheckId}/logs/${editingLog._id}`, {
        document: finalDocuments,
        scheduledDate: editScheduledDate ? new Date(Date.UTC(editScheduledDate.getFullYear(), editScheduledDate.getMonth(), editScheduledDate.getDate())).toISOString() : null,
        completionDate: editCompletionDate ? new Date(Date.UTC(editCompletionDate.getFullYear(), editCompletionDate.getMonth(), editCompletionDate.getDate())).toISOString() : null,
        note: editNote,
date: editCreatedAt 
  ? new Date(Date.UTC(
      editCreatedAt.getFullYear(), 
      editCreatedAt.getMonth(), 
      editCreatedAt.getDate(),
      new Date().getUTCHours(),      // Current hours
      new Date().getUTCMinutes(),    // Current minutes
      new Date().getUTCSeconds(),    // Current seconds
      new Date().getUTCMilliseconds() // Current milliseconds
    )).toISOString() 
  : null      });

      await fetchQACheckData();
      toast({
        title: 'Log document updated successfully!',
        className: 'bg-theme text-white'
      });
      setShowEditLogModal(false);
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Update failed.',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsEditLogSubmitting(false);
    }
  };

  const showCompleteButton =
    scheduledDate 
  // const showCompleteButton =
  //   scheduledDate &&
  //   (!completionDate || moment(scheduledDate).isAfter(moment(completionDate)));

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const renderFileInput = (isOptional: boolean = false) => (
    <div className="space-y-3 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Proof Document(s){' '}
        <span
          className={isOptional ? 'font-normal text-gray-400' : 'text-red-500'}
        >
          {isOptional ? '(Optional)' : '*'}
        </span>
      </Label>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                <p
                  className="truncate text-xs font-medium text-green-700"
                  title={file.name}
                >
                  {file.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isUploading
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple // Enables multiple file selection
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-xs text-blue-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Upload Document
            </span>
            <span className="text-xs text-gray-400">
              PDF/Images (Max 20MB each)
            </span>
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
                  {scheduledDate
                    ? moment(scheduledDate).format('DD MMMM YYYY')
                    : 'Not Set'}
                </div>
              </div>

              {savedNote && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    QA Note
                  </Label>
                  <div className="whitespace-pre-wrap rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                    {savedNote}
                  </div>
                </div>
              )}

              <div className="pt-1">{renderStatusBadge()}</div>

              { completionDate && (
                <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <p>
                    Last QA completed on{' '}
                    <strong>
                      {moment(completionDate).format('DD MMM YYYY')}
                    </strong>
                  </p>
                </div>
              )}

              {/* {(complianceStatus === 'overdue' ||
                complianceStatus === 'due-soon') && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-md p-3 text-sm',
                    complianceStatus === 'overdue'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p>
                    {complianceStatus === 'overdue'
                      ? 'QA check is overdue.'
                      : 'QA check is due soon.'}
                  </p>
                </div>
              )} */}

              <div className="space-y-3 border-t border-gray-100 pt-6">
                <Button
                  onClick={handleOpenSchedule}
                  disabled={leaverData.length > 0}
                  className="w-full bg-theme text-white hover:bg-theme/90"
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {scheduledDate ? 'Update QA Date' : 'Create First QA Date'}
                </Button>

                {showCompleteButton && (
                  <Button
                    onClick={handleOpenComplete}
                    disabled={leaverData.length > 0 || isClosed}
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete QA Check
                  </Button>
                )}

                {qaCheckId && (
                  <Button
                    onClick={() => setShowToggleConfirm(true)}
                    disabled={leaverData.length > 0}
                    variant="outline"
                    className={cn(
                      'w-full border',
                      isClosed
                        ? 'bg-theme text-white border-none hover:bg-theme/90'
                        : 'bg-destructive text-white border-none hover:bg-destructive/90'
                    )}
                  >
                    {isClosed ? (
                      <><LockOpen className="mr-2 h-4 w-4" /> Open QA</>
                    ) : (
                      <><Lock className="mr-2 h-4 w-4" /> Close QA</>
                    )}
                  </Button>
                )}
              </div>

              {/* here add close qa or open qa Button */}
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
                    <TableHead className="text-right">Document(s)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center italic text-gray-500"
                      >
                        No QA history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((entry) => (
                        <TableRow
                          key={entry._id || Math.random()}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="font-medium text-gray-900">
                            {entry.title || 'Update'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {entry.updatedBy &&
                                typeof entry.updatedBy === 'object'
                                  ? entry.updatedBy.name ||
                                    `${entry.updatedBy.firstName ?? ''} ${entry.updatedBy.lastName ?? ''}`.trim()
                                  : 'System'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {moment(entry.date).format('DD MMM YYYY')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p
                              className="truncate text-sm text-gray-600"
                              title={entry.note}
                            >
                              {entry.note || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              {/* Handle array formats */}
                              {Array.isArray(entry.document) &&
                              entry.document.length > 0 ? (
                                entry.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleViewDocument(docUrl)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Doc{' '}
                                    {entry.document!.length > 1 ? idx + 1 : ''}
                                  </Button>
                                ))
                              ) : /* Handle legacy string format fallback */
                              entry.document &&
                                typeof entry.document === 'string' ? (
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() =>
                                    handleViewDocument(entry.document as string)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Doc
                                </Button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size={'icon'}
                              variant={'outline'}
                              onClick={() => openEditLogModal(entry)}
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
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

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {scheduledDate ? 'Update QA Schedule' : 'Schedule QA Check'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Scheduled Date (DD-MM-YYYY)
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select date..."
                // minDate={new Date()}
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
                onKeyDown={(e) => {
                  const input = e.target as HTMLInputElement;
                  const allowed = [
                    'Backspace',
                    'Delete',
                    'ArrowLeft',
                    'ArrowRight',
                    'Tab'
                  ];
                  if (allowed.includes(e.key)) return;
                  if (!/[\d-]/.test(e.key)) {
                    e.preventDefault();
                    return;
                  }
                  if (input.value.length >= 10) e.preventDefault();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Note{' '}
                <span className="font-normal text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                placeholder="Add a note about this QA schedule..."
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
                className="h-[20vh]"
              />
            </div>
            {renderFileInput(true)}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white"
              onClick={submitSchedule}
              disabled={!inputDate || isSubmitting || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete QA Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Completion Date (DD-MM-YYYY)
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
                onKeyDown={(e) => {
                  const input = e.target as HTMLInputElement;
                  const allowed = [
                    'Backspace',
                    'Delete',
                    'ArrowLeft',
                    'ArrowRight',
                    'Tab'
                  ];
                  if (allowed.includes(e.key)) return;
                  if (!/[\d-]/.test(e.key)) {
                    e.preventDefault();
                    return;
                  }
                  if (input.value.length >= 10) e.preventDefault();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Note / Observation{' '}
                <span className="font-normal text-gray-400">(Optional)</span>
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
            <Button
              variant="outline"
              onClick={() => setShowCompleteModal(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={submitCompletion}
              disabled={
                isSubmitting ||
                isUploading ||
                !inputDate ||
                uploadedFiles.length === 0
              }
            >
              {isSubmitting ? 'Saving...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close/Open QA Confirmation Dialog */}
      <Dialog open={showToggleConfirm} onOpenChange={setShowToggleConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isClosed ? (
                <LockOpen className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-red-600" />
              )}
              {isClosed ? 'Reopen QA Check?' : 'Close QA Check?'}
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm text-gray-600">
              {isClosed
                ? 'This will reopen the QA check and add a log entry for the reopening.'
                : 'This will close the QA check and add a log entry for the closure.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowToggleConfirm(false)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              className={isClosed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}
              onClick={handleToggleClose}
              disabled={isToggling}
            >
              {isToggling ? 'Saving...' : isClosed ? 'Yes, Reopen' : 'Yes, Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog open={showEditLogModal} onOpenChange={setShowEditLogModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Log Document</DialogTitle>
            <DialogDescription>{editingLog?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Editable Log Dates */}
            {editingLog && (
              <div className="grid grid-cols-3 gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Created At
                  </Label>
                  <DatePicker
                    selected={editCreatedAt}
                    onChange={(date) => setEditCreatedAt(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date..."
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Scheduled Date
                  </Label>
                  <DatePicker
                    selected={editScheduledDate}
                    onChange={(date) => setEditScheduledDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date..."
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Completion Date
                  </Label>
                  <DatePicker
                    selected={editCompletionDate}
                    onChange={(date) => setEditCompletionDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date..."
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
              </div>
            )}

            {/* Editable Note */}
            {editingLog && (
              <div className="flex flex-col space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  Note <span className="font-normal text-gray-400">(Optional)</span>
                </Label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                  placeholder="Add a note..."
                />
              </div>
            )}

            {/* Existing Documents */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Current Documents
              </Label>
              {(() => {
                const existingDocs = editingLog
                  ? Array.isArray(editingLog.document)
                    ? editingLog.document
                    : editingLog.document
                      ? [editingLog.document]
                      : []
                  : [];

                return existingDocs.length > 0 ? (
                  <div className="space-y-2">
                    {existingDocs.map((docUrl, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span
                            className="truncate text-xs text-gray-700"
                            title={docUrl}
                          >
                            {decodeURIComponent(
                              docUrl.split('/').pop()?.split('?')[0] ||
                                `Doc ${idx + 1}`
                            )}
                          </span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleViewDocument(docUrl)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                            onClick={() =>
                              requestRemoveDocument('existing', idx)
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-400">
                    No documents attached.
                  </p>
                );
              })()}
            </div>

            {/* Newly Uploaded Documents */}
            {editLogFiles.length > 0 && (
              <div className="space-y-2">
               
                <div className="max-h-32 space-y-2 overflow-y-auto ">
                  {editLogFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p
                          className="truncate text-xs font-medium text-green-700"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => requestRemoveDocument('new', index)}
                        className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Dropzone */}
            <div className="space-y-2">
              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
                  isUploading
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                )}
              >
                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  onChange={handleEditLogFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Add Documents
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF/Images (Max 20MB)
                    </span>
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEditLogModal(false)}
              disabled={isEditLogSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              onClick={handleSubmitEditLog}
              disabled={isEditLogSubmitting || isUploading}
            >
              {isEditLogSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Warning Dialog */}
      <Dialog open={showRemoveWarning} onOpenChange={setShowRemoveWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Remove Document?
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm text-gray-600">
              This document will be permanently removed and{' '}
              <span className="font-semibold text-gray-800">
                cannot be retrieved
              </span>{' '}
              once saved. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveWarning(false);
                setPendingRemoveIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveDocument}>
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog Overlay Container */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <div className="z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Document Preview
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-sm truncate text-xs text-gray-500">
                {previewUrl?.split('/').pop()?.split('?')[0] ||
                  'Unknown Document'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => previewUrl && handleForceDownload(previewUrl)}
                className="bg-theme text-white shadow-sm hover:bg-theme/90"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button
                size="sm"
                variant={'outline'}
                onClick={() => setIsPreviewDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-auto bg-gray-100 p-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QACheckTab;
