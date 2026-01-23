import React, { useEffect, useState, useRef } from 'react';
import {
  Calendar,
  History,
  TrendingUp,
  FileText,
  Upload,
  X,
  Eye,
  CheckSquare
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

// --- Interfaces ---

interface LogEntry {
  _id?: string;
  title: string;
  date: string;
  document?: string;
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

// --- Main Component ---

function InductionTab() {
  const { id } = useParams(); // employeeId
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
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Promotion Choice State
  const [promotionChoice, setPromotionChoice] = useState<'yes' | 'no' | null>(
    null
  );

  // --- Fetch Data ---

  const fetchInductionData = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/induction?employeeId=${id}`);
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchInductionData();
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  // --- Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;

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

  // Open Handlers
  const handleOpenSchedule = () => {
    setInputDate(null);
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setShowScheduleModal(true);
  };

  const handleOpenPromotion = () => {
    setInputDate(null);
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setPromotionChoice(null); // Reset choice
    setShowPromotionModal(true);
  };

  // Submit: Schedule (Create ONLY)
  const submitSchedule = async () => {
    if (!inputDate || !user?._id || !uploadedFileUrl) return;
    setIsSubmitting(true);

    try {
      const payload = {
        inductionDate: moment(inputDate).toISOString(),
        updatedBy: user._id,
        document: uploadedFileUrl
      };

      // Only allowing create logic here as reschedule button is hidden if ID exists
      if (!inductionId) {
        await axiosInstance.post('/induction', {
          ...payload,
          employeeId: id
        });
      }

      await fetchInductionData();
      toast({
        title: 'Induction scheduled successfully',
        className: 'bg-theme text-white'
      });
      setShowScheduleModal(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!inductionId || !user?._id || !promotionChoice) return;

    if (promotionChoice === 'yes' && (!inputDate || !uploadedFileUrl)) return;

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any = { updatedBy: user._id };

      if (promotionChoice === 'yes') {
        payload = {
          ...payload,
          action: 'promotion',
          inductionDate: moment(inputDate).toISOString(),
          document: uploadedFileUrl
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to update promotion',
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

  const renderFileInput = (isOptional: boolean = false) => (
    <div className="space-y-2 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Supporting Document{' '}
        <span
          className={isOptional ? 'font-normal text-gray-400' : 'text-red-500'}
        >
          {isOptional ? '(Optional)' : '*'}
        </span>
      </Label>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          uploadedFileUrl
            ? 'border-green-500 bg-green-50'
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
              <span className="truncate text-sm font-medium text-green-700">
                {selectedFileName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Upload Document
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
                  <Button onClick={handleOpenSchedule} className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Induction Date
                  </Button>
                )}

                {/* 2. Promote Button - Hidden if noPromotion is true OR if Induction not scheduled yet */}
                {currentInductionDate && !noPromotion && (
                  <Button
                    onClick={handleOpenPromotion}
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

      {/* 1. Schedule Modal (Create Only) */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Induction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Induction Date <span className="text-red-500">*</span>
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
              disabled={isSubmitting || !inputDate || !uploadedFileUrl}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Promotion Modal */}
      <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
        <DialogContent className="sm:max-w-md">
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
                    New Induction Date <span className="text-red-500">*</span>
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
                  />
                </div>

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
                (promotionChoice === 'yes' && (!inputDate || !uploadedFileUrl))
              }
            >
              {isSubmitting ? 'Saving...' : 'Confirm Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InductionTab;
