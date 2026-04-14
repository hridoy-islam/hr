import React, { useEffect, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  FileText,
  CheckSquare,
  Loader2,
  AlertCircle,
  X
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import moment from '@/lib/moment-setup';
import { cn } from '@/lib/utils';

export function InductionModule({ isOpen, onClose, employeeId, document }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeName, setEmployeeName] = useState('');
  const [inductionId, setInductionId] = useState<string | null>(null);
  const [currentInductionDate, setCurrentInductionDate] = useState<string | null>(null);
  const [noPromotion, setNoPromotion] = useState(false);

  // Form inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [promotionChoice, setPromotionChoice] = useState<'yes' | 'no' | null>(null);

  // ─── Derived state — mirrors InductionTab exactly ─────
  // Schedule mode: no induction date yet
  const isScheduleMode = !currentInductionDate;
  // Promotion mode: induction exists, not marked no-promotion
  const isPromotionMode = !!currentInductionDate && !noPromotion;

  // ─── Fetch Data ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/induction?employeeId=${employeeId}`),
      ])
        .then(([userRes, inductionRes]) => {
          const userData = userRes.data?.data || userRes.data;
          if (userData) {
            setEmployeeName(
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            );
          }

          const records = inductionRes.data?.data?.result || [];
          if (records.length > 0) {
            const data = records[0];
            setInductionId(data._id);
            setCurrentInductionDate(data.inductionDate || null);
            setNoPromotion(data.noPromotion || false);
          } else {
            setInductionId(null);
            setCurrentInductionDate(null);
            setNoPromotion(false);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Reset on close
      setInductionId(null);
      setCurrentInductionDate(null);
      setNoPromotion(false);
      setEmployeeName('');
      setInputDate(null);
      setPromotionChoice(null);
    }
  }, [isOpen, employeeId]);

  // Reset form inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputDate(null);
      setPromotionChoice(null);
    }
  }, [isOpen]);

  // ─── Schedule Handler — mirrors submitSchedule in InductionTab ──
  const handleSchedule = async () => {
    if (!inputDate || !document?.signedDocument) {
      return toast({
        title: 'Please select a date and ensure a signed document is attached.',
        className: 'bg-destructive text-white',
      });
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/induction', {
        inductionDate: moment(inputDate).toISOString(),
        updatedBy: user?._id,
        document: [document.signedDocument],
        employeeId,
      });

      toast({ title: 'Induction scheduled successfully', className: 'bg-theme text-white' });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to schedule induction.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Promotion Handler — mirrors submitPromotion in InductionTab ──
  const handlePromotion = async () => {
    if (!inductionId || !promotionChoice) return;
    if (promotionChoice === 'yes' && (!inputDate || !document?.signedDocument)) return;

    setIsSubmitting(true);
    try {
      let payload: any = { updatedBy: user?._id };

      if (promotionChoice === 'yes') {
        payload = {
          ...payload,
          action: 'promotion',
          inductionDate: moment(inputDate).toISOString(),
          document: [document.signedDocument],
        };
      } else {
        payload = { ...payload, noPromotion: true };
      }

      await axiosInstance.patch(`/induction/${inductionId}`, payload);

      toast({
        title: promotionChoice === 'yes' ? 'Employee Promoted' : 'Promotion Marked as No',
        className: 'bg-theme text-white',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to update promotion.',
        className: 'bg-destructive text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Status Badge ─────────────────────────────────────
  const renderStatusBadge = () => {
    if (!currentInductionDate) return <Badge variant="secondary">Not Scheduled</Badge>;
    if (noPromotion)
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">No Promotion</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
  };

  // ─── Derived submit disabled logic ───────────────────
  const isScheduleDisabled = isSubmitting || !inputDate || !document?.signedDocument;
  const isPromotionDisabled =
    isSubmitting ||
    !promotionChoice ||
    (promotionChoice === 'yes' && (!inputDate || !document?.signedDocument));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isScheduleMode ? 'Schedule Induction' : 'Review for Promotion'}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading details...' : employeeName ? `For ${employeeName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Status:
            </span>
            {renderStatusBadge()}
          </div>

          {/* Current induction date info (promotion mode) */}
          {isPromotionMode && currentInductionDate && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              Current induction date:{' '}
              <span className="font-semibold">
                {moment(currentInductionDate).format('DD MMM YYYY')}
              </span>
            </div>
          )}

          {/* No-promotion notice — mirrors InductionTab's noPromotion banner */}
          {noPromotion && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This employee was marked for <strong>no promotion</strong>. No further
                induction schedules can be added.
              </p>
            </div>
          )}

          {/* Schedule Mode UI */}
          {isScheduleMode && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Induction Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={inputDate}
                  onChange={(date: any) => setInputDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                  placeholderText="Select date..."
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  preventOpenOnFocus
                />
              </div>
            </div>
          )}

          {/* Promotion Mode UI */}
          {isPromotionMode && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <Label className="text-sm font-medium text-gray-700">
                Is this employee getting promoted? <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={promotionChoice === 'yes' ? 'default' : 'outline'}
                  onClick={() => setPromotionChoice('yes')}
                  className={cn(
                    'flex-1 transition-colors',
                    promotionChoice === 'yes'
                      ? 'bg-theme hover:bg-theme/90 border-theme'
                      : 'border-gray-200'
                  )}
                >
                  <TrendingUp className="mr-2 h-4 w-4" /> Yes, Promote
                </Button>
                <Button
                  type="button"
                  variant={promotionChoice === 'no' ? 'default' : 'outline'}
                  onClick={() => setPromotionChoice('no')}
                  className={cn(
                    'flex-1 transition-colors',
                    promotionChoice === 'no'
                      ? 'bg-red-600 hover:bg-red-700 border-red-600'
                      : 'border-gray-200'
                  )}
                >
                  <X className="mr-2 h-4 w-4" /> No
                </Button>
              </div>

              {/* Only show Date Picker if "yes" is selected */}
              {promotionChoice === 'yes' && (
                <div className="flex flex-col space-y-2 pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label className="text-sm font-medium text-gray-700">
                    Next Induction Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    selected={inputDate}
                    onChange={(date: any) => setInputDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select next date..."
                    minDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Pre-Filled Document View */}
          {!noPromotion && (
            <div className="mt-2 space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Attached Document{' '}
                {((isScheduleMode) || (isPromotionMode && promotionChoice === 'yes')) && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex items-center gap-3 rounded-md border border-gray-200 p-3 bg-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme/20 text-theme">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {document?.content || 'Signed_Induction_Document.pdf'}
                  </p>
                </div>
              </div>
              
              {/* Document Validation Notice */}
              {((isScheduleMode) || (isPromotionMode && promotionChoice === 'yes')) && !document?.signedDocument && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  No signed document URL found. Cannot proceed without it.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {/* Schedule mode button */}
          {isScheduleMode && (
            <Button
              onClick={handleSchedule}
              disabled={isScheduleDisabled}
              className="bg-theme text-white hover:bg-theme/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <Calendar className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          )}

          {/* Promotion mode button */}
          {isPromotionMode && (
            <Button
              onClick={handlePromotion}
              disabled={isPromotionDisabled}
              className={cn(
                'text-white transition-colors',
                promotionChoice === 'no'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-theme hover:bg-theme/90'
              )}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && (promotionChoice === 'no' ? <CheckSquare className="mr-2 h-4 w-4" /> : <TrendingUp className="mr-2 h-4 w-4" />)}
              {isSubmitting ? 'Saving...' : 'Confirm Decision'}
            </Button>
          )}

          {/* No-promotion state: nothing actionable, just close */}
          {noPromotion && !isScheduleMode && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}