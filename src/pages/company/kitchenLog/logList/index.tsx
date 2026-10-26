import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChefHat, FileBarChart2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  daysAgo,
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
} from '../constants';
import { ApprovalCounts, FREQUENCY_COLOR, KitchenLogRecord } from '../shared';
import { KitchenLogTable } from '../components/KitchenLogTable';
import { ApproveKitchenLogDialog } from '../components/ApproveKitchenLogDialog';
import {
  KitchenLogAction,
  KitchenLogActionDialog
} from '../components/KitchenLogActionDialog';
import { KitchenEmployees } from './components/KitchenEmployees';

type KitchenTab = KitchenFrequency | 'approval';

export default function KitchenLogListPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();

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

  const [approving, setApproving] = useState<KitchenLogRecord | null>(null);
  const [acting, setActing] = useState<{
    log: KitchenLogRecord;
    action: KitchenLogAction;
  } | null>(null);

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

  const refresh = () => {
    fetchCounts();
    fetchLogs();
  };

  const switchTab = (next: KitchenTab) => {
    setTab(next);
    setModule(next === 'approval' ? null : modulesOf(next)[0] || null);
  };

  const tabs: { key: KitchenTab; label: string; badge: number }[] = [
    ...KITCHEN_FREQUENCIES.map(({ key, label }) => ({
      key: key as KitchenTab,
      label,
      badge: counts?.[key] || 0
    })),
    { key: 'approval', label: 'Needs to Approve', badge: counts?.total || 0 }
  ];

  const emptyText =
    tab === 'approval'
      ? 'Nothing is waiting for approval.'
      : 'No log completed in this range.';

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

      <KitchenEmployees companyId={id || ''} />

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
        <div className="space-y-3">
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
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <KitchenLogTable
          logs={logs}
          emptyText={emptyText}
          showFrequency={tab === 'approval'}
          onView={(log) => navigate(log._id)}
          onApprove={setApproving}
          onEdit={(log) => navigate(`${log._id}/edit`)}
          onDelete={(log) => setActing({ log, action: 'delete' })}
        />
      )}

      <ApproveKitchenLogDialog
        log={approving}
        onClose={() => setApproving(null)}
        onApproved={() => {
          setApproving(null);
          refresh();
        }}
      />

      <KitchenLogActionDialog
        log={acting?.log || null}
        action={acting?.action || null}
        onClose={() => setActing(null)}
        onDone={() => {
          setActing(null);
          refresh();
        }}
      />
    </div>
  );
}
