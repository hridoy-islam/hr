export interface InvoiceItem {
  id: string;
  serviceType: string;
  carerName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate: number;
  amount: number;
  description?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceUserId: string;
  serviceUserName: string;
  serviceUserAddress: string;
  serviceUserEmail: string;
  serviceUserPhone: string;
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDate?: string;
  notes?: string;
}

export interface InvoiceFilters {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  status: string;
  minAmount: string;
  maxAmount: string;
}