import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Check,
  X,
  Plus,
  Eye, // Added
  ChevronDown, // Added
  Download // Added
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import 'react-datepicker/dist/react-datepicker.css';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader, // Added
  DialogTitle // Added
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'; // Added imports
import moment from 'moment';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { Label } from '@/components/ui/label';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadPayrollPDF, getPayrollPDFBlob } from './components/PayrollPDF';
// Import the PDF logic

// Types
export interface TUser {
  _id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  companyId?: string;
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
  totalHour: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  // Note: Ensure your backend sends attendanceList if you want the Detailed PDF to populate the table
  attendanceList?: any[];
}

const AdminPayRoll = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const navigate = useNavigate();
  const{id} = useParams()
  const [payrollList, setPayrollList] = useState<TPayroll[]>([]);
  const [users, setUsers] = useState<TUser[]>([]);
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Loading/Error State
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSearchUser, setSelectedSearchUser] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [payrollToReject, setPayrollToReject] = useState<string | null>(null);
const [selectedUsers, setSelectedUsers] = useState<TUser[]>([]);  const [payloadFromDate, setPayloadFromDate] = useState<Date | null>(null);
  const [payloadToDate, setPayloadToDate] = useState<Date | null>(null);

  // --- PREVIEW STATE ---
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDetailed, setPreviewDetailed] = useState(false);
  const [selectedPreviewPayroll, setSelectedPreviewPayroll] =
    useState<TPayroll | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users', {
        params: { limit: 'all', company: id, role: 'employee' }
      });
      const userList = res.data.data.result || [];
      setUsers(userList);
      setUserOptions(
        userList.map((u: TUser) => ({
          value: u._id,
          label: `${u.firstName} ${u.lastName}`
        }))
      );
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to load user list.',
        variant: 'destructive'
      });
    }
  };

  // Fetch Payroll Data
  const fetchPayrollData = async (page = 1) => {
    setFetching(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: entriesPerPage
      };

      if (selectedDate) {
        params.month = selectedDate.getMonth() + 1;
        params.year = selectedDate.getFullYear();
      }

      if (selectedSearchUser) {
        params.userId = selectedSearchUser.value;
      }

      const response = await axiosInstance.get('/hr/payroll', { params });
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
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchPayrollData(1);
  }, [selectedDate, selectedSearchUser, entriesPerPage]);

  useEffect(() => {
    fetchPayrollData(currentPage);
  }, [currentPage]);

  // Clean up PDF URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleApproveClick = async (payroll: TPayroll) => {
    navigate(payroll._id);
  };

  // --- PREVIEW HANDLER ---
  const handlePreview = async (payroll: TPayroll, detailed: boolean) => {
    try {
      const blob = await getPayrollPDFBlob(payroll, detailed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewDetailed(detailed);
      setSelectedPreviewPayroll(payroll);
      setPreviewOpen(true);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not generate preview',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmReject = async () => {
    if (!payrollToReject) return;
    try {
      await axiosInstance.patch(`/hr/payroll/${payrollToReject}`, {
        status: 'rejected'
      });
      toast({
        title: 'Success',
        description: 'Payroll rejected.',
        variant: 'default'
      });
      fetchPayrollData(currentPage);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reject payroll.',
        variant: 'destructive'
      });
    } finally {
      setShowRejectDialog(false);
      setPayrollToReject(null);
    }
  };

