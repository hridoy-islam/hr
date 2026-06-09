import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  Paperclip,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import moment from '@/lib/moment-setup';

// Interfaces
interface LogEntry {
  _id: string;
  title: string;
  date: string;
  documents: string[];
  note?: string;
  Acknowledgement?: string[];
}

interface Employee {
  _id: string;
  firstName?: string;
  lastName?: string;
  initial?: string;
  name?: string;
  designationId?: { title: string }[];
}

interface MeetingMins {
  _id: string;
  title: string;
  nextMeetingDate: string;
  createdAt: string;
  logs: LogEntry[];
  employeeId: Employee[];
}

// Zod Schema for validation - nextMeetingDate is now optional
const uploadFormSchema = z.object({
  nextMeetingDate: z.date({
    invalid_type_error: 'Invalid date format.'
  }).optional(),
  note: z.string().optional(),
  uploadedFiles: z
    .array(
      z.object({
        name: z.string(),
        url: z.string()
      })
    )
    .min(1, 'Please upload at least one document.')
});

export default function MeetingDetailsPage() {
  const { mid: id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<MeetingMins | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload Dialog States
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [nextMeetingDate, setNextMeetingDate] = useState<Date | null>(null);
  const [note, setNote] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
  const [formErrors, setFormErrors] = useState<{
    nextMeetingDate?: string;
    note?: string;
    uploadedFiles?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useSelector((state: any) => state.auth?.user) || null;

  // View Docs Dialog States
  const [viewDocsDialogOpen, setViewDocsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // --- Specific Log Upload States ---
  const [isLogUploading, setIsLogUploading] = useState(false);
  const [stagedLogFiles, setStagedLogFiles] = useState<File[]>([]);
  const logFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/company-meeting/${id}`);
      setMeeting(response.data.data);
    } catch (error) {
      toast({
        title: 'Error fetching meeting details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  // Clear staged files when viewing dialog closes
  useEffect(() => {
    if (!viewDocsDialogOpen) {
      setStagedLogFiles([]);
    }
  }, [viewDocsDialogOpen]);

  // Sync selectedLog with fresh data when meeting details are refetched
  useEffect(() => {
    if (meeting?.logs && selectedLog) {
      const updatedLog = meeting.logs.find((log) => log._id === selectedLog._id);
      if (updatedLog) {
        setSelectedLog(updatedLog);
      }
    }
  }, [meeting, selectedLog?._id]);

  // Reset form and errors when general dialog closes
  const handleDialogChange = (isOpen: boolean) => {
    setUploadDialogOpen(isOpen);
    if (!isOpen) {
      setNextMeetingDate(null);
      setNote('');
      setUploadedFiles([]);
      setFormErrors({});
      setUploadError(null);
    }
  };

  // --- General Upload Logic ---
  const handleFileSelect = async (
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
  setFormErrors((prev) => ({ ...prev, uploadedFiles: undefined }));

  try {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('entityId', user?._id);
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

// --- Submit Update ---
const handleUploadSubmit = async () => {
  const validationResult = uploadFormSchema.safeParse({
    nextMeetingDate: nextMeetingDate || undefined,
    note,
    uploadedFiles
  });

  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    setFormErrors(fieldErrors);
    return;
  }

  setFormErrors({});

  try {
    setIsSubmitting(true);

    const payload: any = {
      note,
      documents: uploadedFiles.map((f) => f.url),
      updatedBy: user?._id
    };

    // ✅ Fix timezone shifting by forcing UTC midnight of the selected calendar day
    if (nextMeetingDate) {
      payload.nextMeetingDate = new Date(
        Date.UTC(
          nextMeetingDate.getFullYear(),
          nextMeetingDate.getMonth(),
          nextMeetingDate.getDate()
        )
      );
    }

    await axiosInstance.patch(`/company-meeting/${id}`, payload);

    toast({
      title: 'Meeting updated successfully',
      className: 'bg-theme text-white border-none'
    });

    handleDialogChange(false);
    fetchMeetingDetails();
  } catch (error) {
    toast({ title: 'Failed to update meeting', variant: 'destructive' });
  } finally {
    setIsSubmitting(false);
  }
};

  // --- Specific Log Upload Logic (Staged) ---
 const handleLogFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const validFiles = files.filter(file => {
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: `File too large: ${file.name} (Max 20MB)`,
        variant: 'destructive'
      });
      return false;
    }
    return true;
  });

  setStagedLogFiles((prev) => [...prev, ...validFiles]);

  // Clear input so same file can be selected again if removed
  if (logFileInputRef.current) logFileInputRef.current.value = '';
};

  const handleRemoveStagedLogFile = (indexToRemove: number) => {
    setStagedLogFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleConfirmLogUpload = async () => {
    if (!stagedLogFiles.length || !selectedLog) return;
    setIsLogUploading(true);

    try {
      const uploadPromises = stagedLogFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user?._id);
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data?.data?.fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Submit the uploaded URLs to the log endpoint
      await axiosInstance.patch(`/company-meeting/${id}/log/${selectedLog._id}/documents`, {
        documents: uploadedUrls
      });

      toast({
        title: 'Documents added to log successfully',
        className: 'bg-theme text-white border-none'
      });

      setStagedLogFiles([]);
      fetchMeetingDetails(); 
    } catch (err) {
      toast({ title: 'Failed to add documents', variant: 'destructive' });
    } finally {
      setIsLogUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[600px] w-full items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 rounded-md bg-white p-3 shadow-sm sm:h-[97vh] sm:space-y-6 sm:p-5  max-sm:pt-12">
      {/* Header Area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 sm:space-x-3">
          <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
            {meeting?.title || ''}
          </h1>
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-900">
            <span className="text-xs font-medium text-gray-600 sm:text-lg">
              Next Meeting:
            </span>
            <span className="text-xs font-semibold text-gray-900 sm:text-lg">
              {meeting?.nextMeetingDate
                ? moment(meeting.nextMeetingDate).format('DD MMM, YYYY')
                : 'Not Scheduled'}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button
            size="sm"
            variant={'outline'}
            onClick={() => setUploadDialogOpen(true)}
            className="rounded-md text-xs sm:text-sm"
          >
            <Upload className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className=" ">Upload Meeting Minutes</span>
          </Button>
          <Button size="sm" onClick={() => navigate(-1)} className="text-xs sm:text-sm">
            <ArrowLeft className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12">
        {/* Main Page Employee List */}
        <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:max-h-none md:col-span-5 md:h-[85vh]">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Users2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Employee List</h2>
          </div>
          {meeting?.employeeId && meeting.employeeId.length > 0 ? (
            <ul className="space-y-2 px-1 sm:space-y-3 sm:px-2">
              {meeting.employeeId.map((emp) => (
                <li
                  key={emp._id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 shadow-sm transition-colors hover:bg-gray-50 sm:p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium sm:text-sm">
                      {emp.name || `${emp.firstName} ${emp.lastName}`}
                    </span>
                    <span className="text-[11px] sm:text-xs">
                      {emp.designationId?.map((d) => d.title).join(', ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-2 italic text-gray-500 text-sm">No employees assigned.</p>
          )}
        </div>

        {/* Main Page Activity Timeline */}
        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:max-h-none md:col-span-7 md:h-[85vh]">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 sm:mb-8">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
              Activity Timeline
            </h2>
          </div>

          <div className="relative pl-4">
            <div className="absolute bottom-0 left-[23px] top-2 w-[2px] bg-gray-100" />

            <div className="space-y-4 sm:space-y-5">
              {meeting?.logs?.length === 0 ? (
                <p className="ml-10 italic text-gray-500 text-sm">
                  No activities recorded yet.
                </p>
              ) : (
                meeting?.logs?.map((log, index) => {
                  const hasDocs = log.documents && log.documents.length > 0;
                  const isLatest = index === meeting.logs.length - 1;
                  const isFirstLog = index === 0;
                  const canClick = hasDocs || isFirstLog;

                  return (
                    <div
                      key={log._id || index}
                      className="relative z-10 flex gap-0"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px] bg-white',
                            isLatest ? 'border-theme' : 'border-gray-300'
                          )}
                        >
                          {isLatest && (
                            <div className="h-2 w-2 rounded-full bg-theme" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 pb-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                          <span className="px-2 text-xs font-semibold text-black sm:text-sm">
                            {moment(log.date).format('DD MMM, YYYY')}
                          </span>
                          <p
                            className={cn(
                              'text-sm font-semibold text-black sm:text-[15px]',
                              canClick &&
                                'cursor-pointer text-theme hover:underline'
                            )}
                            onClick={() => {
                              if (!canClick) return;
                              setSelectedLog(log);
                              setViewDocsDialogOpen(true);
                            }}
                          >
                            {log.title || 'Meeting Documents'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl sm:rounded-xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-lg font-bold sm:text-xl">
              Upload Meeting Minutes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              {/* Date Input */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Next Meeting Date
                </Label>
                <DatePicker
                  selected={nextMeetingDate}
                  onChange={(date: Date) => {
                    setNextMeetingDate(date);
                    setFormErrors((prev) => ({
                      ...prev,
                      nextMeetingDate: undefined
                    }));
                  }}
                  dateFormat="dd-MM-yyyy"
                  className={cn(
                    'flex h-11 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none',
                    formErrors.nextMeetingDate
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-300 focus:border-theme focus:ring-1 focus:ring-theme'
                  )}
                  placeholderText="Select schedule..."
                  // minDate={
                  //   meeting?.nextMeetingDate
                  //     ? new Date(meeting.nextMeetingDate)
                  //     : new Date()
                  // }
                  preventOpenOnFocus
                />
                {formErrors.nextMeetingDate && (
                  <p className="text-xs font-medium text-red-500">
                    {formErrors.nextMeetingDate}
                  </p>
                )}
              </div>
              {/* Note Input */}
              <div className="flex flex-col space-y-2 md:col-span-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Meeting Note
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter any notes or descriptions here..."
                  className="min-h-[80px] border-gray-300 focus:border-theme focus:ring-theme sm:min-h-[100px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Attachments <span className="text-red-500">*</span>
              </Label>
              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all sm:p-8',
                  isUploading
                    ? 'border-theme bg-theme/5'
                    : formErrors.uploadedFiles
                      ? 'border-red-500 bg-red-50 hover:bg-red-100/50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/80'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
                    <p className="text-sm font-medium text-theme">
                      Uploading files...
                    </p>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Upload
                        className={cn(
                          'h-5 w-5',
                          formErrors.uploadedFiles
                            ? 'text-red-500'
                            : 'text-gray-500'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        formErrors.uploadedFiles
                          ? 'text-red-600'
                          : 'text-gray-700'
                      )}
                    >
                      Click or drag to upload
                    </span>
                    <span className="text-xs text-gray-500">(Max 20MB)</span>
                  </div>
                )}
              </div>

              {formErrors.uploadedFiles && !isUploading && (
                <p className="text-xs font-medium text-red-500">
                  {formErrors.uploadedFiles}
                </p>
              )}

              {uploadError && (
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>{' '}
                  {uploadError}
                </p>
              )}

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
                  <ul className="max-h-[120px] space-y-2 overflow-y-auto pr-1 sm:max-h-[140px]">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                          <span className="truncate font-medium text-gray-700">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              className="w-full min-w-[120px] bg-theme text-white hover:bg-theme/90 sm:w-auto"
              onClick={handleUploadSubmit}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <BlinkingDots size="small" color="bg-white" />
              ) : (
                'Save Details'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Documents Dialog (Activity Timeline Log) */}
      <Dialog open={viewDocsDialogOpen} onOpenChange={setViewDocsDialogOpen}>
        <DialogContent className="max-w-5xl sm:rounded-xl border-gray-100 max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-bold sm:text-xl">
              <FileText className="h-4 w-4 text-theme sm:h-5 sm:w-5" />
              <span className="font-bold text-sm sm:text-base break-all">{meeting?.title}</span>
              <span className="font-bold text-sm sm:text-base">
                {selectedLog?.date &&
                  ` - ${moment(selectedLog.date).format('DD MMMM, YYYY')}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4 sm:gap-6 md:grid-cols-12">
            {/* Left side: Notes and Files */}
            <div className="space-y-4 sm:space-y-6 md:col-span-8">
              {/* Note Display */}
              {selectedLog?.note && (
                <p className="text-sm font-medium text-gray-700">
                  {selectedLog.note}
                </p>
              )}

              {/* Files Display */}
              <div>
                <Label className="mb-3 block text-sm font-semibold text-gray-900">
                  Files
                </Label>
                {selectedLog?.documents && selectedLog.documents.length > 0 ? (
                  <ul className="space-y-2 sm:space-y-2.5">
                    {selectedLog.documents.map((docUrl, idx) => {
                      const fileName =
                        docUrl.split('/').pop() || `Document ${idx + 1}`;
                      return (
                        <li
                          key={idx}
                          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all hover:border-theme/30 hover:shadow-md sm:p-3"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-theme/10">
                            <FileText className="h-4 w-4 text-theme" />
                          </div>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-xs font-medium text-gray-700 group-hover:text-theme sm:text-sm"
                          >
                            {fileName}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center sm:p-6">
                    <p className="text-sm italic text-gray-500">
                      No documents found for this log.
                    </p>
                  </div>
                )}

                {/* Inline Upload for Specific Log with Staging/Confirmation */}
                <div className="mt-4 border-t border-gray-100 pt-4 sm:mt-6">
                  <Label className="mb-3 block text-sm font-semibold text-gray-900">
                    Add Documents
                  </Label>
                  <div className="flex flex-col space-y-4">
                    <input
                      ref={logFileInputRef}
                      type="file"
                      multiple
                      onChange={handleLogFileSelect}
                      className="hidden"
                      disabled={isLogUploading}
                    />

                    <Button
                      variant="outline"
                      onClick={() => logFileInputRef.current?.click()}
                      disabled={isLogUploading}
                      className="w-full sm:w-fit"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Documents
                    </Button>

                    {/* Staged Files Preview List */}
                    {stagedLogFiles.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 shadow-inner">
                        <ul className="space-y-2">
                          {stagedLogFiles.map((file, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                                <span className="truncate font-medium text-gray-700 text-xs sm:text-sm">
                                  {file.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveStagedLogFile(idx)}
                                disabled={isLogUploading}
                                className="ml-3 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
                              >
                                &times;
                              </button>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={handleConfirmLogUpload}
                            disabled={isLogUploading}
                            className="w-full bg-theme text-white hover:bg-theme/90 sm:w-auto"
                          >
                            {isLogUploading ? (
                              <div className="flex items-center gap-2">
                                <BlinkingDots size="small" color="bg-white" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              'Confirm & Upload'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
{user.role !== 'employee' && (  <div className="space-y-4 md:col-span-4 md:border-l md:border-gray-100 md:pl-6">
              {/* Mobile: horizontal divider instead of vertical */}
              <div className="border-t border-gray-100 pt-4 md:border-t-0 md:pt-0">
                <Label className="mb-3 block text-sm font-semibold text-gray-900">
                  Acknowledgement
                </Label>
                {meeting?.employeeId && meeting.employeeId.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 sm:gap-2.5 md:gap-3 md:space-y-0">
                    {[...meeting.employeeId]
                      .sort((a, b) => {
                        const aAcknowledged = selectedLog?.Acknowledgement?.includes(a._id) ? 1 : 0;
                        const bAcknowledged = selectedLog?.Acknowledgement?.includes(b._id) ? 1 : 0;
                        return bAcknowledged - aAcknowledged;
                      })
                      .map((emp) => {
                        const hasAcknowledged = selectedLog?.Acknowledgement?.includes(emp._id);

                        return (
                          <li
                            key={emp._id}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 shadow-sm transition hover:shadow-md ${
                              hasAcknowledged
                                ? 'border-green-200 bg-green-50/50'
                                : 'border-gray-100 bg-white'
                            }`}
                          >
                            <div className="shrink-0">
                              {hasAcknowledged ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-xs font-semibold text-gray-800 sm:text-sm">
                                {emp.name ||
                                  `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                              </span>
                              <span className="text-[11px] text-gray-500 sm:text-xs">
                                {emp.designationId?.map((d) => d.title).join(', ') || 'No designation'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-sm italic text-gray-500">
                    No attendees listed.
                  </p>
                )}
              </div>
            </div>)}
          
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}