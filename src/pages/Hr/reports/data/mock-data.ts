import { ReportRequest, DocumentRequest, PayrollData, AttendanceRecord } from '../types/report-types';
import moment from 'moment';

// Mock report requests
export const mockReportRequests: ReportRequest[] = [
  {
    id: 'REQ001',
    requesterId: 'EMP001',
    requesterName: 'John Smith',
    requesterEmail: 'john.smith@company.com',
    department: 'Care Services',
    reportType: 'attendance',
    dateRange: {
      startDate: '2024-08-14',
      endDate: '2024-08-30'
    },
    status: 'completed',
    requestDate: '2025-01-10',
    approvedBy: 'Manager Smith',
    approvedDate: '2025-01-11',
    reason: 'Need attendance records for August period for performance review',
    priority: 'high',
    documentUrl: '/reports/attendance-aug-14-30-2024.pdf',
    employeeIds: ['EMP001'],
    includeBreakdowns: true
  },
  {
    id: 'REQ002',
    requesterId: 'EMP002',
    requesterName: 'Sarah Johnson',
    requesterEmail: 'sarah.johnson@company.com',
    department: 'HR Department',
    reportType: 'payroll',
    dateRange: {
      startDate: '2024-12-01',
      endDate: '2024-12-31'
    },
    status: 'pending',
    requestDate: '2025-01-12',
    reason: 'Year-end payroll summary required for tax filing',
    priority: 'medium'
  },
  {
    id: 'REQ003',
    requesterId: 'EMP003',
    requesterName: 'Mike Wilson',
    requesterEmail: 'mike.wilson@company.com',
    department: 'Operations',
    reportType: 'attendance',
    dateRange: {
      startDate: '2024-09-01',
      endDate: '2024-09-30'
    },
    status: 'approved',
    requestDate: '2025-01-08',
    approvedBy: 'Director Jones',
    approvedDate: '2025-01-09',
    reason: 'September attendance report for client billing verification',
    priority: 'low',
    employeeIds: ['EMP003', 'EMP004', 'EMP005'],
    includeBreakdowns: false
  },
  {
    id: 'REQ004',
    requesterId: 'EMP001',
    requesterName: 'John Smith',
    requesterEmail: 'john.smith@company.com',
    department: 'Care Services',
    reportType: 'timesheet',
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-01-15'
    },
    status: 'pending',
    requestDate: '2025-01-13',
    reason: 'Bi-weekly timesheet report for project tracking',
    priority: 'medium'
  }
];

// Mock document requests
export const mockDocumentRequests: DocumentRequest[] = [
  {
    id: 'DOC001',
    staffId: 'STAFF001',
    staffName: 'John Smith',
    staffEmail: 'john.smith@company.com',
    department: 'Care Services',
    documentType: 'Employment Certificate',
    requestDate: '2025-01-10',
    status: 'approved',
    reason: 'Required for visa application',
    approvedBy: 'HR Manager',
    approvedDate: '2025-01-11',
    documentUrl: '/documents/employment-cert-john-smith.pdf',
    priority: 'high'
  },
  {
    id: 'DOC002',
    staffId: 'STAFF002',
    staffName: 'Jane Doe',
    staffEmail: 'jane.doe@company.com',
    department: 'HR Department',
    documentType: 'Payslip',
    requestDate: '2025-01-12',
    status: 'pending',
    reason: 'Bank loan application requirement',
    priority: 'medium'
  }
];

// Generate mock payroll data
export const generateMockPayrollData = (): PayrollData[] => {
  const data: PayrollData[] = [];
  for (let i = 0; i < 6; i++) {
    const startDate = moment().subtract(i * 15, 'days');
    const endDate = moment(startDate).add(14, 'days');
    const hours = (Math.random() * 20 + 60).toFixed(1);
    const rate = 25;
    const gross = (parseFloat(hours) * rate).toFixed(2);
    const tax = (parseFloat(gross) * 0.16).toFixed(2);
    const net = (parseFloat(gross) - parseFloat(tax)).toFixed(2);

    data.push({
      id: `PAY${(1000 + i).toString()}`,
      employeeId: 'EMP001',
      period: `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`,
      hours,
      rate: `$${rate}/hr`,
      gross: `$${gross}`,
      tax: `$${tax}`,
      net: `$${net}`,
      status: i === 0 ? 'pending' : i === 1 ? 'processed' : 'paid',
      payDate: endDate.add(3, 'days').format('YYYY-MM-DD')
    });
  }
  return data;
};

export const generateMockAttendanceData = (): AttendanceRecord[] => {
  const data: AttendanceRecord[] = [];
  const serviceUsers = ['Hasan', 'Amina', 'Khalid', 'Sara', 'Yusuf'];
  const locations = ['Main Store', 'Warehouse', 'Client Home A', 'Client Home B'];

  // Define fixed start and end dates
  const startDate = moment('2025-08-14');
  const endDate = moment('2025-08-30');

  for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'day')) {
    if (date.day() === 0 || date.day() === 6) continue; // Skip weekends

    const clockInHour = Math.floor(Math.random() * 2) + 8;
    const clockInMinute = Math.floor(Math.random() * 60);
    const clockOutHour = Math.floor(Math.random() * 2) + 17;
    const clockOutMinute = Math.floor(Math.random() * 60);

    const clockIn = `${clockInHour}:${clockInMinute.toString().padStart(2, '0')}`;
    const clockOut = `${clockOutHour}:${clockOutMinute.toString().padStart(2, '0')}`;
    const breakTime = `${30 + Math.floor(Math.random() * 30)} min`;
    const totalHours = (8 + Math.random() * 2 - 0.5).toFixed(1);

    data.push({
      id: `ATT${date.format('YYYYMMDD')}`,
      employeeId: 'EMP001',
      date: date.format('YYYY-MM-DD'),
      clockIn,
      clockOut,
      breakTime,
      totalHours,
      location: locations[Math.floor(Math.random() * locations.length)],
      serviceUser: serviceUsers[Math.floor(Math.random() * serviceUsers.length)],
      status: 'present'
    });
  }

  return data;
};
