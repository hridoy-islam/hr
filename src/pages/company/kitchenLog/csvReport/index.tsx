import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { apiError, toApiDate } from '@/pages/company/cleaningLog/shared';
import { KITCHEN_MODULES, KitchenModule } from '../constants';
import { KitchenLogRecord } from '../shared';
import {
  KitchenReportFilters,
  useKitchenReportFilters
} from './components/KitchenReportFilters';
import {
  buildCsvTable,
  KitchenCsvTable,
  tableToCsv
} from './components/reportCsv';

interface GeneratedCsv {
  table: KitchenCsvTable;
  module: KitchenModule;
  fileName: string;
}

export default function KitchenCsvReportPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();

  const filters = useKitchenReportFilters(id);
  const { module, fromDate, toDate, employeeId, setError } = filters;

  const [generated, setGenerated] = useState<GeneratedCsv | null>(null);
  const [loading, setLoading] = useState(false);

  // A file made for the old filters goes as soon as they change
  useEffect(() => {
    setGenerated(null);
  }, [module, fromDate, toDate, employeeId]);

  const generate = async () => {
    const message = filters.validate();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setGenerated(null);

    const from = toApiDate(fromDate!);
    const to = toApiDate(toDate!);

    try {
      setLoading(true);
      const res = await axiosInstance.get('/kitchen-log/report', {
        params: {
          companyId: id,
          module,
          fromDate: from,
          toDate: to,
          ...(employeeId ? { employeeId } : {})
        }
      });
      const logs: KitchenLogRecord[] = res.data?.data?.logs || [];
      setGenerated({
        table: buildCsvTable(module!, logs),
        module: module!,
        fileName: `Kitchen_${module}_${from}_${to}.csv`
      });
    } catch (err) {
      setError(apiError(err, 'Failed to generate the CSV'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!generated) return;
    // The BOM lets Excel read the file as UTF-8, so °C displays correctly
    const blob = new Blob(
      [String.fromCharCode(0xfeff), tableToCsv(generated.table)],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generated.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderResult = () => {
    if (!generated) return null;

    if (generated.table.rows.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-black">
          No {KITCHEN_MODULES[generated.module].label.toLowerCase()} was
          completed in this period.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-black">Your CSV is ready</p>
            <p className="break-all text-xs text-black">{generated.fileName}</p>
          </div>
        </div>
        <Button
          className="w-full shrink-0 bg-black text-white hover:bg-black/90 sm:w-auto"
          onClick={downloadCsv}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download CSV
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <FileSpreadsheet className="h-5 w-5 lg:h-6 lg:w-6" />
            Kitchen CSV Report
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Pick a log and a date range to generate its CSV.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/company/${id}/kitchen-log`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      <KitchenReportFilters
        filters={filters}
        loading={loading}
        onGenerate={generate}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : generated ? (
        renderResult()
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select the frequency, log and date range, then press{' '}
          <span className="font-semibold">Generate</span>.
        </div>
      )}
    </div>
  );
}
