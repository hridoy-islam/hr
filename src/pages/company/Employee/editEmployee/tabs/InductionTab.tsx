import React, { useEffect, useState, useRef } from 'react';
import {
  Calendar,
  History,
  TrendingUp,
  FileText,
  Upload,
  X,
  Eye,
  CheckSquare,
  Download,
  Pen,
  AlertCircle
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
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface InductionData {
  _id: string;
  employeeId: string;
  inductionDate: string;
  action?: string;
  noPromotion?: boolean;
  logs?: LogEntry[];
}

interface UploadedFile {
  name: string;
  url: string;
}

// --- Main Component ---

function InductionTab() {
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
  const [inductionId, setInductionId] = useState<string | null>(null);
  const [currentInductionDate, setCurrentInductionDate] = useState<
    string | null
  >(null);
  const [noPromotion, setNoPromotion] = useState<boolean>(false);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // Form Inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Promotion Choice State
  const [promotionChoice, setPromotionChoice] = useState<'yes' | 'no' | null>(
    null
  );

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
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<{
    type: 'existing' | 'new';
    index: number;
  } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const[leaverData,setLeaverData] = useState([]);

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewDialogOpen(true);
  };

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

  const fetchInductionData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/induction?employeeId=${eid}`);
      const result: InductionData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setInductionId(data._id);
        setCurrentInductionDate(data.inductionDate);
        setNoPromotion(data.noPromotion || false);
        setHistory(data.logs || []);
      } else {
        setInductionId(null);
        setCurrentInductionDate(null);
        setNoPromotion(false);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Induction data:', err);
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
      await fetchInductionData();
      await fetchLeaverData();
      setIsLoading(false);
    };
    loadData();
  }, [eid]);

  // --- Handlers ---

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !id) return;

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
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Open Handlers
  const handleOpenSchedule = () => {
    setInputDate(null);
    setUploadedFiles([]);
    setUploadError(null);
    setShowScheduleModal(true);
  };

  const handleOpenPromotion = () => {
    setInputDate(null);
    setUploadedFiles([]);
    setUploadError(null);
    setPromotionChoice(null); // Reset choice
    setShowPromotionModal(true);
  };

  // Submit: Schedule (Create ONLY)
  const submitSchedule = async () => {
    if (!inputDate || !id || uploadedFiles.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        inductionDate: new Date(
          Date.UTC(
            inputDate!.getFullYear(),
            inputDate!.getMonth(),
            inputDate!.getDate()
          )
        ).toISOString(),
        updatedBy: user._id,
        document: uploadedFiles.map((f) => f.url) // Passed as Array
      };

      // Only allowing create logic here as reschedule button is hidden if ID exists
      if (!inductionId) {
        await axiosInstance.post('/induction', {
          ...payload,
          employeeId: eid
        });
      }

      await fetchInductionData();
      toast({
        title: 'Induction scheduled successfully',
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

  // Submit: Promotion Logic
  const submitPromotion = async () => {
    if (!inductionId || !id || !promotionChoice) return;

    if (promotionChoice === 'yes' && (!inputDate || uploadedFiles.length === 0))
      return;

    setIsSubmitting(true);

    try {
      let payload: any = { updatedBy: user._id };

      if (promotionChoice === 'yes') {
        payload = {
          ...payload,
          action: 'promotion',
          inductionDate: new Date(
            Date.UTC(
              inputDate!.getFullYear(),
              inputDate!.getMonth(),
              inputDate!.getDate()
            )
          ).toISOString(),
          document: uploadedFiles.map((f) => f.url) // Array format
        };
      } else {
        payload = {
          ...payload,
          noPromotion: true
        };
      }

      await axiosInstance.patch(`/induction/${inductionId}`, payload);

      await fetchInductionData();
      toast({
        title:
          promotionChoice === 'yes'
            ? 'Employee Promoted'
            : 'Promotion Marked as No',
        className: 'bg-theme text-white'
      });
      setShowPromotionModal(false);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to update promotion',
        className: 'bg-destructive text-white'
      });
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
    if (!inductionId || !editingLog || !editingLog._id) return;

    setIsEditLogSubmitting(true);

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
        ? [editingLog.document]
        : [];

    const finalDocuments = [...existingDocs, ...editLogFiles.map((f) => f.url)];

    try {
      await axiosInstance.patch(
        `/induction/${inductionId}/logs/${editingLog._id}`,
        {
          document: finalDocuments
        }
      );

      await fetchInductionData();
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

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  // Reusable File Input Render
  const renderFileInput = (isOptional: boolean = false) => (
    <div className="space-y-3 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Supporting Document(s){' '}
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
        {/* Left Column: Status */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-theme" />
              Induction Status
            </h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Induction Date
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {currentInductionDate
                    ? moment(currentInductionDate).format('DD MMMM YYYY')
                    : 'Not Scheduled'}
                </div>
              </div>

              {noPromotion && (
                <div className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  <TrendingUp className="mt-0.5 h-4 w-4 rotate-180" />
                  <p>
                    Employee was marked as <strong>No Promotion</strong>.
                  </p>
                </div>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-6">
                {/* 1. Schedule Button (ONLY SHOW IF NOT SCHEDULED) */}
                {!currentInductionDate && (
                  <Button onClick={handleOpenSchedule} disabled={leaverData.length > 0} className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Induction Date
                  </Button>
                )}

                {/* 2. Promote Button - Hidden if noPromotion is true OR if Induction not scheduled yet */}
                {currentInductionDate && !noPromotion && (
                  <Button
                    onClick={handleOpenPromotion}
                    disabled={leaverData.length > 0}
                    className="w-full bg-theme text-white hover:bg-theme/90"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Promote Employee
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History */}
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
                    <TableHead className="text-right">Document(s)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center italic text-gray-500"
                      >
                        No history records found.
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
                                    Document{' '}
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
                                  Document
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

      {/* 1. Schedule Modal (Create Only) */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schedule Induction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Induction Date (DD-MM-YYYY)
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select date..."
                minDate={new Date()}
                showYearDropdown
                showMonthDropdown
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

            {/* Required Document for Scheduling */}
            {renderFileInput(false)}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white"
              onClick={submitSchedule}
              disabled={
                isSubmitting || !inputDate || uploadedFiles.length === 0
              }
            >
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Promotion Modal */}
      <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review for Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Step 1: The Question */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-800">
                Do you want to promote this employee?
              </Label>
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <div
                    onClick={() => setPromotionChoice('yes')}
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                      promotionChoice === 'yes'
                        ? 'border-theme bg-theme text-white'
                        : 'border-gray-400 bg-transparent'
                    )}
                  >
                    {promotionChoice === 'yes' && (
                      <CheckSquare className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Yes, Promote</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <div
                    onClick={() => setPromotionChoice('no')}
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                      promotionChoice === 'no'
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-400 bg-transparent'
                    )}
                  >
                    {promotionChoice === 'no' && <X className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm text-gray-700">
                    No, Do not promote
                  </span>
                </label>
              </div>
            </div>

            {/* Step 2: Conditional Inputs based on 'Yes' */}
            {promotionChoice === 'yes' && (
              <div className="space-y-4 border-t border-gray-100 pt-4 duration-200 animate-in fade-in zoom-in-95">
                <div className="flex flex-col space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    New Induction Date (DD-MM-YYYY)
                    <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    selected={inputDate}
                    onChange={(date) => setInputDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select new date..."
                    minDate={
                      currentInductionDate
                        ? new Date(currentInductionDate)
                        : new Date()
                    }
                    showYearDropdown
                    showMonthDropdown
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

                {/* Upload Section conditionally shown in Yes */}
                {renderFileInput(false)}
              </div>
            )}

            {/* Step 2b: Message for 'No' */}
            {promotionChoice === 'no' && (
              <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
                <p>
                  This will log a "No Promotion" decision and hide the promotion
                  option for this employee.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPromotionModal(false)}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                'text-white transition-colors',
                promotionChoice === 'no'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-theme hover:bg-theme/90'
              )}
              onClick={submitPromotion}
              disabled={
                isSubmitting ||
                !promotionChoice ||
                (promotionChoice === 'yes' &&
                  (!inputDate || uploadedFiles.length === 0))
              }
            >
              {isSubmitting ? 'Saving...' : 'Confirm Decision'}
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
                                `Document ${idx + 1}`
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
                <Label className="text-sm font-medium text-gray-700">
                  New Documents to Add
                </Label>
                <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
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

      {/* Document Preview Dialog Layout */}
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

export default InductionTab;