const handleSavePayroll = async () => {
    // Check if array is empty
    if (selectedUsers.length === 0 || !payloadFromDate || !payloadToDate) {
      toast({
        title: 'Warning',
        description: 'Please select at least one employee and the date range.',
        variant: 'default'
      });
      return;
    }

    setLoading(true);
    try {
      // Create array of IDs
      const userIds = selectedUsers.map((u) => u._id);

      await axiosInstance.post('/hr/payroll', {
        userIds: userIds, // Sending array instead of single userId
        companyId: id,
        fromDate: payloadFromDate.toISOString(),
        toDate: payloadToDate.toISOString()
      });

      console.log(userIds)

      toast({
        title: 'Success',
        description: 'Payroll generated successfully!'
      });

      // Cleanup
      setShowPayloadDialog(false);
      setSelectedUsers([]); // Reset array
      setPayloadFromDate(null);
      setPayloadToDate(null);

      fetchPayrollData(1);
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to generate payroll.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="space-y-4">
        {/* --- HEADER & TABLE SECTION --- */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-4">
            <div className="mb-4 flex items-center space-x-3">
              <FileText className="h-6 w-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Payroll</h2>
            </div>
            <Button
              onClick={() => setShowPayloadDialog(true)}
              className="bg-theme text-white hover:bg-theme/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </div>

          {fetching ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
              {error}
            </div>
          ) : payrollList.length === 0 ? (
            <div className="rounded-lg p-6 text-center text-gray-600">
              No payroll records found.
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
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Total Amount</TableHead>
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
                      <TableCell className="font-bold text-theme">
                        {payroll.totalHour != null
                          ? (() => {
                              const totalMinutes = Number(payroll.totalHour);

                              const hours = Math.floor(totalMinutes / 60);

                              const minutes = Math.floor(totalMinutes % 60);

                              return `${hours}:${String(minutes).padStart(2, '0')}`;
                            })()
                          : '—'}
                      </TableCell>

                      <TableCell className="font-bold text-theme">
                        £
                        {payroll.totalAmount?.toLocaleString(undefined, {
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
                      <TableCell className="flex items-center justify-end space-x-2 text-right">
                        <div className="flex flex-row gap-2">
                          {/* --- PREVIEW DROPDOWN ADDED HERE --- */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" className="border-gray-300">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handlePreview(payroll, false)}
                                className="cursor-pointer"
                              >
                                Normal Preview (Summary)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePreview(payroll, true)}
                                className="cursor-pointer"
                              >
                                Detailed Preview (Full)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="sm"
                            onClick={() => handleApproveClick(payroll)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {payrollList.length > 50 && (
                <>
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
            </div>
          )}
        </div>

        {/* --- GENERATE PAYROLL DIALOG --- */}
        <Dialog
          open={showPayloadDialog}
          onOpenChange={setShowPayloadDialog}
          modal={false}
        >
          <DialogContent className="overflow-visible border-gray-300">
            <h1 className="text-xl font-semibold">Generate Payroll</h1>
          <div>
                <Label>Select Employees</Label>
                <Select
                  isMulti // Enables multiple selection
                  options={userOptions}
                  // Map selectedUsers state back to React-Select format {value, label}
                  value={selectedUsers.map((u) => ({
                    value: u._id,
                    label: `${u.firstName} ${u.lastName}`
                  }))}
                  onChange={(selectedOptions) => {
                    // selectedOptions is an array of {value, label}
                    // Filter the original 'users' list to match selected IDs
                    const selectedIds = selectedOptions.map((opt) => opt.value);
                    const newSelectedUsers = users.filter((u) =>
                      selectedIds.includes(u._id)
                    );
                    setSelectedUsers(newSelectedUsers);
                  }}
                  placeholder="Select employees..."
                  menuPortalTarget={document.body}
                  className="mt-1"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              </div>
<div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <DatePicker
                    selected={payloadFromDate}
                    onChange={(date) => setPayloadFromDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Start date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <DatePicker
                    selected={payloadToDate}
                    onChange={(date) => setPayloadToDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="End date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>
                </div>
            <DialogFooter className="mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowPayloadDialog(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSavePayroll}
                disabled={
                  loading || selectedUsers.length === 0 || !payloadFromDate || !payloadToDate
                }
                className="bg-theme text-white hover:bg-theme/90"
              >
                {loading ? (
                  <BlinkingDots size="small" color="bg-white" />
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Generate Payroll
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- REJECT CONFIRMATION DIALOG --- */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <h2 className="text-lg font-bold">Reject Payroll</h2>
            <p>Are you sure you want to reject this payroll record?</p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject}>
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- PREVIEW PDF DIALOG --- */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex h-[96vh] max-w-6xl flex-col gap-0 p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>
                Payroll Preview ({previewDetailed ? 'Detailed' : 'Summary'})
              </DialogTitle>
            </DialogHeader>

            <div className="relative w-full flex-1 bg-gray-100">
              {previewUrl ? (
                <embed
                  // Hides toolbar
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="absolute inset-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Loading Preview...
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t bg-white p-4">
              <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              {selectedPreviewPayroll && (
                <Button
                  onClick={() =>
                    downloadPayrollPDF(selectedPreviewPayroll, previewDetailed)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPayRoll;
