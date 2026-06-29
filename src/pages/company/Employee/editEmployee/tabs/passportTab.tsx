import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Book, FileText, Upload, X, Eye, History, AlertCircle, Download, Pen } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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

// Interfaces based on your Mongoose Schema
interface LogEntry {
  _id: string;
  title: string;
  date: string;
  document?: string[] | string; // Updated to support array or legacy string
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface PassportData {
  _id: string;
  userId: string;
  passportNumber: string;
  passportExpiryDate: string;
  logs?: LogEntry[];
}

interface UploadedFile {
  name: string;
  url: string;
}

function PassportTab() {
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

  // Settings State (From ScheduleCheck)
  const [passportCheckInterval, setPassportCheckInterval] = useState<number>(0);
  
  // User Data State
  const [userData, setUserData] = useState<any>(null);

  // Current Data State
  const [passportId, setPassportId] = useState<string | null>(null);
  const [currentPassportNumber, setCurrentPassportNumber] = useState<string | null>(null);
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Form Inputs
  const [newPassportNumber, setNewPassportNumber] = useState<string>('');
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);
  
  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview Dialog State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Log Edit State
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editLogFiles, setEditLogFiles] = useState<UploadedFile[]>([]);
  const [editLogRemovedUrls, setEditLogRemovedUrls] = useState<string[]>([]);
  const [isEditLogSubmitting, setIsEditLogSubmitting] = useState(false);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<{ type: 'existing' | 'new'; index: number } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const[leaverData,setLeaverData] = useState([]);

  // 1. Fetch Schedule Settings
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setPassportCheckInterval(result[0].passportCheckDate || 0);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // 2. Fetch User Data to check noRtwCheck flag
  const fetchUserData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/users/${eid}`);
      setUserData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching user data:', err);
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


  // 3. Fetch Passport Data
  const fetchPassportData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/passport?userId=${eid}`);
      const result: PassportData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setPassportId(data._id);
        setCurrentPassportNumber(data.passportNumber);
        setCurrentExpiryDate(data.passportExpiryDate);
        setHistory(data.logs || []);
      } else {
        setPassportId(null);
        setCurrentPassportNumber(null);
        setCurrentExpiryDate(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Passport data:', err);
      toast({
        title: 'Failed to load Passport data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPassportData(), 
        fetchScheduleSettings(),
        fetchUserData(),
        fetchLeaverData()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [eid, id]);

  // 4. Status Calculation (Days Logic)
  useEffect(() => {
    // 1. Check override flag first
    if (userData?.noRtwCheck || leaverData.length > 0) {
      setComplianceStatus('no-check-required');
      return;
    }

    if (currentExpiryDate) {
      const now = moment().startOf('day');
      const expiry = moment(currentExpiryDate);
      
      const diffDays = expiry.diff(now, 'days');

      if (now.isAfter(expiry, 'day')) {
        setComplianceStatus('expired');
      } 
      else if (passportCheckInterval > 0 && diffDays <= passportCheckInterval) {
        setComplianceStatus('expiring-soon');
      } 
      else {
        setComplianceStatus('active');
      }
    } else {
      setComplianceStatus(null);
    }
  }, [currentExpiryDate, passportCheckInterval, userData]);

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
    if (!passportId || !editingLog) return;

    setIsEditLogSubmitting(true);

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
      ? [editingLog.document]
      : [];

    const finalDocuments = [...existingDocs, ...editLogFiles.map((f) => f.url)];

    try {
      await axiosInstance.patch(`/passport/${passportId}/logs/${editingLog._id}`, {
        document: finalDocuments
      });

      await fetchPassportData();
      toast({ title: 'Log document updated successfully!', className: 'bg-theme text-white' });
      setShowEditLogModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-3 py-1">
            No Check Required
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1">
            Active
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-3 py-1">
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-3 py-1">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  // File Upload Logic (Multiple Files)
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

  // Pre-fill data when opening modal
  const openUpdateModal = () => {
    setNewPassportNumber(currentPassportNumber || '');
    setNewExpiryDate(currentExpiryDate ? new Date(currentExpiryDate) : null);
    setUploadedFiles([]);
    setUploadError(null);
    setShowUpdateModal(true);
  };

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

  const handleSubmitUpdate = async () => {
    if (
      !id || 
      uploadedFiles.length === 0 || 
      !newExpiryDate || 
      !newPassportNumber
    ) return;

    setIsSubmitting(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      updatedBy: user._id,
      title: 'Passport Details Updated',
      document: uploadedFiles.map(f => f.url), // Array of URLs
      passportNumber: newPassportNumber,
passportExpiryDate: new Date(
  Date.UTC(
    newExpiryDate!.getFullYear(),
    newExpiryDate!.getMonth(),
    newExpiryDate!.getDate()
  )
).toISOString(),    };

    if (!passportId && eid) {
      payload.userId = eid;
    }

    try {
      const url = passportId ? `/passport/${passportId}` : `/passport`;
      const method = passportId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      await fetchPassportData();
      toast({
        title: 'Passport details updated successfully!',
        className: 'bg-theme text-white'
      });
      setShowUpdateModal(false);
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

  return (
    <div className="">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {/* Left Column: Status & Current Details */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Book className="h-5 w-5 text-theme" />
              Passport Status
            </h2>

            <div className="space-y-6">
              {/* Passport Number */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Passport Number
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {userData?.noRtwCheck  || leaverData.length > 0
                    ? 'N/A' 
                    : currentPassportNumber || 'Not Set'}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expiry Date
                </Label>
                <div className="text-lg font-bold text-gray-900">
                  {userData?.noRtwCheck  || leaverData.length > 0
                    ? 'N/A'
                    : currentExpiryDate
                    ? moment(currentExpiryDate).format('DD MMMM YYYY')
                    : 'Not Set'}
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-1">{getStatusBadge()}</div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 pt-6 space-y-3">
                <Button
                  onClick={openUpdateModal}
                  disabled={userData?.noRtwCheck || leaverData.length > 0}
                  className={cn(
                    "w-full text-white",
                    userData?.noRtwCheck  || leaverData.length > 0
                      ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed" 
                      : "bg-theme hover:bg-theme/90"
                  )}
                >
                  {userData?.noRtwCheck  || leaverData.length > 0
                    ? 'Update Not Required' 
                    : currentExpiryDate 
                      ? 'Update / Renew Passport' 
                      : 'Add Passport Details'}
                </Button>
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
                      <TableHead className="text-right">Actions / Document(s)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center italic text-gray-500">
                          No history records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history
                        .slice()
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <TableRow key={entry._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">
                              {entry.title || 'Update'}
                            </TableCell>
  
                            <TableCell className="">
                              <div className='flex '>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {entry.updatedBy && typeof entry.updatedBy === 'object'
                                    ? entry.updatedBy.name || `${entry.updatedBy.firstName ?? ''} ${entry.updatedBy.lastName ?? ''}`.trim()
                                    : 'System'}
                                </span>
                                <span className="text-xs ">
                                  {moment(entry.date).format('DD MMM YYYY')}
                                </span>
                              </div>
                              </div>
                            </TableCell>
  
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Edit Action Button */}
                              
                                <div className="flex flex-col items-end gap-1">
                                {/* Handle new array format */}
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
                                  <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEditLogModal(entry)}
                                >
                                  <Pen className="h-4 w-4" />
                                </Button>

                              </div>
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
            <DialogTitle>Update Passport Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Context Alert */}
            {currentExpiryDate && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>
                  Current passport expires on{' '}
                  <span className="font-semibold">
                    {moment(currentExpiryDate).format('DD MMM YYYY')}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Passport Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Passport Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter passport number"
                value={newPassportNumber}
                onChange={(e) => setNewPassportNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Expiry Date */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Expiry Date (DD-MM-YYYY)<span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={newExpiryDate}
                  onChange={(date) => setNewExpiryDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select expiry date..."
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  // minDate={
                  //   currentExpiryDate && moment(currentExpiryDate).isValid()
                  //     ? new Date(currentExpiryDate)
                  //     : new Date()
                  // }
                  onKeyDown={(e) => {
    const input = e.target as HTMLInputElement;
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowed.includes(e.key)) return;
    if (!/[\d-]/.test(e.key)) { e.preventDefault(); return; }
    if (input.value.length >= 10) e.preventDefault();
  }}
                />
                {currentExpiryDate && (
                  <p className="text-xs text-gray-500">
                    Must be after {moment(currentExpiryDate).format('DD MMM YYYY')}
                  </p>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                Passport Scan(s) <span className="text-red-500">*</span>
              </Label>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p className="truncate text-xs font-medium text-green-700" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
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
                  multiple // Enabled multiple selection
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
                      Upload Copy
                    </span>
                    <span className="text-xs text-gray-400">PDF/Images (Max 20MB each)</span>
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
                !newExpiryDate || 
                !newPassportNumber
              }
            >
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Log Document Dialog */}
      <Dialog open={showEditLogModal} onOpenChange={setShowEditLogModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Log Document</DialogTitle>
            <DialogDescription className="text-sm ">
              {editingLog?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Existing Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Current Documents</Label>
              {(() => {
                const existingDocs = Array.isArray(editingLog?.document)
                  ? editingLog!.document
                  : editingLog?.document
                  ? [editingLog.document]
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
                <Label className="text-sm font-medium text-gray-700">New Documents</Label>
                <div className="space-y-2">
                  {editLogFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="truncate text-xs font-medium text-green-700">{file.name}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 hover:bg-red-100 hover:text-red-600" onClick={() => requestRemoveDocument('new', idx)}>
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
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="text-xs text-blue-600">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Add Documents</span>
                  <span className="text-xs text-gray-400">PDF/Images (Max 20MB each)</span>
                </div>
              )}
            </div>

            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
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

      {/* Document Preview Dialog */}
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

export default PassportTab;