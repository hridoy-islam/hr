import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Play,
  Square,
  Timer,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { cn } from '@/lib/utils';
import { apiError, formatDuration } from '@/pages/company/cleaningLog/shared';
import {
  SignaturePad,
  SignaturePadHandle
} from '@/pages/company/cleaningLog/components/SignaturePad';
import { KITCHEN_MODULES, KitchenModule, KitchenShift } from '../constants';
import {
  KitchenBoardTarget,
  KitchenFieldValues,
  KitchenLogRecord,
  LOG_STATUS_BADGE,
  LOG_STATUS_LABEL,
  missingField,
  payloadFromValues,
  valuesFromLog
} from '../shared';
import { KitchenLogFields } from './KitchenLogFields';

// Seconds on the clock: from the start to the stop, or to now while running
export function useKitchenTimer(log: KitchenLogRecord | null) {
  const running = log?.status === 'in_progress';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running, log]);

  if (!log?.startedAt) return log?.durationSeconds || 0;
  const end = log.stoppedAt ? new Date(log.stoppedAt).getTime() : now;
  return Math.max(0, (end - new Date(log.startedAt).getTime()) / 1000);
}

interface KitchenSessionProps {
  companyId: string;
  module: KitchenModule;
  target: KitchenBoardTarget;
  // The employee's own session on this target, if one is open
  log: KitchenLogRecord | null;
  // While a start / stop / complete / discard is running, so the page's
  // Back waits for it
  onBusyChange: (busy: boolean) => void;
  // Any change to the session, so the board can follow
  onChange: () => void;
  onCompleted: (log: KitchenLogRecord) => void;
}

type Busy = 'start' | 'stop' | 'complete' | 'discard' | null;

