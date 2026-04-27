import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText,
  Calculator,
  Plus,
  Trash2
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
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

export interface TPayrollBatch {
  ids: string[];
  companyId: string;
  fromDate: string | Date;
  toDate: string | Date;
  createdAt: string | Date;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CompanyPayRoll = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: companyId } = useParams();

  const [batchList, setBatchList] = useState<TPayrollBatch[]>([]);

  // Loading / error
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Generate payroll dialog
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [payloadFromDate, setPayloadFromDate] = useState<Date | null>(null);
  const [payloadToDate, setPayloadToDate] = useState<Date | null>(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Polling Reference to clear timers if component unmounts
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  const formatDateToYMD = (date: Date | null) => {
    if (!date) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchPayrollData = useCallback(async (page = 1, isSilent = false) => {
    if (!isSilent) setFetching(true);
    if (!isSilent) setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: entriesPerPage,
        companyId,
      };

      const res = await axiosInstance.get('/hr/payroll/batch', { params });
      
      const batches: TPayrollBatch[] = res.data?.data?.data ?? [];
      const sortedBatches = batches.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBatchList(sortedBatches);
      setTotalPages(res.data?.data?.meta?.totalPages ?? 1);
      return sortedBatches;
    } catch (err: any) {
      if (!isSilent) setError(err.response?.data?.message ?? 'Failed to load payroll batches');
      setBatchList([]);
      return [];
    } finally {
      if (!isSilent) setFetching(false);
    }
  }, [companyId, entriesPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchPayrollData(1);
  }, [entriesPerPage, fetchPayrollData]);

  useEffect(() => {
    fetchPayrollData(currentPage);
  }, [currentPage, fetchPayrollData]);

  // ─── Polling Logic ──────────────────────────────────────────────────────────
  const pollForNewData = useCallback(async (startTime: number, targetFrom: string, targetTo: string) => {
    try {
      // 1. Silently fetch the latest data
      const latestBatches = await fetchPayrollData(1, true);

      // 2. Check if the newly generated batch exists in the DB yet
      const foundNewBatch = latestBatches.find(b => 
        formatDateToYMD(new Date(b.fromDate)) === targetFrom &&
        formatDateToYMD(new Date(b.toDate)) === targetTo
      );

      if (foundNewBatch) {
        // Data is ready! Stop polling.
        setLoading(false);
        setShowPayloadDialog(false);
        setPayloadFromDate(null);
        setPayloadToDate(null);
        toast({
          title: 'Success',
          description: 'Payroll generated successfully!'
        });
        return;
      }

      // 3. Check if 60 seconds have passed (Timeout)
      if (Date.now() - startTime >= 60000) {
        setLoading(false);
        setShowPayloadDialog(false);
        setPayloadFromDate(null);
        setPayloadToDate(null);
        toast({
          title: 'Still Processing',
          description: 'Payroll generation is taking longer than usual. It will appear here shortly.',
        });
        return;
      }

      // 4. If not found and not timed out, poll again in 5 seconds
      pollingTimerRef.current = setTimeout(() => {
        pollForNewData(startTime, targetFrom, targetTo);
      }, 5000);

    } catch (error) {
      // If error occurs, keep trying until timeout
      if (Date.now() - startTime >= 120000) {
        setLoading(false);
        setShowPayloadDialog(false);
        return;
      }
      pollingTimerRef.current = setTimeout(() => pollForNewData(startTime, targetFrom, targetTo), 5000);
    }
  }, [fetchPayrollData, toast]);

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
    const targetFromStr = formatDateToYMD(payloadFromDate) as string;
    const targetToStr = formatDateToYMD(payloadToDate) as string;

    try {
      // Send the request to enqueue the job
      await axiosInstance.post('/hr/payroll', {
        companyId,
        fromDate: targetFromStr,
        toDate: targetToStr
      });

      // Start the polling cycle (Max 1 minute)
      pollForNewData(Date.now(), targetFromStr, targetToStr);

    } catch (err: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: err.response?.data?.message ?? 'Failed to start payroll generation.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete.length) return;
    setIsDeleting(true);
    try {
      for (const id of batchToDelete) {
        await axiosInstance.delete(`/hr/payroll/${id}`);
      }
      
      toast({
        title: 'Success',
        description: `Successfully deleted ${batchToDelete.length} payroll records.`
      });
      
      setShowDeleteConfirm(false);
      setBatchToDelete([]);
      fetchPayrollData(currentPage); 
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message ?? 'Failed to delete some payrolls.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Memoize the data array so UI doesn't stutter/flash during silent background polling
  const memoizedBatches = useMemo(() => batchList, [batchList]);

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
        {fetching && batchList.length === 0 ? (
          <div className="flex justify-center py-12">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        ) : memoizedBatches.length === 0 ? (
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
                  {memoizedBatches.map((batch, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/60">
                      <TableCell className="font-medium text-gray-800">
                        {moment(batch.fromDate).format('DD MMM, YYYY')} -  {moment(batch.toDate).format('DD MMM, YYYY')}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-theme text-white hover:bg-theme/90"
                            onClick={() =>
                              navigate('batch-details', {
                                state: {
                                  payrollIds: batch.ids,
                                  fromDate: batch.fromDate,
                                  toDate: batch.toDate
                                }
                              })
                            }
                          >
                            Details
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={'destructive'}
                            onClick={() => {
                              setBatchToDelete(batch.ids);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ── Batch Delete Confirmation Dialog ── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all <strong>{batchToDelete.length}</strong> payroll records in this period? This action will process one by one and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setBatchToDelete([]);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBatch}
              disabled={isDeleting}
            >
              {isDeleting ? <BlinkingDots size="small" color="bg-white" /> : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Payroll Dialog ── */}
      {/* If `loading` is true, we prevent the user from clicking out or closing the dialog to interrupt the flow */}
      <Dialog 
        open={showPayloadDialog} 
        onOpenChange={(open) => {
          if (!loading) setShowPayloadDialog(open);
        }}
      >
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
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme disabled:opacity-50"
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
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="secondary"
              disabled={loading}
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