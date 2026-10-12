import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileBarChart2,
  Play,
  Plus,
  SprayCan,
  Timer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  CLEANING_TYPE_LABEL,
  CleaningLogRecord,
  CleaningLogStatus,
  CleaningType,
  completion,
  formatDateTime,
  formatDuration
} from '@/pages/company/cleaningLog/shared';
import { CleaningLogWizard } from '@/pages/company/cleaningLog/components/CleaningLogWizard';
import {
  StatusBadge,
  useElapsed
} from '@/pages/company/cleaningLog/components/CleaningSession';
import { TypeBadge } from '@/pages/company/cleaningLog/components/CleaningLogList';

// One unfinished session, with its clock still ticking if it is running
function ActiveSessionCard({
  log,
  current,
  locked,
  onContinue
}: {
  log: CleaningLogRecord;
  current: boolean;
  // Another session is running and has to be paused first
  locked: boolean;
  onContinue: () => void;
}) {
  const seconds = useElapsed(log);
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl border-2 bg-white p-3 sm:flex-row sm:items-center sm:justify-between',
        current ? 'border-theme' : 'border-gray-200',
        locked && 'opacity-60'
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="break-words text-sm font-semibold text-black">
          {log.areaName}
          {log.roomNumber && (
            <span className="ml-1 font-medium">(Room {log.roomNumber})</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={(log.status || 'in_progress') as CleaningLogStatus} />
          <TypeBadge type={log.type} />
          <span className="font-mono text-sm font-semibold tabular-nums text-black">
            {formatDuration(seconds)}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant={current ? 'outline' : 'default'}
        disabled={current || locked}
        title={locked ? 'Pause the running area first' : undefined}
        className={cn(
          'w-full sm:w-auto',
          !current && 'bg-theme text-white hover:bg-theme/90'
        )}
        onClick={onContinue}
      >
        {current ? (
          'Open below'
        ) : (
          <>
            <Play className="mr-1.5 h-4 w-4" /> Continue
          </>
        )}
      </Button>
    </div>
  );
}

const TYPE_CARDS: {
  type: CleaningType;
  icon: typeof CalendarDays;
  description: string;
}[] = [
  {
    type: 'daily',
    icon: CalendarDays,
    description: 'Routine checks for the areas cleaned every day'
  },
  {
    type: 'monthly',
    icon: CalendarRange,
    description: 'Deep cleaning for the areas cleaned once a month'
  }
];

export default function StaffCleaningLogPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();

  const [type, setType] = useState<CleaningType | null>(null);
  // Remounts the wizard for a fresh log after each submission
  const [wizardKey, setWizardKey] = useState(0);
  const [submitted, setSubmitted] = useState<CleaningLogRecord | null>(null);
  // Sessions started but not completed yet, and the one opened from them
  const [active, setActive] = useState<CleaningLogRecord[]>([]);
  const [resumeDraft, setResumeDraft] = useState<CleaningLogRecord | null>(null);

  const continueSession = (log: CleaningLogRecord) => {
    setSubmitted(null);
    setResumeDraft(log);
    setType(log.type);
    setWizardKey((key) => key + 1);
  };

  // Only the first load opens a running session by itself; after that the
  // wizard already has it on screen
  const openedRunning = useRef(false);

  const fetchActive = useCallback(() => {
    axiosInstance
      .get('/cleaning-log/active', { params: { companyId: id } })
      .then((res) => {
        const sessions: CleaningLogRecord[] = res.data?.data || [];
        setActive(sessions);
        const running = sessions.find((log) => log.status === 'in_progress');
        if (running && !openedRunning.current) continueSession(running);
        openedRunning.current = true;
      })
      .catch(() => setActive([]));
  }, [id]);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // While a session runs everything else waits: the employee has to pause or
  // stop it before switching area or type
  const running = active.find((log) => log.status === 'in_progress');

  const startNew = (nextType: CleaningType | null) => {
    if (running) return;
    setSubmitted(null);
    setResumeDraft(null);
    setType(nextType);
    setWizardKey((key) => key + 1);
  };

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <SprayCan className="h-5 w-5 lg:h-6 lg:w-6" />
            Cleaning Logs
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Pick an area and press Start. Pause to switch area, Stop when
            done, then sign and Complete.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          disabled={Boolean(running)}
          onClick={() => navigate('report')}
        >
          <FileBarChart2 className="mr-1.5 h-4 w-4" /> Report
        </Button>
      </div>

      {running && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-medium text-black sm:text-sm">
          <Timer className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-amber-600" />
          <span>
            <span className="font-semibold">{running.areaName}</span> is running.
            Pause or stop it to switch to another area or type.
          </span>
        </p>
      )}

      {/* Unfinished sessions */}
      {active.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-3 sm:p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-black">
            <Timer className="h-4 w-4" />
            Your unfinished areas ({active.length})
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {active.map((log) => (
              <ActiveSessionCard
                key={log._id}
                log={log}
                current={
                  running
                    ? running._id === log._id
                    : resumeDraft?._id === log._id && !submitted
                }
                locked={Boolean(running) && running?._id !== log._id}
                onContinue={() => continueSession(log)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Daily / monthly choice */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPE_CARDS.map(({ type: cardType, icon: Icon, description }) => {
          const active = type === cardType;
          return (
            <button
              key={cardType}
              type="button"
              disabled={Boolean(running)}
              onClick={() => startNew(cardType)}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed sm:p-5',
                active
                  ? 'border-theme bg-theme/5 shadow-md'
                  : running
                    ? 'border-gray-200 opacity-50'
                    : 'border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-14 sm:w-14',
                  active
                    ? 'bg-theme text-white'
                    : running
                      ? 'bg-gray-100 text-black'
                      : 'bg-gray-100 text-black group-hover:bg-theme group-hover:text-white'
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-black sm:text-lg">
                  {CLEANING_TYPE_LABEL[cardType]} Cleaning
                </span>
                <span className="block text-xs text-black sm:text-sm">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h3 className="text-lg font-bold text-black">Cleaning log submitted</h3>
          <p className="max-w-md text-sm text-black">
            {submitted.areaName} · {completion(submitted.items).done} of{' '}
            {completion(submitted.items).total} elements checked · signed at{' '}
            {formatDateTime(submitted.signedAt)}
          </p>
          <div className="flex w-full flex-col gap-2 pt-2 sm:w-auto sm:flex-row">
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              onClick={() => startNew(submitted.type)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Submit Another
            </Button>
            <Button variant="outline" onClick={() => navigate('report')}>
              <FileBarChart2 className="mr-1.5 h-4 w-4" /> View Report
            </Button>
          </div>
        </div>
      ) : type ? (
        <CleaningLogWizard
          key={wizardKey}
          companyId={id || ''}
          mode="employee"
          type={type}
          draft={resumeDraft}
          onSubmitted={setSubmitted}
          onSessionChange={fetchActive}
          onCancel={() => startNew(null)}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select <span className="font-semibold text-black">Daily</span> or{' '}
          <span className="font-semibold text-black">Monthly</span> above to
          start a cleaning log.
        </div>
      )}
    </div>
  );
}
