import React, { useState } from 'react';
import { DollarSign, FileText, TrendingUp } from 'lucide-react';
import { PayrollSummaryCard } from './PayrollSummaryCard';
import { PayrollHistory } from './PayrollHistory';
import { PayrollRequestForm } from './PayrollRequestForm';
import { PayslipModal } from './PayslipModal';
import { PayrollRecord, PayrollRequest } from '@/types/payroll';

// Demo data - in a real app, this would come from an API
const mockPayrollRecords: PayrollRecord[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    payDate: new Date('2024-01-31'),
    basicSalary: 5000,
    allowances: {
      hra: 1500,
      transport: 300,
      medical: 200,
      other: 100
    },
    deductions: {
      tax: 800,
      insurance: 150,
      pension: 500,
      other: 50
    },
    overtime: 200,
    bonus: 500,
    netPay: 6300,
    status: 'paid'
  },
  {
    id: '2',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    startDate: new Date('2023-12-01'),
    endDate: new Date('2023-12-31'),
    payDate: new Date('2023-12-31'),
    basicSalary: 5000,
    allowances: {
      hra: 1500,
      transport: 300,
      medical: 200,
      other: 100
    },
    deductions: {
      tax: 750,
      insurance: 150,
      pension: 500,
      other: 50
    },
    bonus: 1000,
    netPay: 6650,
    status: 'paid'
  },
  {
    id: '3',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-29'),
    payDate: new Date('2024-02-29'),
    basicSalary: 5000,
    allowances: {
      hra: 1500,
      transport: 300,
      medical: 200,
      other: 100
    },
    deductions: {
      tax: 820,
      insurance: 150,
      pension: 500,
      other: 50
    },
    netPay: 5580,
    status: 'processing'
  }
];

const StaffPayroll: React.FC = () => {
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requests, setRequests] = useState<PayrollRequest[]>([]);

  // Calculate summary data
  const currentMonthRecord = mockPayrollRecords.find(record =>
    record.startDate.getMonth() === 1 && record.startDate.getFullYear() === 2024 // Feb is month 1 (0-indexed)
  );
  const lastMonthRecord = mockPayrollRecords.find(record =>
    record.startDate.getMonth() === 0 && record.startDate.getFullYear() === 2024 // Jan is month 0
  );

  const currentNetPay = currentMonthRecord?.netPay || 0;
  const lastNetPay = lastMonthRecord?.netPay || 0;
  const netPayTrend = lastNetPay > 0 ? ((currentNetPay - lastNetPay) / lastNetPay) * 100 : 0;

  const totalEarningsThisYear = mockPayrollRecords
    .filter(record => record.payDate.getFullYear() === 2024)
    .reduce((sum, record) => sum + record.netPay, 0);

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record);
    setShowPayslip(true);
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    console.log('Downloading payslip for:', record.id);
    alert(`Downloading payslip for ${record.startDate.toLocaleDateString()} - ${record.endDate.toLocaleDateString()}`);
  };

  const handleSubmitRequest = async (requestData: Omit<PayrollRequest, 'id' | 'requestDate' | 'status'>) => {
    setIsSubmittingRequest(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newRequest: PayrollRequest = {
      ...requestData,
      id: `req_${Date.now()}`,
      requestDate: new Date(),
      status: 'pending'
    };
    setRequests(prev => [newRequest, ...prev]);
    setIsSubmittingRequest(false);
    alert('Request submitted successfully! You will receive a notification once it\'s processed.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PayrollSummaryCard
            title="Current Month Net Pay"
            amount={currentNetPay}
            icon={<DollarSign className="h-4 w-4" />}
            trend={Math.round(netPayTrend)}
            period="February 2024"
            className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <PayrollSummaryCard
            title="Year to Date Earnings"
            amount={totalEarningsThisYear}
            icon={<TrendingUp className="h-4 w-4" />}
            period="2024 YTD"
            className="border-green-200 bg-gradient-to-br from-green-50 to-green-100"
          />
          <PayrollSummaryCard
            title="Last Month Net Pay"
            amount={lastNetPay}
            icon={<FileText className="h-4 w-4" />}
            period="January 2024"
            className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Payroll History */}
          <div className="lg:col-span-2">
            <PayrollHistory
              records={mockPayrollRecords}
              onViewPayslip={handleViewPayslip}
              onDownloadPayslip={handleDownloadPayslip}
            />
          </div>

          {/* Request Form */}
          <div className="lg:col-span-1">
            <PayrollRequestForm
              onSubmitRequest={handleSubmitRequest}
              isSubmitting={isSubmittingRequest}
            />
            {/* Recent Requests */}
            {requests.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Requests</h3>
                <div className="space-y-2">
                  {requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payslip Modal */}
        {selectedPayslip && (
          <PayslipModal
            record={selectedPayslip}
            isOpen={showPayslip}
            onClose={() => {
              setShowPayslip(false);
              setSelectedPayslip(null);
            }}
            onDownload={handleDownloadPayslip}
          />
        )}
      </div>
    </div>
  );
};

export default StaffPayroll;
