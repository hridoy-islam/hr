import React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  Calendar,
  FileText,
  Upload,
  X,
  Eye,
  History,
  AlertCircle,
  Download, // Imported for the download features in the preview modal
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription // Imported for the preview modal metadata sub-header
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface UploadedFile {
  name: string;
  url: string;
}

interface HistoryEntry {
  _id: string;
  title: string;
  date: string;
  document?: string[] | string; // Supports array of strings and legacy string fallback
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface RTWData {
  _id: string;
  nextCheckDate: string | null;
  status: 'active' | 'expired' | 'needs-check';
  employeeId: string;
  logs?: HistoryEntry[];
}

function RightToWorkTab() {
  const { id, eid } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Display State
  const [complianceStatus, setComplianceStatus] = useState<
    'active' | 'expired' | 'expiring-soon' | 'no-check-required' | null
  >(null);
  const [currentCheckDate, setCurrentCheckDate] = useState<string | null>(null);
  const [checkInterval, setCheckInterval] = useState<number>(0);

  // User Data State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);

  // Data State
  const [rtwId, setRtwId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newCheckDate, setNewCheckDate] = useState<Date | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Preview Dialog State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<HistoryEntry | null>(null);
  const [editLogFiles, setEditLogFiles] = useState<UploadedFile[]>([]);
  const [editLogRemovedUrls, setEditLogRemovedUrls] = useState<string[]>([]);
  const [isEditLogSubmitting, setIsEditLogSubmitting] = useState(false);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<{
    type: 'existing' | 'new';
    index: number;
  } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Schedule Settings
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setCheckInterval(result[0].rtwCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // 2. Fetch User Data
  const fetchUserData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/users/${eid}`);
      setUserData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // 3. Fetch RTW Data
  const fetchRTWData = async () => {
    if (!eid) return;
    try {
      const rtwRes = await axiosInstance.get(
        `/hr/right-to-work?employeeId=${eid}`
      );
      const rtwList: RTWData[] = rtwRes.data.data.result;

      if (rtwList.length > 0) {
        const rtwData = rtwList[0];
        setRtwId(rtwData._id);

        // Store current check date for display
        setCurrentCheckDate(rtwData.nextCheckDate);

        // Set history
        setHistory(rtwData.logs || []);
      } else {
        setRtwId(null);
        setCurrentCheckDate(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching RTW data:', err);
      toast({
        title: 'Failed to load RTW data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchScheduleSettings(),
        fetchRTWData(),
        fetchUserData()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [id, eid]);

  // 4. Status Calculation (Warning threshold = checkInterval)
  useEffect(() => {
    // 1. Check override flag first
    if (userData?.noRtwCheck) {
      setComplianceStatus('no-check-required');
      return;
    }

    if (currentCheckDate) {
      const now = moment().startOf('day'); // Normalize to start of day for accurate comparison
      const checkDate = moment(currentCheckDate).startOf('day');
      const diffDays = checkDate.diff(now, 'days');

      // 2. Check if Expired (Date has passed)
      if (now.isAfter(checkDate)) {
        setComplianceStatus('expired');
      }
      // 3. Check if Expiring Soon (Within the checkInterval window)
      // Example: If interval is 30 days, warning shows if remaining days <= 30
      else if (checkInterval > 0 && diffDays <= checkInterval) {
        setComplianceStatus('expiring-soon');
      }
      // 4. Otherwise Active
      else {
        setComplianceStatus('active');
      }
    } else {
      setComplianceStatus(null);
    }
  }, [currentCheckDate, checkInterval, userData]);

  const openEditLogModal = (entry: HistoryEntry) => {
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
    if (!rtwId || !editingLog) return;

    setIsEditLogSubmitting(true);

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
        ? [editingLog.document]
        : [];

    const finalDocuments = [...existingDocs, ...editLogFiles.map((f) => f.url)];

    try {
      await axiosInstance.patch(
        `/hr/right-to-work/${rtwId}/logs/${editingLog._id}`,
        {
          document: finalDocuments
        }
      );

      await fetchRTWData();
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

  const getStatusBadge = () => {
    switch (complianceStatus) {
      case 'no-check-required':
        return (
          <Badge className="bg-gray-100 px-3 py-1 text-gray-800 hover:bg-gray-100">
            No Check Required
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-100">
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 px-3 py-1 text-red-800 hover:bg-red-100">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  // File Upload Logic
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !eid) return;

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
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const openUpdateModal = () => {
    setNewCheckDate(null);
    setUploadedFiles([]);
    setUploadError(null);
    setShowUpdateModal(true);
  };

  // Document Viewer Handlers
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

  // Submit Logic
  const handleSubmitUpdate = async () => {
    if (!eid || uploadedFiles.length === 0 || !newCheckDate) return;

    setIsSubmitting(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      updatedBy: user._id,
      document: uploadedFiles.map((f) => f.url),
      title: 'Right to Work Check',
      nextCheckDate: new Date(
        Date.UTC(
          newCheckDate!.getFullYear(),
          newCheckDate!.getMonth(),
          newCheckDate!.getDate()
        )
      ).toISOString()
    };

    if (!rtwId && eid) {
      payload.employeeId = eid;
    }

    try {
      const url = rtwId ? `/hr/right-to-work/${rtwId}` : `/hr/right-to-work`;
      const method = rtwId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      await fetchRTWData();
      toast({
        title: 'RTW check updated successfully!',
        className: 'bg-theme text-white'
      });
      setShowUpdateModal(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast({
        title: err.response?.data?.message || 'Update failed.',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const MaskedDateInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >(({ value, onChange, onClick, onFocus, onBlur, placeholder }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
      let masked = raw;

      if (raw.length > 2) masked = raw.slice(0, 2) + '-' + raw.slice(2);
      if (raw.length > 4)
        masked = raw.slice(0, 2) + '-' + raw.slice(2, 4) + '-' + raw.slice(4);

      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: masked }
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    };

    return (
      <input
        ref={ref}
        value={value}
        onChange={handleChange}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder ?? 'dd-mm-yyyy'}
        maxLength={10}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  });

  MaskedDateInput.displayName = 'MaskedDateInput';

  return (
    <div className=" ">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {/* Left Column: Status & Action */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-theme" />
              RTW Status
            </h2>

            <div className="space-y-8">
              {/* Status Display */}
              <div className="space-y-2">
                <Label className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  RTW Next Check Date
                </Label>
                <div className="text-2xl font-bold text-gray-900">
                  {userData?.noRtwCheck
                    ? 'N/A'
                    : currentCheckDate
                      ? moment(currentCheckDate).format('DD MMMM YYYY')
                      : 'Not Set'}
                </div>

                <div className="pt-1">{getStatusBadge()}</div>
              </div>

              {/* Action Button */}
              <div className="border-t border-gray-100 pt-4">
                <Button
                  onClick={openUpdateModal}
                  disabled={userData?.noRtwCheck}
                  className={cn(
                    'w-full text-white',
                    userData?.noRtwCheck
                      ? 'cursor-not-allowed bg-gray-300 hover:bg-gray-300'
                      : 'bg-theme hover:bg-theme/90'
                  )}
                >
                  {userData?.noRtwCheck
                    ? 'Update Not Required'
                    : 'Update Next Check Date'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Log & Documents */}
        <div className="lg:col-span-2">
          <div className=" rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
                    <TableHead className="text-right">Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
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
                        <TableRow key={entry._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            {entry.title || 'Update'}
                          </TableCell>

                          <TableCell className="">
                            <div className="flex ">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {entry.updatedBy &&
                                  typeof entry.updatedBy === 'object'
                                    ? entry.updatedBy.name ||
                                      `${entry.updatedBy.firstName ?? ''} ${entry.updatedBy.lastName ?? ''}`.trim()
                                    : 'System'}
                                </span>
                                <span className="text-xs ">
                                  {moment(entry.date).format('DD MMM YYYY')}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              {/* Handle array format */}
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

      {/* Update Dialog */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Update RTW Status Check</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Context Alert */}
            {currentCheckDate && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  Current check expires on{' '}
                  <span className="font-semibold">
                    {moment(currentCheckDate).format('DD MMM YYYY')}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Date Input */}
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                New Next Check Date (DD-MM-YYYY)
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newCheckDate}
                onChange={(date) => setNewCheckDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={
                  currentCheckDate && moment(currentCheckDate).isValid()
                    ? new Date(currentCheckDate)
                    : new Date()
                }
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

            {/* Document Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Supporting Document(s) <span className="text-red-500">*</span>
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
                  multiple
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
                      Upload Proof
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF/Images (Max 20MB each)
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
              onClick={() => setShowUpdateModal(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              onClick={handleSubmitUpdate}
              disabled={
                isSubmitting ||
                isUploading ||
                uploadedFiles.length === 0 ||
                !newCheckDate
              }
            >
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
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

      {/* Edit Log Document Dialog */}
      <Dialog open={showEditLogModal} onOpenChange={setShowEditLogModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Log Document</DialogTitle>
            <DialogDescription className="text-sm ">
              {editingLog?.title}
              {/* &mdash; {editingLog?.date ? moment(editingLog.date).format('DD MMM YYYY') : ''} */}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Existing Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Current Documents
              </Label>
              {(() => {
                const existingDocs = Array.isArray(editingLog?.document)
                  ? editingLog!.document
                  : editingLog?.document
                    ? [editingLog.document]
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
                  New Documents
                </Label>
                <div className="space-y-2">
                  {editLogFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="truncate text-xs font-medium text-green-700">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                        onClick={() => requestRemoveDocument('new', idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Zone */}
            <div
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors',
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
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="text-xs text-blue-600">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Add Documents
                  </span>
                  <span className="text-xs text-gray-400">
                    PDF/Images (Max 20MB each)
                  </span>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
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
    </div>
  );
}

export default RightToWorkTab;