export function KitchenSession({
  companyId,
  module,
  target,
  log: initialLog,
  onBusyChange,
  onChange,
  onCompleted
}: KitchenSessionProps) {
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user);
  const config = KITCHEN_MODULES[module];

  const [log, setLog] = useState<KitchenLogRecord | null>(initialLog);
  const [values, setValues] = useState<KitchenFieldValues>(() =>
    valuesFromLog(initialLog)
  );
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const signatureRef = useRef<SignaturePadHandle>(null);
  const seconds = useKitchenTimer(log);

  const shift = (log?.shift ||
    (module === 'kitchen_cleaning' ? target.key : undefined)) as
    | KitchenShift
    | undefined;
  const open = log && log.status !== 'completed';
  // Untimed logs (equipment temperatures) are filled in straight away
  const editable = !config.timed || Boolean(open);

  const fail = (err: unknown, fallback: string) => {
    const message = apiError(err, fallback);
    setError(message);
    toast({ title: message, className: 'bg-red-500 border-none text-white' });
  };

  // Ticks and readings are kept as they are made, so a reload loses nothing
  const saveProgress = useDebouncedCallback((next: KitchenFieldValues) => {
    if (!log || log.status === 'completed') return;
    axiosInstance
      .patch(
        `/kitchen-log/${log._id}/progress`,
        payloadFromValues(module, next)
      )
      .catch(() => undefined);
  }, 800);

  useEffect(() => () => saveProgress.flush(), [saveProgress]);

  const changeValues = (next: KitchenFieldValues) => {
    setValues(next);
    setError('');
    if (open) saveProgress(next);
  };

  const start = async () => {
    try {
      setBusy('start');
      setError('');
      const res = await axiosInstance.post('/kitchen-log/start', {
        companyId,
        module,
        ...(module === 'kitchen_cleaning' ? { shift: target.key } : {}),
        ...(target.key !== 'single' && module !== 'kitchen_cleaning'
          ? { itemKey: target.key }
          : {})
      });
      setLog(res.data?.data);
      setValues(valuesFromLog(res.data?.data));
      onChange();
    } catch (err) {
      fail(err, 'Failed to start');
    } finally {
      setBusy(null);
    }
  };

  const stop = async () => {
    if (!log) return;
    try {
      setBusy('stop');
      saveProgress.cancel();
      const res = await axiosInstance.patch(
        `/kitchen-log/${log._id}/stop`,
        payloadFromValues(module, values)
      );
      setLog(res.data?.data);
      onChange();
    } catch (err) {
      fail(err, 'Failed to end');
    } finally {
      setBusy(null);
    }
  };

  // Kitchen cleaning checks are optional, any of them can be left unticked
  const complete = async () => {
    const missing = missingField(module, values, shift);
    if (missing) {
      setError(missing);
      return;
    }
    if (signatureRef.current?.isEmpty()) {
      setSignatureError('Please sign before completing');
      return;
    }

    try {
      setBusy('complete');
      setError('');
      saveProgress.cancel();
      const signature = await signatureRef.current!.save();
      const payload = { ...payloadFromValues(module, values), ...signature };

      const res = log
        ? await axiosInstance.patch(`/kitchen-log/${log._id}/complete`, payload)
        : await axiosInstance.post('/kitchen-log', {
            ...payload,
            companyId,
            module
          });
      onChange();
      onCompleted(res.data?.data);
    } catch (err) {
      fail(err, 'Failed to submit');
    } finally {
      setBusy(null);
    }
  };

  const discard = async () => {
    if (!log) return;
    try {
      setBusy('discard');
      saveProgress.cancel();
      await axiosInstance.delete(`/kitchen-log/${log._id}/discard`);
      setLog(null);
      setValues(valuesFromLog(null));
      onChange();
    } catch (err) {
      fail(err, 'Failed to discard');
    } finally {
      setBusy(null);
    }
  };

  const date = log?.logDate || new Date().toISOString();
  const disabled = busy !== null;

  useEffect(() => {
    onBusyChange(disabled);
  }, [disabled, onBusyChange]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 p-3 sm:p-5">
      {/* What this log is for */}
      <div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-black">
            {config.label}
          </p>
          <h3 className="break-words text-lg font-bold text-black sm:text-xl">
            {target.label}
            {module === 'kitchen_cleaning' && target.description && (
              <span className="ml-1 text-base font-semibold">
                ({target.description})
              </span>
            )}
          </h3>
          {module !== 'kitchen_cleaning' && target.description && (
            <p className="text-sm text-black">{target.description}</p>
          )}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-4 w-4" />
              {moment(date).format('dddd, DD MMMM YYYY')}
            </span>
          </p>
        </div>
      </div>

      {/* Not started yet */}
      {config.timed && !log && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
          <Timer className="h-10 w-10 text-theme" />
          <p className="max-w-sm text-sm text-black">
            Press Start when you begin. The start time is taken now and the
            timer runs until you press End.
          </p>
          <Button
            size="lg"
            className="bg-theme px-10 text-white hover:bg-theme/90"
            disabled={disabled}
            onClick={start}
          >
            {busy === 'start' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            Start
          </Button>
        </div>
      )}

      {/* Timer */}
      {config.timed && log && (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border-2 p-3 sm:flex-row sm:items-center sm:justify-between',
            log.status === 'in_progress'
              ? 'border-amber-300 bg-amber-50/60'
              : 'border-sky-200 bg-sky-50/60'
          )}
        >
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                LOG_STATUS_BADGE[log.status]
              )}
            >
              {LOG_STATUS_LABEL[log.status]}
            </span>
            <p className="font-mono text-3xl font-bold tabular-nums text-black">
              {formatDuration(seconds)}
            </p>
            <p className="text-xs text-black">
              Started {log.startTime || '-'}
              {log.endTime && ` · Ended ${log.endTime}`}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={disabled}
            onClick={discard}
          >
            {busy === 'discard' ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-4 w-4" />
            )}
            Discard
          </Button>
        </div>
      )}

      {editable && (
        <>
          <KitchenLogFields
            module={module}
            shift={shift}
            values={values}
            onChange={changeValues}
            disabled={disabled}
          />

          <div className="w-full space-y-1.5 md:max-w-md">
            <p className="text-sm font-semibold text-black">Signature*</p>
            <SignaturePad
              ref={signatureRef}
              entityId={user?._id || companyId}
              signatureUrl=""
              signedAt={null}
              disabled={disabled}
              onDraw={() => setSignatureError('')}
              error={signatureError}
              height={200}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {config.timed && log?.status === 'in_progress' && (
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={disabled}
                onClick={stop}
              >
                {busy === 'stop' ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-1.5 h-4 w-4" />
                )}
                End
              </Button>
            )}
            {(!config.timed || log?.status === 'stopped') && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={disabled}
                onClick={complete}
              >
                {busy === 'complete' ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Submit
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
