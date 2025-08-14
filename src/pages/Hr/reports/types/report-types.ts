export interface ReportRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  reportType: 'attendance' | 'payroll' | 'hours' | 'timesheet';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  documentUrl?: string;
  employeeIds?: string[]; // For requesting specific employees' records
  includeBreakdowns?: boolean; // Include detailed breakdowns
}

export interface DocumentRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  documentType: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  approvedBy?: string;
  approvedDate?: string;
  documentUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PayrollData {
  id: string;
  employeeId: string;
  period: string;
  hours: string;
  rate: string;
  gross: string;
  tax: string;
  net: string;
  status: 'processed' | 'paid' | 'pending';
  payDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakTime: string;
  totalHours: string;
  location: string;
  serviceUser: string;
  status: 'approved' | 'pending' | 'rejected';
}