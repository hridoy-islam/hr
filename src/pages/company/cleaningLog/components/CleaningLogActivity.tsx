import {
  CheckCircle2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Square
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { CleaningLogHistory, formatDateTime } from '../shared';

const ACTION_STYLE: Record<
  CleaningLogHistory['action'],
  { icon: typeof Play; className: string }
> = {
  start: { icon: Play, className: 'bg-theme/10 text-theme' },
  pause: { icon: Pause, className: 'bg-orange-100 text-orange-700' },
  resume: { icon: RotateCcw, className: 'bg-sky-100 text-sky-700' },
  stop: { icon: Square, className: 'bg-red-100 text-red-600' },
  create: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  update: { icon: Pencil, className: 'bg-gray-100 text-black' }
};

// Newest entry first, without mutating what the API sent
export const sortHistory = (logs: CleaningLogHistory[] = []) =>
  [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

// Every start, pause, resume, stop, submit and edit of a log, as a timeline
export function CleaningLogActivity({
  logs,
  className
}: {
  logs?: CleaningLogHistory[];
  className?: string;
}) {
  const history = sortHistory(logs);

  if (!history.length) {
    return (
      <p className="m-3 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-xs italic text-black sm:text-sm">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ol className={cn('relative space-y-1 p-2', className)}>
      {history.map((entry, index) => {
        const { icon: Icon, className: tone } =
          ACTION_STYLE[entry.action] || ACTION_STYLE.update;
        return (
          <li
            key={entry._id || `${entry.date}-${index}`}
            className="relative flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
          >
            {/* The line joining each entry to the one before it */}
            {index < history.length - 1 && (
              <span className="absolute left-[21px] top-9 h-[calc(100%-20px)] w-px bg-gray-200" />
            )}
            <span
              className={cn(
                'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                tone
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-xs font-semibold leading-relaxed text-black sm:text-sm">
                {entry.title}
              </span>
              <span className="block text-[11px] text-black sm:text-xs">
                {formatDateTime(entry.date)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
