import { AlertTriangle, Check, ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  formatDateTime,
  formatDuration,
  personName
} from '@/pages/company/cleaningLog/shared';
import { KITCHEN_MODULES } from '../constants';
import { KitchenLogRecord, logTarget, needsApproval } from '../shared';
import { ProbeCalibrationNote } from './KitchenLogFields';
import { ApprovalBadge, logPeriodLabel, StatusPill } from './KitchenLogTable';

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid grid-cols-[130px_1fr] gap-2 border-b border-gray-100 py-1.5 text-sm text-black last:border-b-0">
    <span className="font-semibold">{label}</span>
    <span className="min-w-0 break-words">{value || '-'}</span>
  </div>
);

const Tick = ({ checked }: { checked: boolean }) => (
  <span
    className={cn(
      'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
      checked
        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
        : 'border-gray-300 text-gray-400'
    )}
  >
    {checked ? (
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    ) : (
      <X className="h-3 w-3" />
    )}
  </span>
);

const Signature = ({ url, label }: { url?: string; label: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-semibold text-black">{label}</p>
    {url ? (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
        <img src={url} alt={label} className="h-20 w-full object-contain" />
      </div>
    ) : (
      <p className="text-sm italic text-black">Not signed</p>
    )}
  </div>
);

// The module's own readings, as they were signed
export function KitchenLogReadings({ log }: { log: KitchenLogRecord }) {
  if (log.module === 'kitchen_cleaning') {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          {(log.checklist || []).map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-2 text-sm text-black"
            >
              <Tick checked={item.checked} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          {(log.readings || []).map((reading) => (
            <div
              key={reading.key}
              className="grid grid-cols-[150px_1fr] border-b border-gray-200 text-sm text-black last:border-b-0"
            >
              <span className="border-r border-gray-200 bg-gray-50 px-3 py-1.5 font-semibold">
                {reading.label}
              </span>
              <span className="px-3 py-1.5">{reading.value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (log.module === 'equipment_temperature') {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-black">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-1.5">Equipment</th>
              <th className="px-3 py-1.5">Time</th>
              <th className="px-3 py-1.5">Temp</th>
            </tr>
          </thead>
          <tbody>
            {(log.temperatures || []).map((reading) => (
              <tr
                key={reading.key}
                className={cn(
                  'border-t border-gray-200',
                  reading.outOfRange && 'bg-red-50'
                )}
              >
                <td className="px-3 py-1.5 font-semibold">
                  {reading.label} ({reading.range})
                </td>
                <td className="px-3 py-1.5">{reading.time || '-'}</td>
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-1">
                    {typeof reading.temperature === 'number'
                      ? `${reading.temperature}°C`
                      : '-'}
                    {reading.outOfRange && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (log.module === 'probe_calibration') {
    const reading = (value?: number, ok?: boolean) =>
      typeof value === 'number' ? (
        <span className={cn(ok === false && 'font-semibold text-red-600')}>
          {value}°C{ok === false && ' (outside range)'}
        </span>
      ) : (
        '-'
      );
    return (
      <div className="space-y-3">
        <div>
          <Row label="Probe details" value={log.probeDetails} />
          <Row
            label="Iced water"
            value={reading(log.icedWaterReading, log.icedWaterInRange)}
          />
          <Row
            label="Boiling water"
            value={reading(log.boilingWaterReading, log.boilingWaterInRange)}
          />
        </div>
        <ProbeCalibrationNote />
      </div>
    );
  }

  if (log.action) {
    return (
      <div>
        <Row label="Action" value={log.action} />
        <Row label="Frequency" value={log.itemFrequency} />
      </div>
    );
  }

  return null;
}

interface KitchenLogDetailsDialogProps {
  log: KitchenLogRecord | null;
  onClose: () => void;
  onApprove?: (log: KitchenLogRecord) => void;
}

export function KitchenLogDetailsDialog({
  log,
  onClose,
  onApprove
}: KitchenLogDetailsDialogProps) {
  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {log ? KITCHEN_MODULES[log.module]?.label : 'Kitchen Log'}
          </DialogTitle>
        </DialogHeader>

        {log && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1">
              <StatusPill log={log} />
              <ApprovalBadge log={log} />
            </div>

            <div>
              <Row label="Date" value={logPeriodLabel(log)} />
              <Row label="Item / Shift" value={logTarget(log)} />
              <Row label="Employee" value={personName(log.employeeId)} />
              <Row
                label="Time"
                value={`${log.startTime || '-'} - ${log.endTime || '-'}`}
              />
              {Boolean(log.durationSeconds) && (
                <Row
                  label="Duration"
                  value={formatDuration(log.durationSeconds || 0)}
                />
              )}
              <Row label="Completed" value={formatDateTime(log.completedAt)} />
              {log.note && <Row label="Note" value={log.note} />}
            </div>

            <KitchenLogReadings log={log} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Signature url={log.signatureUrl} label="Employee Signature" />
              {KITCHEN_MODULES[log.module]?.requiresApproval && (
                <div className="space-y-1">
                  <Signature
                    url={log.approvalSignature}
                    label="Management Signature"
                  />
                  {log.approvedAt && (
                    <p className="text-xs text-black">
                      Approved by {personName(log.approvedBy)} on{' '}
                      {formatDateTime(log.approvedAt)}
                    </p>
                  )}
                  {log.approvalComment && (
                    <p className="text-xs text-black">
                      Comment: {log.approvalComment}
                    </p>
                  )}
                </div>
              )}
            </div>

            {onApprove && needsApproval(log) && (
              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => onApprove(log)}
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            )}

            {(log.logs || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-black">History</p>
                {[...(log.logs || [])].reverse().map((entry, index) => (
                  <p
                    key={entry._id || index}
                    className="flex justify-between gap-2 border-b border-gray-100 py-1 text-xs text-black"
                  >
                    <span>{entry.title}</span>
                    <span className="shrink-0">
                      {formatDateTime(entry.date)}
                    </span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
