import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';

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

const LeaveApprovalPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const res = await axiosInstance.get('/hr/leave?status=pending');
        const fetchedLeaves: LeaveRequest[] = res.data.data.result;
        setLeaves(fetchedLeaves);
      } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Unable to load leave requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  const handleIndividualAction = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const res = await axiosInstance.patch(`/hr/leave/${id}`, { status });

      setLeaves((prev) => prev.filter((req) => req._id !== id));
      toast({ title: 'Leave request updated successfully' });
    } catch (err) {
      console.error('Error updating leave status:', err);
      toast({
        title: 'Unable to update leave status. Please try again later.'
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
const LeaveTooltipContent = ({ request }: { request: LeaveRequest }) => {
  const [allowance, setAllowance] = useState<{
    holidayAllowance: number;
    usedHours: number;
    remainingHours: number;
    requestedHours: number;
    totalHours: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentYear = `${moment().format('YYYY')}-${moment().add(1, 'year').format('YYYY')}`; // Match your app's current year logic

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!request.userId?._id) return;
      try {
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
          setAllowance({
            holidayAllowance: record.holidayAllowance || 0,
            usedHours: record.usedHours || 0,
            remainingHours: record.remainingHours || 0,
            requestedHours: record.requestedHours || 0,
            totalHours: record.totalHours || 0
          });
        } else {
          setAllowance({
            holidayAllowance: 0,
            usedHours: 0,
            remainingHours: 0,
            requestedHours: 0,
            totalHours: 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch leave allowance for tooltip:', err);
       
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
        <h4 className="font-semibold text-blue-900">Leave Allowance ({currentYear})</h4>
        {loading ? (
          <div className="flex justify-center py-2">
            <BlinkingDots size="small" color="bg-blue-600" />
          </div>
        ) : allowance ? (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Opening:</span>
              <span className="font-medium">{allowance.holidayAllowance.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Holiday Accured:</span>
              <span className="font-medium">{allowance.totalHours.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taken:</span>
              <span className="font-medium text-green-600">{allowance.usedHours.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Requested:</span>
              <span className="font-medium text-yellow-600">{allowance.requestedHours.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-blue-600">
              <span>Remaining:</span>
              <span>{allowance.remainingHours.toFixed(1)} h</span>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-700" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <BlinkingDots size="large" color="bg-supperagent" />
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
                            <TableCell
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex cursor-pointer items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={request.userId?.image}
                                        alt={request.userId?.name}
                                      />
                                      <AvatarFallback>
                                        {request.userId?.firstName[0]}
                                        {request.userId?.lastName[0]}
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
                            <TableCell
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
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
                            <TableCell
                              className="text-sm"
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
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
                            <TableCell
                              className="text-sm"
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
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
                             <TableCell
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
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
                            <TableCell
                              className="max-w-xs truncate"
                              onClick={() =>
                                navigate(
                                  `/admin/hr/employee/${request.userId._id}`
                                )
                              }
                            >
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
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequestId(request._id);
                                      setShowApproveConfirmModal(true);
                                    }}
                                    className="h-8 bg-green-600 px-2 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedRequestId(request._id);
                                      setShowRejectConfirmModal(true);
                                    }}
                                    className="h-8 px-2"
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
                <p>Are you sure you want to approve this leave request?</p>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      if (selectedRequestId) {
                        handleIndividualAction(selectedRequestId, 'approved');
                      }
                      setShowApproveConfirmModal(false);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
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

export default LeaveApprovalPage;
