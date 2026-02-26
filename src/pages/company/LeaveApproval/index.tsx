import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  XCircle,
  Users,
  Check,
  Info,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface LeaveRequest {
  _id: string;
  holidayYear: string;
  userId: {
    _id: string;
    name: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  startDate: string;
  endDate: string;
  title: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  holidayType: string;
  totalDays: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
}

const CompanyLeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const { id: companyId } = useParams();
  const radioRefs = useRef<{
    paid: HTMLInputElement | null;
    unpaid: HTMLInputElement | null;
  }>({
    paid: null,
    unpaid: null
  });
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const res = await axiosInstance.get(
          `/hr/leave?status=pending&companyId=${companyId}&limit=${entriesPerPage}`
        );
        const fetchedLeaves: LeaveRequest[] = res.data.data.result;
        setLeaves(fetchedLeaves);
        setTotalPages(res.data.data.meta.totalPage);
      } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Unable to load leave requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [currentPage, entriesPerPage]);

  const handleIndividualAction = async (
    id: string,
    status: 'approved' | 'rejected',
    leaveType?: 'paid' | 'unpaid' // Optional, but used when approving
  ) => {
    try {
      const payload: any = { status };

      // Only send leaveType if it's an approval
      if (status === 'approved' && leaveType) {
        payload.leaveType = leaveType; // e.g., "paid" or "unpaid"
      }

      const res = await axiosInstance.patch(`/hr/leave/${id}`, payload);
      setLeaves((prev) => prev.filter((req) => req._id !== id));
      toast({ title: 'Leave request updated successfully' });
    } catch (err: any) {
      console.error('Error updating leave status:', err);
      toast({
        title: 'Failed to update leave request',
        description: err.response?.data?.message || 'Check console for details',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tooltip  component

  // Enhanced LeaveTooltipContent with Leave Allowance
  // Enhanced LeaveTooltipContent with Correct Allowance Calculation
  const LeaveTooltipContent = ({ request }: { request: LeaveRequest }) => {
    const [allowance, setAllowance] = useState<{
      openingThisYear: number;
      holidayAccured: number;
      taken: number;
      requested: number;
      remainingHours: number;
      unpaidLeaveRequest: number;
      unpaidLeaveTaken: number;
      leftThisYear: number;
    } | null>(null);

    const [loading, setLoading] = useState<boolean>(true);

    // Match your app's current year logic
    const currentYear = `${moment().format('YYYY')}-${moment().add(1, 'year').format('YYYY')}`;

    useEffect(() => {
      const fetchAllowance = async () => {
        if (!request.userId?._id) return;

        try {
          // Fetch holiday allowance record for this user + year
          const res = await axiosInstance.get(
            `/hr/holidays?userId=${request.userId._id}&year=${currentYear}`
          );

          const data = res.data.data?.result || res.data.data || res.data;

          let record = null;
          if (Array.isArray(data)) {
            record = data.find((item: any) => item.year === currentYear);
          } else if (data?.year === currentYear) {
            record = data;
          }

          if (record) {
            const taken = record.usedHours || 0;
            const requested = record.requestedHours || 0;
            const holidayAccured = record.holidayAccured || 0;
            const remainingHours = record.remainingHours || 0;
            const unpaidLeaveRequest = record.unpaidLeaveRequest || 0;
            const unpaidLeaveTaken = record.unpaidLeaveTaken || 0;
            const openingThisYear = record.holidayAllowance || 0;
            const leftThisYear = holidayAccured - taken - requested;

            setAllowance({
              openingThisYear,
              holidayAccured,
              taken,
              requested,
              remainingHours,
              unpaidLeaveRequest,
              unpaidLeaveTaken,
              leftThisYear
            });
          } else {
            setAllowance({
              openingThisYear: 0,
              holidayAccured: 0,
              taken: 0,
              requested: 0,
              remainingHours: 0,
              unpaidLeaveRequest: 0,
              unpaidLeaveTaken: 0,
              leftThisYear: 0
            });
          }
        } catch (err) {
          console.error('Failed to fetch leave allowance for tooltip:', err);
          setAllowance({
            openingThisYear: 0,
            holidayAccured: 0,
            taken: 0,
            requested: 0,
            remainingHours: 0,
            unpaidLeaveRequest: 0,
            unpaidLeaveTaken: 0,
            leftThisYear: 0
          });
        } finally {
          setLoading(false);
        }
      };

      fetchAllowance();
    }, [request.userId?._id]);

    return (
      <div className="max-w-xs space-y-3 rounded-lg bg-white p-3 shadow-lg">
        {/* Employee Info */}
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">
            {request.userId?.firstName} {request.userId?.lastName}
          </span>
        </div>

        {/* Leave Allowance Section */}
        <div className="space-y-2 rounded-md bg-blue-50 p-3 text-sm">
          <h4 className="font-semibold text-blue-900">
            Leave Allowance ({currentYear})
          </h4>
          {loading ? (
            <div className="flex justify-center py-2">
              <BlinkingDots size="small" color="bg-blue-600" />
            </div>
          ) : allowance ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Opening Allowance:</span>
                <span className="font-medium">
                  {allowance.openingThisYear.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Holiday Accrued:</span>
                <span className="font-medium">
                  {allowance.holidayAccured.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taken (Paid):</span>
                <span className="font-medium text-green-600">
                  {allowance.taken.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requested (Pending):</span>
                <span className="font-medium text-yellow-600">
                  {allowance.requested.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unpaid Taken:</span>
                <span className="font-medium text-red-600">
                  {allowance.unpaidLeaveTaken.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unpaid Requested:</span>
                <span className="font-medium text-red-600">
                  {allowance.unpaidLeaveRequest.toFixed(1)} h
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-blue-600">
                <span>Remaining This Year:</span>
                <span>{allowance.leftThisYear.toFixed(1)} h</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No data</div>
          )}
        </div>
      </div>
    );
  };
  const navigate = useNavigate();
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-5 w-5 text-theme" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <BlinkingDots size="large" color="bg-theme" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="">
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-8 text-center text-gray-500"
                          >
                            No leave requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaves.map((request) => (
                          <TableRow
                            key={request._id}
                            className="hover:bg-gray-50"
                          >
                            {/* Employee */}
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex cursor-pointer items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      {/* Let AvatarImage handle the placeholder fallback natively */}
                                      <AvatarImage
                                        src={
                                          request.userId?.image ||
                                          '/placeholder.png'
                                        }
                                        alt={
                                          request.userId?.name || 'User Avatar'
                                        }
                                      />

                                      {/* Use AvatarFallback for text initials (e.g., "VC") as a final safety net */}
                                      <AvatarFallback className="text-xs font-medium uppercase text-slate-700">
                                        {request.userId?.name?.substring(
                                          0,
                                          2
                                        ) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>

                                    <span className="font-medium">
                                      {request.userId?.firstName}{' '}
                                      {request.userId?.lastName}
                                    </span>
                                    <Info className="h-4 w-4 text-gray-400" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Leave Type */}
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer">
                                    {request.holidayType}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Leave Date */}
                            <TableCell className="text-sm">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    {formatDate(request.startDate)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-sm">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    {formatDate(request.endDate)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer">
                                    {request.totalDays}d ({request.totalHours}h)
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Title */}
                            <TableCell className="max-w-xs truncate">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <div className="text-sm text-gray-500">
                                      {request.reason}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs p-3"
                                >
                                  <LeaveTooltipContent request={request} />
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Duration */}

                            {/* Status */}
                            <TableCell>
                              <Badge
                                className={`
                    ${request.status === 'pending' ? 'bg-yellow-500 text-white hover:bg-yellow-500' : ''}
                    ${request.status === 'approved' ? 'bg-green-500 text-white hover:bg-green-500' : ''}
                    ${request.status === 'rejected' ? 'bg-red-500 text-white hover:bg-red-500' : ''}
                  `}
                              >
                                {request.status}
                              </Badge>
                            </TableCell>

                            {/* Action */}
                            <TableCell className="flex justify-end gap-2 text-right">
                              {request.status === 'pending' ? (
                                <>
                                  <Button
                                    size="icon"
                                    onClick={() => {
                                      setSelectedRequestId(request._id);
                                      setShowApproveConfirmModal(true);
                                    }}
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedRequestId(request._id);
                                      setShowRejectConfirmModal(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 text-white" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {leaves.length > 30 && (
                    <>
                      <DynamicPagination
                        pageSize={entriesPerPage}
                        setPageSize={setEntriesPerPage}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Individual Approve Confirmation Modal */}
            <Dialog
              open={showApproveConfirmModal}
              onOpenChange={setShowApproveConfirmModal}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Approval</DialogTitle>
                </DialogHeader>
                <p>How would you like to approve this leave request?</p>

                {/* Radio Group for Paid vs Unpaid */}
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="leaveType"
                      value="paid"
                      defaultChecked
                      className="h-4 w-4"
                      ref={(el) => (radioRefs.current.paid = el)}
                    />
                    <span>Authorized Paid Leave</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="leaveType"
                      value="unpaid"
                      className="h-4 w-4"
                      ref={(el) => (radioRefs.current.unpaid = el)}
                    />
                    <span>Authorized Unpaid Leave</span>
                  </label>
                </div>

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      if (selectedRequestId) {
                        const leaveType =
                          radioRefs.current.unpaid?.checked === true
                            ? 'unpaid'
                            : 'paid';

                        // Pass action with type
                        handleIndividualAction(
                          selectedRequestId,
                          'approved',
                          leaveType
                        );
                      }
                      setShowApproveConfirmModal(false);
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Individual Reject Confirmation Modal */}
            <Dialog
              open={showRejectConfirmModal}
              onOpenChange={setShowRejectConfirmModal}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Rejection</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to reject this leave request?</p>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      if (selectedRequestId) {
                        handleIndividualAction(selectedRequestId, 'rejected');
                      }
                      setShowRejectConfirmModal(false);
                    }}
                    variant="destructive"
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default CompanyLeaveApprovalPage;
