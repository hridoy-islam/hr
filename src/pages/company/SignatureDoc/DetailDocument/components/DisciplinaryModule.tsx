import React, { useEffect, useState } from 'react';
import {
  Gavel,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  AlertTriangle
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
import { cn } from '@/lib/utils';

export function DisciplinaryModule({ isOpen, onClose, employeeId, document }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeName, setEmployeeName] = useState('');
  const [disciplinaryId, setDisciplinaryId] = useState<string | null>(null);
  const [activeIssue, setActiveIssue] = useState<any | null>(null);
  const [status, setStatus] = useState<'overdue' | 'due-soon' | 'active' | 'no-issue'>('no-issue');

  // Form states
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');
  
  // Action Choice for active issues: Initially null (undefined/unselected)
  const [activeAction, setActiveAction] = useState<'resolve' | 'extend' | null>(null);

  const checkInterval = 7;

  // ─── Fetch Data ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/disciplinary?employeeId=${employeeId}`)
      ])
        .then(([userRes, discRes]) => {
          const userData = userRes.data?.data || userRes.data;
          if (userData) {
            setEmployeeName(`${userData.firstName || ''} ${userData.lastName || ''}`.trim());
          }

          const result = discRes.data?.data?.result || [];
          if (result.length > 0) {
            const data = result[0];
            setDisciplinaryId(data._id);
            
            if (data.issueDeadline) {
              setActiveIssue(data);
            } else {
              setActiveIssue(null);
            }
          } else {
            setDisciplinaryId(null);
            setActiveIssue(null);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Reset on close
      setDisciplinaryId(null);
      setActiveIssue(null);
      setEmployeeName('');
      setInputDate(null);
      setInputNote('');
      setActiveAction(null); // Reset to null on close
    }
  }, [isOpen, employeeId]);

  // ─── Status Logic ─────────────────────────────────────
  useEffect(() => {
    if (!activeIssue || !activeIssue.issueDeadline) {
      setStatus('no-issue');
      return;
    }

    const now = moment().startOf('day');
    const deadline = moment(activeIssue.issueDeadline).startOf('day');
    const diffDays = deadline.diff(now, 'days');

    if (now.isAfter(deadline)) {
      setStatus('overdue');
    } else if (diffDays <= checkInterval) {
      setStatus('due-soon');
    } else {
      setStatus('active');
    }
  }, [activeIssue]);

  // ─── Submit: Create Issue ─────────────────────────────
  const submitCreate = async () => {
    if (!inputDate || !document?.signedDocument) {
      return toast({ title: 'Deadline date and signed document are required.', className: 'bg-destructive text-white' });
    }
    setIsSubmitting(true);

    try {
      const payload = {
        issueDeadline: moment(inputDate).toISOString(),
        note: inputNote,
        document: [document.signedDocument],
        updatedBy: user?._id,
      };

      if (disciplinaryId) {
        await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
          ...payload,
          title: 'New Disciplinary Issue Created' 
        });
      } else {
        await axiosInstance.post('/disciplinary', {
          ...payload,
          employeeId
        });
      }

      toast({ title: 'Disciplinary issue created', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to create issue', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Submit: Extend Deadline ──────────────────────────
  const submitExtend = async () => {
    if (!inputDate || !disciplinaryId || !document?.signedDocument) {
      return toast({ title: 'New deadline date and signed document are required.', className: 'bg-destructive text-white' });
    }
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
        action: 'extendDate',
        extendDeadline: moment(inputDate).toISOString(),
        note: inputNote,
        document: [document.signedDocument],
        updatedBy: user?._id
      });

      toast({ title: 'Deadline extended successfully', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to extend', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Submit: Resolve Issue ────────────────────────────
  const submitResolve = async () => {
    if (!disciplinaryId || !document?.signedDocument) {
      return toast({ title: 'Signed document is required to resolve.', className: 'bg-destructive text-white' });
    }
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
        action: 'resolved',
        note: inputNote,
        document: [document.signedDocument],
        updatedBy: user?._id
      });

      toast({ title: 'Issue marked as resolved', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to resolve', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render Helpers ───────────────────────────────────
  const renderStatusBadge = () => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Due Soon</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Active Issue</Badge>;
      default:
        return <Badge variant="secondary" className="bg-green-50 text-green-700 border-none">No Active Issue</Badge>;
    }
  };

  const isCreateMode = status === 'no-issue';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? 'Create Disciplinary Issue' : 'Manage Disciplinary Issue'}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading details...' : employeeName ? `For ${employeeName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status:</span>
            {renderStatusBadge()}
          </div>

          {/* If there is an active issue, show context and action toggle */}
          {!isCreateMode && activeIssue && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Deadline is currently set for{' '}
                  <span className="font-semibold">{moment(activeIssue.issueDeadline).format('DD MMM YYYY')}</span>.
                </p>
              </div>

              <Label className="text-sm font-medium text-gray-700">What would you like to do? <span className="text-red-500">*</span></Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={activeAction === 'resolve' ? 'default' : 'outline'}
                  onClick={() => setActiveAction('resolve')}
                  className={cn(
                    'flex-1 transition-colors',
                   
                  )}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve Issue
                </Button>
                <Button
                  type="button"
                  variant={activeAction === 'extend' ? 'default' : 'outline'}
                  onClick={() => setActiveAction('extend')}
                  className={cn(
                    'flex-1 transition-colors',
                   
                  )}
                >
                  <CalendarClock className="mr-2 h-4 w-4" /> Extend Deadline
                </Button>
              </div>
            </div>
          )}

          {/* Form Fields: Only render if in Create Mode OR if an action has been explicitly selected */}
          {(isCreateMode || activeAction !== null) && (
            <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Date Picker (Required for Create and Extend, Hidden for Resolve) */}
              {(isCreateMode || activeAction === 'extend') && (
                <div className="flex flex-col space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {isCreateMode ? 'Issue Deadline' : 'New Extended Deadline'} <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    selected={inputDate}
                    onChange={(date: any) => setInputDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select deadline date..."
                    minDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
              )}

              {/* Note Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Note / Observation <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  placeholder={isCreateMode ? "Enter issue details..." : "Enter additional notes..."}
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Pre-Filled Document View (Always Required) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Attached Proof <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-3 rounded-md border border-gray-200 p-3 bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme/20 text-theme">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {document?.content || 'Signed_Disciplinary_Document.pdf'}
                    </p>
                  </div>
                </div>
                {!document?.signedDocument && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    No signed document URL found. Cannot proceed without it.
                  </p>
                )}
              </div>

            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {isCreateMode ? (
            <Button
              onClick={submitCreate}
              disabled={isSubmitting || !inputDate || !document?.signedDocument}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <ShieldAlert className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </Button>
          ) : activeAction === 'extend' ? (
            <Button
              onClick={submitExtend}
              disabled={isSubmitting || !inputDate || !document?.signedDocument}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <CalendarClock className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Extending...' : 'Confirm Extension'}
            </Button>
          ) : activeAction === 'resolve' ? (
            <Button
              onClick={submitResolve}
              disabled={isSubmitting || !document?.signedDocument}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <Gavel className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          ) : (
            <Button disabled className="bg-gray-100 text-gray-400 cursor-not-allowed">
              Select an Action
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}