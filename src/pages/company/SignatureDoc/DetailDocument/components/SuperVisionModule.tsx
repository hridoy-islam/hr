import React, { useEffect, useState } from 'react';
import {
  Users,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import moment from '@/lib/moment-setup';

export function SuperVisionModule({ isOpen, onClose, employeeId, document }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeName, setEmployeeName] = useState('');
  const [supervisionId, setSupervisionId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState('');

  // Form inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');

  // ─── Derived state — mirrors SuperVisionCheckTab exactly ───────
  // Cycle is open when scheduledDate exists and completionDate is before scheduledDate (or missing)
  const isCycleOpen =
    !!scheduledDate &&
    (!completionDate || moment(scheduledDate).isAfter(moment(completionDate)));

  // Show complete button only when a cycle is open
  const showCompleteButton = isCycleOpen;

  // In complete mode when cycle is open; schedule mode otherwise
  const isScheduleMode = !showCompleteButton;

  // ─── Fetch Data ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/supervision?employeeId=${employeeId}`),
      ])
        .then(([userRes, supervisionRes]) => {
          const userData = userRes.data?.data || userRes.data;
          if (userData) {
            setEmployeeName(
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            );
          }

          const records = supervisionRes.data?.data?.result || [];
          if (records.length > 0) {
            const data = records[0];
            setSupervisionId(data._id);
            setScheduledDate(data.scheduledDate || null);
            setCompletionDate(data.completionDate || null);
            setSavedNote(data.supervisionNote || '');
          } else {
            setSupervisionId(null);
            setScheduledDate(null);
            setCompletionDate(null);
            setSavedNote('');
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Reset on close
      setSupervisionId(null);
      setScheduledDate(null);
      setCompletionDate(null);
      setSavedNote('');
      setEmployeeName('');
      setInputDate(null);
      setInputNote('');
    }
  }, [isOpen, employeeId]);

  // Prefill note when mode is determined
  useEffect(() => {
    if (!isLoading) {
      setInputNote(showCompleteButton ? savedNote : '');
      setInputDate(null);
    }
  }, [showCompleteButton, isLoading]);

  // ─── Schedule Handler ──
  const handleSchedule = async () => {
    if (!inputDate || !document?.signedDocument) {
      return toast({ 
        title: 'Please select a scheduled date and ensure a document is attached.', 
        className: 'bg-destructive text-white' 
      });
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        scheduledDate: moment(inputDate).toISOString(),
        updatedBy: user?._id,
        note: inputNote,
        document: [document.signedDocument] // <-- Added document reference here
      };

      if (!supervisionId) {
        // No existing record → POST (create)
        await axiosInstance.post('/supervision', { ...payload, employeeId });
      } else {
        // Existing record → PATCH (reschedule)
        await axiosInstance.patch(`/supervision/${supervisionId}`, {
          ...payload,
          completionDate: null,
          title: `Supervision Scheduled for ${moment(inputDate).format('DD/MM/YYYY')}`,
        });
      }

      toast({ title: 'Supervision check scheduled successfully', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to schedule supervision check.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Complete Handler ──
  const handleComplete = async () => {
    if (!inputDate) {
      return toast({ title: 'Please select a completion date.', className: 'bg-destructive text-white' });
    }
    if (!document?.signedDocument) {
      return toast({ title: 'No signed document attached. Cannot complete without proof.', className: 'bg-destructive text-white' });
    }
    if (!supervisionId) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/supervision/${supervisionId}`, {
        completionDate: moment(inputDate).toISOString(),
        document: [document.signedDocument], // <-- Document sent to complete endpoint
        note: inputNote,
        updatedBy: user?._id,
      });

      toast({ title: 'Supervision check marked as completed', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to complete supervision check.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Status Badge ───────────────
  const renderStatusBadge = () => {
    if (!scheduledDate) return <Badge variant="secondary">Not Scheduled</Badge>;

    if (!isCycleOpen)
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;

    const now = moment().startOf('day');
    const target = moment(scheduledDate).startOf('day');
    const diffDays = target.diff(now, 'days');

    if (now.isAfter(target, 'day'))
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    if (diffDays <= 7 && diffDays >= 0)
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due Soon</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isScheduleMode
              ? supervisionId
                ? 'Update Supervision Schedule'
                : 'Schedule Supervision'
              : 'Complete Supervision'}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading details...' : employeeName ? `For ${employeeName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status:</span>
            {renderStatusBadge()}
          </div>

          {/* Open cycle info */}
          {!isScheduleMode && isCycleOpen && scheduledDate && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Supervision was scheduled for{' '}
                <span className="font-semibold">{moment(scheduledDate).format('DD MMM YYYY')}</span>.
              </p>
            </div>
          )}

          {/* Completed notice */}
          {isScheduleMode && !isCycleOpen && completionDate && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Last check completed on{' '}
                <strong>{moment(completionDate).format('DD MMM YYYY')}</strong>.
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {isScheduleMode ? 'Scheduled Date' : 'Completion Date'}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              selected={inputDate}
              onChange={(date: any) => setInputDate(date)}
              dateFormat="dd-MM-yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
              placeholderText="Select date..."
              minDate={isScheduleMode ? new Date() : undefined}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              preventOpenOnFocus
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Session Note <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              placeholder={
                isScheduleMode
                  ? 'Add a note about this schedule...'
                  : 'Enter details about the supervision session...'
              }
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Pre-Filled Document View (Now Visible for both Scheduling & Completing) */}
          <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Attached Document <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3 rounded-md border border-gray-200 p-3 bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme/20 text-theme">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_Supervision_Document.pdf'}
                </p>
              </div>
            </div>
            {!document?.signedDocument && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                No signed document URL found. Cannot proceed without it.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {isScheduleMode ? (
            <Button
              onClick={handleSchedule}
              disabled={isSubmitting || !inputDate || !document?.signedDocument}
              className="bg-theme text-white hover:bg-theme/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <CalendarClock className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !inputDate || !document?.signedDocument}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Mark as Completed'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}