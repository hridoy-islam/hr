import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Download,
  Check
} from 'lucide-react';
import Select from 'react-select';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeImage: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  applyDate: string;
  title: string;
  hours: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  description: string;
}

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employeeName: 'Sarah Johnson',
    employeeImage:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    leaveType: 'Personal Day',
    startDate: '2025-06-02',
    endDate: '2025-06-02',
    applyDate: '2025-05-15',
    title: 'Personal Day',
    hours: '07:30',
    status: 'Pending',
    description: 'Personal appointment'
  },
  {
    id: 2,
    employeeName: 'Michael Chen',
    employeeImage:
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    leaveType: 'Vacation',
    startDate: '2025-07-15',
    endDate: '2025-07-19',
    applyDate: '2025-06-01',
    title: 'Summer Vacation',
    hours: '37:30',
    status: 'Pending',
    description: 'Family vacation to Europe'
  },
  {
    id: 3,
    employeeName: 'Emily Rodriguez',
    employeeImage:
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    leaveType: 'Sick Leave',
    startDate: '2025-06-10',
    endDate: '2025-06-12',
    applyDate: '2025-06-09',
    title: 'Medical Leave',
    hours: '22:30',
    status: 'Pending',
    description: 'Medical treatment required'
  },
  {
    id: 4,
    employeeName: 'David Thompson',
    employeeImage:
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    leaveType: 'Family Leave',
    startDate: '2025-08-01',
    endDate: '2025-08-03',
    applyDate: '2025-07-10',
    title: 'Family Emergency',
    hours: '22:30',
    status: 'Pending',
    description: 'Family emergency situation'
  },
  {
    id: 5,
    employeeName: 'Lisa Wang',
    employeeImage:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    leaveType: 'Vacation',
    startDate: '2025-09-05',
    endDate: '2025-09-09',
    applyDate: '2025-08-15',
    title: 'Wedding Anniversary',
    hours: '37:30',
    status: 'Pending',
    description: 'Anniversary celebration trip'
  }
];

const LeaveApprovalPage: React.FC = () => {
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({
    start: '2024-07-01',
    end: '2025-07-31'
  });
  const [selectedUser, setSelectedUser] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const uniqueEmployees = Array.from(
    new Set(mockLeaveRequests.map((req) => req.employeeName))
  );

  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );

  const userOptions = [
    { value: 'all', label: 'All Users' },
    ...uniqueEmployees.map((name) => ({ value: name, label: name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const handleApproveAllClick = () => {
    if (selectedRequests.length > 0) {
      setShowApproveModal(true);
    }
  };

  const handleRejectAllClick = () => {
    if (selectedRequests.length > 0) {
      setShowRejectModal(true);
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesUser =
        !selectedUser ||
        selectedUser.value === 'all' ||
        request.employeeName === selectedUser.value;
      const matchesSearch =
        !searchTerm ||
        request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());

      const requestDate = new Date(request.startDate);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const matchesDateRange =
        requestDate >= startDate && requestDate <= endDate;

      return matchesUser && matchesSearch && matchesDateRange;
    });
  }, [leaveRequests, selectedUser, searchTerm, dateRange]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(paginatedRequests.map((req) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: number, checked: boolean) => {
    setSelectedRequests((prev) =>
      checked ? [...prev, requestId] : prev.filter((id) => id !== requestId)
    );
  };

  const handleApproveAll = () => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        selectedRequests.includes(req.id) ? { ...req, status: 'Approved' } : req
      )
    );
    setSelectedRequests([]);
  };

  const handleRejectAll = () => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        selectedRequests.includes(req.id) ? { ...req, status: 'Rejected' } : req
      )
    );
    setSelectedRequests([]);
  };

  const handleIndividualAction = (
    requestId: number,
    action: 'Approved' | 'Rejected'
  ) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: action } : req
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={statusStyles[status] || ''}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-supperagent" />
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Date Range */}
  <div className="w-full">
    <Label className="text-sm font-medium text-gray-700">Select Date Range:</Label>
    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center col-span-2">
      <Input
        type="date"
        className="w-full min-w-0"
        value={dateRange.start}
        onChange={(e) =>
          setDateRange((prev) => ({ ...prev, start: e.target.value }))
        }
      />
      <span className="text-center text-gray-500">to</span>
      <Input
        type="date"
        className="w-full min-w-0"
        value={dateRange.end}
        onChange={(e) =>
          setDateRange((prev) => ({ ...prev, end: e.target.value }))
        }
      />
    </div>
  </div>

  {/* User Select */}
  <div className="w-full">
    <Label className="text-sm font-medium text-gray-700">Select User:</Label>
    <div className="mt-1">
      <Select
        value={selectedUser}
        onChange={(option) => setSelectedUser(option)}
        options={userOptions}
        placeholder="Select user..."
        className="w-full"
      />
    </div>
  </div>

  {/* Status Select */}
  <div className="w-full">
    <Label className="text-sm font-medium text-gray-700">Select Status:</Label>
    <div className="mt-1">
      <Select
        value={selectedStatus}
        onChange={(option) => setSelectedStatus(option)}
        options={statusOptions}
        placeholder="Select status"
        className="w-full"
      />
    </div>
  </div>

  {/* Search Button */}
  <div className="flex items-end w-full">
    <Button className="w-full bg-supperagent text-white hover:bg-supperagent/90">
      <Search className="mr-2 h-4 w-4" />
      Search
    </Button>
  </div>
</div>


          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button
                onClick={handleApproveAllClick}
                disabled={selectedRequests.length === 0}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All
              </Button>

              <Button
                onClick={handleRejectAllClick}
                disabled={selectedRequests.length === 0}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject All
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedRequests.length === paginatedRequests.length &&
                        paginatedRequests.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Leave Date</TableHead>
                  <TableHead>Apply Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-gray-500"
                    >
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRequest(request.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={request.employeeImage}
                              alt={request.employeeName}
                            />
                            <AvatarFallback>
                              {request.employeeName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {request.employeeName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{request.leaveType}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(request.startDate)}</div>
                          {request.startDate !== request.endDate && (
                            <div className="text-gray-500">
                              to {formatDate(request.endDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(request.applyDate)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{request.title}</div>
                          <div className="truncate text-sm text-gray-500">
                            {request.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {calculateDuration(
                              request.startDate,
                              request.endDate
                            )}
                          </div>
                          <div className="text-gray-500">{request.hours}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="flex justify-end gap-2 text-right">
                        {request.status === 'Pending' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequestId(request.id);
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
                                setSelectedRequestId(request.id);
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
            {/* Confirm Approve Modal */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Approval</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to approve all selected leave requests?
                </p>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      handleApproveAll();
                      setShowApproveModal(false);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirm Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Rejection</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to reject all selected leave requests?
                </p>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      handleRejectAll();
                      setShowRejectModal(false);
                    }}
                    variant="destructive"
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                      if (selectedRequestId !== null) {
                        handleIndividualAction(selectedRequestId, 'Approved');
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
                      if (selectedRequestId !== null) {
                        handleIndividualAction(selectedRequestId, 'Rejected');
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
          </div>

          {/* Pagination */}
          <DynamicPagination
            pageSize={pageSize}
            setPageSize={(size: number) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveApprovalPage;
