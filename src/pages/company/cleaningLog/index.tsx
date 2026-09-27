import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import {
  LayoutGrid,
  Plus,
  Search,
  SprayCan,
  UserPlus,
  Users2,
  X
} from 'lucide-react';

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
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import {
  apiError,
  CleaningEmployee,
  CleaningLogRecord,
  CleaningType,
  daysAgo,
  personName,
  SelectOption,
  selectStyles,
  toApiDate,
  today
} from './shared';
import { CleaningLogTimeline, DateRangeNav } from './components/CleaningLogList';

const TYPE_OPTIONS: SelectOption<CleaningType>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' }
];

export default function CleaningLogPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [logs, setLogs] = useState<CleaningLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters - the list opens on the last 30 days
  const [fromDate, setFromDate] = useState<Date | null>(daysAgo(30));
  const [toDate, setToDate] = useState<Date | null>(today());
  const [typeFilter, setTypeFilter] = useState<SelectOption<CleaningType> | null>(
    null
  );
  const [employeeFilter, setEmployeeFilter] = useState<SelectOption | null>(null);

  // Employees on the cleaning module, and the company's whole staff to add from
  const [assigned, setAssigned] = useState<CleaningEmployee[]>([]);
  const [allEmployees, setAllEmployees] = useState<CleaningEmployee[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] =
    useState<CleaningEmployee | null>(null);

  const [logToDelete, setLogToDelete] = useState<CleaningLogRecord | null>(null);

  const fetchLogs = async () => {
    // A half-picked range waits for its second date
    if (fromDate && !toDate) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get('/cleaning-log', {
        params: {
          companyId: id,
          limit: 'all',
          ...(fromDate ? { fromDate: toApiDate(fromDate) } : {}),
          ...(toDate ? { toDate: toApiDate(toDate) } : {}),
          ...(typeFilter ? { type: typeFilter.value } : {}),
          ...(employeeFilter ? { employeeId: employeeFilter.value } : {})
        }
      });
      setLogs(response.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching cleaning logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssigned = async () => {
    try {
      const response = await axiosInstance.get('/cleaning-access', {
        params: { companyId: id }
      });
      setAssigned(response.data?.data?.employeeId || []);
    } catch (error) {
      console.error('Error fetching cleaning employees:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await axiosInstance.get('/users', {
        params: {
          company: id,
          role: 'employee',
          fields: 'firstName lastName email',
          limit: 'all',
          status: 'active'
        }
      });
      setAllEmployees(response.data?.data?.result || response.data?.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchAssigned();
    fetchAllEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fromDate, toDate, typeFilter, employeeFilter]);

  const handleAssign = async () => {
    if (!assignIds.length) return;
    try {
      setIsAssigning(true);
      const response = await axiosInstance.patch('/cleaning-access/employees', {
        companyId: id,
        employeeId: assignIds
      });
      setAssigned(response.data?.data?.employeeId || []);
      toast({
        title: 'Employee added to cleaning logs',
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
      const response = await axiosInstance.delete(
        `/cleaning-access/${id}/employees/${employeeToRemove._id}`
      );
      setAssigned(response.data?.data?.employeeId || []);
      toast({
        title: 'Employee removed from cleaning logs',
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

  const handleDelete = async () => {
    if (!logToDelete) return;
    try {
      await axiosInstance.delete(`/cleaning-log/${logToDelete._id}`);
      toast({
        title: 'Cleaning log deleted successfully',
        className: 'bg-theme border-none text-white'
      });
      setLogToDelete(null);
      fetchLogs();
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to delete cleaning log'),
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

  const employeeOptions: SelectOption[] = assigned.map((emp) => ({
    value: emp._id,
    label: personName(emp)
  }));

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <SprayCan className="h-5 w-5 lg:h-6 lg:w-6" />
            Cleaning Logs
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Daily and monthly cleaning checklists signed by your staff.
          </p>
        </div>

        <DateRangeNav
          fromDate={fromDate}
          toDate={toDate}
          onChange={(from, to) => {
            setFromDate(from);
            setToDate(to);
          }}
        />

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => navigate('areas')}
          >
            <LayoutGrid className="mr-1.5 h-4 w-4" /> Area
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-theme text-white hover:bg-theme/90 sm:flex-none"
            onClick={() => navigate('create')}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Log
          </Button>
        </div>
      </div>

      {/* Employees on the cleaning module */}
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-black">
          <Users2 className="h-4 w-4" />
          Employee ({assigned.length})
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {assigned.length === 0 ? (
            <span className="text-xs italic text-black">
              No employee added yet. Only added employees see Cleaning Logs on
              their sidebar.
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

      {/* Filters */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[200px_240px]">
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(option: any) => {
            setTypeFilter(option);
          }}
          placeholder="All types"
          isClearable
          styles={selectStyles}
        />
        <Select
          options={employeeOptions}
          value={employeeFilter}
          onChange={(option: any) => {
            setEmployeeFilter(option);
          }}
          placeholder="All employees"
          isClearable
          styles={selectStyles}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <CleaningLogTimeline
          logs={logs}
          fromDate={fromDate}
          toDate={toDate}
          onView={(log) => navigate(log._id)}
          onEdit={(log) => navigate(`${log._id}/edit`)}
          onDelete={setLogToDelete}
        />
      )}



      {/* Add employee */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Employee to Cleaning Logs</DialogTitle>
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
              will no longer see Cleaning Logs. Logs they already submitted are
              kept.
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

      {/* Delete log */}
      <AlertDialog
        open={!!logToDelete}
        onOpenChange={(open) => !open && setLogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cleaning Log</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will permanently delete the{' '}
              <span className="font-semibold">{logToDelete?.areaName}</span> log
              signed by {personName(logToDelete?.employeeId)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
