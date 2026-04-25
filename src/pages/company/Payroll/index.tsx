import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Plus,
  Eye,
  ChevronDown,
  Download,
  X,
  Filter,
  Search
} from 'lucide-react';
import DatePicker from 'react-datepicker';
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
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadPayrollPDF, getPayrollPDFBlob } from './components/PayrollPDF';
import moment from 'moment';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TDesignation {
  _id: string;
  title: string;
}

export interface TDepartment {
  _id: string;
  departmentName: string;
}

export interface TUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  phone?: string;
  departmentId?: TDepartment | TDepartment[];
  designationId?: TDesignation | TDesignation[];
  department?: string;
  designation?: string;
  departments?: TDepartment[];
  designations?: TDesignation[];
}

export interface TAttendanceLog {
  attendanceId: string;
  payRate: number;
  duration: number; // minutes
}

export interface TPayroll {
  _id: string;
  refId?: string;
  userId?: TUser;
  user?: TUser;
  fromDate: Date | string;
  toDate: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  totalHour: number;
  totalAmount: number;
  attendanceList?: TAttendanceLog[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveUser = (p: TPayroll): TUser | null =>
  (p.userId as TUser) ?? p.user ?? null;

const sumDuration = (list?: TAttendanceLog[]): string => {
  const totalMins = (list ?? []).reduce((s, a) => s + (a.duration ?? 0), 0);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

const getDesignation = (emp: TUser | null): string => {
  if (!emp) return '—';
  if (emp.designations?.length) return emp.designations[0].title;
  if (emp.designationId && !Array.isArray(emp.designationId))
    return (emp.designationId as TDesignation).title;
  if (Array.isArray(emp.designationId) && emp.designationId.length)
    return (emp.designationId as TDesignation[])[0].title;
  return emp.designation || '—';
};

// ─── Component ────────────────────────────────────────────────────────────────

const CompanyPayRoll = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: companyId } = useParams();

  const [payrollList, setPayrollList] = useState<TPayroll[]>([]);

  // Loading / error
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  // Generate payroll dialog
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [payloadFromDate, setPayloadFromDate] = useState<Date | null>(null);
  const [payloadToDate, setPayloadToDate] = useState<Date | null>(null);

  // PDF preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatDateToYMD = (date: Date | null) => {
    if (!date) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchPayrollData = async (page = 1) => {
    setFetching(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: entriesPerPage,
        companyId,
     };

      const res = await axiosInstance.get('/hr/payroll', { params });
      setPayrollList(res.data.data.result ?? []);
      setTotalPages(res.data.data.meta?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load payroll data');
      setPayrollList([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchPayrollData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesPerPage]);

  useEffect(() => {
    fetchPayrollData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleGeneratePayroll = async () => {
    if (!payloadFromDate || !payloadToDate) {
      toast({
        title: 'Warning',
        description: 'Please select a date range.',
        variant: 'default'
      });
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/hr/payroll', {
        companyId,
        fromDate: formatDateToYMD(payloadFromDate),
        toDate: formatDateToYMD(payloadToDate)
      });
      toast({
        title: 'Success',
        description: 'Payroll generated successfully!'
      });
      setShowPayloadDialog(false);
      setPayloadFromDate(null);
      setPayloadToDate(null);
      fetchPayrollData(1,);
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.response?.data?.message ?? 'Failed to generate payroll.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };



  // ✅ Aggregate payrolls into a single object per date range
  const aggregatedPayrolls = Object.values(
    payrollList.reduce(
      (acc, payroll) => {
        const from = moment(payroll.fromDate).format('DD MMM, YYYY');
        const to = moment(payroll.toDate).format('DD MMM, YYYY');
        const key = `${from} - ${to}`;

        if (!acc[key]) {
          acc[key] = {
            ids: [], // Array of payroll IDs
            fromDate: payroll.fromDate,
            toDate: payroll.toDate,
            employeeNames: [],
            totalDurationMins: 0,
            totalAmount: 0,
            count: 0
          };
        }

        // Push every payroll ID in this batch into the array
        acc[key].ids.push(payroll._id);

        // Add employee name
        const emp = resolveUser(payroll);
        if (emp) {
          acc[key].employeeNames.push(`${emp.firstName} ${emp.lastName}`);
        }

        // Calculate total duration and amount specifically from attendanceList
        let userTotalMins = 0;
        let userTotalAmount = 0;

        (payroll.attendanceList ?? []).forEach((att: any) => {
          // 1. Calculate actual duration from timestamps since DB duration is often 0
          const clockIn = moment(att.attendanceId?.clockIn);
          const clockOut = moment(att.attendanceId?.clockOut);

          let workedMinutes = 0;

          // Fallback to DB duration only if timestamps are completely missing
          workedMinutes = att.duration ?? 0;

          const rate = att.payRate ?? 0;

          userTotalMins += workedMinutes;
          userTotalAmount += (workedMinutes / 60) * rate; // Calculated per attendance log
        });

        // Accumulate the batch totals
        acc[key].totalDurationMins += userTotalMins;
        acc[key].totalAmount += userTotalAmount;
        acc[key].count += 1;

        return acc;
      },
      {} as Record<string, any>
    )
  );


  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* ── Page header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
          <div className="flex flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
            </div>
          </div>

          <Button
            onClick={() => setShowPayloadDialog(true)}
            className="bg-theme text-white hover:bg-theme/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Payroll
          </Button>
        </div>

        {/* ── Table ── */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        ) : payrollList.length === 0 ? (
          <div className="rounded-lg p-10 text-center text-gray-400">
            No payroll records found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">
                      Payroll Period
                    </TableHead>
           
                    <TableHead className="text-right font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {aggregatedPayrolls.map((group, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/60">
                      {/* Employee Names joined by comma */}

                      {/* From Date */}
                      <TableCell className="font-medium text-gray-800">
                        {moment(group.fromDate).format('DD MMM, YYYY')} -  {moment(group.toDate).format('DD MMM, YYYY')}
                      </TableCell>


                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-theme text-white hover:bg-theme/90"
                            onClick={() =>
                              navigate('batch-details', {
                                state: {
                                  payrollIds: group.ids,
                                  fromDate: group.fromDate,
                                  toDate: group.toDate
                                }
                              })
                            }
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Generate Payroll Dialog ── */}
      <Dialog open={showPayloadDialog} onOpenChange={setShowPayloadDialog}>
        <DialogContent className="overflow-visible border-gray-300 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Generate Payroll
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            Payroll will be generated for <strong>all active employees</strong>{' '}
            in this company for the selected date range.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>From Date</Label>
              <DatePicker
                selected={payloadFromDate}
                onChange={(date) => setPayloadFromDate(date)}
                dateFormat="dd-MM-yyyy"
                placeholderText="Start date"
                showMonthDropdown
                showYearDropdown
                preventOpenOnFocus
                dropdownMode="select"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>To Date</Label>
              <DatePicker
                selected={payloadToDate}
                onChange={(date) => setPayloadToDate(date)}
                dateFormat="dd-MM-yyyy"
                placeholderText="End date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
                minDate={payloadFromDate ?? undefined}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPayloadDialog(false);
                setPayloadFromDate(null);
                setPayloadToDate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePayroll}
              disabled={loading || !payloadFromDate || !payloadToDate}
              className="bg-theme text-white hover:bg-theme/90"
            >
              {loading ? (
                <BlinkingDots size="small" color="bg-white" />
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyPayRoll;
