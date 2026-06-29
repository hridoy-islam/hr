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
  Users,
  Download,
  Pen
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
  document?: string[] | string; // Updated to support array or legacy string
  note?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface SupervisionData {
  _id: string;
  employeeId: string;
  scheduledDate: string;
  completionDate?: string;
  sessionNote?: string;
  logs?: LogEntry[];
}

interface UploadedFile {
  name: string;
  url: string;
}

// --- Main Component ---

function SupervisionTab() {
  const { id,eid } = useParams(); // employeeId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth); // companyId/userId
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Data
  const [supervisionId, setSupervisionId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string>(''); 
  const [history, setHistory] = useState<LogEntry[]>([]);
  
  // Settings & Status
  const [scheduleInterval, setScheduleInterval] = useState<number>(0);
  const [complianceStatus, setComplianceStatus] = useState<string>('not-scheduled');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Preview Dialog State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit Log States
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editLogFiles, setEditLogFiles] = useState<UploadedFile[]>([]);
  const [editLogRemovedUrls, setEditLogRemovedUrls] = useState<string[]>([]);
  const [isEditLogSubmitting, setIsEditLogSubmitting] = useState(false);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<{ type: 'existing' | 'new'; index: number } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Form Inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');
  
  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const[leaverData,setLeaverData] = useState([]);

  // --- Fetch Data ---

  const fetchSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setScheduleInterval(result[0].supervisionCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  const fetchSupervisionData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/supervision?employeeId=${eid}`);
      const result: SupervisionData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setSupervisionId(data._id);
        setScheduledDate(data.scheduledDate);
        setCompletionDate(data.completionDate || null);
        setSavedNote(data.sessionNote || ''); 
        setHistory(data.logs || []);
      } else {
        setSupervisionId(null);
        setScheduledDate(null);
        setCompletionDate(null);
        setSavedNote('');
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Supervision data:', err);
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchSupervisionData(),fetchLeaverData()]);
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

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewDialogOpen(true);
  };

  // Robust Force Download Mechanism
  const handleForceDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
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
      console.error('Blob fetch failed, falling back to direct anchor download', error);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.setAttribute('download', '');
      fallbackLink.setAttribute('target', '_blank');
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    // Validate all files first
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
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Open Handlers
  const handleOpenSchedule = () => {
    setInputDate(null); 
    setInputNote('');
    // Reset file states for "Create"
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

  // Submit: Schedule (Create/Update)
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
).toISOString(),        updatedBy: user._id,
        note: inputNote,
        document: uploadedFiles.map(f => f.url) // Passed as Array
      };

      if (!supervisionId) {
        // Create new
        await axiosInstance.post('/supervision', {
            ...payload,
            employeeId: eid,
        });
      } else {
        // Update existing schedule
        await axiosInstance.patch(`/supervision/${supervisionId}`, {
          ...payload,
          completionDate: null,
          title: 'Supervision Scheduled',
        });
      }

      await fetchSupervisionData();
      toast({ title: 'Supervision scheduled successfully', className: 'bg-theme text-white' });
      setShowScheduleModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to schedule', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Complete
  const submitCompletion = async () => {
    // Requires at least one uploaded document
    if (!inputDate || uploadedFiles.length === 0 || !supervisionId || !id) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/supervision/${supervisionId}`, {
completionDate: new Date(
  Date.UTC(
    inputDate!.getFullYear(),
    inputDate!.getMonth(),
    inputDate!.getDate()
  )
).toISOString(),        document: uploadedFiles.map(f => f.url), // Array submission
        note: inputNote,
        updatedBy: user._id
      });

      await fetchSupervisionData();
      toast({ title: 'Supervision marked as completed', className: 'bg-theme text-white' });
      setShowCompleteModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to complete', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log Edit Functions
  const openEditLogModal = (entry: LogEntry) => {
    setEditingLog(entry);
    setEditLogFiles([]);
    setEditLogRemovedUrls([]);
    setShowEditLogModal(true);
  };

  const handleEditLogFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setEditLogFiles((prev) => prev.filter((_, i) => i !== pendingRemoveIndex.index));
    }

    setShowRemoveWarning(false);
    setPendingRemoveIndex(null);
  };

  const handleSubmitEditLog = async () => {
    if (!supervisionId || !editingLog || !editingLog._id) return;

    setIsEditLogSubmitting(true);

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
      ? [editingLog.document]
      : [];

    const finalDocuments = [...existingDocs, ...editLogFiles.map((f) => f.url)];

    try {
      await axiosInstance.patch(`/supervision/${supervisionId}/logs/${editingLog._id}`, {
        document: finalDocuments
      });

      await fetchSupervisionData();
      toast({ title: 'Log document updated successfully!', className: 'bg-theme text-white' });
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
          className="max-h-full max-w-full object-contain rounded-md shadow-sm" 
        />
      );
    }

    if (isWord) {
      // Encodes the document's cloud URL into Microsoft's official high-fidelity web viewer iframe format
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
      return (
        <iframe 
          src={officeViewerUrl} 
          className="w-full h-full border-0 rounded-md shadow-sm" 
          title="Word Document Preview" 
        />
      );
    }

    if (isPdf) {
      return (
        <iframe 
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
          className="w-full h-full border-0 rounded-md shadow-sm" 
          title="PDF Preview" 
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Preview not available</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          This file format cannot be safely previewed in the browser.
        </p>
        <Button onClick={() => handleForceDownload(previewUrl)} className="bg-theme hover:bg-theme/90 text-white">
          <Download className="mr-2 h-4 w-4" /> Download to View
        </Button>
      </div>
    );
  };

  const showCompleteButton = scheduledDate && (!completionDate || moment(scheduledDate).isAfter(moment(completionDate)));

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  // Helper for rendering File Input (Reusable Logic)
  const renderFileInput = (isOptional: boolean = false) => (
    <div className="space-y-3 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Signed Document(s) <span className={isOptional ? "text-gray-400 font-normal" : "text-red-500"}>
          {isOptional ? "(Optional)" : "*"}
        </span>
      </Label>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                <button 
                  type="button"
                  onClick={() => handleViewDocument(file.url)}
                  className="truncate text-xs font-medium text-green-700 hover:underline text-left" 
                  title={file.name}
                >
                  {file.name}
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(index)}
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
            <span className="text-sm font-medium text-gray-600">Upload Document</span>
            <span className="text-xs text-gray-400">PDF/Images (Max 20MB each)</span>
          </div>
        )}
      </div>
      
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {/* Left Column: Status & Actions */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Users className="h-5 w-5 text-theme" />
              Supervision Status
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
                    Session Note
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
                  <p>Last supervision completed on <strong>{moment(completionDate).format('DD MMM YYYY')}</strong></p>
                </div>
              )}
              
              {(complianceStatus === 'overdue' || complianceStatus === 'due-soon') && (
                <div className={cn(
                  "rounded-md p-3 text-sm flex items-start gap-2",
                  complianceStatus === 'overdue' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                )}>
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <p>
                    {complianceStatus === 'overdue' ? 'Supervision is overdue.' : 'Supervision is due soon.'}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-6 space-y-3">
                {showCompleteButton ? (
                   <div className="space-y-3">
                     <Button onClick={handleOpenComplete} disabled={leaverData.length > 0} className="w-full bg-green-600 text-white hover:bg-green-700">
                       <CheckCircle2 className="mr-2 h-4 w-4" />
                       Complete Supervision
                     </Button>
                   </div>
                ) : (
                  <Button onClick={handleOpenSchedule} disabled={leaverData.length > 0} className="w-full bg-theme text-white hover:bg-theme/90">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {scheduledDate ? 'Update Supervision Date' : 'Create First Supervision Date'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Log */}
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
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Document(s)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center italic text-gray-500">
                        No history records found.
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
                            <div className="flex flex-col items-end gap-1">
                              {/* Handle array formats */}
                              {Array.isArray(entry.document) && entry.document.length > 0 ? (
                                entry.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleViewDocument(docUrl)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Document {entry.document!.length > 1 ? idx + 1 : ''}
                                  </Button>
                                ))
                              ) 
                              /* Handle legacy string format fallback */
                              : entry.document && typeof entry.document === 'string' ? (
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleViewDocument(entry.document as string)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Document 
                                </Button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size={'icon'} variant={'outline'} onClick={() => openEditLogModal(entry)}>
                              <Pen className='w-4 h-4' />
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

      {/* 1. Schedule Modal (Create/Update) */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{scheduledDate ? 'Update Schedule' : 'Schedule Supervision'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Scheduled Date (DD-MM-YYYY)<span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select date..."
                // minDate={new Date()} 
                showYearDropdown
                dropdownMode='select'
                preventOpenOnFocus
                onKeyDown={(e) => {
    const input = e.target as HTMLInputElement;
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowed.includes(e.key)) return;
    if (!/[\d-]/.test(e.key)) { e.preventDefault(); return; }
    if (input.value.length >= 10) e.preventDefault();
  }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Session Note <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Add note about this supervision..." 
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
                className='h-[20vh]'
              />
            </div>

            {/* Added: Optional Document Upload */}
            {renderFileInput(true)}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button className="bg-theme text-white hover:bg-theme/90" onClick={submitSchedule} disabled={!inputDate || isSubmitting || isUploading}>
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Completion Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Supervision</DialogTitle>
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
                dropdownMode='select'
                preventOpenOnFocus
                 onKeyDown={(e) => {
    const input = e.target as HTMLInputElement;
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowed.includes(e.key)) return;
    if (!/[\d-]/.test(e.key)) { e.preventDefault(); return; }
    if (input.value.length >= 10) e.preventDefault();
  }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Session Note <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Enter details about the supervision..." 
                value={inputNote} 
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
              />
            </div>

            {/* Document Required for Completion */}
            {renderFileInput(false)}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700" 
              onClick={submitCompletion} 
              disabled={isSubmitting || isUploading || !inputDate || uploadedFiles.length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog open={showEditLogModal} onOpenChange={setShowEditLogModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Log Document</DialogTitle>
            <DialogDescription>
              {editingLog?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Existing Documents */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Current Documents</Label>
              {(() => {
                const existingDocs = editingLog 
                  ? (Array.isArray(editingLog.document) 
                      ? editingLog.document 
                      : editingLog.document ? [editingLog.document] : [])
                  : [];
                
                return existingDocs.length > 0 ? (
                  <div className="space-y-2">
                    {existingDocs.map((docUrl, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span className="truncate text-xs text-gray-700" title={docUrl}>
                            {decodeURIComponent(docUrl.split('/').pop()?.split('?')[0] || `Document ${idx + 1}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleViewDocument(docUrl)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-100 hover:text-red-600" onClick={() => requestRemoveDocument('existing', idx)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-400">No documents attached.</p>
                );
              })()}
            </div>

            {/* Newly Uploaded Documents */}
            {editLogFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">New Documents to Add</Label>
                <div className="max-h-32 overflow-y-auto pr-1 space-y-2">
                  {editLogFiles.map((file, index) => (
                    <div key={`new-${index}`} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p className="truncate text-xs font-medium text-green-700" title={file.name}>
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
                  isUploading ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
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
                    <span className="text-sm font-medium text-gray-600">Add Documents</span>
                    <span className="text-xs text-gray-400">PDF/Images (Max 20MB)</span>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowEditLogModal(false)} disabled={isEditLogSubmitting || isUploading}>
              Cancel
            </Button>
            <Button className="bg-theme hover:bg-theme/90 text-white" onClick={handleSubmitEditLog} disabled={isEditLogSubmitting || isUploading}>
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
            <DialogDescription className="text-sm text-gray-600 pt-1">
              This document will be permanently removed and <span className="font-semibold text-gray-800">cannot be retrieved</span> once saved. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => { setShowRemoveWarning(false); setPendingRemoveIndex(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveDocument}>
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog Component */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
          <div className="flex items-center justify-between border-b px-6 py-4 bg-white z-10">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">Document Preview</DialogTitle>
              <DialogDescription className="mt-1 text-xs text-gray-500 truncate max-w-sm">
                {previewUrl?.split('/').pop()?.split('?')[0] || 'Unknown Document'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => previewUrl && handleForceDownload(previewUrl)}
                className="bg-theme text-white hover:bg-theme/90 shadow-sm"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button size="sm" variant={'outline'} onClick={()=> setIsPreviewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-100 p-4 flex flex-col items-center justify-center overflow-auto relative">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog> 
    </div>
  );
}

export default SupervisionTab;