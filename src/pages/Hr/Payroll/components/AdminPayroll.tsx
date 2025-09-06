import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Download,
  FileText,
  User,
  DollarSign,
  Calculator,
  CreditCard,
  Clock,
  Search,
  Check,
  X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { pdf } from '@react-pdf/renderer';
import 'react-datepicker/dist/react-datepicker.css';
import { PayrollPDF } from './PayrollPDF';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import moment from 'moment';

// Axios
import axiosInstance from '@/lib/axios';

// Types
export interface TUser {
  _id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId: string;
  department: string;
  designation: string;
  employmentType: string;
  joiningDate: Date | string;
  workLocation: string;
  departmentId?: {
    departmentName: string;
  };
  designationId?: {
    title: string;
  };
}

export interface TPayroll {
  _id: string;
  userId: TUser;
  fromDate: Date | string;
  toDate: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string | null;
  netAmount: number;
  paymentDate?: Date | string;
  paymentMode?: string;
  bankAccount?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  date: Date | string;
  clockIn: Date | string;
  clockOut: Date | string | null;
  status: 'present' | 'absent' | 'late';
}

export interface TEmployeeRate {
  _id: string;
  employeeId: string;
  rates: {
    [key: string]: { rate: number };
  };
  createdAt: string;
  updatedAt: string;
}

// Payroll Detail for PDF
interface PayrollDetail {
  date: string;
  day: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  hourlyRate: number;
  dailyEarnings: number;
}

