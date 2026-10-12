import { useEffect, useState } from 'react';
import {
  Clock3,
  Loader2,
  Pause,
  Play,
  Square,
  Timer,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CleaningLogRecord,
  CleaningLogStatus,
  elapsedSeconds,
  formatDuration,
  LOG_STATUS_BADGE,
  LOG_STATUS_LABEL
} from '../shared';

export type SessionAction = 'start' | 'pause' | 'resume' | 'stop' | 'discard';

export const StatusBadge = ({
  status,
  className
}: {
  status: CleaningLogStatus;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
      LOG_STATUS_BADGE[status],
      className
    )}
  >
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full bg-current',
        status === 'in_progress' && 'animate-pulse'
      )}
    />
    {LOG_STATUS_LABEL[status]}
  </span>
);

// Ticks once a second while a session is running, otherwise stays still
export function useElapsed(log: CleaningLogRecord | null) {
  const running = log?.status === 'in_progress';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running, log]);

  return log ? elapsedSeconds(log, now) : 0;
}

interface CleaningSessionProps {
  draft: CleaningLogRecord | null;
  busy: SessionAction | null;
  onAction: (action: SessionAction) => void;
}

// The timer card: a Start button before the session exists, then the clock
// with Pause / Resume / Stop
export function CleaningSession({ draft, busy, onAction }: CleaningSessionProps) {
  const seconds = useElapsed(draft);
  const disabled = busy !== null;

  // Colours, hover included, are set in full by each caller; the shared
  // outline variant's hover text colour would otherwise make the label vanish
  const actionButton = (
    action: SessionAction,
    label: string,
    Icon: typeof Play,
    className: string
  ) => (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => onAction(action)}
      className={cn('h-11 flex-1 text-sm font-semibold sm:flex-none sm:px-6', className)}
    >
      {busy === action ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );

  if (!draft) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-theme/30 bg-theme/5 px-4 py-6 text-center sm:py-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-theme/10 text-theme">
          <Timer className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-bold text-black">Ready to start?</p>
          <p className="max-w-sm text-xs text-black sm:text-sm">
            Starting puts this area on hold for you, so no one else can take it
            while you work.
          </p>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => onAction('start')}
          className="h-12 w-full max-w-xs bg-theme text-base font-semibold text-white hover:bg-theme/90 hover:text-white"
        >
          {busy === 'start' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Play className="mr-2 h-5 w-5 fill-current" />
          )}
          Start
        </Button>
      </div>
    );
  }

  const status = (draft.status || 'in_progress') as CleaningLogStatus;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 transition-colors',
        status === 'in_progress'
          ? 'border-amber-300 bg-amber-50/40'
          : status === 'paused'
            ? 'border-slate-300 bg-slate-50'
            : 'border-sky-200 bg-sky-50/40'
      )}
    >
      <div className="flex flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <StatusBadge status={status} />
          <span
            className="font-mono text-4xl font-bold tabular-nums tracking-tight text-black sm:text-5xl"
            aria-live="off"
          >
            {formatDuration(seconds)}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-black sm:justify-start">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" /> Started {draft.startTime || '-'}
            </span>
            {status === 'stopped' && draft.endTime && (
              <span className="inline-flex items-center gap-1">
                <Square className="h-3 w-3" /> Stopped {draft.endTime}
              </span>
            )}
          </span>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <div className="flex w-full gap-2 sm:w-auto">
            {status === 'in_progress' &&
              actionButton(
                'pause',
                'Pause',
                Pause,
                'border-2 border-slate-400 bg-white text-black shadow-sm hover:border-slate-500 hover:bg-slate-100 hover:text-black'
              )}
            {/* A stopped session is final: it can only be completed */}
            {status === 'paused' &&
              actionButton(
                'resume',
                'Resume',
                Play,
                'border-2 border-theme bg-white text-theme shadow-sm hover:bg-theme hover:text-white'
              )}
            {status !== 'stopped' &&
              actionButton('stop', 'Stop', Square, 'bg-red-600 text-white hover:bg-red-700 hover:text-white')}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction('discard')}
            className="inline-flex items-center justify-center gap-1 self-center text-xs font-medium text-red-600 hover:underline disabled:opacity-50 sm:self-end"
          >
            <Trash2 className="h-3.5 w-3.5" /> Discard session
          </button>
        </div>
      </div>

      <p className="border-t border-black/5 bg-white/60 px-4 py-2 text-center text-xs text-black sm:px-6 sm:text-left">
        {status === 'in_progress'
          ? 'Tick the elements as you clean. Pause to switch to another area, or Stop when you are done.'
          : status === 'paused'
            ? 'Paused. You can start another area now and come back to this one later.'
            : 'Stopped. The timer is final. Check the list, sign below and press Complete to submit.'}
      </p>
    </div>
  );
}
