import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  User,
  Clock,
  Search,
  Check,
  X,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import moment from 'moment';

// Define Interfaces
interface DocumentRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    departmentId: {
      _id: string;
      departmentName: string;
    };
    designationId: {
      _id: string;
      title: string;
    };
  };
  documentType: string;
  reason: string;
  requestDate: string | Date;
  status: RequestStatus;
  approvedPdfUrl?: string;
  startDate?: Date;
  endDate?: Date;
}

type RequestStatus = 'pending' | 'approved' | 'rejected';

const documentTypes = [
  'Attendance Report',
  'Employment Certificate',
  'Tax Certificate',
  'Reference Letter',
  'Salary Certificate',
  'Experience Letter',
  'Increment Letter',
  'Promotion Letter',
];

const RequestDocumentPage = () => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch pending requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axiosInstance.get('/hr/request-document', {
          params: {
            status: 'pending',
            limit: 'all',
          },
        });
        setRequests(response.data.data?.result || []);
      } catch (error) {
        console.error('Failed to fetch document requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const pendingRequests = requests.filter((req) => req.status === 'pending');

  // Search filter
  const filteredRequests = pendingRequests.filter(
    (req) =>
      req.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userId._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userId.departmentId.departmentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + entriesPerPage);

  // Handle approve click
  const handleApproveClick = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  // Open reject confirmation dialog
  const handleRejectConfirm = (id: string) => {
    setRejectId(id);
    setShowRejectDialog(true);
  };

  // Confirm rejection
  const handleRejectConfirmed = async () => {
    if (!rejectId) return;

    try {
      await axiosInstance.patch(`/hr/request-document/${rejectId}`, {
        status: 'rejected',
      });

      setRequests((prev) =>
        prev.map((req) => (req._id === rejectId ? { ...req, status: 'rejected' } : req))
      );

      // Close dialog
      setShowRejectDialog(false);
      setRejectId(null);
    } catch (error) {
      console.error('Failed to reject document request:', error);
      alert('Failed to reject request. Please try again.');
      setShowRejectDialog(false);
      setRejectId(null);
    }
  };

  // Handle file change for PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  // Handle approve with PDF upload
  const handleApproveWithPdf = async () => {
    if (!selectedRequest || !pdfFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('status', 'approved');
      formData.append('document', pdfFile);

      const response = await axiosInstance.patch(
        `/hr/request-document/${selectedRequest._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const approvedPdfUrl =
        response.data.data?.approvedPdfUrl || response.data.data?.documentUrl;

      setRequests((prev) =>
        prev.map((req) =>
          req._id === selectedRequest._id
            ? { ...req, status: 'approved', approvedPdfUrl }
            : req
        )
      );

      setShowApproveDialog(false);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Failed to approve document request:', error);
      const message =
        error.response?.data?.message || 'Approval failed. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle download sample
  const handleDownloadSample = (request: DocumentRequest) => {
    alert(`Downloading draft ${request.documentType} for ${request.userId.firstName}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Requests</h1>
            <p className="text-gray-600">Manage employee document approval workflow.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, ID, department, or document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileText className="h-6 w-6" />
            Pending Requests
          </h2>

          {currentRequests.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
              <p className="text-gray-500">All document requests have been processed.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRequests.map((req) => (
                    <TableRow key={req._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.userId.firstName} {req.userId.lastName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{req.documentType}</span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {req.userId.departmentId.departmentName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(req.requestDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {req.startDate && req.endDate ? (
                          <span className="text-sm text-muted-foreground">
                            {moment(req.startDate).format('DD MMM, YYYY')} -{' '}
                            {moment(req.endDate).format('DD MMM, YYYY')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveClick(req)}
                          className="bg-supperagent hover:bg-supperagent/90 text-white"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRejectConfirm(req._id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
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
            </>
          )}
        </div>
      </div>

      {/* Approve with PDF Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Document Request</DialogTitle>
            <DialogDescription>
              You are approving a request from{' '}
              <strong>
                {selectedRequest?.userId.firstName} {selectedRequest?.userId.lastName}
              </strong>{' '}
              for a <strong>{selectedRequest?.documentType}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Reason</Label>
              <p className="mt-1 text-sm text-gray-600">{selectedRequest?.reason}</p>
            </div>

            <div>
              <Label htmlFor="pdfUpload">Upload Final Document (PDF)</Label>
              <Input
                id="pdfUpload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {pdfFile && (
                <p className="mt-2 flex items-center text-sm text-green-600">
                  <Upload className="mr-1 h-4 w-4" />
                  {pdfFile.name}
                </p>
              )}
            </div>
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
              className="bg-supperagent hover:bg-supperagent/90 text-white"
            >
              {loading ? (
                <>
                  <BlinkingDots size="small" color="bg-white" /> Processing...
                </>
              ) : (
                'Approve & Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this document request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirmed}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestDocumentPage;