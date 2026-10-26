import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Lock,
  PauseCircle,
  Play,
  Repeat,
  Timer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  apiError,
  formatDuration,
  personName
} from '@/pages/company/cleaningLog/shared';
import {
  FREQUENCY_LABEL,
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULES,
  KitchenFrequency,
  KitchenModule
} from '@/pages/company/kitchenLog/constants';
import {
  KitchenBoard,
  KitchenBoardModule,
  KitchenBoardTarget,
  KitchenLogRecord,
  formatLogDate,
  logTarget
} from '@/pages/company/kitchenLog/shared';
import { KitchenSession } from '@/pages/company/kitchenLog/components/KitchenSession';

const FREQUENCY_ICON: Record<KitchenFrequency, typeof CalendarDays> = {
  daily: CalendarDays,
  weekly: CalendarRange,
  twice_weekly: Repeat,
  monthly: CalendarClock
};

// Modules with one thing to do per period open straight on it; the others
// list their shifts or items first
const pickTargetFirst = (module: KitchenModule) =>
  module === 'kitchen_cleaning' ||
  module === 'larder_deep_clean' ||
  module === 'servery_deep_clean' ||
  module === 'mini_kitchen_deep_clean';

export default function StaffKitchenLogPage() {
  const { id } = useParams(); // companyId
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user);

  const [frequency, setFrequency] = useState<KitchenFrequency | null>(null);
  const [board, setBoard] = useState<KitchenBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState<KitchenModule | null>(null);
  const [target, setTarget] = useState<KitchenBoardTarget | null>(null);
  // The employee's own open session on the picked target
  const [session, setSession] = useState<KitchenLogRecord | null>(null);
  const [opening, setOpening] = useState(false);
  const [completed, setCompleted] = useState<KitchenLogRecord | null>(null);
  // The open session is saving, so Back waits
  const [sessionBusy, setSessionBusy] = useState(false);
  // The employee's paused logs, listed at the top until they are finished
  const [paused, setPaused] = useState<KitchenLogRecord[]>([]);

  const fetchPaused = useCallback(() => {
    axiosInstance
      .get('/kitchen-log/paused', { params: { companyId: id } })
      .then((res) => setPaused(res.data?.data || []))
      .catch(() => setPaused([]));
  }, [id]);

  useEffect(() => {
    fetchPaused();
  }, [fetchPaused]);

  const fetchBoard = useCallback(
    async (next: KitchenFrequency, quiet = false) => {
      try {
        if (!quiet) setLoading(true);
        const res = await axiosInstance.get('/kitchen-log/board', {
          params: { companyId: id, frequency: next }
        });
        setBoard(res.data?.data || null);
      } catch (err) {
        setBoard(null);
        toast({
          title: apiError(err, 'Failed to load the kitchen logs'),
          className: 'bg-red-500 border-none text-white'
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  useEffect(() => {
    if (frequency) fetchBoard(frequency);
  }, [frequency, fetchBoard]);

  const boardModule = (key: KitchenModule | null) =>
    board?.modules.find((entry) => entry.module === key) || null;

  const mine = (entry: { employeeId?: { _id: string } }) =>
    entry.employeeId?._id === user?._id;

  const openTarget = async (
    nextModule: KitchenModule,
    nextTarget: KitchenBoardTarget
  ) => {
    setCompleted(null);
    const own = nextTarget.entries.find(
      (entry) => entry.status !== 'completed' && mine(entry)
    );
    if (!own) {
      setSession(null);
      setTarget(nextTarget);
      return;
    }
    try {
      setOpening(true);
      const res = await axiosInstance.get(`/kitchen-log/${own._id}`);
      setSession(res.data?.data || null);
      setTarget(nextTarget);
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to open the log'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setOpening(false);
    }
  };

  // Opens a paused log from the list at the top. Its shift or item is taken
  // from the board when the log belongs to the current period; an older one
  // is opened from the log itself.
  const openPaused = async (log: KitchenLogRecord) => {
    try {
      setOpening(true);
      setCompleted(null);
      const [boardRes, logRes] = await Promise.all([
        axiosInstance.get('/kitchen-log/board', {
          params: { companyId: id, frequency: log.frequency }
        }),
        axiosInstance.get(`/kitchen-log/${log._id}`)
      ]);
      const nextBoard: KitchenBoard | null = boardRes.data?.data || null;
      const fromBoard = nextBoard?.modules
        .find((entry) => entry.module === log.module)
        ?.targets.find((item) =>
          item.entries.some((entry) => entry._id === log._id)
        );
      const fallback: KitchenBoardTarget = {
        key: log.shift || log.itemKey || 'single',
        label: logTarget(log) || KITCHEN_MODULES[log.module].label,
        required: 1,
        done: 0,
        isDone: false,
        entries: []
      };
      setBoard(nextBoard);
      setFrequency(log.frequency);
      setModule(log.module);
      setSession(logRes.data?.data || log);
      setTarget(fromBoard || fallback);
    } catch (err) {
      toast({
        title: apiError(err, 'Failed to open the log'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setOpening(false);
    }
  };

  const pickFrequency = (next: KitchenFrequency) => {
    setFrequency(next);
    setModule(null);
    setTarget(null);
    setSession(null);
    setCompleted(null);
  };

  // One step back: from a log to the logs of its frequency, from there to the
  // frequencies
  const goBack = () => {
    if (module) {
      setModule(null);
      return;
    }
    setFrequency(null);
    setBoard(null);
  };

  const pickModule = (entry: KitchenBoardModule) => {
    setModule(entry.module);
    setTarget(null);
    setSession(null);
    setCompleted(null);
    // Done or held by someone else, it stays a card below instead
    const only = entry.targets[0];
    if (
      !pickTargetFirst(entry.module) &&
      only &&
      !only.isDone &&
      !blockedBy(only)
    ) {
      openTarget(entry.module, only);
    }
  };

  // Back to the very start, as when the page was first opened
  const resetAll = () => {
    setCompleted(null);
    setFrequency(null);
    setBoard(null);
    setModule(null);
    setTarget(null);
    setSession(null);
  };

  // The submitted message clears itself after 10 seconds
  useEffect(() => {
    if (!completed) return;
    const timer = window.setTimeout(resetAll, 10000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  const backFromSession = () => {
    setTarget(null);
    setSession(null);
    // A module with a single target has nothing to go back to but the list
    if (module && !pickTargetFirst(module)) setModule(null);
  };

  // Who holds a target nobody else can start right now
  const blockedBy = (entry: KitchenBoardTarget) => {
    if (entry.isDone) return null;
    const open = entry.entries.find((log) => log.status !== 'completed');
    if (open && !mine(open)) return personName(open.employeeId);
    return null;
  };

  const renderTarget = (
    entry: KitchenBoardModule,
    item: KitchenBoardTarget
  ) => {
    const holder = blockedBy(item);
    const ownLog = item.entries.find(
      (log) => log.status !== 'completed' && mine(log)
    );
    const ownOpen = Boolean(ownLog);
    const locked = item.isDone || Boolean(holder);
    const lastDone = [...item.entries]
      .reverse()
      .find((log) => log.status === 'completed');

    return (
      <button
        key={item.key}
        type="button"
        disabled={locked || opening}
        onClick={() => openTarget(entry.module, item)}
        className={cn(
          'flex min-h-[72px] flex-col justify-between gap-1 rounded-xl border-2 p-3 text-left transition-all disabled:cursor-not-allowed',
          item.isDone
            ? 'border-emerald-200 bg-emerald-50'
            : holder
              ? 'border-gray-200 bg-gray-50 opacity-70'
              : ownOpen
                ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-100'
                : 'border-gray-200 hover:-translate-y-0.5 hover:border-theme hover:shadow-md'
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-black">
            {item.label}
            {entry.module === 'kitchen_cleaning' && item.description && (
              <span className="ml-1 font-semibold">({item.description})</span>
            )}
          </span>
          {item.isDone ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : holder ? (
            <Lock className="h-4 w-4 shrink-0 text-black" />
          ) : ownOpen ? (
            <Timer className="h-4 w-4 shrink-0 animate-pulse text-amber-600" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-black" />
          )}
        </span>
        <span className="text-xs text-black">
          {item.isDone
            ? `Done by ${personName(lastDone?.employeeId)}`
            : holder
              ? `In progress by ${holder}`
              : ownOpen
                ? ownLog?.status === 'paused'
                  ? 'Your session is paused - tap to resume'
                  : 'Your session is open - tap to continue'
                : item.required > 1
                  ? `${item.done} of ${item.required} done this week`
                  : 'Not done yet'}
        </span>
      </button>
    );
  };

  const current = boardModule(module);
  // The one open below is not listed again
  const pausedList = paused.filter((log) => log._id !== session?._id);

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <ChefHat className="h-5 w-5 lg:h-6 lg:w-6" />
            Kitchen
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Pick how often the log is done, then the log itself. Press Start,
            fill it in (Pause to take a break), sign, then End and Submit.
          </p>
        </div>
        {frequency && !completed && (
          <Button
            size="sm"
            className="shrink-0"
            disabled={opening || (Boolean(target) && sessionBusy)}
            onClick={target ? backFromSession : goBack}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {/* Paused logs, still waiting to be finished and submitted */}
      {pausedList.length > 0 && !completed && (
        <div className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50/50 p-3 sm:p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-black">
            <PauseCircle className="h-4 w-4 text-orange-600" />
            Your paused logs
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              {pausedList.length} paused
            </span>
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {pausedList.map((log) => (
              <div
                key={log._id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border-2 border-orange-400 bg-orange-50 p-3 ring-4 ring-orange-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-semibold text-black">
                    {KITCHEN_MODULES[log.module].label}
                    {logTarget(log) && (
                      <span className="ml-1 font-medium">
                        ({logTarget(log)})
                      </span>
                    )}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-black">
                    <span>{formatLogDate(log.logDate)}</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatDuration(log.durationSeconds || 0)}
                    </span>
                    <span className="font-semibold text-orange-700">
                      · not submitted yet
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-theme text-white hover:bg-theme/90 sm:w-auto"
                  disabled={opening || sessionBusy}
                  onClick={() => openPaused(log)}
                >
                  <Play className="mr-1.5 h-4 w-4" /> Continue
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily / Weekly / Twice a week / Monthly */}
      {!frequency && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {KITCHEN_FREQUENCIES.map(({ key, label }) => {
            const Icon = FREQUENCY_ICON[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => pickFrequency(key)}
                className="group flex items-center gap-3 rounded-2xl border-2 border-gray-200 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-black transition-colors group-hover:bg-theme group-hover:text-white sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-sm font-bold text-black sm:text-base">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!frequency ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select <span className="font-semibold">Daily</span>,{' '}
          <span className="font-semibold">Weekly</span>,{' '}
          <span className="font-semibold">Twice a Week</span> or{' '}
          <span className="font-semibold">Monthly</span> above.
        </div>
      ) : completed ? (
        /* Shown for 10 seconds after a submit, then the page starts over */
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h3 className="text-lg font-bold text-black">
            {KITCHEN_MODULES[completed.module].label} submitted
          </h3>
          <p className="max-w-md text-sm text-black">
            {[
              logTarget(completed),
              completed.startTime &&
                `${completed.startTime} - ${completed.endTime || '-'}`
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {KITCHEN_MODULES[completed.module].requiresApproval && (
            <p className="text-xs font-medium text-black">
              Sent to management for approval.
            </p>
          )}
        </div>
      ) : target && module ? (
        <KitchenSession
          key={`${module}-${target.key}-${session?._id || 'new'}`}
          companyId={id || ''}
          module={module}
          target={target}
          log={session}
          onBusyChange={setSessionBusy}
          onChange={() => {
            fetchBoard(frequency, true);
            fetchPaused();
          }}
          onCompleted={(log) => {
            setCompleted(log);
            setTarget(null);
            setSession(null);
          }}
        />
      ) : (
        <div className="space-y-3 rounded-2xl border border-gray-200 p-3 sm:p-4">
          <h3 className="break-words text-lg font-bold text-black">
            {current ? current.label : FREQUENCY_LABEL[frequency]}
          </h3>

          {loading || opening ? (
            <div className="flex justify-center py-16">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : !board ? null : !current ? (
            /* The logs of the picked frequency */
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {board.modules.map((entry) => (
                <button
                  key={entry.module}
                  type="button"
                  onClick={() => pickModule(entry)}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-gray-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-black">
                      {entry.label}
                    </span>
                    <span className="block text-xs text-black">
                      {entry.left === 0
                        ? 'All done'
                        : `${entry.left} of ${entry.targets.length} left`}
                    </span>
                  </span>
                  {entry.left === 0 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-black" />
                  )}
                </button>
              ))}
            </div>
          ) : pickTargetFirst(current.module) ? (
            /* Shifts or items of the picked log */
            <div className="space-y-2">
              <p className="text-sm font-bold text-black">
                {current.module === 'kitchen_cleaning'
                  ? 'Pick a shift'
                  : 'Pick an item'}
              </p>
              <div
                className={cn(
                  'grid gap-2',
                  current.module === 'kitchen_cleaning'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                )}
              >
                {current.targets.map((item) => renderTarget(current, item))}
              </div>
            </div>
          ) : (
            /* A single-target log that is done or held by someone else */
            current.targets[0] && (
              <div className="grid grid-cols-1 sm:max-w-sm">
                {renderTarget(current, current.targets[0])}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
