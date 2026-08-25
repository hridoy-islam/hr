import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Pen,
  Plus,
  Trash2,
  UserCog
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
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { PresetTaskDialog } from './Components/presetTaskDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useParams, useNavigate } from 'react-router-dom';

export default function PresetTask() {
  const [presetTasks, setPresetTasks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTask, setEditingTask] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/preset-task`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setPresetTasks(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching preset tasks:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let response;
      if (editingTask) {
        response = await axiosInstance.patch(
          `/preset-task/${editingTask?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/preset-task`, {
          ...data,
          companyId: id
        });
      }

      if (response.data && response.data.success === true) {
        const saved = response.data.data;
        if (editingTask) {
          // Update the edited record in local state
          setPresetTasks((prev) =>
            prev.map((task) =>
              task._id === editingTask._id ? { ...task, ...saved } : task
            )
          );
        } else if (saved) {
          // Prepend the newly created record to local state
          setPresetTasks((prev) => [saved, ...prev]);
        }
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

      setEditingTask(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      const response = await axiosInstance.delete(`/preset-task/${taskId}`);
      if (response.data?.success) {
        // Remove the deleted record from local state
        setPresetTasks((prev) =>
          prev.filter((task) => task._id !== taskId)
        );
        toast({
          title: response.data.message || 'Record deleted successfully',
          className: 'bg-theme border-none text-white'
        });
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete record',
variant:'destructive'      });
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
            <ClipboardList className="h-6 w-6" />
           Daily Work Flow Settings
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Task Title"
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={'sm'}
            onClick={() =>
              navigate(`/company/${id}/preset-task/manage-employee`)
            }
          >
            <UserCog className="mr-2 h-4 w-4" />
            Manage Employee
          </Button>
          <Button
            className="bg-theme text-white hover:bg-theme/90"
            size={'sm'}
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Preset Task
          </Button>
        </div>
      </div>

      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : presetTasks.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presetTasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell className="font-medium text-gray-900">
                    {task.title}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-row items-center justify-end gap-2">
                      <Button size="icon" onClick={() => handleEdit(task)}>
                        <Pen className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete this preset task and remove
                              its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => handleDelete(task._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

      <PresetTaskDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingTask}
      />
    </div>
  );
}
