import type { StylesConfig } from 'react-select';
import moment from '@/lib/moment-setup';

export type CleaningType = 'daily' | 'monthly';

// A log is a session: in_progress <-> paused -> stopped -> completed
export type CleaningLogStatus = 'in_progress' | 'paused' | 'stopped' | 'completed';

export interface CleaningEmployee {
  _id: string;
  firstName?: string;
  lastName?: string;
  initial?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface CleaningArea {
  _id: string;
  companyId: string;
  areaName: string;
  type: CleaningType;
  roomNumber?: string;
  totalElement?: number;
  // Only sent to the log form: the log that already covers this area today
  // (daily) or this month (monthly)
  completion?: {
    logId: string;
    employeeId?: CleaningEmployee;
    completedAt: string;
  } | null;
  // Only sent to the log form: a session someone is still working on
  inProgress?: {
    logId: string;
    employeeId?: CleaningEmployee;
    status: CleaningLogStatus;
    startedAt: string;
  } | null;
}

export interface CleaningElement {
  _id: string;
  areaId: string;
  element: string;
  performanceParameter: string;
}

export interface CleaningLogItem {
  elementId?: string;
  element: string;
  performanceParameter: string;
  checked: boolean;
}

export interface CleaningLogHistory {
  _id?: string;
  title: string;
  action: 'create' | 'update' | 'start' | 'pause' | 'resume' | 'stop';
  updatedBy?: CleaningEmployee;
  date: string;
}

export interface CleaningLogSession {
  startedAt: string;
  endedAt?: string;
}

export interface CleaningLogRecord {
  _id: string;
  companyId: string;
  employeeId?: CleaningEmployee;
  areaId?: string;
  areaName: string;
  roomNumber?: string;
  type: CleaningType;
  // Older logs have no status and are completed
  status?: CleaningLogStatus;
  items: CleaningLogItem[];
  sessions?: CleaningLogSession[];
  durationSeconds?: number;
  signatureUrl?: string;
  note?: string;
  signedAt?: string;
  // UK clock times (HH:MM) of the start and the stop, set by the server
  startTime?: string;
  endTime?: string;
  completedAt?: string;
  createdBy?: CleaningEmployee;
  updatedBy?: CleaningEmployee;
  logs?: CleaningLogHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export const CLEANING_TYPE_LABEL: Record<CleaningType, string> = {
  daily: 'Daily',
  monthly: 'Monthly'
};

export const CLEANING_TYPE_BADGE: Record<CleaningType, string> = {
  daily: 'bg-sky-50 text-sky-700 ring-sky-200',
  monthly: 'bg-violet-50 text-violet-700 ring-violet-200'
};

export const personName = (person?: CleaningEmployee) => {
  if (!person) return 'Unknown';
  return (
    `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
    person.name ||
    person.email ||
    'Unknown'
  );
};

export const areaLabel = (area: { areaName: string; roomNumber?: string }) =>
  area.roomNumber ? `${area.areaName} (Room ${area.roomNumber})` : area.areaName;

// Room number ascending (numeric-aware, so 2 comes before 10); areas with
// no room number go last, in name order
export const sortAreasByRoom = <T extends { areaName: string; roomNumber?: string }>(
  areas: T[]
): T[] =>
  [...areas].sort((a, b) => {
    const roomA = (a.roomNumber || '').trim();
    const roomB = (b.roomNumber || '').trim();
    if (!roomA !== !roomB) return roomA ? -1 : 1;
    return (
      roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' }) ||
      a.areaName.localeCompare(b.areaName)
    );
  });

export const LOG_STATUS_LABEL: Record<CleaningLogStatus, string> = {
  in_progress: 'In Progress',
  paused: 'Paused',
  stopped: 'Awaiting Completion',
  completed: 'Completed'
};

export const LOG_STATUS_BADGE: Record<CleaningLogStatus, string> = {
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  paused: 'bg-slate-100 text-slate-700 ring-slate-300',
  stopped: 'bg-sky-50 text-sky-700 ring-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

// Seconds worked so far: the closed sessions plus the one still running
export const elapsedSeconds = (
  log: Pick<CleaningLogRecord, 'sessions' | 'durationSeconds'>,
  now: number = Date.now()
) => {
  const running = (log.sessions || []).find((session) => !session.endedAt);
  const live = running
    ? Math.max(0, (now - new Date(running.startedAt).getTime()) / 1000)
    : 0;
  return Math.floor((log.durationSeconds || 0) + live);
};

// 3725 -> 01:02:05
export const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
};

export const completion = (items: CleaningLogItem[] = []) => {
  const total = items.length;
  const done = items.filter((item) => item.checked).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
};



export const formatDateTime = (date?: string | Date) =>
  date ? moment(date).format('DD MMM YYYY, h:mm A') : '-';

// Built from local date parts, so the picker and the API agree on the day
export const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

export const daysAgo = (days: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
};

export const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const apiError = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback;

// react-select dressed to sit alongside the shadcn inputs
export const selectStyles: StylesConfig<any, boolean> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 6,
    fontSize: 14,
    borderColor: state.isFocused ? 'var(--theme)' : '#e5e7eb',
    boxShadow: 'none',
    '&:hover': { borderColor: '#9ca3af' }
  }),
  menu: (base) => ({ ...base, zIndex: 60, fontSize: 14 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'var(--theme)'
      : state.isFocused
        ? '#f3f4f6'
        : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer'
  }),
  placeholder: (base) => ({ ...base, color: '#6b7280' })
};
