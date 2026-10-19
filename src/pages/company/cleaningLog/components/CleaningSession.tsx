import { useEffect, useState } from 'react';
import {
  Loader2,
  Pause,
  PauseCircle,
  Play,
  Square,
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
  // Something is ticked already: the employee has chosen to work without
  // the timer, so Start is no longer offered
  hasTicks?: boolean;
}

// Plain buttons for an untimed log, or, for one started with the timer, the
// clock with Pause / Resume / Stop
export function CleaningSession({
  draft,
  busy,
  onAction,
  hasTicks = false
}: CleaningSessionProps) {
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
      className={cn(
        'h-11 flex-1 text-sm font-semibold sm:flex-none sm:px-6',
        className
      )}
    >
      {busy === action ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );

  // Smaller, rounded buttons for the untimed states
  const pillButton = (
    action: SessionAction,
    label: string,
    Icon: typeof Play,
    className: string
  ) => (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => onAction(action)}
      className={cn(
        'h-10 flex-1 rounded-full px-5 font-semibold shadow-sm sm:flex-none',
        className
      )}
    >
      {busy === action ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-1.5 h-4 w-4" />
      )}
      {label}
    </Button>
  );

  const status = (draft?.status || 'in_progress') as CleaningLogStatus;
  // A log that never started the timer has no clock to show
  const timed = (draft?.sessions || []).length > 0;

  // Untimed, the times are typed in below:
  //   new log            -> Start (until something is ticked) and Pause
  //   paused, no timer   -> highlighted, Resume only
  //   resumed, no timer  -> Pause and Discard session
  // Once Start is pressed the log is timed and gets the full clock card.
  if (!timed) {
    const pauseButton = pillButton(
      'pause',
      'Pause',
      Pause,
      'bg-orange-500 text-white hover:bg-orange-600 hover:text-white'
    );

    if (status === 'paused') {
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-3 shadow-sm ring-4 ring-orange-100 sm:flex-row sm:items-center sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
              <PauseCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-black">
              Paused · not submitted yet
            </p>
          </div>
          {pillButton(
            'resume',
            'Resume',
            Play,
            'bg-theme text-white hover:bg-theme/90 hover:text-white'
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!draft &&
          !hasTicks &&
          pillButton(
            'start',
            'Start',
            Play,
            'bg-theme text-white hover:bg-theme/90 hover:text-white'
          )}
        {pauseButton}
        {draft &&
          pillButton(
            'discard',
            'Discard session',
            Trash2,
            'border border-red-200 bg-white text-red-600 shadow-none hover:bg-red-50 hover:text-red-700'
          )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 transition-colors',
        status === 'in_progress'
          ? 'border-amber-300 bg-amber-50/40'
          : status === 'paused'
            ? 'border-orange-400 bg-orange-50 ring-4 ring-orange-100'
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
              actionButton(
                'stop',
                'Stop',
                Square,
                'bg-red-600 text-white hover:bg-red-700 hover:text-white'
              )}
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

      <p
        className={cn(
          'border-t border-black/5 px-4 py-2 text-center text-xs text-black sm:px-6 sm:text-left',
          status === 'paused' ? 'bg-orange-100 font-semibold' : 'bg-white/60'
        )}
      >
        {status === 'in_progress'
          ? 'Tick the elements as you clean. Pause to switch to another area, or Stop when you are done.'
          : status === 'paused'
            ? 'Paused, not submitted yet. Your ticks and times are saved. Resume to carry on.'
            : 'Stopped. The timer is final. Check the list, sign below and press Complete to submit.'}
      </p>
    </div>
  );
}
