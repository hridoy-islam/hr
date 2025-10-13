// components/HolidayRequestsCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check, XCircle, Info, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';

// ===== Interfaces =====
interface Employee {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  image?: string;
}

export interface HolidayRequest {
  _id: string;
  holidayYear: string;
  userId: Employee;
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

interface AllowanceData {
  openingThisYear: number;
  holidayAccured: number;
  taken: number;
  requested: number;
  remainingHours: number;
  unpaidLeaveRequest: number;
  unpaidLeaveTaken: number;
  leftThisYear: number;
}

// ===== Tooltip Content =====
const LeaveTooltipContent = ({ request }: { request: HolidayRequest }) => {
  const [allowance, setAllowance] = useState<AllowanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const currentYear = `${moment().format('YYYY')}-${moment().add(1, 'year').format('YYYY')}`;

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!request.userId?._id) return;

      try {
        const res = await axiosInstance.get(
          `/hr/holidays?userId=${request.userId._id}&year=${currentYear}`
        );

        const data = res.data.data?.result ;
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
        console.error('Failed to fetch leave allowance:', err);
        toast({
          title: 'Error',
          description: 'Could not load leave allowance',
          variant: 'destructive'
        });
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
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-gray-500" />
        <span className="font-semibold">
          {request.userId?.firstName} {request.userId?.lastName}
        </span>
      </div>
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
              <span className="font-medium">{allowance.openingThisYear.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Holiday Accrued:</span>
              <span className="font-medium">{allowance.holidayAccured.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taken (Paid):</span>
              <span className="font-medium text-green-600">{allowance.taken.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Requested (Pending):</span>
              <span className="font-medium text-yellow-600">{allowance.requested.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unpaid Taken:</span>
              <span className="font-medium text-red-600">{allowance.unpaidLeaveTaken.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unpaid Requested:</span>
              <span className="font-medium text-red-600">{allowance.unpaidLeaveRequest.toFixed(1)} h</span>
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

// ===== Main Card Component =====
interface HolidayRequestsCardProps {
  requests: HolidayRequest[];
  onRefresh: () => void; // To trigger re-fetch after approval/rejection
}

const HolidayRequestsCard: React.FC<HolidayRequestsCardProps> = ({
  requests,
  onRefresh,
}) => {
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null);
  const radioRefs = useRef<{
    paid: HTMLInputElement | null;
    unpaid: HTMLInputElement | null;
  }>({ paid: null, unpaid: null });
  const { toast } = useToast();

  const handleIndividualAction = async (
    id: string,
    status: 'approved' | 'rejected',
    leaveType?: 'paid' | 'unpaid'
  ) => {
    try {
      const payload: any = { status };
      if (status === 'approved' && leaveType) {
        payload.leaveType = leaveType;
      }

      await axiosInstance.patch(`/hr/leave/${id}`, payload);
      toast({ title: 'Leave request updated successfully' });
      onRefresh(); // Refresh parent data
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="bg-gradient-to-r from-supperagent/70 to-supperagent px-6 py-4">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-white mr-3" />
            <h2 className="text-xl font-semibold text-white">Pending Holiday Requests</h2>
            <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
              {requests.length}
            </span>
          </div>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Employee</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Reason</th>

                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Dates</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Hours</th>
                    <th className="py-3 px-2 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center cursor-pointer">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={request.userId.image} />
                                <AvatarFallback>
                                  {request.userId.firstName[0]}
                                  {request.userId.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {request.userId.firstName} {request.userId.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{request.holidayType}</div>
                              </div>
                              <Info className="h-4 w-4 text-gray-400 ml-2" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs p-3">
                            <LeaveTooltipContent request={request} />
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-4 px-2 text-sm">
                        {request?.reason}
                      </td>
                      <td className="py-4 px-2 text-sm">
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </td>
                      <td className="py-4 px-2">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                          {request.totalHours}h
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex space-x-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveConfirmModal(true);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center"
                          >
                            <Check className="h-4 w-4 " />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectConfirmModal(true);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center"
                          >
                            <XCircle className="h-4 w-4 " />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approve Modal */}
        <Dialog open={showApproveConfirmModal} onOpenChange={setShowApproveConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Approval</DialogTitle>
            </DialogHeader>
            <p>How would you like to approve this leave request?</p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center space-x-2">
                <input type="radio" name="leaveType" value="paid" defaultChecked className="h-4 w-4" ref={(el) => (radioRefs.current.paid = el)} />
                <span>Authorized Paid Leave</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="leaveType" value="unpaid" className="h-4 w-4" ref={(el) => (radioRefs.current.unpaid = el)} />
                <span>Authorized Unpaid Leave</span>
              </label>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (selectedRequest) {
                    const leaveType = radioRefs.current.unpaid?.checked ? 'unpaid' : 'paid';
                    handleIndividualAction(selectedRequest._id, 'approved', leaveType);
                    setShowApproveConfirmModal(false);
                  }
                }}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectConfirmModal} onOpenChange={setShowRejectConfirmModal}>
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
                variant="destructive"
                onClick={() => {
                  if (selectedRequest) {
                    handleIndividualAction(selectedRequest._id, 'rejected');
                    setShowRejectConfirmModal(false);
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default HolidayRequestsCard;