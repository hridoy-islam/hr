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

  const {toast} = useToast();

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
      toast({title:'Unable to update leave status. Please try again later.'});
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

  const LeaveTooltipContent = ({ request }: { request: LeaveRequest }) => (
    <div className="max-w-xs space-y-3 rounded-lg bg-white p-3 shadow-md">
      <div className="flex items-center space-x-2">
        <User className="text-gray-500" />
        <span className="font-semibold">
          {request.userId.firstName} {request.userId.lastName}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Calendar className="text-gray-500" />
        <span>
          <strong>Type:</strong> {request.holidayType}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Clock className="text-gray-500" />
        <span>
          <strong>Duration:</strong> {request.totalDays}d ({request.totalHours}
          h)
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <CheckCircle className="text-gray-500" />
        <span>
          <strong>Status:</strong>
          <Badge
            className={`
          ${request.status === 'pending' ? 'bg-yellow-500 text-white' : ''}
          ${request.status === 'approved' ? 'bg-green-500 text-white' : ''}
          ${request.status === 'rejected' ? 'bg-red-500 text-white' : ''}
        `}
          >
            {request.status}
          </Badge>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <AlertCircle className="text-gray-500" />
        <span>
          <strong>Reason:</strong> {request.reason}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Calendar className="text-gray-500" />
        <span>
          <strong>Period:</strong> {formatDate(request.startDate)} –{' '}
          {formatDate(request.endDate)}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Calendar className="text-gray-500" />
        <span>
          <strong>Applied:</strong> {formatDateTime(request.createdAt)}
        </span>
      </div>
    </div>
  );
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
            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              {selectedRequests.length > 0 && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setShowApproveModal(true)}
                  >
                    Approve Selected ({selectedRequests.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject Selected ({selectedRequests.length})
                  </Button>
                </>
              )}
            </div>

            {/* Table */}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Leave Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
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
                      <TableRow key={request._id} className="hover:bg-gray-50">
                        {/* Employee */}
                        <TableCell
                          onClick={() =>
                            navigate(`/admin/hr/employee/${request.userId._id}`)
                          }
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex cursor-pointer items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={request.userId?.image}
                                    alt={request.userId.name}
                                  />
                                  <AvatarFallback>
                                    {request.userId.firstName[0]}
                                    {request.userId.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {request.userId.firstName}{' '}
                                  {request.userId.lastName}
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
                            navigate(`/admin/hr/employee/${request.userId._id}`)
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
                            navigate(`/admin/hr/employee/${request.userId._id}`)
                          }
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                {formatDate(request.startDate)}
                                {request.startDate !== request.endDate && (
                                  <div className="text-gray-500">
                                    to {formatDate(request.endDate)}
                                  </div>
                                )}
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

                        {/* Title */}
                        <TableCell
                          className="max-w-xs truncate"
                          onClick={() =>
                            navigate(`/admin/hr/employee/${request.userId._id}`)
                          }
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <div className="font-medium">
                                  {request.title}
                                </div>
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
                        <TableCell
                          onClick={() =>
                            navigate(`/admin/hr/employee/${request.userId._id}`)
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

                        {/* Status */}
                        <TableCell>
                          <Badge
                            className={`
                    ${request.status === 'pending' ? 'bg-yellow-500 text-white' : ''}
                    ${request.status === 'approved' ? 'bg-green-500 text-white' : ''}
                    ${request.status === 'rejected' ? 'bg-red-500 text-white' : ''}
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
