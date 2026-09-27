import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileBarChart2,
  Plus,
  SprayCan
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CLEANING_TYPE_LABEL,
  CleaningLogRecord,
  CleaningType,
  completion,
  formatDateTime
} from '@/pages/company/cleaningLog/shared';
import { CleaningLogWizard } from '@/pages/company/cleaningLog/components/CleaningLogWizard';

const TYPE_CARDS: {
  type: CleaningType;
  icon: typeof CalendarDays;
  description: string;
}[] = [
  {
    type: 'daily',
    icon: CalendarDays,
    description: 'Routine checks for the areas cleaned every day'
  },
  {
    type: 'monthly',
    icon: CalendarRange,
    description: 'Deep cleaning for the areas cleaned once a month'
  }
];

export default function StaffCleaningLogPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();

  const [type, setType] = useState<CleaningType | null>(null);
  // Remounts the wizard for a fresh log after each submission
  const [wizardKey, setWizardKey] = useState(0);
  const [submitted, setSubmitted] = useState<CleaningLogRecord | null>(null);

  const startNew = (nextType: CleaningType | null) => {
    setSubmitted(null);
    setType(nextType);
    setWizardKey((key) => key + 1);
  };

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <SprayCan className="h-5 w-5 lg:h-6 lg:w-6" />
            Cleaning Logs
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Choose the cleaning you are doing, tick what you cleaned and sign.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate('report')}
        >
          <FileBarChart2 className="mr-1.5 h-4 w-4" /> Report
        </Button>
      </div>

      {/* Daily / monthly choice */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPE_CARDS.map(({ type: cardType, icon: Icon, description }) => {
          const active = type === cardType;
          return (
            <button
              key={cardType}
              type="button"
              onClick={() => startNew(cardType)}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all sm:p-5',
                active
                  ? 'border-theme bg-theme/5 shadow-md'
                  : 'border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-14 sm:w-14',
                  active
                    ? 'bg-theme text-white'
                    : 'bg-gray-100 text-black group-hover:bg-theme group-hover:text-white'
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-black sm:text-lg">
                  {CLEANING_TYPE_LABEL[cardType]} Cleaning
                </span>
                <span className="block text-xs text-black sm:text-sm">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h3 className="text-lg font-bold text-black">Cleaning log submitted</h3>
          <p className="max-w-md text-sm text-black">
            {submitted.areaName} · {completion(submitted.items).done} of{' '}
            {completion(submitted.items).total} elements checked · signed at{' '}
            {formatDateTime(submitted.signedAt)}
          </p>
          <div className="flex w-full flex-col gap-2 pt-2 sm:w-auto sm:flex-row">
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              onClick={() => startNew(submitted.type)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Submit Another
            </Button>
            <Button variant="outline" onClick={() => navigate('report')}>
              <FileBarChart2 className="mr-1.5 h-4 w-4" /> View Report
            </Button>
          </div>
        </div>
      ) : type ? (
        <CleaningLogWizard
          key={wizardKey}
          companyId={id || ''}
          mode="employee"
          type={type}
          onSubmitted={setSubmitted}
          onCancel={() => startNew(null)}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select <span className="font-semibold text-black">Daily</span> or{' '}
          <span className="font-semibold text-black">Monthly</span> above to
          start a cleaning log.
        </div>
      )}
    </div>
  );
}
