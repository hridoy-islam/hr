import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, SprayCan } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { CleaningLogRecord } from './shared';
import { CleaningLogWizard } from './components/CleaningLogWizard';

// Create and edit share this page: /cleaning-log/create and
// /cleaning-log/:lid/edit
export default function CleaningLogFormPage() {
  const { id, lid } = useParams(); // companyId, logId
  const navigate = useNavigate();
  const listPath = `/company/${id}/cleaning-log`;

  const [log, setLog] = useState<CleaningLogRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(lid));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!lid) return;
    axiosInstance
      .get(`/cleaning-log/${lid}`)
      .then((res) => setLog(res.data?.data))
      .catch(() => setLoadError('This cleaning log could not be loaded.'))
      .finally(() => setLoading(false));
  }, [lid]);

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <SprayCan className="h-5 w-5 lg:h-6 lg:w-6" />
            {lid ? 'Edit Cleaning Log' : 'Create Cleaning Log'}
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            {lid
              ? 'Correct the checklist or signature of a submitted log.'
              : 'Record a cleaning log on behalf of an employee.'}
          </p>
        </div>
        <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(listPath)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : loadError ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{loadError}</p>
      ) : (
        <CleaningLogWizard
          companyId={id || ''}
          mode="admin"
          log={log}
          onSubmitted={() => navigate(listPath)}
          onCancel={() => navigate(listPath)}
        />
      )}
    </div>
  );
}
