import React, { useState, useRef } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

// Define Request Interface
interface DocumentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  documentType: string;
  reason: string;
  requestedDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedPdfUrl?: string;
}

// Demo Data
const demoRequests: DocumentRequest[] = [
  {
    id: 'REQ001',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Information Technology',
    designation: 'Senior Developer',
    documentType: 'Experience Letter',
    reason: 'For new job application',
    requestedDate: new Date('2025-03-10'),
    status: 'pending',
  },
  {
    id: 'REQ002',
    employeeId: 'EMP005',
    employeeName: 'Sarah Wilson',
    department: 'Finance',
    designation: 'Accountant',
    documentType: 'Salary Certificate',
    reason: 'Loan application',
    requestedDate: new Date('2025-03-11'),
    status: 'pending',
  },
  {
    id: 'REQ003',
    employeeId: 'EMP008',
    employeeName: 'David Kim',
    department: 'Human Resources',
    designation: 'HR Executive',
    documentType: 'No Objection Certificate (NOC)',
    reason: 'Visa processing',
    requestedDate: new Date('2025-03-12'),
    status: 'pending',
  },
];

const RequestDocumentPage = () => {
  const [requests, setRequests] = useState<DocumentRequest[]>(demoRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only pending requests
  const pendingRequests = requests.filter((req) => req.status === 'pending');

  const filteredRequests = pendingRequests.filter(
    (req) =>
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + entriesPerPage);

  // Handlers
  const handleApproveClick = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'rejected' } : req))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleApproveWithPdf = () => {
    if (!selectedRequest || !pdfFile) return;

    setLoading(true);

    // Simulate upload delay
    setTimeout(() => {
      const pdfUrl = URL.createObjectURL(pdfFile);

      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? { ...req, status: 'approved', approvedPdfUrl: pdfUrl }
            : req
        )
      );

      setLoading(false);
      setShowApproveDialog(false);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleDownloadSample = (request: DocumentRequest) => {
    // In real app, this would download a pre-filled template
    alert(`Downloading draft ${request.documentType} for ${request.employeeName}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 ">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Requests</h1>
          </div>
          
        </div>

      

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Pending Requests
          </h2>

          {currentRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
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
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{req.employeeName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{req.documentType}</span>
                      </TableCell>
                      <TableCell className="text-gray-600">{req.department}</TableCell>
                      <TableCell className="text-gray-600">
                        {req.requestedDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                       
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveClick(req)}
                          className="text-white  hover:bg-supperagent/90 bg-supperagent"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRejectClick(req.id)}
                          className="text-white  hover:bg-destructive/90 bg-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
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
              <strong>{selectedRequest?.employeeName}</strong> for a{' '}
              <strong>{selectedRequest?.documentType}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label>Reason</Label>
              <p className="text-sm text-gray-600 mt-1">{selectedRequest?.reason}</p>
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
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Upload className="h-4 w-4 mr-1" />
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
    </div>
  );
};

export default RequestDocumentPage;