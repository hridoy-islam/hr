import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp } from 'lucide-react';
import { PayrollSummaryCard } from './PayrollSummaryCard';
import { PayrollHistory } from './PayrollHistory';
import { PayrollRequestForm } from './PayrollRequestForm';
import { PayslipModal } from './PayslipModal';
import { PayrollRecord } from '@/types/payroll';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';

const StaffPayroll: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const userId = user?._id;

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const {toast} = useToast();
  // Fetch payroll data on mount
  useEffect(() => {
    if (!userId) return;

    const fetchPayrollData = async () => {
      try {
        const response = await axiosInstance.get('/hr/payroll', {
          params: { userId, limit: 'all' },
        });

        // Normalize dates safely using moment
        const fetchedRecords: PayrollRecord[] = response.data.data.result.map((rec: any) => ({
          ...rec,
          fromDate: rec.fromDate ? new Date(rec.fromDate) : null,
          toDate: rec.toDate ? new Date(rec.toDate) : null,
          payDate: rec.payDate ? new Date(rec.payDate) : null,
        }));

        setRecords(fetchedRecords);
      } catch (error) {
        console.error('Failed to fetch payroll data:', error);
        alert('Could not load payroll data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, [userId]);

  // Summary calculations using moment
  const currentMonth = moment().month(); // 0–11
  const currentYear = moment().year();

  const currentMonthRecord = records.find((record) =>
    record.fromDate && moment(record.fromDate).month() === currentMonth &&
    moment(record.fromDate).year() === currentYear
  );

  const lastMonthRecord = records.find((record) =>
    record.fromDate &&
    moment(record.fromDate).month() === (currentMonth === 0 ? 11 : currentMonth - 1) &&
    moment(record.fromDate).year() === (currentMonth === 0 ? currentYear - 1 : currentYear)
  );

  const currentNetPay = currentMonthRecord?.netPay || 0;
  const lastNetPay = lastMonthRecord?.netPay || 0;

  const netPayTrend =
    lastNetPay > 0 ? ((currentNetPay - lastNetPay) / lastNetPay) * 100 : 0;

  const totalEarningsThisYear = records
    .filter((record) => record.payDate && moment(record.payDate).year() === currentYear)
    .reduce((sum, record) => sum + record.netPay, 0);

  // Handlers
  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record);
    setShowPayslip(true);
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    const start = record.fromDate ? moment(record.fromDate).format('MMM DD, YYYY') : 'N/A';
    const end = record.toDate ? moment(record.toDate).format('MMM DD, YYYY') : 'N/A';
    toast({
      title: 'Payslip Download',
      description: `Downloading payslip for ${start} - ${end}`,
      className: 'bg-supperagent text-white border-none',
    });

  };

  const handleSubmitRequest = async (requestData: any) => {
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const payload = {
        userId,
         fromDate: requestData.fromDate ? moment(requestData.fromDate).toISOString() : null,
      toDate: requestData.toDate ? moment(requestData.toDate).toISOString() : null,
        reason: requestData.reason,
      };

      await axiosInstance.post('/hr/payroll', payload);

      // Append new request as a record (assuming backend will return the updated list eventually)
      const newRecord: PayrollRecord = {
        id: 'temp-id-' + Date.now(),
        fromDate: requestData.fromDate ? new Date(requestData.fromDate) : null,
        toDate: requestData.fromDate ? new Date(requestData.fromDate) : null,
        payDate: new Date(),
        netPay: 0,
        status: 'pending',
      };

      setRecords((prev) => [newRecord, ...prev]);
toast({
        title: 'Request submitted',
        description: 'You will receive a notification once it’s processed.',
        className: 'bg-supperagent text-white border-none',
      });    } catch (error: any) {
      console.error('Failed to submit request:', error);
     toast({
        title: 'Submission failed',
        description: error.response?.data?.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PayrollSummaryCard
            title="Current Month Net Pay"
            amount={currentNetPay}
            icon={<DollarSign className="h-4 w-4" />}
            trend={Math.round(netPayTrend)}
            period={`${moment().format('MMMM')} ${currentYear}`}
            className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <PayrollSummaryCard
            title="Year to Date Earnings"
            amount={totalEarningsThisYear}
            icon={<TrendingUp className="h-4 w-4" />}
            period={`${currentYear} YTD`}
            className="border-green-200 bg-gradient-to-br from-green-50 to-green-100"
          />
          <PayrollSummaryCard
            title="Last Month Net Pay"
            amount={lastNetPay}
            icon={<FileText className="h-4 w-4" />}
            period={`${moment().subtract(1, 'months').format('MMMM')} ${
              currentMonth === 0 ? currentYear - 1 : currentYear
            }`}
            className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Payroll History */}
          <div className="lg:col-span-2">
            <PayrollHistory
              records={records}
              onViewPayslip={handleViewPayslip}
              onDownloadPayslip={handleDownloadPayslip}
            />
          </div>

          {/* Request Form */}
          <div className="space-y-6">
            <PayrollRequestForm
              onSubmitRequest={handleSubmitRequest}
              isSubmitting={isSubmittingRequest}
            />
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
