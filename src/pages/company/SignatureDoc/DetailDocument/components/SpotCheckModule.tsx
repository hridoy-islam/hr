import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2, AlertCircle, ClipboardCheck, CheckCircle2, CalendarClock } from 'lucide-react';
import moment from '@/lib/moment-setup';

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

export function SpotCheckModule({ isOpen, onClose, document, module, employeeId }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ─────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');

  // Spot Check Data State
  const [employeeName, setEmployeeName] = useState<string>('');
  const [spotCheckId, setSpotCheckId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);

  // ─── Derived state (mirrors SpotCheckTab exactly) ───
  const hasRecord = !!spotCheckId;

  const isCycleOpen =
    hasRecord &&
    !!scheduledDate &&
    (!completionDate || moment(scheduledDate).isAfter(moment(completionDate)));

  const isCycleCompleted = hasRecord && !isCycleOpen;

  // Mode: "schedule" when no record at all, "complete" when a cycle is open
  const mode: 'schedule' | 'complete' = !hasRecord ? 'schedule' : 'complete';
  const isScheduleMode = mode === 'schedule';

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/spot-check?employeeId=${employeeId}`),
      ])
        .then(([userRes, spotCheckRes]) => {
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setEmployeeName(
              `${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim()
            );
          }

          const recordsList = spotCheckRes.data?.data?.result || [];
          if (recordsList.length > 0) {
            const data = recordsList[0];
            setSpotCheckId(data._id);
            setScheduledDate(data.scheduledDate || null);
            setCompletionDate(data.completionDate || null);

            const cycleOpen =
              !!data.scheduledDate &&
              (!data.completionDate ||
                moment(data.scheduledDate).isAfter(moment(data.completionDate)));
            setInputNote(cycleOpen ? data.spotCheckNote || '' : '');
          } else {
            // No record exists at all — schedule mode
            setSpotCheckId(null);
            setScheduledDate(null);
            setCompletionDate(null);
            setInputNote('');
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Reset on close
      setInputDate(null);
      setInputNote('');
      setSpotCheckId(null);
      setScheduledDate(null);
      setCompletionDate(null);
      setEmployeeName('');
      setIsLoading(false);
    }
  }, [isOpen, employeeId]);

  // ─── Schedule Handler (POST — mirrors submitSchedule in SpotCheckTab) ──
  const handleSchedule = async () => {
    if (!inputDate) {
      return toast({ title: 'Please select a scheduled date.', className: 'bg-destructive text-white' });
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/spot-check', {
        employeeId,
        scheduledDate: moment(inputDate).toISOString(),
        updatedBy: user?._id,
        note: inputNote,
        // document is optional for scheduling — matches SpotCheckTab schedule modal
      });

      toast({ title: 'Spot check scheduled successfully', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to schedule spot check.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Complete Handler (PATCH — mirrors submitCompletion in SpotCheckTab) ──
  const handleComplete = async () => {
    if (!inputDate) {
      return toast({ title: 'Please select a completion date.', className: 'bg-destructive text-white' });
    }
    if (!document?.signedDocument) {
      return toast({ title: 'No signed document attached. Cannot complete without proof.', className: 'bg-destructive text-white' });
    }
    if (isCycleCompleted) {
      return toast({ title: 'This spot check cycle is already completed.', className: 'bg-destructive text-white' });
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/spot-check/${spotCheckId}`, {
        completionDate: moment(inputDate).toISOString(),
        document: [document.signedDocument],
        note: inputNote,
        updatedBy: user?._id,
      });

      toast({ title: 'Spot check marked as completed', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to complete spot check.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Status Badge ────────────────────────────────────
  const renderStatusBadge = () => {
    if (!hasRecord || !scheduledDate) return <Badge variant="secondary">Not Scheduled</Badge>;
    if (isCycleCompleted) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;

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
            {isScheduleMode ? 'Schedule Spot Check' : 'Complete Spot Check'}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading details...' : employeeName ? `For ${employeeName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          {/* 1. Status Badge — always shown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status:</span>
            {renderStatusBadge()}
          </div>

          {/* 2. Open cycle info (complete mode only) */}
          {!isScheduleMode && isCycleOpen && scheduledDate && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Spot check was scheduled for{' '}
                <span className="font-semibold">{moment(scheduledDate).format('DD MMM YYYY')}</span>.
              </p>
            </div>
          )}

          {/* 3. Already completed notice (complete mode only) */}
          {!isScheduleMode && isCycleCompleted && completionDate && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Last check completed on{' '}
                <strong>{moment(completionDate).format('DD MMM YYYY')}</strong>.
              </p>
            </div>
          )}

          {/* 4. Date Picker */}
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

          {/* 5. Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {isScheduleMode ? 'Note' : 'Note / Observation'}{' '}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              placeholder={
                isScheduleMode
                  ? 'Add a note about this schedule...'
                  : 'Enter details about the check...'
              }
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 6. Attached Document — only required in complete mode */}

            <div className="space-y-2 mt-2">
              <Label className="text-sm font-medium text-gray-700">
                Attached Document <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {document?.content || 'Signed_SpotCheck.pdf'}
                  </p>
                  <p className="text-xs text-gray-500">Ready to be saved as proof</p>
                </div>
              </div>
              {!document?.signedDocument && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No signed document URL found. Cannot complete without it.
                </p>
              )}
            </div>
          
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {isScheduleMode ? (
            <Button
              onClick={handleSchedule}
              disabled={isSubmitting || !inputDate}
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