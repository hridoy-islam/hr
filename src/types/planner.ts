export interface ServiceUser {
  id: string;
  name: string;
  initials: string;
  type: string;
  care: string;
  avatar?: string;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  care: string;
  avatar?: string;
}

export interface schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'service-user' | 'employee';
  assigneeId: string;
  serviceType: string;
  status: 'allocated' | 'unallocated';
  color: string;
  date: string;
}

export interface DayStats {
  date: string;
  day: string;
  unallocated: number;
  allocated: number;
  total: number;
}

export interface SidebarState {
  left: boolean;
  right: boolean;
}