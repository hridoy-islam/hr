import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, Eye, Download } from 'lucide-react';
import { PayrollRequestForm } from './PayrollRequestForm';
import { PayslipModal } from './PayslipModal';
import { PayrollRecord } from '@/types/payroll';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StaffPayroll: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const userId = user?._id;

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Only controls table loading
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchPayrollData = async (page = 1) => {
    if (!userId) return;
    setLoading(true); // Start loading table
    try {
      const params: any = {
        userId,
        page,
        limit: entriesPerPage,
      };

      if (selectedDate) {
        params.month = selectedDate.getMonth() + 1;
        params.year = selectedDate.getFullYear();
      }

      const response = await axiosInstance.get('/hr/payroll', { params });

      const fetchedRecords: PayrollRecord[] = response.data.data.result.map((rec: any) => ({
        ...rec,
        fromDate: rec.fromDate ? new Date(rec.fromDate) : null,
        toDate: rec.toDate ? new Date(rec.toDate) : null,
        payDate: rec.payDate ? new Date(rec.payDate) : null,
      }));

      setRecords(fetchedRecords);
      setTotalPages(response.data.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast({
        title: 'Error',
        description: 'Could not load payroll data. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false); // Stop loading table
    }
  };

  useEffect(() => {
    fetchPayrollData(currentPage);
  }, [userId, currentPage, entriesPerPage, selectedDate]);

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
      className: 'bg-theme text-white border-none',
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

      const newRecord: PayrollRecord = {
        id: 'temp-id-' + Date.now(),
        fromDate: requestData.fromDate ? new Date(requestData.fromDate) : null,
        toDate: requestData.toDate ? new Date(requestData.toDate) : null,
        payDate: new Date(),
        netPay: 0,
        status: 'pending',
      };

      setRecords((prev) => [newRecord, ...prev]);

      toast({
        title: 'Request submitted',
        description: 'You will receive a notification once it’s processed.',
        className: 'bg-theme text-white border-none',
      });
    } catch (error: any) {
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'pending':
      case 'processing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDateSafe = (date: Date | string | null | undefined) =>
    date
      ? moment(date).isValid()
        ? moment(date).format('MMM DD, YYYY')
        : 'Invalid Date'
      : 'N/A';

  return (
    <div className="bg-white space-y-6 rounded-lg shadow-sm">
      {/* Payroll Table */}
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Payroll History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : records.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No payroll records found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Pay Period</TableHead>
                    <TableHead className="w-[20%]">Net Pay</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[20%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record._id || record.id} className="transition-colors hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {`${formatDateSafe(record.fromDate)} - ${formatDateSafe(record?.toDate)}`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        £{typeof record.netAmount === 'number' ? record.netAmount.toLocaleString() : '0'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status
                            ? record.status.charAt(0).toUpperCase() + record.status.slice(1)
                            : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {record.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleDownloadPayslip(record)}
                            className="bg-theme text-white hover:bg-theme"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
  );
};

export default StaffPayroll;