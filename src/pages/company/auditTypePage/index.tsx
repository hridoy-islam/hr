import { useEffect, useState } from 'react';
import { Pen, Plus, ShieldCheck, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { AuditTypeDialog } from './Components/auditTypeDialog';
import { useParams } from 'react-router-dom';

export default function AuditTypePage() {
  const [auditTypes, setAuditTypes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuditType, setEditingAuditType] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [auditTypeToDelete, setAuditTypeToDelete] = useState<string | null>(
    null
  );

  const { id } = useParams();

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/audit-type`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setAuditTypes(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching audit types:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let response;
      if (editingAuditType) {
        response = await axiosInstance.patch(
          `/audit-type/${editingAuditType?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/audit-type`, {
          ...data,
          companyId: id
        });
      }

      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-theme border-none text-white'
        });
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }

      fetchData(currentPage, entriesPerPage);
      setEditingAuditType(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleEdit = (auditType: any) => {
    setEditingAuditType(auditType);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: boolean) => {
    try {
      await axiosInstance.patch(`/audit-type/${id}`, {
        status: status ? 'active' : 'inactive'
      });
      toast({
        title: 'Audit type status updated successfully',
        className: 'bg-theme border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating audit type status:', error);
      toast({
        title: 'Failed to update audit type status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (auditTypeToDelete) {
      try {
        await axiosInstance.delete(`/audit-type/${auditTypeToDelete}`);
        toast({
          title: 'Audit type deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        fetchData(currentPage, entriesPerPage);
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error('Error deleting audit type:', error);
        toast({
          title: 'Failed to delete audit type',
          variant: 'destructive'
        });
      }
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <ShieldCheck className="h-6 w-6" />
            All Audit Types
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Audit Type Title"
              className="h-8 min-w-[250px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="min-w-[100px] border-none bg-theme text-white hover:bg-theme/90"
            >
              Search
            </Button>
          </div>
        </div>
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Audit Type
        </Button>
      </div>

      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : auditTypes.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit Type Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTypes.map((auditType) => (
                <TableRow key={auditType._id}>
                  <TableCell className="font-medium text-gray-900">
                    {auditType.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={auditType.status === 'active'}
                        onCheckedChange={(checked) =>
                          handleStatusChange(auditType._id, checked)
                        }
                      />
                      <Badge
                        variant="outline"
                        className={
                          auditType.status === 'active'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      >
                        {auditType.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-row items-center justify-end gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleEdit(auditType)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size={'icon'}
                        onClick={() => {
                          setAuditTypeToDelete(auditType._id);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <AuditTypeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAuditType(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingAuditType}
      />

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              audit type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-700 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
