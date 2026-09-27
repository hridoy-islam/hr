import type { StylesConfig } from 'react-select';
import moment from '@/lib/moment-setup';

export type CleaningType = 'daily' | 'monthly';

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
  action: 'create' | 'update';
  updatedBy?: CleaningEmployee;
  date: string;
}

export interface CleaningLogRecord {
  _id: string;
  companyId: string;
  employeeId?: CleaningEmployee;
  areaId?: string;
  areaName: string;
  roomNumber?: string;
  type: CleaningType;
  items: CleaningLogItem[];
  signatureUrl: string;
  signedAt: string;
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
