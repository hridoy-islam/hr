import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChefHat,
  FileBarChart2,
  Plus,
  Search,
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
import { cn } from '@/lib/utils';
import {
  apiError,
  CleaningEmployee,
  daysAgo,
  personName,
  toApiDate,
  today
} from '@/pages/company/cleaningLog/shared';
import { DateRangeNav } from '@/pages/company/cleaningLog/components/CleaningLogList';
import {
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULES,
  KitchenFrequency,
  KitchenModule,
  modulesOf
} from './constants';
import { ApprovalCounts, FREQUENCY_COLOR, KitchenLogRecord } from './shared';
import { KitchenLogTable } from './components/KitchenLogTable';
import { KitchenLogDetailsDialog } from './components/KitchenLogDetailsDialog';
import { ApproveKitchenLogDialog } from './components/ApproveKitchenLogDialog';

type KitchenTab = KitchenFrequency | 'approval';

export default function KitchenLogPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<KitchenTab>('daily');
  const [counts, setCounts] = useState<ApprovalCounts | null>(null);

  const [logs, setLogs] = useState<KitchenLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date | null>(daysAgo(30));
  const [toDate, setToDate] = useState<Date | null>(today());
  // The log shown under a frequency tab, its first log until another is picked
  const [module, setModule] = useState<KitchenModule | null>(
    modulesOf('daily')[0] || null
  );

  const [viewing, setViewing] = useState<KitchenLogRecord | null>(null);
  const [approving, setApproving] = useState<KitchenLogRecord | null>(null);
  const [logToDelete, setLogToDelete] = useState<KitchenLogRecord | null>(null);

  // Employees on the kitchen module, and the company's whole staff to add from
  const [assigned, setAssigned] = useState<CleaningEmployee[]>([]);
  const [allEmployees, setAllEmployees] = useState<CleaningEmployee[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] =
    useState<CleaningEmployee | null>(null);

  const fetchCounts = useCallback(() => {
    axiosInstance
      .get('/kitchen-log/approval-counts', { params: { companyId: id } })
      .then((res) => setCounts(res.data?.data || null))
      .catch(() => setCounts(null));
  }, [id]);

  const fetchLogs = useCallback(async () => {
    // A half-picked range waits for its second date
    if (tab !== 'approval' && fromDate && !toDate) return;

    try {
      setLoading(true);
      const res = await axiosInstance.get('/kitchen-log', {
        params: {
          companyId: id,
          limit: 'all',
          ...(tab === 'approval'
            ? { needsApproval: true, sort: 'logDate' }
            : {
                frequency: tab,
                ...(fromDate ? { fromDate: toApiDate(fromDate) } : {}),
                ...(toDate ? { toDate: toApiDate(toDate) } : {}),
                ...(module ? { module } : {})
              })
        }
      });
      setLogs(res.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching kitchen logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [id, tab, fromDate, toDate, module]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    axiosInstance
      .get('/kitchen-access', { params: { companyId: id } })
      .then((res) => setAssigned(res.data?.data?.employeeId || []))
      .catch(() => setAssigned([]));
    axiosInstance
      .get('/users', {
        params: {
          company: id,
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
  }, [id]);

  const refresh = () => {
    fetchCounts();
    fetchLogs();
  };

  const switchTab = (next: KitchenTab) => {
    setTab(next);
    setModule(next === 'approval' ? null : modulesOf(next)[0] || null);
  };

  const handleAssign = async () => {
    if (!assignIds.length) return;
    try {
      setIsAssigning(true);
      const res = await axiosInstance.patch('/kitchen-access/employees', {
        companyId: id,
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
        `/kitchen-access/${id}/employees/${employeeToRemove._id}`
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

  const handleDelete = async () => {
    if (!logToDelete) return;
    try {
      await axiosInstance.delete(`/kitchen-log/${logToDelete._id}`);
      toast({
        title: 'Kitchen log deleted successfully',
        className: 'bg-theme border-none text-white'
      });
      setLogToDelete(null);
      refresh();
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to delete kitchen log'),
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

  const tabs: { key: KitchenTab; label: string; badge: number }[] = [
    ...KITCHEN_FREQUENCIES.map(({ key, label }) => ({
      key: key as KitchenTab,
      label,
      badge: counts?.[key] || 0
    })),
    { key: 'approval', label: 'Needs to Approve', badge: counts?.total || 0 }
  ];

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <ChefHat className="h-5 w-5 lg:h-6 lg:w-6" />
            Kitchen Logs
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Daily, weekly, twice a week and monthly kitchen records signed by
            your staff.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => navigate('report')}
          >
            <FileBarChart2 className="mr-1.5 h-4 w-4" /> Report
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

      {/* Employees on the kitchen module */}
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

      {/* Tabs, a colour each */}
      <div className="flex flex-wrap gap-1">
        {tabs.map((item) => {
          const active = tab === item.key;
          const color = FREQUENCY_COLOR[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => switchTab(item.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? cn(color.solid, 'shadow-sm')
                  : cn(color.text, 'bg-white hover:bg-gray-50')
              )}
            >
              {item.label}
              {item.badge > 0 && (
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold',
                    active ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The logs of the frequency, in line with the date range */}
      {tab !== 'approval' && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* One line of buttons, the same width each; a long name wraps
              inside its button, never cut */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-0 lg:flex-1">
            {modulesOf(tab).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setModule(key)}
                className={cn(
                  'flex min-h-[44px] items-center justify-center rounded-xl border-2 px-3 py-2 text-center text-sm font-bold leading-tight transition-all',
                  module === key
                    ? cn(FREQUENCY_COLOR[tab].solid, 'shadow-md')
                    : 'border-gray-200 text-black hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm'
                )}
              >
                {KITCHEN_MODULES[key].label}
              </button>
            ))}
          </div>
          <div className="lg:shrink-0">
            <DateRangeNav
              fromDate={fromDate}
              toDate={toDate}
              onChange={(from, to) => {
                setFromDate(from);
                setToDate(to);
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <KitchenLogTable
          logs={logs}
          emptyText={
            tab === 'approval'
              ? 'Nothing is waiting for approval.'
              : 'No log completed in this range.'
          }
          showFrequency={tab === 'approval'}
          onView={setViewing}
          onApprove={setApproving}
          onEdit={(log) => navigate(`${log._id}/edit`)}
          onDelete={setLogToDelete}
        />
      )}

      <KitchenLogDetailsDialog
        log={viewing}
        onClose={() => setViewing(null)}
        onApprove={(log) => {
          setViewing(null);
          setApproving(log);
        }}
      />

      <ApproveKitchenLogDialog
        log={approving}
        onClose={() => setApproving(null)}
        onApproved={() => {
          setApproving(null);
          refresh();
        }}
      />

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

      {/* Delete log */}
      <AlertDialog
        open={!!logToDelete}
        onOpenChange={(open) => !open && setLogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Kitchen Log</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will permanently delete the{' '}
              <span className="font-semibold">
                {logToDelete ? KITCHEN_MODULES[logToDelete.module].label : ''}
              </span>{' '}
              log of {personName(logToDelete?.employeeId)}.
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
