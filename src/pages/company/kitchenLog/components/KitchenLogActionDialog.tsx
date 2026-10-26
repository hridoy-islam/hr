import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { apiError, personName } from '@/pages/company/cleaningLog/shared';
import { KITCHEN_MODULES } from '../constants';
import { KitchenLogRecord, logTarget } from '../shared';

// Discard drops an unfinished log and frees its shift or item for the period;
// delete removes any log for good
export type KitchenLogAction = 'delete' | 'discard';

const COPY: Record<
  KitchenLogAction,
  { title: string; button: string; done: string; failed: string }
> = {
  delete: {
    title: 'Delete Kitchen Log',
    button: 'Delete',
    done: 'Kitchen log deleted successfully',
    failed: 'Failed to delete kitchen log'
  },
  discard: {
    title: 'Discard Kitchen Log',
    button: 'Discard',
    done: 'Kitchen log discarded',
    failed: 'Failed to discard kitchen log'
  }
};

interface KitchenLogActionDialogProps {
  log: KitchenLogRecord | null;
  action: KitchenLogAction | null;
  onClose: () => void;
  onDone: (log: KitchenLogRecord, action: KitchenLogAction) => void;
}

export function KitchenLogActionDialog({
  log,
  action,
  onClose,
  onDone
}: KitchenLogActionDialogProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const copy = action ? COPY[action] : null;

  const confirm = async () => {
    if (!log || !action || !copy) return;
    try {
      setBusy(true);
      await axiosInstance.delete(
        action === 'discard'
          ? `/kitchen-log/${log._id}/discard`
          : `/kitchen-log/${log._id}`
      );
      toast({ title: copy.done, className: 'bg-theme border-none text-white' });
      onDone(log, action);
    } catch (error) {
      toast({
        title: apiError(error, copy.failed),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setBusy(false);
    }
  };

  const name = log ? KITCHEN_MODULES[log.module]?.label : '';
  const target = log ? logTarget(log) : '';

  return (
    <AlertDialog
      open={Boolean(log && action)}
      onOpenChange={(open) => !open && !busy && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-black">
            {action === 'discard' ? (
              <>
                The unfinished{' '}
                <span className="font-semibold">
                  {name}
                  {target && ` (${target})`}
                </span>{' '}
                log of {personName(log?.employeeId)} will be dropped, with its
                time and progress. The {target ? 'shift or item' : 'log'} is
                free to be started again.
              </>
            ) : (
              <>
                This will permanently delete the{' '}
                <span className="font-semibold">
                  {name}
                  {target && ` (${target})`}
                </span>{' '}
                log of {personName(log?.employeeId)}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {copy?.button}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
