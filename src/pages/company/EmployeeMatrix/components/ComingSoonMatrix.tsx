import { Clock3 } from 'lucide-react';
import type { ModuleComponentProps } from '../types';

export const ComingSoonMatrix = ({
  moduleLabel,
  moduleSelect
}: ModuleComponentProps & { moduleLabel: string }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {moduleSelect}
    </div>
    <div className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <Clock3 className="h-5 w-5 text-gray-400" />
      <p className="text-sm text-gray-500">
        The{' '}
        <span className="font-semibold text-gray-700">{moduleLabel}</span>{' '}
        module is coming soon. Only the Training module is available right now.
      </p>
    </div>
  </div>
);
