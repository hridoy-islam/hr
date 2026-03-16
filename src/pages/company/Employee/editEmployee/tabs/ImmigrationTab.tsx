import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Calendar, FileText, Upload, X, Eye, History, AlertCircle } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Interfaces based on the provided Mongoose model
interface HistoryEntry {
  _id: string;
  title: string;
  date: string;
  document?: string[] | string; // Updated to support array or legacy string
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface ImmigrationData {
  _id: string;
  nextCheckDate: string | null;
  employeeId: string;
  logs?: HistoryEntry[];
}

interface UploadedFile {
  name: string;
  url: string;
}

function ImmigrationTab() {
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
  const [userData, setUserData] = useState<any>(null);

  // Data State
  const [immigrationId, setImmigrationId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newCheckDate, setNewCheckDate] = useState<Date | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Operation Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Fetch Schedule Settings (Get Immigration Interval)
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setCheckInterval(result[0].immigrationCheckDate || 30);
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

  // 3. Fetch Immigration Data
  const fetchImmigrationData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(
        `/immigration?employeeId=${eid}`
      );
      const dataList: ImmigrationData[] = res.data.data.result;

      if (dataList.length > 0) {
        const record = dataList[0];
        setImmigrationId(record._id);

        // Store current check date for display
        setCurrentCheckDate(record.nextCheckDate);

        // Set history
        setHistory(record.logs || []);
      } else {
        setImmigrationId(null);
        setCurrentCheckDate(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Immigration data:', err);
      toast({
        title: 'Failed to load Immigration data.',
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
        fetchImmigrationData(),
        fetchUserData()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [eid, id]);

  // 4. Status Calculation (Using Days Logic exactly like Passport/Visa)
  useEffect(() => {
    // 1. Check override flag first
    if (userData?.noRtwCheck) {
      setComplianceStatus('no-check-required');
      return;
    }

    if (currentCheckDate) {
      const now = moment().startOf('day');
      // Added robust parsing format fallback in case of string formats
      const checkDate = moment(currentCheckDate, [moment.ISO_8601, 'DD MMMM YYYY', 'YYYY-MM-DD']).startOf('day');
      
      const diffDays = checkDate.diff(now, 'days');

      // 2. Check if Expired (Date has passed mathematically)
      if (diffDays < 0) {
        setComplianceStatus('expired');
      } 
      // 3. Check if Expiring Soon (Within the checkInterval window)
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
      if (!validTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Only PDF, JPEG, or PNG allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
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

  const openUpdateModal = () => {
    setNewCheckDate(currentCheckDate ? new Date(currentCheckDate) : null);
    setUploadedFiles([]);
    setUploadError(null);
    setShowUpdateModal(true);
  };

  // Submit Logic
  const handleSubmitUpdate = async () => {
    if (!id || uploadedFiles.length === 0 || !newCheckDate) return;

    setIsSubmitting(true);

    const payload: any = {
      updatedBy: user._id,
      document: uploadedFiles.map(f => f.url), // Array of URLs
      title: uploadedFiles.map(f => f.name).join(', ') || 'Immigration Status Check Updated',
      nextCheckDate: moment(newCheckDate).toISOString()
    };

    if (!immigrationId && eid) {
      payload.employeeId = eid;
    }

    try {
      const url = immigrationId ? `/immigration/${immigrationId}` : `/immigration`;
      const method = immigrationId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      await fetchImmigrationData();
      toast({
        title: 'Immigration status updated successfully!',
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
        {/* Left Column: Status & Action */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-theme" />
              Immigration Status
            </h2>

            <div className="space-y-8">
              {/* Status Display */}
              <div className="space-y-2">
                <Label className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Next Check Date
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
                    "w-full text-white",
                    userData?.noRtwCheck 
                      ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed" 
                      : "bg-theme hover:bg-theme/90"
                  )}
                >
                  {userData?.noRtwCheck ? 'Update Not Required' : 'Update Next Check Date'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Log & Documents */}
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
                            {entry.title || 'Update'}
                          </TableCell>

                          <TableCell className="">
                            <div className='flex '>
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
                              {/* Handle array formats */}
                              {Array.isArray(entry.document) && entry.document.length > 0 ? (
                                entry.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => window.open(docUrl, '_blank')}
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
                                  onClick={() => window.open(entry.document as string, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Document 
                                </Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Immigration Status Check</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Context Alert */}
            {currentCheckDate && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
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
                New Next Check Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newCheckDate}
                onChange={(date) => setNewCheckDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode='select'
                minDate={
                  currentCheckDate && moment(currentCheckDate).isValid()
                    ? new Date(currentCheckDate)
                    : new Date()
                }
                preventOpenOnFocus
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                Supporting Document(s) <span className="text-red-500">*</span>
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
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Upload Proof
                    </span>
                    <span className="text-xs text-gray-400">PDF/Images (Max 5MB each)</span>
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
                isSubmitting || isUploading || uploadedFiles.length === 0 || !newCheckDate
              }
            >
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImmigrationTab;