import type { ReactNode } from 'react';

export interface ModuleComponentProps {
  moduleSelect?: ReactNode;
}

export interface MatrixRow {
  _id: string | null;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    departmentId?:
      | { departmentName?: string }
      | { departmentName?: string }[]
      | null;
    designationId?: { title?: string } | { title?: string }[] | null;
  };
  trainingId: {
    _id: string;
    name: string;
    validityDays?: number;
    reminderBeforeDays?: number;
  } | null;
  assignedDate: string | null;
  expireDate: string | null;
  isOptional?: boolean;
  status: string;
  certificate?: string[] | string;
  completionHistory: TCompletionRecord[];
}

export interface TCompletionRecord {
  _id?: string;
  assignedDate?: string;
  expireDate?: string;
  completedAt?: string;
  certificate?: string[] | string;
}

export interface HistoryRecord {
  _id: string;
  trainingId: { _id: string; name: string; reminderBeforeDays?: number };
  assignedDate?: string;
  expireDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  certificate?: string[] | string;
  completionHistory: TCompletionRecord[];
  isOptional?: boolean;
}

// RTW-specific types
export interface RtwMatrixRow {
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    departmentId?:
      | { departmentName?: string }
      | { departmentName?: string }[]
      | null;
    designationId?: { title?: string } | { title?: string }[] | null;
    noRtwCheck?: boolean;
  };
  rtwId: string | null;
  nextCheckDate: string | null;
  status: 'active' | 'expiring-soon' | 'expired' | 'missing';
  logs?: Array<{
    _id: string;
    title: string;
    date: string;
    document?: string[] | string;
    updatedBy: string | { firstName: string; lastName: string; name?: string };
  }>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RtwMatrixResponse {
  data: RtwMatrixRow[];
}

// Export status options for reusability
export const RTW_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'missing', label: 'Not Set' }
] as const;

export type RtwStatus = typeof RTW_STATUSES[number]['value'];