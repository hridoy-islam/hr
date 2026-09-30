import { useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListChecks,
  Pencil,
  SprayCan,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import moment from '@/lib/moment-setup';
import { cn } from '@/lib/utils';
import {
  CLEANING_TYPE_BADGE,
  CLEANING_TYPE_LABEL,
  CleaningLogRecord,
  CleaningType,
  completion,
  personName,
  toApiDate
} from '../shared';

export const TypeBadge = ({ type }: { type: CleaningType }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
      CLEANING_TYPE_BADGE[type]
    )}
  >
    {CLEANING_TYPE_LABEL[type]}
  </span>
);

// Green when every element was ticked, yellow when any was left out
export const CheckDot = ({ log }: { log: CleaningLogRecord }) => {
  const { done, total } = completion(log.items);
  const allChecked = total > 0 && done === total;

  return (
    <span
      title={`${done} of ${total} elements checked`}
      className={cn(
        'inline-block h-3 w-3 shrink-0 rounded-full ring-2',
        allChecked
          ? 'bg-emerald-500 ring-emerald-100'
          : 'bg-yellow-400 ring-yellow-100'
      )}
    />
  );
};

// How much of the checklist was ticked, e.g. "2/4"
export const ChecklistStatus = ({ log }: { log: CleaningLogRecord }) => {
  const { done, total } = completion(log.items);
  const allChecked = total > 0 && done === total;

  return (
    <span
      title={`${done} of ${total} elements checked`}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold sm:text-sm',
        allChecked ? 'text-emerald-600' : 'text-amber-600'
      )}
    >
      <ListChecks className="h-4 w-4 shrink-0" />
      <span className="tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
};

interface DateRangeNavProps {
  fromDate: Date | null;
  toDate: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}

// Same controls as the job board: the arrows step the whole range back or
// forward by its own length
export function DateRangeNav({ fromDate, toDate, onChange }: DateRangeNavProps) {
  const shift = (direction: number) => {
    if (!fromDate || !toDate) return;
    const days =
      Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
    const move = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + direction * days);
    onChange(move(fromDate), move(toDate));
  };

  const arrowClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black text-theme transition-all hover:border-theme hover:bg-theme hover:text-white focus:outline-none focus-visible:border-theme lg:h-10 lg:w-10';

  return (
    <div className="flex w-full items-center justify-center gap-2 lg:w-auto">
      <button
        type="button"
        title="Previous range"
        className={arrowClass}
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={4} />
      </button>

      <div className="relative min-w-0 flex-1 lg:flex-none">
        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-theme" />
        <DatePicker
          selectsRange
          startDate={fromDate}
          endDate={toDate}
          onChange={(dates) => {
            const [start, end] = dates as [Date | null, Date | null];
            onChange(start, end);
          }}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          dateFormat="dd MMM yyyy"
          placeholderText="Select date range"
          wrapperClassName="w-full"
          className="h-10 w-full rounded-full border-2 border-black pl-11 pr-4 text-center text-xs font-medium text-black transition-colors focus:border-theme focus:outline-none sm:text-sm lg:w-[300px]"
        />
      </div>

      <button
        type="button"
        title="Next range"
        className={arrowClass}
        onClick={() => shift(1)}
      >
        <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={4} />
      </button>
    </div>
  );
}

interface CleaningLogTimelineProps {
  logs: CleaningLogRecord[];
  fromDate: Date | null;
  toDate: Date | null;
  showEmployee?: boolean;
  onView: (log: CleaningLogRecord) => void;
  onEdit?: (log: CleaningLogRecord) => void;
  onDelete?: (log: CleaningLogRecord) => void;
}

export function CleaningLogTimeline({
  logs,
  fromDate,
  toDate,
  showEmployee = true,
  onView,
  onEdit,
  onDelete
}: CleaningLogTimelineProps) {
  const todayKey = moment().format('YYYY-MM-DD');

  // Every day of the range gets its own row, newest day on top
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, CleaningLogRecord[]>();
    logs.forEach((log) => {
      const key = moment(log.createdAt).format('YYYY-MM-DD');
      groups.set(key, [...(groups.get(key) || []), log]);
    });

    const days = new Map<string, CleaningLogRecord[]>();
    if (fromDate && toDate) {
      const cursor = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
      const first = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate()
      );
      while (cursor >= first && days.size < 400) {
        const key = toApiDate(cursor);
        days.set(key, groups.get(key) || []);
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // A log landing outside the range still needs a day of its own
    groups.forEach((dayLogs, key) => {
      if (!days.has(key)) days.set(key, dayLogs);
    });

    return Array.from(days.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [logs, fromDate, toDate]);

  if (groupedLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme/10">
          <SprayCan className="h-6 w-6 text-theme" />
        </div>
        <p className="text-sm font-extrabold text-black">Select a date range</p>
      </div>
    );
  }

  const renderLogRow = (log: CleaningLogRecord) => {
    return (
      <div
        key={log._id}
        className="flex w-full flex-col gap-2 rounded-xl bg-white px-2 py-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:py-1 lg:pr-3.5"
      >
        {/* Area */}
        <div
          role="button"
          tabIndex={0}
          title="View cleaning log"
          className="flex min-w-0 cursor-pointer flex-wrap items-center gap-2"
          onClick={() => onView(log)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onView(log);
            }
          }}
        >
          <CheckDot log={log} />
          <h4 className="break-words text-md font-semibold leading-snug tracking-tight text-black">
            {log.areaName}
            {log.roomNumber && (
              <span className="ml-1 text-sm font-medium">(Room {log.roomNumber})</span>
            )}
          </h4>
          <TypeBadge type={log.type} />
        </div>

        {/* Details and actions */}
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:gap-1">
          <div className="flex w-full items-center gap-4 text-xs font-medium text-black sm:text-sm lg:mr-4 lg:w-auto">
            <ChecklistStatus log={log} />
            <span className="flex items-center gap-2">
              <span className="tracking-wider">Signed At</span>
              <span>{moment(log.signedAt).format('h:mm A')}</span>
            </span>
          </div>

          {showEmployee && (
            <div className="flex w-full items-center gap-2 text-xs font-medium text-black sm:text-sm lg:mr-4 lg:w-auto">
              <span className="tracking-wider">By</span>
              <span>{personName(log.employeeId)}</span>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={() => onView(log)}>
            <Eye className="mr-1 h-4 w-4" /> View
          </Button>
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(log)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(log)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {groupedLogs.map(([dateKey, dayLogs]) => {
        const isToday = dateKey === todayKey;
        const date = moment(dateKey, 'YYYY-MM-DD');

        return (
          <div key={dateKey} className="space-y-3">
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 rounded-lg p-2',
                isToday ? 'bg-theme text-white' : 'bg-gray-200 text-black'
              )}
            >
              <span className="text-xs font-medium tracking-[0.12em] sm:text-sm">
                {date.format('DD MMM YYYY')}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium tracking-[0.12em] sm:text-sm">
                {isToday ? 'Today' : date.format('dddd')}
              </span>
              <span className="text-xs font-semibold sm:text-sm">
                {dayLogs.length} {dayLogs.length === 1 ? 'log' : 'logs'}
              </span>
            </div>

            <div className="space-y-1">
              {dayLogs.length === 0 ? (
                <p className="px-2 pb-1 text-xs font-medium italic text-black sm:text-sm">
                  No cleaning log on this day
                </p>
              ) : (
                dayLogs.map(renderLogRow)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