// Component
const AdminPayRoll = () => {
  const [selectedPayroll, setSelectedPayroll] = useState<TPayroll | null>(null);
  const [employeeRate, setEmployeeRate] = useState<TEmployeeRate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [pdfData, setPdfData] = useState<{
    payrollDetails: PayrollDetail[];
    totalAmount: number;
  } | null>(null); // ✅ Store PDF-ready data

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payrollList, setPayrollList] = useState<TPayroll[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch payroll data
  const fetchPayrollData = async (page = 1) => {
    setFetching(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/hr/payroll', {
        params: {
          status: 'pending',
          page,
          limit: entriesPerPage
        }
      });

      const result = response.data.data.result;
      setPayrollList(result);
      setTotalPages(response.data.data.meta?.totalPages || 1);
    } catch (err: any) {
      console.error('Fetch payroll error:', err);
      setError(err.response?.data?.message || 'Failed to load payroll data');
      setPayrollList([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPayrollData(currentPage);
  }, [currentPage, entriesPerPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, entriesPerPage]);

  // Handle Generate Payroll
  const handleGeneratePayroll = async (payroll: TPayroll) => {
    setSelectedPayroll(payroll);
    setAttendanceData([]);
    setEmployeeRate(null);
    setPdfData(null); 
    setShowGenerateDialog(true);
    setLoading(true);

    try {
      // Fetch attendance
      const attendanceRes = await axiosInstance.get('/hr/attendance', {
        params: {
          userId: payroll.userId._id,
          fromDate: moment(payroll.fromDate).format('YYYY-MM-DD'),
          toDate: moment(payroll.toDate).format('YYYY-MM-DD'),
          limit: 'all'
        }
      });
      const attendance: AttendanceRecord[] = attendanceRes.data.data.result;
      setAttendanceData(attendance);

      // Fetch employee rate
      const rateRes = await axiosInstance.get('/hr/employeeRate', {
        params: { employeeId: payroll.userId._id }
      });

      const rateData: TEmployeeRate = rateRes.data.data?.result[0];
      setEmployeeRate(rateData);

      // Calculate total & build PDF-ready details
      let total = 0;
      const ratesMap = rateData?.rates || {};

      const payrollDetails: PayrollDetail[] = attendance.map((att) => {
        if (!att.clockOut) return null;

        const clockIn = new Date(att.clockIn);
        const clockOut = new Date(att.clockOut);
        const durationMs = clockOut.getTime() - clockIn.getTime();
        const durationHrs = durationMs / (1000 * 60 * 60);

        const dayOfWeek = moment(clockIn).format('dddd');
        const rateObj = ratesMap[dayOfWeek];
        const hourlyRate = rateObj?.rate || 0;
        const dailyEarnings = durationHrs * hourlyRate;

        total += dailyEarnings;

        return {
          date: moment(clockIn).format('MMM DD, YYYY'),
          day: dayOfWeek,
          clockIn: moment(clockIn).format('HH:mm'),
          clockOut: moment(clockOut).format('HH:mm'),
          duration: durationHrs.toFixed(2),
          hourlyRate,
          dailyEarnings,
        };
      }).filter((item): item is PayrollDetail => item !== null); // Remove nulls

      // ✅ Save for PDF (even after regenerating or closing dialog)
      setPdfData({ payrollDetails, totalAmount: total });

      // Update payroll list
      setPayrollList((prev) =>
        prev.map((p) =>
          p._id === payroll._id ? { ...p, netAmount: total } : p
        )
      );
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      alert(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  
  // Handle Download PDF
const handleDownloadPDF = async (payroll: TPayroll) => {
  if (!pdfData || !pdfData.totalAmount) {
    alert('Please generate payroll first to calculate earnings.');
    return;
  }

  const user = payroll.userId;
  const updatedNetAmount = pdfData.totalAmount;

  // Data for PDF
  const dataToPDF = {
    firstName: user?.firstName,
    lastName: user?.lastName,
    name: user?.name || `${user?.firstName} ${user?.lastName}`,
    employeeId: user.employeeId,
    department: user.departmentId?.departmentName || 'N/A',
    designation: user.designationId?.title || 'N/A',
    payPeriod: `${moment(payroll.fromDate).format('MMM DD')} - ${moment(payroll.toDate).format('MMM DD, YYYY')}`,
    payrollDetails: pdfData.payrollDetails,
    totalAmount: updatedNetAmount,
  };

  setLoading(true);
  try {
    // 🔹 1. Update netAmount in backend
    await axiosInstance.patch(`/hr/payroll/${payroll._id}`, {
      netAmount: updatedNetAmount,
    });

    // 🔹 2. Update in UI
    setPayrollList((prev) =>
      prev.map((p) =>
        p._id === payroll._id ? { ...p, netAmount: updatedNetAmount } : p
      )
    );

    // 🔹 3. Generate PDF
    const blob = await pdf(<PayrollPDF employee={dataToPDF} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payslip_${user.employeeId}_${moment(payroll.fromDate).format('MMM_YYYY')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('PDF generation failed:', err);
    alert(err.response?.data?.message || 'Failed to generate & update PDF.');
  } finally {
    setLoading(false);
  }
};


  // Handle Approve Click
  const handleApproveClick = (payroll: TPayroll) => {
    setSelectedPayroll(payroll);
    setShowApproveDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleApproveWithPdf = async () => {
    if (!selectedPayroll || !pdfFile) return;

    const formData = new FormData();
    formData.append('pdf', pdfFile);

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/hr/payroll/${selectedPayroll._id}/approve`,
        formData
      );

      const updatedPayroll = response.data.data;

      setPayrollList((prev) =>
        prev.map((p) =>
          p._id === selectedPayroll._id
            ? {
                ...p,
                status: 'approved',
                approvedBy: updatedPayroll.approvedBy
              }
            : p
        )
      );

      setShowApproveDialog(false);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Approval failed:', err);
      alert(err.response?.data?.message || 'Approval failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reject
  const handleRejectClick = async (payrollId: string) => {
    if (!window.confirm('Are you sure you want to reject this payroll request?'))
      return;

    try {
      await axiosInstance.patch(`/hr/payroll/${payrollId}`, {
        status: 'rejected'
      });

      setPayrollList((prev) =>
        prev.map((p) => (p._id === payrollId ? { ...p, status: 'rejected' } : p))
      );
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Failed to reject payroll.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Pending Requests</p>
                <p className="text-2xl font-bold">{payrollList.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Net Payable</p>
                <p className="text-2xl font-bold">
                  £
                  {payrollList
                    .reduce((sum, p) => sum + (p.netAmount || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center space-x-3">
            <FileText className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Pending Payroll Requests
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full sm:w-80"
            />
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-gray-500" />
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                showYearDropdown
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
              {error}
            </div>
          ) : payrollList.length === 0 ? (
            <div className="rounded-lg p-6 text-center text-gray-600">
              No pending payroll requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollList.map((payroll) => (
                    <TableRow
                      key={payroll._id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        {payroll.userId
    ? payroll.userId.name || `${payroll.userId.firstName} ${payroll.userId.lastName}`
    : '—'}
                      </TableCell>
                     <TableCell>
  {payroll.userId
    ? payroll.userId.departmentId?.departmentName || payroll.userId.department || '—'
    : '—'}
</TableCell>

<TableCell>
  {payroll.userId
    ? payroll.userId.designationId?.title || payroll.userId.designation || '—'
    : '—'}
</TableCell>
                      <TableCell>
                        {moment(payroll.fromDate).format('MMM DD')} -{' '}
                        {moment(payroll.toDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        £
                        {payroll.netAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2
                        }) || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            payroll.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : payroll.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payroll.status}
                        </span>
                      </TableCell>
                      <TableCell className="flex justify-end space-x-2 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleGeneratePayroll(payroll)}
                          className="bg-supperagent text-white hover:bg-supperagent/90"
                        >
                          <Calculator className="mr-1 h-4 w-4" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveClick(payroll)}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(payroll._id)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
            </div>
          )}
        </div>

        {/* Generate Payroll Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
              <DialogDescription>
                Attendance for{' '}
                {selectedPayroll
                  ? `${selectedPayroll.userId.firstName} ${selectedPayroll.userId.lastName}`
                  : '—'}
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex justify-center py-8">
                <BlinkingDots size="large" color="bg-supperagent" />
              </div>
            ) : (
              <div className="py-4">
                <h3 className="mb-4 text-lg font-semibold">
                  Attendance & Pay Breakdown
                </h3>

                {attendanceData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Duration (hrs)</TableHead>
                        <TableHead>Hourly Rate (£)</TableHead>
                        <TableHead>Daily Earnings (£)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData.map((att) => {
                        if (!att.clockOut) return null;

                        const clockIn = new Date(att.clockIn);
                        const clockOut = new Date(att.clockOut);
                        const durationMs = clockOut.getTime() - clockIn.getTime();
                        const durationHrs = durationMs / (1000 * 60 * 60);

                        const dayOfWeek = moment(clockIn).format('dddd');
                        const rateObj = employeeRate?.rates[dayOfWeek];
                        const hourlyRate = rateObj?.rate || 0;
                        const dailyEarnings = durationHrs * hourlyRate;

                        return (
                          <TableRow key={att._id}>
                            <TableCell>{moment(clockIn).format('MMM DD, YYYY')}</TableCell>
                            <TableCell className="font-medium">{dayOfWeek}</TableCell>
                            <TableCell>{moment(clockIn).format('HH:mm')}</TableCell>
                            <TableCell>{moment(clockOut).format('HH:mm')}</TableCell>
                            <TableCell>{durationHrs.toFixed(2)}</TableCell>
                            <TableCell>{hourlyRate.toFixed(2)}</TableCell>
                            <TableCell className="font-medium text-green-700">
                              {dailyEarnings.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-4 text-center text-gray-500">
                    No attendance records found.
                  </p>
                )}

                <div className="mt-6 border-t pt-4 text-right">
                  <p className="text-xl font-bold text-green-600">
                    Total Earnings: £
                    {pdfData?.totalAmount?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowGenerateDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => selectedPayroll && handleDownloadPDF(selectedPayroll)}
                disabled={!selectedPayroll || !pdfData}
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Payslip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Payroll</DialogTitle>
              <DialogDescription>
                Approve payroll for{' '}
                <strong>
                  {selectedPayroll?.userId?.firstName} {selectedPayroll?.userId?.lastName}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label>Upload Approved PDF</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {pdfFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {pdfFile.name}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApproveDialog(false);
                  setPdfFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveWithPdf}
                disabled={!pdfFile || loading}
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                {loading ? (
                  <BlinkingDots size="small" color="bg-white" />
                ) : (
                  'Approve'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPayRoll;