import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Pencil,
  ShieldCheck,
  Trash2,
  XCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { KITCHEN_MODULES } from '../constants';
import { KitchenLogRecord, logTarget, needsApproval } from '../shared';
import {
  KitchenLogDetailsBody,
  KitchenLogHistory
} from '../components/KitchenLogDetails';
import { ApproveKitchenLogDialog } from '../components/ApproveKitchenLogDialog';
import {
  KitchenLogAction,
  KitchenLogActionDialog
} from '../components/KitchenLogActionDialog';

// Company side: the whole log on the left, its activity on the right. A
// completed log can be edited or deleted; an unfinished one (in progress,
// paused or awaiting completion) can be completed for the employee,
// discarded or deleted.
export default function KitchenLogDetailsPage() {
  const { id, lid } = useParams(); // companyId, logId
  const navigate = useNavigate();
  const listPath = `/company/${id}/kitchen-log`;

  const [log, setLog] = useState<KitchenLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [action, setAction] = useState<KitchenLogAction | null>(null);

  const fetchLog = useCallback(() => {
    axiosInstance
      .get(`/kitchen-log/${lid}`)
      .then((res) => setLog(res.data?.data || null))
      .catch(() => setLog(null))
      .finally(() => setLoading(false));
  }, [lid]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  if (loading) {
    return (
      <div className="flex min-h-[97vh] justify-center rounded-md bg-white py-24">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const open = log && log.status !== 'completed';
  const target = log ? logTarget(log) : '';

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold text-black lg:text-2xl">
            {log ? KITCHEN_MODULES[log.module]?.label : 'Kitchen Log'}
            {target && (
              <span className="ml-1.5 text-base font-semibold lg:text-lg">
                ({target})
              </span>
            )}
          </h2>
          {open && (
            <p className="mt-1 text-xs font-semibold text-orange-700 sm:text-sm">
              Not submitted yet. Complete it for the employee, or discard it to
              free the {target ? 'shift or item' : 'log'} again.
            </p>
          )}
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
          <Button
            size="sm"
            variant="default"
            onClick={() => navigate(listPath)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {log && needsApproval(log) && (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
              onClick={() => setApproving(true)}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Approve
            </Button>
          )}
          {log &&
            (open ? (
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                onClick={() => navigate('edit')}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => navigate('edit')}
              >
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            ))}
          {open && (
            <Button
              size="sm"
              className="flex-1 bg-orange-500 text-white hover:bg-orange-600 hover:text-white sm:flex-none"
              onClick={() => setAction('discard')}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Discard
            </Button>
          )}
          {log && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => setAction('delete')}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {!log ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-black">
          This kitchen log could not be found. It may have been deleted or
          discarded.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
            <KitchenLogDetailsBody log={log} />
          </div>
          <div className="h-fit space-y-2 rounded-xl border border-gray-200 p-3 sm:p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-black">
              <History className="h-4 w-4" />
              Activity ({log.logs?.length || 0})
            </p>
            <KitchenLogHistory log={log} />
          </div>
        </div>
      )}

      <ApproveKitchenLogDialog
        log={approving ? log : null}
        onClose={() => setApproving(false)}
        onApproved={() => {
          setApproving(false);
          fetchLog();
        }}
      />

      <KitchenLogActionDialog
        log={log}
        action={action}
        onClose={() => setAction(null)}
        onDone={() => navigate(listPath)}
      />
    </div>
  );
}
