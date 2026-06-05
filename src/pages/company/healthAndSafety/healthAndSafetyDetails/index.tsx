import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  Activity,
  FileText,
  Upload,
  X,
  Eye,
  History,
  AlertCircle,
  MoveLeft,
  Download // Imported for document download actions
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
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
  DialogDescription // Imported to cleanly bind into the description slots
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Interfaces based on your Mongoose Schema
interface LogEntry {
  _id: string;
  title: string;
  date: string;
  document?: string[];
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface HealthSafetyData {
  _id: string;
  companyId: string;
  title: string;
  startDate: string;
  expiryDate: string;
  document?: string[];
  logs?: LogEntry[];
}

interface UploadedFile {
  name: string;
  url: string;
}

function HealthAndSafetyDetails() {
  const { id, hid } = useParams(); // id = companyId, hid = healthSafetyId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Display State
  const [complianceStatus, setComplianceStatus] = useState<
    'active' | 'expired' | 'expiring-soon' | null
  >(null);

  // Settings State (From ScheduleCheck)
  const [checkInterval, setCheckInterval] = useState<number>(30);

  // Current Data State
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentStartDate, setCurrentStartDate] = useState<string | null>(null);
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string | null>(
    null
  );
  const [currentDocuments, setCurrentDocuments] = useState<string[]>([]);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form Inputs
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Preview Dialog State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // 1. Fetch Schedule Settings (Uses healthSafetyCheckDate or defaults to 30)
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        // Adjust this key if your DB uses a different name for Health & Safety
        setCheckInterval(result[0].healthSafetyCheckDate || result[0].policyCheckDate || 30);
      } else {
        setCheckInterval(30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
      setCheckInterval(30); // Fallback on error
    }
  };

  // 2. Fetch Health & Safety Data
  const fetchHealthSafetyData = async () => {
    if (!hid) return;
    try {
      // Assuming your API looks up by the Health & Safety ID
      const res = await axiosInstance.get(`/health-and-safety/${hid}`);
      const data: HealthSafetyData = res.data?.data;

      if (data) {
        setCurrentTitle(data.title);
        setCurrentStartDate(data.startDate);
        setCurrentExpiryDate(data.expiryDate);
        setCurrentDocuments(data.document || []);
        setHistory(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching Health & Safety data:', err);
      toast({
        title: 'Failed to load Health & Safety data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchHealthSafetyData(), fetchScheduleSettings()]);
      setIsLoading(false);
    };
    loadData();
  }, [hid, id]);

  // 3. Status Calculation
  useEffect(() => {
    if (currentExpiryDate) {
      const now = moment().startOf('day');
      const expiry = moment(currentExpiryDate);
      const diffDays = expiry.diff(now, 'days');

      if (now.isAfter(expiry, 'day')) {
        setComplianceStatus('expired');
      } else if (diffDays <= checkInterval) {
        setComplianceStatus('expiring-soon');
      } else {
        setComplianceStatus('active');
      }
    } else {
      setComplianceStatus(null);
    }
  }, [currentExpiryDate, checkInterval]);

  const getStatusBadge = () => {
    switch (complianceStatus) {
      case 'active':
        return (
          <Badge className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-yellow-100 px-3 py-1 text-yellow-800 hover:bg-yellow-100">
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
    if (!files.length) return;

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Pre-fill data when opening modal
  const openUpdateModal = () => {
    setNewTitle(currentTitle || '');
    setNewStartDate(currentStartDate ? new Date(currentStartDate) : null);
    setNewExpiryDate(currentExpiryDate ? new Date(currentExpiryDate) : null);
    setUploadedFiles([]);
    setUploadError(null);
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    if (!hid  || !newTitle) return;

    setIsSubmitting(true);

    const normalizeDate = (date: Date | null) => {
      if (!date) return date;
      return new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          12,
          0,
          0,
          0
        )
      );
    };
    const payload = {
      updatedBy: user._id,
      title: newTitle,
      startDate: normalizeDate(newStartDate),
      expiryDate: normalizeDate(newExpiryDate),
      document: uploadedFiles.map((f) => f.url)
    };

    try {
      await axiosInstance.patch(`/health-and-safety/${hid}`, payload);
      await fetchHealthSafetyData();

      toast({
        title: 'Health & Safety details updated successfully!',
        className: 'bg-theme border-none text-white'
      });
      setShowUpdateModal(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: err.response?.data?.message || 'Update failed.',
        className: 'bg-red-500 border-none text-white'
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
      <div className=" mb-4 flex items-center justify-between">
        <h2 className=" flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Activity className="h-5 w-5 text-theme" />
          Health & Safety Details
        </h2>
        <Button
          variant="outline"
          className="border-none bg-theme text-white hover:bg-theme/90"
          onClick={() => navigate(-1)}
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Record Title
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {currentTitle || 'Not Set'}
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Start Date
                </Label>
                <div className="text-md font-medium text-gray-800">
                  {currentStartDate
                    ? moment(currentStartDate).format('DD MMMM YYYY')
                    : 'Not Set'}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expiry Date
                </Label>
                <div className="text-lg font-bold text-gray-900">
                  {currentExpiryDate
                    ? moment(currentExpiryDate).format('DD MMMM YYYY')
                    : 'Not Set'}
                </div>
              </div>

              {/* Current Documents (if any) */}
              {currentDocuments.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Active Documents
                  </Label>
                  <div className="flex flex-col gap-2 pt-1">
                    {currentDocuments.map((docUrl, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleViewDocument(docUrl)}
                      >
                        <Eye className="mr-2 h-4 w-4 " />
                        View Document{' '}
                        {currentDocuments.length > 1 ? idx + 1 : ''}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="pt-1">{getStatusBadge()}</div>

              {/* Action Buttons */}
              <div className="space-y-3 border-t border-gray-100 pt-6">
                <Button
                  onClick={openUpdateModal}
                  className="w-full bg-theme text-white hover:bg-theme/90"
                >
                  Update Record
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
                    <TableHead className="text-right">Document(s)</TableHead>
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
                            {entry.title || 'Record Update'}
                          </TableCell>

                          <TableCell className="">
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
                              {Array.isArray(entry.document) &&
                              entry.document.length > 0 ? (
                                entry.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    className="h-8 border border-gray-200"
                                    onClick={() => handleViewDocument(docUrl)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Doc{' '}
                                    {entry.document!.length > 1 ? idx + 1 : ''}
                                  </Button>
                                ))
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
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
            <DialogTitle>Update Health & Safety Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Context Alert */}
            {currentExpiryDate && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  Current record expires on{' '}
                  <span className="font-semibold">
                    {moment(currentExpiryDate).format('DD MMM YYYY')}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Record Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter record title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Start Date */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Start Date
                </Label>
                <DatePicker
                  selected={newStartDate}
                  onChange={(date) => setNewStartDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select start date..."
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Expiry Date 
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
                  minDate={newStartDate || undefined}
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                Document(s)
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
                      Upload Document
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
                !newTitle
              }
            >
              {isSubmitting ? 'Saving...' : 'Update Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
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

export default HealthAndSafetyDetails;