import React, { useEffect, useState } from 'react';
import { Users, Pen, Plus, Trash2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useParams } from 'react-router-dom';
import { ServiceUserDialog } from './Components/ServiceUserDialog';

export default function ServiceUserPage() {
  const [serviceUsers, setServiceUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [searchTerm, setSearchTerm] = useState('');

  const { id } = useParams(); // Acts as the companyId

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/serviceuser`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });
      // Adjust according to your exact pagination response payload structure
      setServiceUsers(response.data.data.result || response.data.data);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching service users:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const handleSubmit = async (data: any) => {
    try {
      let response;
      if (editingUser) {
        response = await axiosInstance.patch(
          `/serviceuser/${editingUser?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/serviceuser`, {
          ...data,
          companyId: id
        });
      }

      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record saved successfully',
          className: 'bg-theme border-none text-white'
        });
      } else {
        toast({
          title: response.data?.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      }

      fetchData(currentPage, entriesPerPage);
      setEditingUser(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;
    try {
      const response = await axiosInstance.delete(`/serviceuser/${deletingUserId}`);
      if (response.data && response.data.success === true) {
        toast({
          title: 'Service user deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        fetchData(currentPage, entriesPerPage);
      } else {
        toast({
          title: response.data?.message || 'Deletion failed',
          className: 'bg-red-500 border-none text-white'
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred while deleting.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingUserId(null);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6" />
            Service Users
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Room"
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
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Service User
        </Button>
      </div>

      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : serviceUsers.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-gray-900">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.room}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-row items-center justify-end gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteClick(user._id)}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {serviceUsers.length > entriesPerPage && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ServiceUserDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open);
          if (!open) setEditingUser(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingUser}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}