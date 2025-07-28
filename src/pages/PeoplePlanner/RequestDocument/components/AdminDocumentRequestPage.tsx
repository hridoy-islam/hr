import React, { useState } from 'react';
import { DocumentRequest } from '@/types/DocumentTypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Check, X, FileUp, FileCog2, Building2, Calendar, CheckCircle, FileText, MessageSquare, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const AdminDocumentRequestPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DocumentRequest[]>([
    {
      id: '1',
      staffId: 'STAFF001',
      staffName: 'John Smith',
      staffEmail: 'john.smith@company.com',
      department: 'Care Services',
      documentType: 'payslip',
      requestDate: '2025-01-10',
      status: 'pending',
      reason: 'Required for bank loan application'
    },
    {
      id: '2',
      staffId: 'STAFF002',
      staffName: 'Alice Johnson',
      staffEmail: 'alice.johnson@company.com',
      department: 'Nursing',
      documentType: 'experience-letter',
      requestDate: '2025-01-08',
      status: 'pending',
      reason: 'Job application'
    },
    {
      id: '3',
      staffId: 'STAFF003',
      staffName: 'Michael Brown',
      staffEmail: 'michael.brown@company.com',
      department: 'Administration',
      documentType: 'appointment-letter',
      requestDate: '2025-01-05',
      status: 'approved',
      adminNotes: 'Document sent via email',
      approvedBy: 'Admin User',
      approvedDate: '2025-01-06',
      documentUrl: '/documents/appointment-michael-brown.pdf',
            reason: 'Job application'

    }
  ]);

  const [selectedRequest, setSelectedRequest] =
    useState<DocumentRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
const [selectedDetailRequest, setSelectedDetailRequest] = useState<DocumentRequest | null>(null);

  const handleAction = (
    request: DocumentRequest,
    actionType: 'approve' | 'reject'
  ) => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNotes('');
    setDocumentFile(null);
  };

  const submitAction = () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map((req) => {
      if (req.id === selectedRequest.id) {
        const updatedRequest: DocumentRequest = {
          ...req,
          status: action === 'approve' ? 'approved' : 'rejected',
          adminNotes,
          approvedBy: 'Admin User',
          approvedDate: new Date().toISOString().split('T')[0],
          ...(action === 'approve' &&
            documentFile && {
              documentUrl: URL.createObjectURL(documentFile)
            })
        };
        return updatedRequest;
      }
      return req;
    });

    setRequests(updatedRequests);
    setSelectedRequest(null);
    setAction(null);

    toast({
      title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
      description: `The document request has been ${action === 'approve' ? 'approved' : 'rejected'}.`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Document Requests Management</h1>
        <p className="text-muted-foreground">
          Review and manage staff document requests
        </p>
      </div>

      <div className="rounded-md  bg-white p-2 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} className="hover:bg-gray-100">
                <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {request.staffName}
</TableCell>
<TableCell className="cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {request.department}
</TableCell>
<TableCell className="capitalize cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {request.documentType.replace('-', ' ')}
</TableCell>
<TableCell className="cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {request.requestDate}
</TableCell>
<TableCell className="max-w-[200px] truncate cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {request.reason}
</TableCell>
<TableCell className="cursor-pointer" onClick={() => setSelectedDetailRequest(request)}>
  {getStatusBadge(request.status)}
</TableCell>

                <TableCell className="flex justify-end">
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction(request, 'approve')}
                                              className='bg-supperagent text-white hover:bg-supperagent/90'

                      >
                        <Check className=" h-4 w-4 text-white" />
                        {/* Approve */}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction(request, 'reject')}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        <X className=" h-4 w-4 text-white" />
                        {/* Reject */}
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && request.documentUrl && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(request.documentUrl, '_blank')}
                      className='bg-supperagent text-white hover:bg-supperagent/90'
                    >
                      <FileUp className=" h-4 w-4" />
                      View Document
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!action && !!selectedRequest}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'Upload the document and add any notes'
                : 'Provide a reason for rejecting this request'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'approve' && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Upload Document
                </label>
                <Input type="file" onChange={handleFileChange} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload the requested document file
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                {action === 'approve' ? 'Notes' : 'Reason for Rejection'}
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Add any additional notes...'
                    : 'Explain why this request is being rejected...'
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitAction}
                disabled={action === 'approve' && !documentFile}
              >
                {action === 'approve' ? 'Approve' : 'Reject'} Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

     <Dialog
  open={!!selectedDetailRequest}
  onOpenChange={(open) => !open && setSelectedDetailRequest(null)}
>
  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
    <DialogHeader className="flex flex-row justify-between items-center">
      <div>
        <DialogTitle className="text-xl font-semibold">Document Request Details</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Full details of the selected document request
        </p>
      </div>
      
    </DialogHeader>

    {selectedDetailRequest && (
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Staff Information</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.staffName} (ID: {selectedDetailRequest.staffId})</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.staffEmail}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Department</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.department}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Document Type</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.documentType}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Request Date</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.requestDate}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Reason</p>
            <p className="text-sm text-muted-foreground">{selectedDetailRequest.reason}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              selectedDetailRequest.status === 'Approved' 
                ? 'bg-green-100 text-green-800' 
                : selectedDetailRequest.status === 'Rejected' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {selectedDetailRequest.status}
            </span>
          </div>
        </div>

        {selectedDetailRequest.adminNotes && (
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Admin Notes</p>
              <p className="text-sm text-muted-foreground">{selectedDetailRequest.adminNotes}</p>
            </div>
          </div>
        )}

        {selectedDetailRequest.documentUrl && (
          <div className="flex items-start gap-3 pt-2">
            <FileCog2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Document</p>
              <a
                href={selectedDetailRequest.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                View Document
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
};

export default AdminDocumentRequestPage;
