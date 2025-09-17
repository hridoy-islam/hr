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
  X,
  Plus
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
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
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import moment from 'moment';

// Import toast
import { useToast } from '@/components/ui/use-toast';

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
  } | null>(null);

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payrollList, setPayrollList] = useState<TPayroll[]>([]);

  // ✅ Generate Payload Dialog State
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);
  const [payloadFromDate, setPayloadFromDate] = useState<Date | null>(null);
  const [payloadToDate, setPayloadToDate] = useState<Date | null>(null);
  const [searchedAttendance, setSearchedAttendance] = useState<
    AttendanceRecord[]
  >([]);
  const [payloadEmployeeRate, setPayloadEmployeeRate] =
    useState<TEmployeeRate | null>(null);
  const [payloadPdfData, setPayloadPdfData] = useState<{
    payrollDetails: PayrollDetail[];
    totalAmount: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<TUser[]>([]);
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // ✅ Add toast hook
  const { toast } = useToast();

  // ✅ Add reject confirmation dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [payrollToReject, setPayrollToReject] = useState<string | null>(null);

  // ✅ Add search user state
  const [selectedSearchUser, setSelectedSearchUser] = useState<{ value: string; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch users for React Select
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users', {
        params: { limit: 'all' }
      });
      const userList = res.data.data.result || [];
      setUsers(userList);
      setUserOptions(
        userList.map((user) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`
        }))
      );
    } catch (err) {
      console.error('Failed to fetch users:', err);
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description: 'Failed to load user list.',
        variant: 'destructive'
      });
    }
  };

  // Fetch payroll data with filters
  const fetchPayrollData = async (page = 1) => {
    setFetching(true);
    setError(null);
    try {
      const params: any = {
        // status: 'pending',
        page,
        limit: entriesPerPage
      };

      // Add date filter (filter by month and year)
      if (selectedDate) {
        params.month = selectedDate.getMonth() + 1; // Month is 0-indexed in JS
        params.year = selectedDate.getFullYear();
      }

      // Add user filter if selected
      if (selectedSearchUser) {
        params.userId = selectedSearchUser.value;
      }

      const response = await axiosInstance.get('/hr/payroll', {
        params
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
    fetchUsers();
  }, [currentPage, entriesPerPage]);

  // ✅ Add effect to refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchPayrollData(1);
  }, [selectedDate, selectedSearchUser]);

  const refreshPayrollList = async () => {
    setFetching(true);
    try {
      await fetchPayrollData(currentPage);
    } finally {
      setFetching(false);
    }
  };

  // Handle Generate Payroll
  const handleGeneratePayroll = async (payroll: TPayroll) => {
    setSelectedPayroll(payroll);
    setAttendanceData([]);
    setEmployeeRate(null);
    setPdfData(null);
    setShowGenerateDialog(true);
    setLoading(true);

    try {
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

      const rateRes = await axiosInstance.get('/hr/employeeRate', {
        params: { employeeId: payroll.userId._id }
      });

      const rateData: TEmployeeRate = rateRes.data.data?.result[0];
      setEmployeeRate(rateData);

      let total = 0;
      const ratesMap = rateData?.rates || {};

      const payrollDetails: PayrollDetail[] = attendance
        .map((att) => {
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
            dailyEarnings
          };
        })
        .filter((item): item is PayrollDetail => item !== null);

      setPdfData({ payrollDetails, totalAmount: total });

      setPayrollList((prev) =>
        prev.map((p) =>
          p._id === payroll._id ? { ...p, netAmount: total } : p
        )
      );
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPDF = async (payroll: TPayroll) => {
    if (!pdfData || !pdfData.totalAmount) {
      // ✅ Replace alert with toast
      toast({
        title: 'Warning',
        description: 'Please generate payroll first to calculate earnings.',
        variant: 'default'
      });
      return;
    }

    const user = payroll.userId;
    const updatedNetAmount = pdfData.totalAmount;

    const dataToPDF = {
      firstName: user?.firstName,
      lastName: user?.lastName,
      name: user?.name || `${user?.firstName} ${user?.lastName}`,
      employeeId: user.employeeId,
      department: user.departmentId?.departmentName || 'N/A',
      designation: user.designationId?.title || 'N/A',
      payPeriod: `${moment(payroll.fromDate).format('MMM DD')} - ${moment(payroll.toDate).format('MMM DD, YYYY')}`,
      payrollDetails: pdfData.payrollDetails,
      totalAmount: updatedNetAmount
    };

    setLoading(true);
    try {
      await axiosInstance.patch(`/hr/payroll/${payroll._id}`, {
        netAmount: updatedNetAmount
      });

      setPayrollList((prev) =>
        prev.map((p) =>
          p._id === payroll._id ? { ...p, netAmount: updatedNetAmount } : p
        )
      );

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
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to generate & update PDF.',
        variant: 'destructive'
      });
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
    formData.append('status', 'approved');
    setLoading(true);
    try {
      const response = await axiosInstance.patch(
        `/hr/payroll/${selectedPayroll._id}`,
        formData
      );

      const updatedPayroll = response.data.data;

      // ✅ Remove the approved payroll from the list
      setPayrollList((prev) => 
        prev.filter((p) => p._id !== selectedPayroll._id)
      );

      setShowApproveDialog(false);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // ✅ Add success toast
      toast({
        title: 'Success',
        description: 'Payroll approved successfully.',
        variant: 'default'
      });
    } catch (err: any) {
      console.error('Approval failed:', err);
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Approval failed.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Reject with confirmation dialog
  const handleRejectClick = (payrollId: string) => {
    setPayrollToReject(payrollId);
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!payrollToReject) return;

    // ✅ Optimistically remove from list
    setPayrollList((prev) => prev.filter((p) => p._id !== payrollToReject));

    try {
      await axiosInstance.patch(`/hr/payroll/${payrollToReject}`, {
        status: 'rejected'
      });

      toast({
        title: 'Success',
        description: 'Payroll rejected successfully.',
        variant: 'default'
      });
    } catch (err) {
      console.error('Reject failed:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to reject payroll.',
        variant: 'destructive'
      });
      // Revert optimistic update on error
      await refreshPayrollList();
    } finally {
      setShowRejectDialog(false);
      setPayrollToReject(null);
    }
  };

  // ✅ Handle Search Attendance in Payload Dialog
  const handleSearchAttendance = async () => {
    if (!selectedUser || !payloadFromDate || !payloadToDate) {
      // ✅ Replace alert with toast
      toast({
        title: 'Warning',
        description: 'Please select user and date range.',
        variant: 'default'
      });
      return;
    }

    setIsSearching(true);
    setSearchedAttendance([]);
    setPayloadEmployeeRate(null);
    setPayloadPdfData(null);

    try {
      // Fetch attendance
      const attendanceRes = await axiosInstance.get('/hr/attendance', {
        params: {
          userId: selectedUser._id,
          fromDate: moment(payloadFromDate).format('YYYY-MM-DD'),
          toDate: moment(payloadToDate).format('YYYY-MM-DD'),
          limit: 'all'
        }
      });
      const attendance: AttendanceRecord[] = attendanceRes.data.data.result;
      setSearchedAttendance(attendance);

      // Fetch employee rate
      const rateRes = await axiosInstance.get('/hr/employeeRate', {
        params: { employeeId: selectedUser._id }
      });

      const rateData: TEmployeeRate = rateRes.data.data?.result[0];
      setPayloadEmployeeRate(rateData);

      // Calculate total & build PDF-ready details
      let total = 0;
      const ratesMap = rateData?.rates || {};

      const payrollDetails: PayrollDetail[] = attendance
        .map((att) => {
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
            dailyEarnings
          };
        })
        .filter((item): item is PayrollDetail => item !== null);

      setPayloadPdfData({ payrollDetails, totalAmount: total });
    } catch (err: any) {
      console.error('Search failed:', err);
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to load attendance data.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSavePayroll = async () => {
    if (
      !selectedUser ||
      !payloadFromDate ||
      !payloadToDate ||
      !payloadPdfData
    ) {
      // ✅ Replace alert with toast
      toast({
        title: 'Warning',
        description: 'Please search attendance and generate preview first.',
        variant: 'default'
      });
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/hr/payroll', {
        userId: selectedUser._id,
        fromDate: payloadFromDate.toISOString(),
        toDate: payloadToDate.toISOString(),
        netAmount: payloadPdfData.totalAmount,
        status: 'pending'
      });

      await refreshPayrollList();

      setShowPayloadDialog(false);
      setSelectedUser(null);
      setPayloadFromDate(null);
      setPayloadToDate(null);
      setSearchedAttendance([]);
      setPayloadEmployeeRate(null);
      setPayloadPdfData(null);

      // ✅ Replace alert with toast
      toast({
        title: 'Success',
        description: 'Payroll created successfully!',
        variant: 'default'
      });
    } catch (err: any) {
      console.error('Failed to create payroll:', err);
      // ✅ Replace alert with toast
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create payroll.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        {/* Payroll Table */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-4">
            <div className="mb-4 flex items-center space-x-3">
              <FileText className="h-6 w-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Pending Payroll Requests
              </h2>
            </div>

            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-gray-500" />
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                showYearDropdown
                dropdownMode="select"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            {/* ✅ Replace text input with React Select for user search */}
            <div className="w-full sm:w-80">
              <Label className="block mb-1 text-sm font-medium text-gray-700">Filter by Employee</Label>
              <Select
                options={userOptions}
                value={selectedSearchUser}
                onChange={(option) => {
                  setSelectedSearchUser(option);
                }}
                placeholder="Select an employee to filter..."
                isClearable
                className="mt-1"
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999
                  })
                }}
              />
            </div>

            <Button
              onClick={() => setShowPayloadDialog(true)}
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Payload
            </Button>
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
                    <TableRow key={payroll._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {payroll.userId
                          ? payroll.userId.name ||
                            `${payroll.userId.firstName} ${payroll.userId.lastName}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {payroll.userId
                          ? payroll.userId.departmentId?.departmentName ||
                            payroll.userId.department ||
                            '—'
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {payroll.userId
                          ? payroll.userId.designationId?.title ||
                            payroll.userId.designation ||
                            '—'
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
                        {/* <Button
                          size="sm"
                          onClick={() => handleGeneratePayroll(payroll)}
                          className="bg-supperagent text-white hover:bg-supperagent/90"
                        >
                          <Calculator className="mr-1 h-4 w-4" />
                          Generate
                        </Button> */}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveClick(payroll)}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
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

        <Dialog
          open={showPayloadDialog}
          onOpenChange={setShowPayloadDialog}
          modal={false}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-gray-300">
            <h1 className="text-xl font-semibold">Generate Payroll</h1>
            <div className="space-y-2">
              <div>
                <Label>Select Employee</Label>
                <Select
                  options={userOptions}
                  value={
                    selectedUser
                      ? {
                          value: selectedUser._id,
                          label: `${selectedUser.firstName} ${selectedUser.lastName}`
                        }
                      : null
                  }
                  onChange={(option) => {
                    if (!option) {
                      setSelectedUser(null);
                      return;
                    }
                    // Find full user object by _id
                    const user = users.find((u) => u._id === option.value);
                    setSelectedUser(user || null);
                  }}
                  placeholder="Select an employee..."
                  isClearable
                  className="mt-1"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>From Date</Label>
                  <DatePicker
                    selected={payloadFromDate}
                    onChange={(date) => setPayloadFromDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="datepicker-root"
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <DatePicker
                    selected={payloadToDate}
                    onChange={(date) => setPayloadToDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select end date"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="datepicker-root"
                  />
                </div>
              </div>

              {isSearching ? (
                <div className="flex justify-center py-4">
                  <BlinkingDots size="large" color="bg-supperagent" />
                </div>
              ) : (
                searchedAttendance.length > 0 && (
                  <>
                    <h3 className="mt-6 text-lg font-semibold">
                      Attendance & Pay Breakdown
                    </h3>
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
                        {searchedAttendance.map((att) => {
                          if (!att.clockOut) return null;

                          const clockIn = new Date(att.clockIn);
                          const clockOut = new Date(att.clockOut);
                          const durationMs =
                            clockOut.getTime() - clockIn.getTime();
                          const durationHrs = durationMs / (1000 * 60 * 60);

                          const dayOfWeek = moment(clockIn).format('dddd');
                          const rateObj = payloadEmployeeRate?.rates[dayOfWeek];
                          const hourlyRate = rateObj?.rate || 0;
                          const dailyEarnings = durationHrs * hourlyRate;

                          return (
                            <TableRow key={att._id}>
                              <TableCell>
                                {moment(clockIn).format('MMM DD, YYYY')}
                              </TableCell>
                              <TableCell className="font-medium">
                                {dayOfWeek}
                              </TableCell>
                              <TableCell>
                                {moment(clockIn).format('HH:mm')}
                              </TableCell>
                              <TableCell>
                                {moment(clockOut).format('HH:mm')}
                              </TableCell>
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

                    <div className="mt-6 border-t pt-4 text-right">
                      <p className="text-xl font-bold text-green-600">
                        Total Earnings: £
                        {payloadPdfData?.totalAmount?.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }
                        ) || '0.00'}
                      </p>
                    </div>
                  </>
                )
              )}
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  // Reset all form data when canceling
                  setShowPayloadDialog(false);
                  setSelectedUser(null);
                  setPayloadFromDate(null);
                  setPayloadToDate(null);
                  setSearchedAttendance([]);
                  setPayloadEmployeeRate(null);
                  setPayloadPdfData(null);
                  setIsSearching(false);
                }}
              >
                Cancel
              </Button>
              {searchedAttendance.length > 0 && payloadPdfData ? (
                <Button
                  onClick={handleSavePayroll}
                  disabled={isSearching}
                  className="bg-supperagent text-white hover:bg-supperagent/90"
                >
                  Create Payroll
                </Button>
              ) : (
                <Button
                  onClick={handleSearchAttendance}
                  disabled={
                    !selectedUser ||
                    !payloadFromDate ||
                    !payloadToDate ||
                    isSearching
                  }
                  className="bg-supperagent text-white hover:bg-supperagent/90"
                >
                  {isSearching ? (
                    <BlinkingDots size="small" color="bg-white" />
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              )}
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
                  {selectedPayroll?.userId?.firstName}{' '}
                  {selectedPayroll?.userId?.lastName}
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

        {/* ✅ Reject Confirmation Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Rejection</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this payroll request? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReject}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? (
                  <BlinkingDots size="small" color="bg-white" />
                ) : (
                  'Reject'
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