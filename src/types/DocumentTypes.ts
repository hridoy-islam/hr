export interface DocumentRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  documentType: 'payslip' | 'experience-letter' | 'appointment-letter' | 'job-contract';
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  approvedBy?: string;
  approvedDate?: string;
  documentUrl?: string;
  reason: string;
}

export interface DocumentTemplate {
  type: string;
  title: string;
  description: string;
  icon: string;
  processingTime: string;
}