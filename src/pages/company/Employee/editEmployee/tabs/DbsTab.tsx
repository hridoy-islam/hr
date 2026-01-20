import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, FileText, Upload, X, Eye, History } from 'lucide-react';
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

interface LogEntry {
  _id: string;
  title: string;
  date: string;
  document: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface DbsData {
  _id: string;
  userId: string;
  disclosureNumber: string;
  dbsDocumentUrl: string;
  dateOfIssue: string;
  expiryDate: string;
  logs?: LogEntry[];
}

function DbsTab() {
  const { id } = useParams();
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // --- UPDATED: Display State to include 'expiring-soon' ---
  const [complianceStatus, setComplianceStatus] = useState<
    'active' | 'expired' | 'expiring-soon' | null
  >(null);

  // Settings State (From ScheduleCheck)
  const [dbsCheckInterval, setDbsCheckInterval] = useState<number>(0);

  // Current Data State
  const [dbsId, setDbsId] = useState<string | null>(null);
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string | null>(
    null
  );
  const [currentDateOfIssue, setCurrentDateOfIssue] = useState<string | null>(
    null
  );
  const [currentDisclosureNum, setCurrentDisclosureNum] = useState<
    string | null
  >(null);
  const [currentDbsDocUrl, setCurrentDbsDocUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form Inputs
  const [newDisclosureNumber, setNewDisclosureNumber] = useState<string>('');
  const [newDateOfIssue, setNewDateOfIssue] = useState<Date | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // File Upload State
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Fetch Schedule Settings (To get auto-calculation interval)
  const fetchScheduleSettings = async () => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${user._id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setDbsCheckInterval(result[0].dbsCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // 2. Fetch DBS Data
  const fetchDbsData = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/dbs?userId=${id}`);
      const result: DbsData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setDbsId(data._id);
        setCurrentExpiryDate(data.expiryDate);
        setCurrentDateOfIssue(data.dateOfIssue);
        setCurrentDisclosureNum(data.disclosureNumber);
        setCurrentDbsDocUrl(data.dbsDocumentUrl);
        setHistory(data.logs || []);
      } else {
        setDbsId(null);
        setCurrentExpiryDate(null);
        setCurrentDateOfIssue(null);
        setCurrentDisclosureNum(null);
        setCurrentDbsDocUrl(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching DBS data:', err);
      toast({
        title: 'Failed to load DBS data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDbsData(), fetchScheduleSettings()]);
      setIsLoading(false);
    };
    loadData();
  }, [id, user?._id]);

  // --- UPDATED: Status Calculation Logic ---
  useEffect(() => {
    if (currentExpiryDate) {
      const now = moment();
      const expiry = moment(currentExpiryDate);

      // Calculate difference in days
      const diffDays = expiry.diff(now, 'days');

      // 1. Check if Expired (Now is after Expiry)
      if (now.isAfter(expiry, 'day')) {
        setComplianceStatus('expired');
      }
      // 2. Check if Expiring Soon (Within the checkInterval window)
      // Note: Assuming checkInterval is the warning threshold in days (e.g., 30 days)
      else if (dbsCheckInterval > 0 && diffDays <= dbsCheckInterval) {
        setComplianceStatus('expiring-soon');
      }
      // 3. Otherwise Active
      else {
        setComplianceStatus('active');
      }
    } else {
      setComplianceStatus(null);
    }
  }, [currentExpiryDate, dbsCheckInterval]);

  // Auto-calculate Expiry Date based on Issue Date + Interval
  const handleIssueDateChange = (date: Date | null) => {
    setNewDateOfIssue(date);

    // If we have a date and a configured interval > 0
    // Note: This assumes interval is used as Months for validity period
    if (date && dbsCheckInterval > 0) {
      const calculatedExpiry = moment(date)
        .add(dbsCheckInterval, 'months')
        .toDate();
      setNewExpiryDate(calculatedExpiry);
    }
  };

  // File Upload Logic
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?._id) return;

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

  // Open Modal Logic
  const openUpdateModal = () => {
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);

    setNewDisclosureNumber(currentDisclosureNum || '');

    if (currentDateOfIssue) {
      setNewDateOfIssue(new Date(currentDateOfIssue));
    } else {
      setNewDateOfIssue(new Date());
    }

    if (currentExpiryDate) {
      setNewExpiryDate(new Date(currentExpiryDate));
    } else {
      setNewExpiryDate(null);
    }

    setShowUpdateModal(true);
  };

  // Submit Logic
  const handleSubmitUpdate = async () => {
    if (
      !user?._id ||
      !uploadedFileUrl ||
      !newExpiryDate ||
      !newDateOfIssue ||
      !newDisclosureNumber
    )
      return;

    setIsSubmitting(true);

    const payload: any = {
      updatedBy: user._id,
      title: 'DBS Details Updated',
      dbsDocumentUrl: uploadedFileUrl,
      disclosureNumber: newDisclosureNumber,
      dateOfIssue: moment(newDateOfIssue).toISOString(),
      expiryDate: moment(newExpiryDate).toISOString(),
      date: new Date().toISOString()
    };

    if (!dbsId && id) {
      payload.userId = id;
    }

    try {
      const url = dbsId ? `/dbs/${dbsId}` : `/dbs`;
      const method = dbsId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      await fetchDbsData();
      toast({
        title: 'DBS details updated successfully!',
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
          <div className="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <ShieldCheck className="h-5 w-5 text-theme" />
              DBS Status
            </h2>

            <div className="space-y-6">
              {/* Disclosure Number */}
              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Disclosure Number
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {currentDisclosureNum || 'Not Set'}
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

              {/* --- UPDATED: Status Badge with 3 States --- */}
              {complianceStatus && (
                <div>
                  <Badge
                    className={cn(
                      'px-3 py-1 text-sm',
                      complianceStatus === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : complianceStatus === 'expiring-soon'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                    )}
                  >
                    {complianceStatus === 'active'
                      ? 'Active'
                      : complianceStatus === 'expiring-soon'
                        ? 'Expiring Soon'
                        : 'Expired'}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 border-t border-gray-100 pt-6">
                {currentDbsDocUrl && (
                  <Button
                    variant="outline"
                    className="w-full "
                    onClick={() => window.open(currentDbsDocUrl, '_blank')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                )}

                <Button
                  onClick={openUpdateModal}
                  className="w-full bg-theme text-white hover:bg-theme/90"
                >
                  {currentExpiryDate ? 'Update / Renew DBS' : 'Add DBS Details'}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update DBS Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Disclosure Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Disclosure Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter certificate number"
                value={newDisclosureNumber}
                onChange={(e) => setNewDisclosureNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date of Issue */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date of Issue <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={newDateOfIssue}
                  onChange={handleIssueDateChange}
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select date..."
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  // Min date = Previous Expiry Date if preferred
                  minDate={
                    currentExpiryDate ? new Date(currentExpiryDate) : undefined
                  }
                />
                {currentExpiryDate && (
                  <p className="text-xs text-gray-500">
                    Must be on or after{' '}
                    {moment(currentExpiryDate).format('DD MMM YYYY')}
                  </p>
                )}
              </div>

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
                  placeholderText="Select date..."
                  showMonthDropdown
                  showYearDropdown
                  minDate={newDateOfIssue || undefined}
                  dropdownMode="select"
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                DBS Certificate Scan <span className="text-red-500">*</span>
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
                      Upload Certificate
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
                !newDateOfIssue ||
                !newDisclosureNumber
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

export default DbsTab;
