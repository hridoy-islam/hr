import React, { useEffect, useState } from 'react';
import { Pen, Trash2, Plus, FileText, Check } from 'lucide-react';
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
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { SendDocumentDialog } from './components/SendDocumentDialog';

export default function SignatureDoc() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    try {
      // Added status: 'pending' to only fetch pending documents
      const response = await axiosInstance.get(`/signature-documents`, {
        params: { page: currentPage, limit: entriesPerPage, status: 'pending' }
      });
      setDocuments(response.data.data.result || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch signature documents',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, entriesPerPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axiosInstance.delete(`/signature-documents/${deleteId}`);
      toast({ title: 'Success', description: 'Document deleted successfully' });
      fetchDocuments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // Assuming your endpoint accepts a PATCH to update the status
      await axiosInstance.patch(`/signature-documents/${id}`, { status: 'completed' });
      toast({ title: 'Success', description: 'Document approved successfully!' });
      fetchDocuments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve document',
        variant: 'destructive'
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <BlinkingDots />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-white rounded-md shadow-md p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pending Signature Documents
          </h1>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-theme text-white hover:bg-theme/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Send Document to Staff
        </Button>
      </div>

      <div className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Signed Document</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-gray-500"
                >
                  No pending documents found.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">
                    {doc.employeeId?.firstName} {doc.employeeId?.lastName}
                  </TableCell>

                  <TableCell className="">
                    {moment(doc.createdAt).format('DD MMM, YYYY')}
                  </TableCell>
                  <TableCell className="">
                    {doc?.submittedAt
                      ? moment(doc.submittedAt).format('DD MMM, YYYY')
                      : '--'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.status === 'completed' ? 'default' : 'secondary'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={doc.document}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-theme hover:underline"
                    >
                      <FileText className="mr-1 h-4 w-4" /> View Doc
                    </a>
                  </TableCell>
                  <TableCell>
                    {doc?.submittedDoc ? (
                      <a
                        href={doc.submittedDoc}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-theme hover:underline"
                      >
                        <FileText className="mr-1 h-4 w-4" /> View Doc
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Not submitted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {/* Approve Button - Only shows if pending AND a document is submitted */}
                      {doc.status === 'pending' && doc.submittedDoc && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doc._id)}
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
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

      {documents.length > 60 && (
        <DynamicPagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* The Dialog */}
      {dialogOpen && (
        <SendDocumentDialog
          onClose={() => setDialogOpen(false)}
          onSuccess={() => {
            setDialogOpen(false);
            fetchDocuments(); // Refresh table after sending
          }}
        />
      )}

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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}