import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  Award,
  FileText,
  Upload,
  X,
  Eye,
  History,
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

// Interfaces based on the common structure
interface HistoryEntry {
  _id: string;
  title: string;
  date: string;
  document?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface AppraisalData {
  _id: string;
  nextCheckDate: string | null;
  employeeId: string;
  logs?: HistoryEntry[];
}

function AppraisalTab() {
  const { id ,eid} = useParams();
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Display State
  const [complianceStatus, setComplianceStatus] = useState<
    'active' | 'expired' | 'expiring-soon' | null
  >(null);

  // Settings State (Configured Interval)
  const [checkInterval, setCheckInterval] = useState<number>(0);

  // Data State
  const [appraisalId, setAppraisalId] = useState<string | null>(null);
  const [currentCheckDate, setCurrentCheckDate] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Modal & Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newCheckDate, setNewCheckDate] = useState<Date | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Operation Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Fetch Schedule Settings (Get Appraisal Interval)
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        // Mapping to appraisalCheckDate
        setCheckInterval(result[0].appraisalCheckDate || 90);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // 2. Fetch Appraisal Data
  const fetchAppraisalData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/appraisal?employeeId=${eid}`);
      const dataList: AppraisalData[] = res.data.data.result;

      if (dataList.length > 0) {
        const record = dataList[0];
        setAppraisalId(record._id);
        setCurrentCheckDate(record.nextCheckDate);
        setHistory(record.logs || []);
      } else {
        setAppraisalId(null);
        setCurrentCheckDate(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Appraisal data:', err);
      toast({
        title: 'Failed to load Appraisal data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchScheduleSettings(), fetchAppraisalData()]);
      setIsLoading(false);
    };
    loadData();
  }, [eid, id]);

  // 3. Status Calculation (Exact logic from ImmigrationTab)
  useEffect(() => {
    if (currentCheckDate) {
      const now = moment().startOf('day');
      const checkDate = moment(currentCheckDate).startOf('day');
      const diffDays = checkDate.diff(now, 'days');

      if (now.isAfter(checkDate)) {
        setComplianceStatus('expired');
      }
      // Check if within warning interval
      else if (checkInterval > 0 && diffDays <= checkInterval) {
        setComplianceStatus('expiring-soon');
      } else {
        setComplianceStatus('active');
      }
    } else {
      setComplianceStatus(null);
    }
  }, [currentCheckDate, checkInterval]);

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

  // Modal Open Logic: Reset form
  const openUpdateModal = () => {
    setNewCheckDate(null);
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setShowUpdateModal(true);
  };

  // Submit Logic
  const handleSubmitUpdate = async () => {
    if (!id || !uploadedFileUrl || !newCheckDate) return;

    setIsSubmitting(true);

    const payload: any = {
      updatedBy: user._id,
      document: uploadedFileUrl,
      title: selectedFileName || 'Appraisal Check Completed',
      nextCheckDate: moment(newCheckDate).toISOString()
    };

    if (!appraisalId && eid) {
      payload.employeeId = eid;
    }

    try {
      const url = appraisalId ? `/appraisal/${appraisalId}` : `/appraisal`;
      const method = appraisalId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      await fetchAppraisalData();
      toast({
        title: 'Appraisal status updated successfully!',
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
              <Award className="text-theme h-5 w-5" />
              Appraisal Status
            </h2>

            <div className="space-y-8">
              {/* Status Display */}
              <div className="space-y-2">
                <Label className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Next Appraisal Date
                </Label>
                <div className="text-2xl font-bold text-gray-900">
                  {currentCheckDate
                    ? moment(currentCheckDate).format('DD MMMM YYYY')
                    : 'Not Set'}
                </div>

                <div className="pt-1">{getStatusBadge()}</div>
              </div>

              {/* Action Button */}
              <div className="border-t border-gray-100 pt-4">
                <Button
                  onClick={openUpdateModal}
                  className="bg-theme hover:bg-theme/90 w-full text-white"
                >
                  Update Next Appraisal
                </Button>
                {checkInterval > 0 && complianceStatus === 'expiring-soon' && (
                  <p className="mt-3 text-center text-xs font-medium text-amber-600">
                    Action required: Appraisal due within {checkInterval} days
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Log & Documents */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <History className="text-theme h-5 w-5" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Appraisal Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Context Alert */}
            {currentCheckDate && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  Current appraisal due on{' '}
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
                New Next Appraisal Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newCheckDate}
                onChange={(date) => setNewCheckDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                // Logic: Min date is strictly the previous check date (or today)
                minDate={
                  currentCheckDate && moment(currentCheckDate).isValid()
                    ? new Date(currentCheckDate)
                    : new Date()
                }
                preventOpenOnFocus
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Supporting Document <span className="text-red-500">*</span>
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
                      Upload Proof
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
              className="bg-theme hover:bg-theme/90 text-white"
              onClick={handleSubmitUpdate}
              disabled={
                isSubmitting || isUploading || !uploadedFileUrl || !newCheckDate
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

export default AppraisalTab;
