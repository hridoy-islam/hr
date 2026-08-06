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
