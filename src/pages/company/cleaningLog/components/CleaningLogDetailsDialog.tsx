import { CheckCircle2, Circle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CleaningLogRecord,
  completion,
  formatDateTime,
  personName
} from '../shared';
import { CheckDot, TypeBadge } from './CleaningLogList';

export const CleaningLogTitle = ({ log }: { log: CleaningLogRecord }) => (
  <>
    <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-black lg:text-2xl">
      <CheckDot log={log} />
      {log.areaName}
      <TypeBadge type={log.type} />
    </span>
    {log.roomNumber && (
      <p className="mt-1 text-sm text-black">Room {log.roomNumber}</p>
    )}
  </>
);

// Details, checklist and signature - shared by the employee's popup and the
// admin's details page
export function CleaningLogDetailsBody({ log }: { log: CleaningLogRecord }) {
  const { done, total } = completion(log.items);

  // Only worth showing when someone other than the employee filed it
  const filedByOther =
    log.createdBy && log.createdBy._id !== log.employeeId?._id;

  const renderDetail = (label: string, value: React.ReactNode) => (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">
        {label}
      </p>
      <div className="mt-1 break-words text-sm text-black">{value}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {renderDetail('Employee', personName(log.employeeId))}
        {renderDetail('Signed At', formatDateTime(log.signedAt))}
        {renderDetail('Submitted At', formatDateTime(log.createdAt))}
        {filedByOther && renderDetail('Created By', personName(log.createdBy))}
        {log.updatedBy &&
          renderDetail(
            'Last Edited',
            `${personName(log.updatedBy)} · ${formatDateTime(log.updatedAt)}`
          )}
        {renderDetail('Checked', `${done} of ${total} elements`)}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-black">
          Checklist ({done}/{total})
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="hidden grid-cols-[40px_minmax(0,2fr)_minmax(0,3fr)] bg-gray-50 text-xs font-bold uppercase tracking-wider text-black sm:grid">
            <span className="px-3 py-2" />
            <span className="px-3 py-2">Element</span>
            <span className="px-3 py-2">Performance Parameter</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {log.items.map((item, index) => (
              <li
                key={`${item.elementId || index}`}
                className={cn(
                  'grid grid-cols-[36px_minmax(0,1fr)] gap-y-1 py-2.5 sm:grid-cols-[40px_minmax(0,2fr)_minmax(0,3fr)]',
                 
                )}
              >
                <span className="flex justify-center pt-0.5">
                  {item.checked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                </span>
                <span className="px-2 text-sm font-medium text-black sm:px-3">
                  {item.element}
                </span>
                <span className="col-start-2 whitespace-pre-wrap px-2 text-xs leading-relaxed text-black sm:col-start-3 sm:px-3 sm:text-sm">
                  {item.performanceParameter}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-black">
          Signature
        </p>
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <img
            src={log.signatureUrl}
            alt="Signature"
            className="h-20 w-full max-w-xs rounded border border-gray-200 bg-white object-contain"
          />
          <p className="text-xs text-black">
            Signed at {formatDateTime(log.signedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface CleaningLogDetailsDialogProps {
  log: CleaningLogRecord | null;
  onClose: () => void;
}

// The employee's view of their own log
export function CleaningLogDetailsDialog({
  log,
  onClose
}: CleaningLogDetailsDialogProps) {
  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-4 sm:p-6">
        {log && (
          <>
            <DialogHeader className="border-b border-gray-200 pb-4 text-left">
              <DialogTitle>
                <CleaningLogTitle log={log} />
              </DialogTitle>
            </DialogHeader>
            <CleaningLogDetailsBody log={log} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
