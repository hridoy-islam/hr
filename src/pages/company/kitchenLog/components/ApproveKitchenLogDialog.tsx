import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { apiError, personName } from '@/pages/company/cleaningLog/shared';
import { KITCHEN_MODULES, TEST_APPROVAL_SIGNATURE } from '../constants';
import { formatLogDate, KitchenLogRecord, logTarget } from '../shared';

interface ApproveKitchenLogDialogProps {
  log: KitchenLogRecord | null;
  onClose: () => void;
  onApproved: (log: KitchenLogRecord) => void;
}

// Management checks the area and signs it off, with an optional comment
export function ApproveKitchenLogDialog({
  log,
  onClose,
  onApproved
}: ApproveKitchenLogDialogProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setComment('');
    onClose();
  };

  const approve = async () => {
    if (!log) return;
    try {
      setSaving(true);
      const res = await axiosInstance.patch(`/kitchen-log/${log._id}/approve`, {
        approvalSignature: TEST_APPROVAL_SIGNATURE,
        approvalComment: comment
      });
      toast({
        title: 'Log approved',
        className: 'bg-theme border-none text-white'
      });
      setComment('');
      onApproved(res.data?.data);
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to approve the log'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Log</DialogTitle>
        </DialogHeader>

        {log && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-black">
              <p className="font-bold">{KITCHEN_MODULES[log.module].label}</p>
              <p>
                {[logTarget(log), formatLogDate(log.logDate)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p>
                Completed by {personName(log.employeeId)} ·{' '}
                {log.startTime || '-'} - {log.endTime || '-'}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-black">Comment</p>
              <Textarea
                value={comment}
                disabled={saving}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment on the area checked"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-black">
                Management Signature
              </p>
              <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
                <img
                  src={TEST_APPROVAL_SIGNATURE}
                  alt="Management signature"
                  className="h-24 w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={saving} onClick={close}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving}
            onClick={approve}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-1.5 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
