import React, { useEffect, useState, useMemo } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import ReactSelect from 'react-select';

const getInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SignatureDoc() {
  const { toast } = useToast();
  const { id: companyId } = useParams();

  const [documents, setDocuments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);


  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: entriesPerPage,
        companyId: companyId
      };

     

      const url =`/signature-documents?${new URLSearchParams(params).toString()}`;

      const res = await axiosInstance.get(
        url
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
  }, [currentPage, entriesPerPage]);

  const handleDelete = async () => {
    if (!deleteIds || deleteIds.length === 0) return;
    try {
      // Use Promise.all to delete all grouped documents concurrently
      await Promise.all(
        deleteIds.map((id) =>
          axiosInstance.delete(`/signature-documents/${id}`)
        )
      );

      toast({
        title: 'Success',
        description: 'Grouped documents deleted successfully.'
      });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to delete some or all documents',
        variant: 'destructive'
      });
    } finally {
      setDeleteIds(null);
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
      setCompleteId(null);
    }
  };

  const displayedDocs = documents;

  // Grouping Logic - Merged into single rows
  const groupedDocs = useMemo(() => {
    const groups: Record<
      string,
      { content: string; approvers: any[]; docs: any[] }
    > = {};

    displayedDocs.forEach((doc) => {
      const content = doc.content || 'Untitled';

      const approverNames = (doc.approverIds || [])
        .map((a: any) => {
          const user = a.userId || a;
          return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        })
        .sort()
        .join(',');

      const key = `${content}|${approverNames}`;

      if (!groups[key]) {
        groups[key] = {
          content: content,
          approvers: doc.approverIds || [],
          docs: []
        };
      }
      groups[key].docs.push(doc);
    });

    return Object.values(groups);
  }, [displayedDocs]);

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
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
        <div className="flex flex-row items-center gap-4 ">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">
            Signature Documents
          </h2>
          {/* <div className="w-[350px]">
            <ReactSelect
              options={statusOptions}
              value={statusOptions.find(
                (opt) =>
                  opt.value === (statusFilter || 'pending,forwarded,submitted')
              )}
              onChange={(newValue) => {
                setStatusFilter(newValue?.value || '');
                setCurrentPage(1);
              }}
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
          </div> */}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-theme text-white hover:bg-theme/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Signature Request
          </Button>
        </div>
      </div>

      <div className="">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Recipients</TableHead>
              <TableHead className="font-semibold">Date Of Sending</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedDocs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-gray-800"
                >
                  No documents found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              groupedDocs.map((group, groupIndex) => {
                // Combine employee names
                const employeeNames = group.docs
                  .map((d) =>
                    `${d.employeeId?.firstName || ''} ${d.employeeId?.lastName || ''}`.trim()
                  )
                  .filter(Boolean)
                  .join(', ');

                // Combine approver names
                const approverNames = group.approvers
                  .map((a: any) => {
                    const user = a.userId || a;
                    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
                  })
                  .filter(Boolean)
                  .join(', ');

                const representativeDoc = group.docs[0];

                return (
                  <TableRow key={`group-${groupIndex}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="font-medium text-gray-900">
                          {group.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[250px]  text-sm font-medium text-gray-900"
                      title={employeeNames}
                    >
                      {employeeNames || 'N/A'}
                    </TableCell>

                    <TableCell className="text-sm text-gray-800">
                      {moment(representativeDoc.createdAt).format(
                        'MMM DD, YYYY'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const docIds = group.docs
                              .map((d) => d._id)
                              .join(',');
                            const encodedContent = encodeURIComponent(
                              group.content
                            );
                            navigate(
                              `details?ids=${docIds}&content=${encodedContent}`
                            );
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" /> Check Progress
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            // Map through group.docs to collect all IDs in this group
                            const idsToDelete = group.docs.map((d) => d._id);
                            setDeleteIds(idsToDelete);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {createDialogOpen && (
        <SendDocumentDialog
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            fetchDocuments();
          }}
        />
      )}

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

      <AlertDialog
        open={!!deleteIds}
        onOpenChange={(open) => !open && setDeleteIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <strong> all {deleteIds?.length} document(s)</strong> in this group from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
