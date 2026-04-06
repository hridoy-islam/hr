import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Plus,
  FileText,
  Check,
  Forward,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Search,
  Eye,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { SendDocumentDialog } from './components/SendDocumentDialog';
import { useParams } from 'react-router-dom';
import ReactSelect from 'react-select';

const getInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
};

// ─────────────────────────────────────────────────────────────────────────────
// Document Details Dialog
// ─────────────────────────────────────────────────────────────────────────────
function DocumentDetailsDialog({
  doc,
  onClose
}: {
  doc: any;
  onClose: () => void;
}) {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 -top-8 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Document Details
            </h2>
            <p className="text-sm text-gray-800">
              Complete timeline and approval status.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 " />
          </Button>
        </div>

        <div className="grid max-h-[75vh] grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          {/* Left Column: General Info */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Document Info
              </h3>
              <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                <div>
                  <p className="mb-1 text-xs text-gray-800">
                    Instructions / Title
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.content}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs text-gray-800">Status</p>
                    <Badge className="capitalize">{doc.status}</Badge>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-800">Created At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {moment(doc.createdAt).format('MMM DD, YYYY')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
                  {doc.document &&
                    doc.document !== 'docusign-template-used' && (
                      <a
                        href={doc.document}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-theme hover:underline"
                      >
                        <Eye className="h-4 w-4" /> View Original Request
                      </a>
                    )}
                  {doc.signedDocument && (
                    <a
                      href={doc.signedDocument}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                    >
                      <FileSignature className="h-4 w-4" /> View Final Signed
                      PDF
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-800">
                Employee
              </h3>
              <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                <Avatar className="h-10 w-10 border border-white shadow-sm">
                  <AvatarFallback className="bg-theme/10 font-medium text-theme">
                    {getInitials(
                      doc.employeeId?.firstName,
                      doc.employeeId?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.employeeId?.firstName} {doc.employeeId?.lastName}
                  </p>
                  <p className="text-xs text-gray-800">
                    {doc.employeeId?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Approvers */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-800">
              Approval Workflow
            </h3>
            <div className="space-y-3">
              {doc.approverIds && doc.approverIds.length > 0 ? (
                doc.approverIds.map((approver: any) => {
                  const approverId =
                    typeof approver === 'string' ? approver : approver._id;

                  // Check if this approver ID exists in the signedByApprovers array
                  const hasSigned = doc.signedByApprovers?.some(
                    (signer: any) => {
                      const signerId =
                        typeof signer === 'string' ? signer : signer._id;
                      return signerId === approverId;
                    }
                  );

                  return (
                    <div
                      key={approverId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-gray-100">
                          <AvatarImage src={approver.image || '/user.png'} />
                          <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-600">
                            {getInitials(approver.firstName, approver.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {approver.firstName} {approver.lastName}
                          </p>
                          <p className="text-xs text-gray-800">
                            {approver.email}
                          </p>
                        </div>
                      </div>
                      <div>
                        {hasSigned ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80">
                            <CheckCircle className="mr-1 h-3 w-3" /> Signed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-600"
                          >
                            <Clock className="mr-1 h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50/80 p-6 text-center text-sm text-gray-800">
                  <Clock className="mb-2 h-8 w-8 text-gray-300" />
                  <p>No approvers assigned yet.</p>
                  <p className="mt-1 text-xs">
                    Use the "Forward" button to add managers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Forward Document Dialog Component
// ─────────────────────────────────────────────────────────────────────────────
function ForwardDocumentDialog({
  docId,
  companyId,
  onClose,
  onSuccess
}: {
  docId: string;
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyId) {
      // Fetch users
      axiosInstance
        .get(`/users?company=${companyId}&role=employee&limit=all`)
        .then((res) => setAuthorities(res.data.data.result || []))
        .catch((err) => console.error(err));
    }
  }, [companyId]);

  const filteredAuthorities = authorities.filter((user) =>
    `${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleToggleApprover = (userId: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const onSubmit = async () => {
    if (selectedApprovers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one authority.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/signature-documents/forward/${docId}`, {
        approverIds: selectedApprovers
      });

      toast({
        title: 'Success',
        description: 'Document forwarded to authorities successfully!'
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to forward document.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 -top-8 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Forward to Employee
            </h2>
            <p className="text-sm text-gray-800">
              Select employees to sign this document.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col space-y-4 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search staff..."
              className="h-9 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="h-[200px] space-y-1 overflow-y-auto p-2">
              {filteredAuthorities.map((user) => (
                <div
                  key={user._id}
                  className="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-50"
                  onClick={() => handleToggleApprover(user._id)}
                >
                  <Checkbox
                    checked={selectedApprovers.includes(user._id)}
                    onCheckedChange={() => handleToggleApprover(user._id)}
                  />
                  <Avatar className="h-7 w-7 border border-gray-100">
                    <AvatarImage
                      src={user.image || '/user.png'}
                      alt={user.firstName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-transparent">
                      <img
                        src="/user.png"
                        alt="fallback"
                        className="h-full w-full object-cover"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              ))}
              {filteredAuthorities.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-800">
                  No authorities found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || selectedApprovers.length === 0}
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Forward className="mr-2 h-4 w-4" />
            )}
            Forward Document
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SignatureDoc() {
  const { toast } = useToast();
  const { id: companyId } = useParams();

  const [documents, setDocuments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Status Filter State ('active' vs 'completed')
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null); // 🚀 NEW: State for Complete Dialog
  const [forwardDocId, setForwardDocId] = useState<string | null>(null);
  const [detailsDoc, setDetailsDoc] = useState<any | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    try {
      // 1. Base parameters
      const params: any = {
        page: currentPage,
        limit: entriesPerPage,
        companyId: companyId
      };

      // 2. Handle Status logic
      let statusQuery = '';
      if (statusFilter === 'completed') {
        params.status = 'completed';
      } else {
        // Create a manual string if your backend expects standard multi-query params
        // Results in: ?page=1&limit=50&status=pending&status=forwarded&status=submitted
        statusQuery = '&status=pending&status=forwarded&status=submitted';
      }

      // 3. Make the request
      // We append the statusQuery manually to the URL if it's the multi-status case
      const url =
        statusFilter === 'completed'
          ? '/signature-documents'
          : `/signature-documents?${new URLSearchParams(params).toString()}${statusQuery}`;

      const res = await axiosInstance.get(
        url,
        statusFilter === 'completed' ? { params } : {}
      );

      if (res.data?.success) {
        setDocuments(res.data.data.result || []);
        if (res.data.data.meta) {
          setTotalPages(res.data.data.meta.totalPage);
        }
      }
    } catch (error) {
      console.error('Error fetching signature documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, entriesPerPage, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await axiosInstance.delete(
        `/signature-documents/${deleteId}`
      );
      if (res.data?.success) {
        toast({
          title: 'Success',
          description: 'Document deleted successfully.'
        });
        fetchDocuments();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to delete document',
        variant: 'destructive'
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleMarkComplete = async () => {
    if (!completeId) return;
    try {
      await axiosInstance.patch(`/signature-documents/${completeId}`, {
        status: 'completed'
      });
      toast({ title: 'Success', description: 'Document marked as completed.' });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to mark as completed.',
        variant: 'destructive'
      });
    } finally {
      setCompleteId(null); // Close dialog
    }
  };

  // Filter out completed ones locally if we are in the "Active" tab
  // (Provides an extra layer of safety if the backend doesn't support $ne or array queries well)
  const displayedDocs =
    statusFilter === ''
      ? documents.filter((doc) => doc.status !== 'completed')
      : documents;

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="text-theme" />
      </div>
    );
  }
  const statusOptions = [
    {
      label: 'Documents Awaiting Action',
      value: 'pending,forwarded,submitted'
    },
    { label: 'Finalized Documents', value: 'completed' }
  ];
  return (
    <div className="space-y-6 rounded-md bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className='flex flex-row items-center gap-4 '>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">
            Signature Documents
          </h2>
           <div className="w-[350px]">
            <ReactSelect
              options={statusOptions}
              // Match the current statusFilter to the correct option object
              value={statusOptions.find(
                (opt) =>
                  opt.value === (statusFilter || 'pending,forwarded,submitted')
              )}
              onChange={(newValue) => {
                setStatusFilter(newValue?.value || '');
                setCurrentPage(1);
              }}
              // Customizing styles to match your theme
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#e5e7eb',
                  fontSize: '0.875rem',
                  minHeight: '38px',
                  borderRadius: '0.5rem',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#a1a1aa' }
                }),
                option: (base, state) => ({
                  ...base,
                  fontSize: '0.875rem',
                  backgroundColor: state.isSelected
                    ? '#0f172a'
                    : state.isFocused
                      ? '#f3f4f6'
                      : 'white',
                  color: state.isSelected ? 'white' : '#1f2937',
                  cursor: 'pointer'
                })
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
         
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-theme text-white hover:bg-theme/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Document
          </Button>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Document</TableHead>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Created At</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedDocs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-gray-800"
                >
                  No documents found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              displayedDocs.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div
                        className="max-w-[200px] truncate font-medium text-gray-900"
                        title={doc.content}
                      >
                        {doc.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {doc.employeeId?.name ||
                        `${doc.employeeId?.firstName} ${doc.employeeId?.lastName}`}
                    </div>
                    <div className="text-xs text-gray-800">
                      {doc.employeeId?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Status Display Logic */}
                    {doc.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80">
                        <CheckCircle className="mr-1 h-3 w-3" /> Completed
                      </Badge>
                    )}
                    {doc.status === 'submitted' && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80">
                        Signed
                      </Badge>
                    )}
                    {doc.status === 'forwarded' && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80">
                        Forwarded
                      </Badge>
                    )}
                    {doc.status === 'pending' && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-600"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-800">
                    {moment(doc.createdAt).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsDoc(doc)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> Details
                      </Button>

                      {/* Show Forward and Complete ONLY if status is submitted */}
                      {doc.status === 'submitted' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setForwardDocId(doc._id)}
                          >
                            Forward
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setCompleteId(doc._id)}
                          >
                            Complete
                          </Button>
                        </>
                      )}

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(doc._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {displayedDocs.length > 30 && (
        <DynamicPagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Dialog */}
      {createDialogOpen && (
        <SendDocumentDialog
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            fetchDocuments();
          }}
        />
      )}

      {/* Forward to Authority Dialog */}
      {forwardDocId && companyId && (
        <ForwardDocumentDialog
          docId={forwardDocId}
          companyId={companyId}
          onClose={() => setForwardDocId(null)}
          onSuccess={() => {
            setForwardDocId(null);
            fetchDocuments();
          }}
        />
      )}

      {/* Details Dialog */}
      {detailsDoc && (
        <DocumentDetailsDialog
          doc={detailsDoc}
          onClose={() => setDetailsDoc(null)}
        />
      )}

      {/* 🚀 NEW: Complete Confirmation */}
      <AlertDialog
        open={!!completeId}
        onOpenChange={(open) => !open && setCompleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will finalize the signature workflow. The document will be
              permanently marked as completed and no further signatures or
              forwards can be requested.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkComplete}
              className="bg-theme text-white hover:bg-theme/90"
            >
              Confirm Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
