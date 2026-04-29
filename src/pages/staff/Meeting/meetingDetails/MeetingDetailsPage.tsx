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
  Users2,
  ShieldCheck
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

// Interfaces based on your schema
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

// Zod Schema for validation
const uploadFormSchema = z.object({
  nextMeetingDate: z.date({
    required_error: 'Next meeting date is required.',
    invalid_type_error: 'Invalid date format.'
  }),
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

export default function StaffMeetingDetailsPage() {
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

  // Acknowledge Confirmation Dialog States
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [logToAcknowledge, setLogToAcknowledge] = useState<LogEntry | null>(null);
  const [ackConsent, setAckConsent] = useState(false);

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

  // Reset form and errors when dialog closes
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

  // --- Upload Logic ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setUploadError(
          `Invalid file type: ${file.name}. Only PDF, JPEG, or PNG allowed.`
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
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
      nextMeetingDate,
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
      const payload = {
        nextMeetingDate: nextMeetingDate,
        note: note,
        documents: uploadedFiles.map((f) => f.url),
        updatedBy: user?._id
      };

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

  // --- Acknowledge Logic ---

  /**
   * Checks if the current logged-in user is in the meeting's employee list
   * and has NOT yet acknowledged the given log.
   */
  const canAcknowledge = (log: LogEntry): boolean => {
    if (!user?._id || !meeting) return false;
    const isEmployee = meeting.employeeId.some((emp) => emp._id === user._id);
    const alreadyAcknowledged = log.Acknowledgement?.includes(user._id);
    return isEmployee && !alreadyAcknowledged;
  };

  const handleOpenAcknowledgeDialog = (log: LogEntry) => {
    setLogToAcknowledge(log);
    setAckConsent(false);
    setAcknowledgeDialogOpen(true);
  };

  const handleConfirmAcknowledge = async () => {
    if (!logToAcknowledge || !user?._id || !id) return;

    try {
      setIsAcknowledging(true);
      await axiosInstance.patch(
        `/company-meeting/${id}/logs/${logToAcknowledge._id}/acknowledge/${user._id}`
      );

      toast({
        title: 'Acknowledged successfully',
        className: 'bg-theme text-white border-none'
      });

      setAcknowledgeDialogOpen(false);
      setLogToAcknowledge(null);

      // Refresh meeting data so acknowledgement status updates in UI
      await fetchMeetingDetails();

      // Also update selectedLog if the view docs dialog is still open for the same log
      // The re-fetch will update `meeting`, but selectedLog is a snapshot — re-sync it
      setSelectedLog((prev) => {
        if (!prev || prev._id !== logToAcknowledge._id) return prev;
        return {
          ...prev,
          Acknowledgement: [...(prev.Acknowledgement || []), user._id]
        };
      });
    } catch (error) {
      toast({ title: 'Failed to acknowledge', variant: 'destructive' });
    } finally {
      setIsAcknowledging(false);
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
    <div className="h-[97vh] space-y-6 rounded-md bg-white p-5 shadow-sm">
      {/* Header Area */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row gap-2 space-x-3">
          <h1 className="max-w-[65%] text-lg font-semibold text-gray-900">
            {meeting?.title || ''}
          </h1>
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-900">
            <span className="text-sm font-medium text-gray-600 sm:text-lg">
              Next Meeting:
            </span>
            <span className="text-sm font-semibold text-gray-900 sm:text-lg">
              {meeting?.nextMeetingDate
                ? moment(meeting.nextMeetingDate).format('DD MMM, YYYY')
                : 'Not Scheduled'}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Main Page Employee List */}
        <div className="h-[85vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:col-span-5">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Users2 className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-900">Employee List</h2>
          </div>
          {meeting?.employeeId && meeting.employeeId.length > 0 ? (
            <ul className="space-y-3 px-2">
              {meeting.employeeId.map((emp) => (
                <li
                  key={emp._id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {emp.name || `${emp.firstName} ${emp.lastName}`}
                    </span>
                    <span className="text-xs">
                      {emp.designationId?.map((d) => d.title).join(', ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-2 italic text-gray-500">No employees assigned.</p>
          )}
        </div>

        {/* Main Page Activity Timeline */}
        <div className="h-[85vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:col-span-7">
          <div className="mb-8 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Clock className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-900">
              Activity Timeline
            </h2>
          </div>

          <div className="relative pl-4">
            <div className="absolute bottom-0 left-[23px] top-2 w-[2px] bg-gray-100" />

            <div className="space-y-5">
              {meeting?.logs?.length === 0 ? (
                <p className="ml-10 italic text-gray-500">
                  No activities recorded yet.
                </p>
              ) : (
                meeting?.logs?.map((log, index) => {
                  const hasDocs = log.documents && log.documents.length > 0;
                  const isLatest = index === meeting.logs.length - 1;
                  const showAcknowledgeBtn = hasDocs && canAcknowledge(log);

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
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 text-sm font-semibold text-black">
                            {moment(log.date).format('DD MMM, YYYY')}
                          </span>
                          <p
                            className={cn(
                              'text-[15px] font-semibold text-black',
                              hasDocs &&
                                'cursor-pointer text-theme hover:underline'
                            )}
                            onClick={() => {
                              if (!hasDocs) return;
                              setSelectedLog(log);
                              setViewDocsDialogOpen(true);
                            }}
                          >
                            {log.title || 'Meeting Documents'}
                          </p>

                          {/* Acknowledge Button — only visible if user is in employeeId list and hasn't acknowledged this log */}
                          {showAcknowledgeBtn && (
                            <Button
                              size="sm"
                              className="ml-auto flex items-center gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAcknowledgeDialog(log);
                              }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Acknowledge
                            </Button>
                          )}
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

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl sm:rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-xl font-bold">
              Upload Meeting Minutes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Date Input */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Next Meeting Date <span className="text-red-500">*</span>
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
                  minDate={
                    meeting?.nextMeetingDate
                      ? new Date(meeting.nextMeetingDate)
                      : new Date()
                  }
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
                  className="min-h-[100px] border-gray-300 focus:border-theme focus:ring-theme"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Attachments <span className="text-red-500">*</span>
              </Label>
              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
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
                  accept=".pdf,application/pdf,image/*"
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
                    <span className="text-xs text-gray-500">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
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

              {uploadedFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
                  <ul className="max-h-[140px] space-y-2 overflow-y-auto pr-1">
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

          <DialogFooter className="gap-2 border-t border-gray-100 pt-4 sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancel
            </Button>
            <Button
              className="min-w-[120px] bg-theme text-white hover:bg-theme/90"
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

      {/* View Documents Dialog */}
      <Dialog open={viewDocsDialogOpen} onOpenChange={setViewDocsDialogOpen}>
        <DialogContent className="max-w-5xl sm:rounded-xl border-gray-100">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-theme" />
              {meeting?.title}
              <span className="font-bold">
                {selectedLog?.date &&
                  ` - ${moment(selectedLog.date).format('DD MMMM, YYYY')}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-12">
            {/* Left side: Notes and Files */}
            <div className="space-y-6 md:col-span-8">
              {selectedLog?.note && (
                <p className="text-sm font-medium text-gray-700">
                  {selectedLog.note}
                </p>
              )}

              <div>
                <Label className="mb-3 block text-sm font-semibold text-gray-900">
                  Uploaded Files
                </Label>
                {selectedLog?.documents && selectedLog.documents.length > 0 ? (
                  <ul className="space-y-2.5">
                    {selectedLog.documents.map((docUrl, idx) => {
                      const fileName =
                        docUrl.split('/').pop() || `Document ${idx + 1}`;
                      return (
                        <li
                          key={idx}
                          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-theme/30 hover:shadow-md"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-theme/10">
                            <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                          </div>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-sm font-medium text-gray-700 group-hover:text-theme"
                          >
                            {fileName}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 py-6 text-center text-sm italic text-gray-500">
                    No documents found for this log.
                  </div>
                )}
              </div>

              {/* Acknowledge button inside view docs dialog */}
              {selectedLog && canAcknowledge(selectedLog) && (
                <div className="pt-2">
                  <Button
                    className="flex w-full items-center justify-center gap-2 bg-theme text-white hover:bg-theme/90"
                    onClick={() => {
                      setViewDocsDialogOpen(false);
                      handleOpenAcknowledgeDialog(selectedLog);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Acknowledge - I have reviewed all documents
                  </Button>
                </div>
              )}
            </div>

            {/* Right side: Acknowledgement Status */}
            <div className="space-y-4 md:col-span-4 md:border-l md:border-gray-100 md:pl-6">
              <Label className="block text-sm font-semibold text-gray-900">
                Acknowledgement
              </Label>
              {meeting?.employeeId && meeting.employeeId.length > 0 ? (
                <ul className="space-y-3">
                  {meeting.employeeId.map((emp) => {
                    const hasAcknowledged =
                      selectedLog?.Acknowledgement?.includes(emp._id);

                    return (
                      <li
                        key={emp._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
                      >
                        <div className="shrink-0">
                          {hasAcknowledged ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-gray-800">
                            {emp.name ||
                              `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                          </span>
                          <span className="truncate text-xs text-gray-500">
                            {emp.designationId
                              ?.map((d) => d.title)
                              .join(', ') || 'No designation'}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Acknowledge Confirmation Dialog ── */}
      <Dialog
        open={acknowledgeDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAcknowledgeDialogOpen(false);
            setLogToAcknowledge(null);
            setAckConsent(false);
          }
        }}
      >
        <DialogContent className="max-w-xl sm:rounded-xl border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="h-5 w-5 text-theme" />
              Confirm Acknowledgement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Log info summary */}
            {logToAcknowledge && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-800">
                  {logToAcknowledge.title || 'Meeting Documents'}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {moment(logToAcknowledge.date).format('DD MMMM, YYYY')}
                </p>
                {logToAcknowledge.documents?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {logToAcknowledge.documents.length} document
                    {logToAcknowledge.documents.length > 1 ? 's' : ''} attached
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-gray-700">
              By clicking <span className="font-semibold">Confirm</span>, you
              confirm that you have{' '}
              <span className="font-semibold">reviewed all the documents</span>{' '}
              attached to this meeting. This action cannot be undone.
            </p>

            {/* Checkbox for extra consent */}
            <label
              htmlFor="ack-consent"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
            >
              <Checkbox
                id="ack-consent"
                checked={ackConsent}
                onCheckedChange={(checked) => setAckConsent(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                I confirm that I have read and reviewed all documents for this
                meeting.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-4 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAcknowledgeDialogOpen(false);
                setLogToAcknowledge(null);
                setAckConsent(false);
              }}
              disabled={isAcknowledging}
            >
              Cancel
            </Button>
            <Button
              className="min-w-[120px] bg-theme text-white hover:bg-theme/90 disabled:opacity-50"
              onClick={handleConfirmAcknowledge}
              disabled={!ackConsent || isAcknowledging}
            >
              {isAcknowledging ? (
                <BlinkingDots size="small" color="bg-white" />
              ) : (
                <>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}