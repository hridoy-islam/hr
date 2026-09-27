import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileBarChart2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { CleaningLogRecord, daysAgo, toApiDate, today } from '@/pages/company/cleaningLog/shared';
import {
  CleaningLogTimeline,
  DateRangeNav
} from '@/pages/company/cleaningLog/components/CleaningLogList';
import { CleaningLogDetailsDialog } from '@/pages/company/cleaningLog/components/CleaningLogDetailsDialog';

export default function StaffCleaningReportPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<CleaningLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // Opens on the last 30 days
  const [fromDate, setFromDate] = useState<Date | null>(daysAgo(30));
  const [toDate, setToDate] = useState<Date | null>(today());
  const [viewingLog, setViewingLog] = useState<CleaningLogRecord | null>(null);

  useEffect(() => {
    // A half-picked range waits for its second date
    if (fromDate && !toDate) return;

    // The API only ever returns the signed-in employee's own logs
    setLoading(true);
    axiosInstance
      .get('/cleaning-log', {
        params: {
          limit: 'all',
          ...(fromDate ? { fromDate: toApiDate(fromDate) } : {}),
          ...(toDate ? { toDate: toApiDate(toDate) } : {})
        }
      })
      .then((res) => setLogs(res.data?.data?.result || []))
      .catch((error) => console.error('Error fetching cleaning report:', error))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <FileBarChart2 className="h-5 w-5 lg:h-6 lg:w-6" />
            My Cleaning Report
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            The cleaning logs you have submitted.
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

        <Button
          size="sm"
          className="w-full gap-2 lg:w-auto"
          onClick={() => navigate('..', { relative: 'path' })}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
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
          showEmployee={false}
          onView={setViewingLog}
        />
      )}

      <CleaningLogDetailsDialog log={viewingLog} onClose={() => setViewingLog(null)} />
    </div>
  );
}
