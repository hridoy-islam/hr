import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';

// --- Validation ---
const jobBoardSchema = z.object({
  title: z
    .string({ required_error: 'Job board name is required' })
    .trim()
    .min(3, { message: 'Job board name must be at least 3 characters long' })
    .max(100, { message: 'Job board name cannot exceed 100 characters' }),
  description: z.string().trim().optional(),
  employeeId: z.array(z.string()).optional(),
  companyId: z.string().min(1, { message: 'Company ID cannot be empty' })
});

export interface EmployeeRecord {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  initial?: string;
  email?: string;
  designationId?: { title: string }[];
}

interface JobBoardRecord {
  _id: string;
  title: string;
  description?: string;
  employeeId: EmployeeRecord[];
  totalTask?: number;
  completedTask?: number;
  pendingTask?: number;
}

export const employeeName = (employee?: EmployeeRecord) => {
  if (!employee) return 'Unknown';
  return (
    employee.name ||
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
    'Unknown'
  );
};

export const employeeInitials = (employee?: EmployeeRecord) =>
  employeeName(employee)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function JobBoardPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobBoards, setJobBoards] = useState<JobBoardRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<JobBoardRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmations
  const [boardToDelete, setBoardToDelete] = useState<JobBoardRecord | null>(
    null
  );

  const fetchJobBoards = async (page: number, limit: number, search = '') => {
    try {
      const response = await axiosInstance.get(`/job-board`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });

      setJobBoards(response.data.data.result || []);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching job boards:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get(`/users`, {
        params: {
          company: id,
          role: 'employee',
          fields: 'firstName lastName email designationId',
          limit: 'all',
          status: 'active'
        }
      });
      setEmployees(response.data.data.result || response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchJobBoards(currentPage, entriesPerPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resetCreateForm = () => {
    setEditingBoard(null);
    setTitle('');
    setDescription('');
    setSelectedEmployeeIds([]);
    setEmployeeSearch('');
    setFormErrors({});
  };

  const openEditDialog = (board: JobBoardRecord) => {
    setEditingBoard(board);
    setTitle(board.title);
    setDescription(board.description || '');
    setSelectedEmployeeIds(
      (board.employeeId || []).map((employee) => employee._id)
    );
    setEmployeeSearch('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSaveJobBoard = async () => {
    setFormErrors({});

    const validation = jobBoardSchema.safeParse({
      title,
      description,
      employeeId: selectedEmployeeIds,
      companyId: id || ''
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = editingBoard
        ? await axiosInstance.patch(`/job-board/${editingBoard._id}`, {
            title: validation.data.title,
            description: validation.data.description,
            employeeId: validation.data.employeeId
          })
        : await axiosInstance.post('/job-board', validation.data);

      if (response.data?.success) {
        toast({
          title: editingBoard
            ? 'Job board updated successfully'
            : 'Job board created successfully',
          className: 'bg-theme border-none text-white'
        });
        setDialogOpen(false);
        resetCreateForm();
        fetchJobBoards(currentPage, entriesPerPage, searchTerm);
      }
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.message ||
          (editingBoard
            ? 'Failed to update job board'
            : 'Failed to create job board'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJobBoard = async () => {
    if (!boardToDelete) return;

    try {
      const response = await axiosInstance.delete(
        `/job-board/${boardToDelete._id}`
      );

      if (response.data?.success) {
        toast({
          title: 'Job board deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        setBoardToDelete(null);
        fetchJobBoards(currentPage, entriesPerPage, searchTerm);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete job board',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const filterEmployees = (search: string, excludeIds: string[] = []) =>
    employees.filter((employee) => {
      if (excludeIds.includes(employee._id)) return false;
      return employeeName(employee)
        .toLowerCase()
        .includes(search.toLowerCase());
    });

  const toggleId = (
    empId: string,
    current: string[],
    setter: (ids: string[]) => void
  ) => {
    setter(
      current.includes(empId)
        ? current.filter((item) => item !== empId)
        : [...current, empId]
    );
  };

  return (
    <div className="h-screen space-y-4 rounded-sm bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-black">
            <ClipboardList className="h-6 w-6" />
            Job Board
          </h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme/50" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                    fetchJobBoards(1, entriesPerPage, searchTerm);
                  }
                }}
                placeholder="Search job board..."
                className="h-9 w-full min-w-0 pl-9 sm:min-w-[250px]"
              />
            </div>

            <Button
              onClick={() => {
                setCurrentPage(1);
                fetchJobBoards(1, entriesPerPage, searchTerm);
              }}
              size="sm"
              className="h-9 w-full min-w-[100px] border-none bg-theme text-white hover:bg-theme/90 sm:w-auto"
            >
              Search
            </Button>
          </div>
        </div>

        <Button
          className="w-full bg-theme text-white hover:bg-theme/90 md:w-auto"
          size="sm"
          onClick={() => {
            resetCreateForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Job Board
        </Button>
      </div>

      {/* Board grid */}
      {initialLoading ? (
        <div className="flex justify-center py-10">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : jobBoards.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-sm border-2 border-theme/15 bg-white px-6 py-14 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-sm bg-theme/10">
            <ClipboardList className="h-7 w-7 text-theme" />
          </div>

          <h3 className="text-base font-semibold tracking-tight text-black">
            No job boards yet
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-black/60">
            No job boards are available at the moment. Once a job board is
            created, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {jobBoards.map((board) => (
            <div
              key={board._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`${board._id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`${board._id}`);
                }
              }}
              className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-theme/40 hover:shadow-xl hover:shadow-theme/5  "
            >
              {/* Edit + delete buttons */}
              <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-all duration-200 focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  title="Edit job board"
                  className="rounded-xl p-2 text-gray-400 transition-all duration-200 hover:bg-theme/10 hover:text-theme focus:outline-none focus-visible:ring-2 focus-visible:ring-theme/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(board);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  title="Delete job board"
                  className="rounded-xl p-2 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoardToDelete(board);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-theme/10 to-theme/5 text-theme ring-1 ring-inset ring-theme/10 transition-all duration-300 group-hover:from-theme group-hover:to-theme/90 group-hover:text-white group-hover:shadow-lg group-hover:shadow-theme/20 group-hover:ring-theme/20">
                <ClipboardList className="h-5 w-5" />
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold tracking-tight text-gray-900 transition-colors duration-200 group-hover:text-theme">
                {board.title}
              </h3>

              {/* Description */}
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-800">
                {board.description || ''}
              </p>

              {/* CTA */}
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-theme/70 transition-colors duration-200 group-hover:text-theme">
                View tasks
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
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

      {/* --- Create / edit dialog --- */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto border border-gray-300">
          <DialogHeader className=" ">
            <DialogTitle className="text-lg font-bold">
              {editingBoard ? 'Edit Job Board' : 'Create Job Board'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">
                Job Board Name*
              </Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFormErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="Enter job board name"
                className={cn(formErrors.title && 'border-red-500')}
              />
              {formErrors.title && (
                <p className="text-xs font-medium text-red-500">
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this job board for?"
                className="min-h-[70px] "
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">
                Assign Employees
              </Label>
              <Input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search employee..."
                className="h-9"
              />

              <div className="max-h-[180px] space-y-1 overflow-y-auto rounded-sm border border-gray-300 p-2">
                {filterEmployees(employeeSearch).length === 0 ? (
                  <p className="p-2 text-sm italic text-theme/50">
                    No employee found.
                  </p>
                ) : (
                  filterEmployees(employeeSearch).map((employee) => (
                    <label
                      key={employee._id}
                      className="flex cursor-pointer items-center gap-3 rounded-sm p-2 hover:bg-theme/5"
                    >
                      <Checkbox
                        checked={selectedEmployeeIds.includes(employee._id)}
                        onCheckedChange={() =>
                          toggleId(
                            employee._id,
                            selectedEmployeeIds,
                            setSelectedEmployeeIds
                          )
                        }
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {employeeName(employee)}
                        </span>
                        <span className="text-[11px] text-black/60">
                          {employee.email || '-'}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedEmployeeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {employees
                    .filter((employee) =>
                      selectedEmployeeIds.includes(employee._id)
                    )
                    .map((employee) => (
                      <Badge
                        key={employee._id}
                        variant="secondary"
                        className="gap-1 border border-theme/20 bg-theme/5 text-black"
                      >
                        {employeeName(employee)}
                        <button
                          type="button"
                          onClick={() =>
                            toggleId(
                              employee._id,
                              selectedEmployeeIds,
                              setSelectedEmployeeIds
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isSubmitting}
              onClick={handleSaveJobBoard}
            >
              {isSubmitting
                ? editingBoard
                  ? 'Updating...'
                  : 'Creating...'
                : editingBoard
                  ? 'Update Job Board'
                  : 'Create Job Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete job board confirmation --- */}
      <AlertDialog
        open={!!boardToDelete}
        onOpenChange={(open) => {
          if (!open) setBoardToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Board</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will delete{' '}
              <span className="font-semibold">{boardToDelete?.title}</span> and
              every task under it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteJobBoard();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
