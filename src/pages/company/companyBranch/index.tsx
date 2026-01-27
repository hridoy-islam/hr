import { useEffect, useState } from 'react';
import { MapPin, Pen, Plus, Trash2 } from 'lucide-react';
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useSelector } from 'react-redux';
import { BranchDialog } from './components/BranchDialog';
import { useParams } from 'react-router-dom';

export default function CompanyBranch() {
  const [branches, setBranches] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  
  // State for Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const {id} = useParams()
  const user = useSelector((state: any) => state.auth.user);

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/company-branch`, {
        params: {
          page,
          limit: entriesPerPage,
          companyId: id,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setBranches(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingBranch) {
        response = await axiosInstance.patch(
          `/company-branch/${editingBranch?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/company-branch`, {
          ...data,
          companyId: id
        });
      }

      if (response.data?.success) {
        toast({
          title: response.data.message || 'Record saved successfully',
          className: 'bg-theme border-none text-white'
        });
      }
      fetchData(currentPage, entriesPerPage);
      setEditingBranch(undefined);
    } catch (error) {
      toast({
        variant:"destructive",
        title: error?.response.data.message||'An error occurred.',
      });
    }
  };

  // 1. This function is now called by the AlertDialog Action
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await axiosInstance.delete(`/company-branch/${deleteId}`);
      if (response.data?.success) {
        toast({
          title: 'Branch deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        fetchData(currentPage, entriesPerPage);
      }
    } catch (error) {
      toast({
        title: 'Failed to delete branch',
        variant: 'destructive'
      });
    } finally {
      setDeleteId(null); // Close the dialog
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
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
            <MapPin className="h-6 w-6" />
            Company Branches
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Branch Name"
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
          New Branch
        </Button>
      </div>

      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch._id}>
                  <TableCell className="font-medium">{branch.branchName}</TableCell>

                  <TableCell>
                    <div className="flex flex-row items-center justify-end gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleEdit(branch)}
                        className="h-8 w-8"
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      
                      {/* 2. Open Dialog on Click */}
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteId(branch._id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {branches.length > 50 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Edit/Create Dialog */}
      <BranchDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBranch(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingBranch}
      />

      {/* 3. Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this branch
              and remove the data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}