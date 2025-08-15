export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: Date; // added
  endDate: Date;   // added
  payDate: Date;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    pension: number;
    other: number;
  };
  overtime?: number;
  bonus?: number;
  netPay: number;
  status: 'paid' | 'pending' | 'processing';
  payslipUrl?: string;
}


export interface PayrollRequest {
  id: string;
  employeeId: string;
  requestedBy: string;
  startDate: Date;
  endDate: Date;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminNotes?: string;
}