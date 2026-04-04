import React, { useEffect, useState } from 'react';
import { Trash2, Plus, FileText, Check, ExternalLink } from 'lucide-react'; // <-- Imported ExternalLink
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
import moment from '@/lib/moment-setup';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { SendDocumentDialog } from './components/SendDocumentDialog';

export default function SignatureDoc() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Dialog states 
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    try {
      const res = await axiosInstance.get('/signature-documents', {
        params: {
          page: currentPage,
          limit: entriesPerPage,
          status:'pending'
        }
      });
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
    if (!deleteId) return;
    try {
      const res = await axiosInstance.delete(`/signature-documents/${deleteId}`);
      if (res.data?.success) {
        toast({ title: 'Success', description: 'Document deleted successfully.' });
        fetchDocuments();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete document',
        variant: 'destructive'
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="text-theme" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white p-4 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Signature Documents</h2>
        </div>
        
        {/* 🚀 NEW: Buttons Container */}
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-theme hover:bg-theme/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create Document
          </Button>
        </div>
      </div>

      <div className="  ">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="font-semibold">Document</TableHead>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Created At</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No documents found. Click "Create Document" to add one.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id} className="">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="max-w-[200px] truncate font-medium text-gray-900" title={doc.content}>
                        {doc.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {doc.employeeId?.name || `${doc.employeeId?.firstName} ${doc.employeeId?.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500">{doc.employeeId?.email}</div>
                  </TableCell>
                  <TableCell>
                    {doc.status === 'submitted' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80">
                        <Check className="mr-1 h-3 w-3" /> Signed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {moment(doc.createdAt).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="icon"
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

      {documents.length > 30 && (
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