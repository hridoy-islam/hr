import { Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { personName } from '@/pages/company/cleaningLog/shared';
import { FREQUENCY_LABEL, KITCHEN_MODULES } from '../constants';
import {
  formatLogDate,
  FREQUENCY_COLOR,
  KitchenLogRecord,
  LOG_STATUS_BADGE,
  LOG_STATUS_LABEL,
  logTarget,
  needsApproval
} from '../shared';

export const ApprovalBadge = ({ log }: { log: KitchenLogRecord }) => {
  if (!KITCHEN_MODULES[log.module]?.requiresApproval) return null;
  const approved = Boolean(log.approvedAt);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        approved
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-orange-100 text-orange-700 ring-orange-300'
      )}
    >
      {approved ? 'Approved' : 'Needs Approval'}
    </span>
  );
};

export const StatusPill = ({ log }: { log: KitchenLogRecord }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
      LOG_STATUS_BADGE[log.status]
    )}
  >
    {LOG_STATUS_LABEL[log.status]}
  </span>
);

export const logPeriodLabel = (log: KitchenLogRecord) =>
  formatLogDate(log.logDate);

interface KitchenLogTableProps {
  logs: KitchenLogRecord[];
  emptyText: string;
  // The approval list mixes daily, weekly and monthly logs, so badges which
  showFrequency?: boolean;
  onView: (log: KitchenLogRecord) => void;
  onApprove?: (log: KitchenLogRecord) => void;
  onEdit?: (log: KitchenLogRecord) => void;
  onDelete?: (log: KitchenLogRecord) => void;
}

export function KitchenLogTable({
  logs,
  emptyText,
  showFrequency,
  onView,
  onApprove,
  onEdit,
  onDelete
}: KitchenLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-black">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[760px] border-collapse text-sm text-black">
        <thead>
          <tr className="bg-gray-100 text-left text-xs font-bold uppercase tracking-wide">
            <th className="px-3 py-2.5">Date</th>
            {/* <th className="px-3 py-2.5">Log</th> */}
            <th className="px-3 py-2.5">Area</th>
            <th className="w-[15%] px-3 py-2.5">Employee</th>
            <th className="px-3 py-2.5">Start Time</th>
            <th className="px-3 py-2.5">End Time</th>
            {/* {!showFrequency && <th className="px-3 py-2.5">Status</th>} */}
            <th className="px-3 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const frequency =
              KITCHEN_MODULES[log.module]?.frequency || log.frequency;
            return (
              <tr
                key={log._id}
                className="cursor-pointer border-t border-gray-200 transition-colors hover:bg-gray-50"
                onClick={() => onView(log)}
              >
                <td className="px-3 py-2.5">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {KITCHEN_MODULES[log.module]?.label || log.module}
                      </span>
                      {showFrequency && frequency && (
                        <span
                          className={cn(
                            'inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            FREQUENCY_COLOR[frequency].soft
                          )}
                        >
                          {FREQUENCY_LABEL[frequency]}
                        </span>
                      )}
                    </span>
                    {logPeriodLabel(log)}
                  </div>
                </td>
                {/* <td className="px-3 py-2.5 font-semibold">
              </td> */}
                <td className="px-3 py-2.5">{logTarget(log) || '-'}</td>
                <td className="px-3 py-2.5">{personName(log.employeeId)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {log.startTime || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {log.endTime || '-'}
                </td>
                {/* {!showFrequency && (
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <StatusPill log={log} />
                    <ApprovalBadge log={log} />
                  </div>
                </td>
              )} */}

                {/* The buttons do their own thing, not the row's */}
                <td
                  className="px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-end gap-1.5">
                    {onApprove && needsApproval(log) && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => onApprove(log)}
                      >
                        <ShieldCheck className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(log)}
                    >
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    {onEdit && log.status === 'completed' && (
                      <Button size="sm" onClick={() => onEdit(log)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(log)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
