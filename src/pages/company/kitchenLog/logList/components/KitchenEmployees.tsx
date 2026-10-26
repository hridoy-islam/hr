import { useEffect, useState } from 'react';
import { Search, UserPlus, Users2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import axiosInstance from '@/lib/axios';
import {
  apiError,
  CleaningEmployee,
  personName
} from '@/pages/company/cleaningLog/shared';

// Employees on the kitchen module: only they see Kitchen on their sidebar
export function KitchenEmployees({ companyId }: { companyId: string }) {
  const { toast } = useToast();

  // Employees on the kitchen module, and the company's whole staff to add from
  const [assigned, setAssigned] = useState<CleaningEmployee[]>([]);
  const [allEmployees, setAllEmployees] = useState<CleaningEmployee[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] =
    useState<CleaningEmployee | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/kitchen-access', { params: { companyId } })
      .then((res) => setAssigned(res.data?.data?.employeeId || []))
      .catch(() => setAssigned([]));
    axiosInstance
      .get('/users', {
        params: {
          company: companyId,
          role: 'employee',
          fields: 'firstName lastName email',
          limit: 'all',
          status: 'active'
        }
      })
      .then((res) =>
        setAllEmployees(res.data?.data?.result || res.data?.data || [])
      )
      .catch(() => setAllEmployees([]));
  }, [companyId]);

  const handleAssign = async () => {
    if (!assignIds.length) return;
    try {
      setIsAssigning(true);
      const res = await axiosInstance.patch('/kitchen-access/employees', {
        companyId,
        employeeId: assignIds
      });
      setAssigned(res.data?.data?.employeeId || []);
      toast({
        title: 'Employee added to kitchen logs',
        className: 'bg-theme border-none text-white'
      });
      setAssignOpen(false);
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to add employee'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!employeeToRemove) return;
    try {
      const res = await axiosInstance.delete(
        `/kitchen-access/${companyId}/employees/${employeeToRemove._id}`
      );
      setAssigned(res.data?.data?.employeeId || []);
      toast({
        title: 'Employee removed from kitchen logs',
        className: 'bg-theme border-none text-white'
      });
      setEmployeeToRemove(null);
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to remove employee'),
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const assignedIds = new Set(assigned.map((emp) => emp._id));
  const assignable = allEmployees.filter(
    (emp) =>
      !assignedIds.has(emp._id) &&
      `${personName(emp)} ${emp.email || ''}`
        .toLowerCase()
        .includes(assignSearch.trim().toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-black">
          <Users2 className="h-4 w-4" />
          Employee ({assigned.length})
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {assigned.length === 0 ? (
            <span className="text-xs italic text-black">
              No employee added yet. Only added employees see Kitchen on their
              sidebar.
            </span>
          ) : (
            assigned.map((employee) => (
              <span
                key={employee._id}
                className="flex items-center gap-1 rounded-full border border-gray-300 py-1 pl-3 pr-1 text-xs font-semibold text-black"
              >
                {personName(employee)}
                <button
                  type="button"
                  title="Remove employee"
                  className="rounded-full p-1 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={() => setEmployeeToRemove(employee)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => {
            setAssignIds([]);
            setAssignSearch('');
            setAssignOpen(true);
          }}
        >
          <UserPlus className="mr-1.5 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Add employee */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Employee to Kitchen Logs</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              <Input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search employee by name or email..."
                className="pl-9"
              />
            </div>

            {assignIds.length > 0 && (
              <p className="text-xs font-semibold text-black">
                {assignIds.length} selected
              </p>
            )}

            <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
              {assignable.length === 0 ? (
                <p className="p-2 text-sm italic text-black">
                  No employee left to add.
                </p>
              ) : (
                assignable.map((employee) => (
                  <label
                    key={employee._id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={assignIds.includes(employee._id)}
                      onCheckedChange={() =>
                        setAssignIds((current) =>
                          current.includes(employee._id)
                            ? current.filter((item) => item !== employee._id)
                            : [...current, employee._id]
                        )
                      }
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-black">
                        {personName(employee)}
                      </span>
                      <span className="text-[11px] text-black">
                        {employee.email || '-'}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isAssigning || assignIds.length === 0}
              onClick={handleAssign}
            >
              {isAssigning ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove employee */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => !open && setEmployeeToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              <span className="font-semibold">
                {personName(employeeToRemove || undefined)}
              </span>{' '}
              will no longer see Kitchen. Logs they already completed are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
