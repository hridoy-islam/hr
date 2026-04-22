import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Plus,
  Eye,
  ChevronDown,
  Download,
  X,
  Filter
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
import moment from '@/lib/moment-setup';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadPayrollPDF, getPayrollPDFBlob } from './components/PayrollPDF';

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
  // old aggregation shapes
  departmentId?: TDepartment | TDepartment[];
  designationId?: TDesignation | TDesignation[];
  department?: string;
  designation?: string;
  // new aggregation shapes (arrays from $lookup)
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
  // aggregation may return employee as `userId` (populated) or `user` (projected)
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

/** Pick employee object regardless of aggregation shape */
const resolveUser = (p: TPayroll): TUser | null =>
  (p.userId as TUser) ?? p.user ?? null;

/** Sum attendance durations (minutes) → "H:MM" */
const sumDuration = (list?: TAttendanceLog[]): string => {
  const totalMins = (list ?? []).reduce((s, a) => s + (a.duration ?? 0), 0);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

/** Resolve designation title from any shape */
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
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter date range
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);

  // Generate payroll dialog
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [payloadFromDate, setPayloadFromDate] = useState<Date | null>(null);
  const [payloadToDate, setPayloadToDate] = useState<Date | null>(null);

  // PDF preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDetailed, setPreviewDetailed] = useState(false);
  const [selectedPreviewPayroll, setSelectedPreviewPayroll] =
    useState<TPayroll | null>(null);

  // ── Grand totals ───────────────────────────────────────────────────────────
  const grandTotalMins = payrollList.reduce(
    (acc, p) =>
      acc + (p.attendanceList ?? []).reduce((s, a) => s + (a.duration ?? 0), 0),
    0
  );
  const grandTotalHours = `${Math.floor(grandTotalMins / 60)}:${String(grandTotalMins % 60).padStart(2, '0')}`;
  const grandTotalAmount = payrollList.reduce(
    (acc, p) => acc + (p.totalAmount ?? 0),
    0
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchPayrollData = async (page = 1) => {
    setFetching(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: entriesPerPage,
        companyId
      };
      if (filterFromDate) params.fromDate = filterFromDate.toISOString();
      if (filterToDate) params.toDate = filterToDate.toISOString();

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
  }, [filterFromDate, filterToDate, entriesPerPage]);

  useEffect(() => {
    fetchPayrollData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePreview = async (payroll: TPayroll, detailed: boolean) => {
    try {
      const blob = await getPayrollPDFBlob(payroll, detailed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewDetailed(detailed);
      setSelectedPreviewPayroll(payroll);
      setPreviewOpen(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Could not generate preview',
        variant: 'destructive'
      });
    }
  };

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
        fromDate: payloadFromDate.toISOString(),
        toDate: payloadToDate.toISOString()
      });
      toast({
        title: 'Success',
        description: 'Payroll generated successfully!'
      });
      setShowPayloadDialog(false);
      setPayloadFromDate(null);
      setPayloadToDate(null);
      fetchPayrollData(1);
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

  const statusBadge = (status: TPayroll['status']) => {
    const map = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    } as const;
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* ── Page header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-500" />
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

        {/* ── Filters ── */}
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Filter className="h-4 w-4" />
            Filter by date
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">From Date</Label>
            <DatePicker
              selected={filterFromDate}
              onChange={(date) => setFilterFromDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Start date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              isClearable
              className="h-9 w-40 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <DatePicker
              selected={filterToDate}
              onChange={(date) => setFilterToDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="End date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              isClearable
              minDate={filterFromDate ?? undefined}
              className="h-9 w-40 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
            />
          </div>

          {(filterFromDate || filterToDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterFromDate(null);
                setFilterToDate(null);
              }}
              className="h-9 gap-1 text-gray-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
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
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">
                      Payroll #
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Employee Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Designation
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Pay Period
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Hours Worked
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Total Amount
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {payrollList.map((payroll) => {
                    const emp = resolveUser(payroll);
                    return (
                      <TableRow
                        key={payroll._id}
                        className="hover:bg-gray-50/60"
                      >
                        {/* Payroll Number */}
                        <TableCell className="font-mono text-sm font-medium text-gray-700">
                          {payroll.refId ?? '—'}
                        </TableCell>

                        {/* Employee Name */}
                        <TableCell className="font-medium text-gray-900">
                          {emp ? `${emp.firstName} ${emp.lastName}` : '—'}
                        </TableCell>

                        {/* Designation */}
                        <TableCell className="text-gray-600">
                          {getDesignation(emp)}
                        </TableCell>

                        {/* Pay Period */}
                        <TableCell className="text-gray-600">
                          {moment(payroll.fromDate).format('DD MMM')} –{' '}
                          {moment(payroll.toDate).format('DD MMM YYYY')}
                        </TableCell>

                        {/* Hours Worked — sum of all attendance durations */}
                        <TableCell className="font-semibold text-theme">
                          {sumDuration(payroll.attendanceList)}
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="font-semibold text-theme">
                          £
                          {(payroll.totalAmount ?? 0).toLocaleString('en-GB', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>

                        {/* Status */}
                        <TableCell>{statusBadge(payroll.status)}</TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300"
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  Preview
                                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handlePreview(payroll, false)}
                                  className="cursor-pointer"
                                >
                                  Summary
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePreview(payroll, true)}
                                  className="cursor-pointer"
                                >
                                  Detailed
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              size="sm"
                              className="bg-theme text-white hover:bg-theme/90"
                              onClick={() => navigate(payroll._id)}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>

                {/* ── Grand totals footer ── */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-600"
                    >
                      Total ({payrollList.length} record
                      {payrollList.length !== 1 ? 's' : ''})
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-theme">
                      {grandTotalHours}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-theme">
                      £
                      {grandTotalAmount.toLocaleString('en-GB', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </Table>
            </div>

            {payrollList.length > 50 && (
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
                dateFormat="dd/MM/yyyy"
                placeholderText="Start date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>To Date</Label>
              <DatePicker
                selected={payloadToDate}
                onChange={(date) => setPayloadToDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="End date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
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

      {/* ── Preview PDF Dialog ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[96vh] max-w-6xl flex-col gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              Payroll Preview — {previewDetailed ? 'Detailed' : 'Summary'}
            </DialogTitle>
          </DialogHeader>

          <div className="relative w-full flex-1 bg-gray-100">
            {previewUrl ? (
              <embed
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                width="100%"
                height="100%"
                className="absolute inset-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Loading Preview…
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t bg-white p-4">
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedPreviewPayroll && (
              <Button
                className="bg-theme text-white hover:bg-theme/90"
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
  );
};

export default CompanyPayRoll;
