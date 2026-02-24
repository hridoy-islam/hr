import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Book, FileText, Upload, X, Eye, History, AlertCircle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Interfaces based on your Mongoose Schema
interface LogEntry {
  _id: string;
  title: string;
  date: string;
  document?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface PassportData {
  _id: string;
  userId: string;
  passportNumber: string;
  passportExpiryDate: string;
  logs?: LogEntry[];
}

function PassportTab() {
  const { id,eid } = useParams();
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
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        fetchUserData()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [eid, id]);

  // 4. Status Calculation (Days Logic)
  useEffect(() => {
    // 1. Check override flag first
    if (userData?.noRtwCheck) {
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

  // File Upload Logic
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PDF, JPEG, or PNG files are allowed.');
      return;
    }
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

  // Pre-fill data when opening modal
  const openUpdateModal = () => {
    setNewPassportNumber(currentPassportNumber || '');
    setNewExpiryDate(currentExpiryDate ? new Date(currentExpiryDate) : null);
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    if (
      !id || 
      !uploadedFileUrl || 
      !newExpiryDate || 
      !newPassportNumber
    ) return;

    setIsSubmitting(true);

    const payload: any = {
      updatedBy: user._id,
      title: 'Passport Details Updated',
      document: uploadedFileUrl,
      passportNumber: newPassportNumber,
      passportExpiryDate: moment(newExpiryDate).toISOString(),
    };

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
                  {userData?.noRtwCheck 
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
                  {userData?.noRtwCheck 
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
                  disabled={userData?.noRtwCheck}
                  className={cn(
                    "w-full text-white",
                    userData?.noRtwCheck 
                      ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed" 
                      : "bg-theme hover:bg-theme/90"
                  )}
                >
                  {userData?.noRtwCheck 
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
                                  {/* Date & Time Column Removed */}
                                  <TableHead>Activity</TableHead>
                                  <TableHead >Updated By</TableHead>
                                  <TableHead className="text-right">Document</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {history.length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={3} // Adjusted colspan from 4 to 3
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
                                        {/* Date Cell Removed */}
              
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
                                            {/* Date moved here underneath the name */}
                                            <span className="text-xs ">
                                              {moment(entry.date).format('DD MMM YYYY')}
                                            </span>
                                          </div>
                                          </div>
                                        </TableCell>
              
                                        <TableCell className="text-right">
                                          {entry.document ? (
                                            <Button
                                              size="sm"
                                              className="h-8"
                                              onClick={() =>
                                                window.open(entry.document, '_blank')
                                              }
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

      {/* Update Dialog */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="sm:max-w-xl">
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
                  Expiry Date <span className="text-red-500">*</span>
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
                  // UPDATED LOGIC: Cannot select a date before the current expiry (if exists)
                  minDate={
                    currentExpiryDate && moment(currentExpiryDate).isValid()
                      ? new Date(currentExpiryDate)
                      : new Date()
                  }
                />
                {currentExpiryDate && (
                  <p className="text-xs text-gray-500">
                    Must be after {moment(currentExpiryDate).format('DD MMM YYYY')}
                  </p>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                Passport Scan <span className="text-red-500">*</span>
              </Label>

              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                  uploadedFileUrl
                    ? 'border-green-500 bg-green-50'
                    : isUploading
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
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
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-green-700">
                          File attached
                        </p>
                        <p className="max-w-[150px] truncate text-xs text-gray-500">
                          {selectedFileName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Upload Copy
                    </span>
                    <span className="text-xs text-gray-400">PDF/Image</span>
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
                !uploadedFileUrl || 
                !newExpiryDate || 
                !newPassportNumber
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

export default PassportTab;