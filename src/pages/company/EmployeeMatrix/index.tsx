import { useState } from 'react';
import Select from 'react-select';
import type { StylesConfig } from 'react-select';
import { Grid3X3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MODULES } from './constants';
import type { OptionType } from './constants';
import type { ModuleComponentProps } from './types';
import { TrainingMatrix } from './components/TrainingMatrix';
import { PassportMatrix } from './components/PassportMatrix';
import { RtwMatrix } from './components/RtwMatrix';
import { VisaMatrix } from './components/VisaMatrix';
import { DbsMatrix } from './components/DbsMatrix';
import { ImmigrationMatrix } from './components/ImmigrationMatrix';
import { AppraisalMatrix } from './components/AppraisalMatrix';
import { SpotCheckMatrix } from './components/SpotCheckMatrix';
import { SupervisionMatrix } from './components/SupervisionMatrix';
import { InductionMatrix } from './components/InductionMatrix';
import { DisciplinaryMatrix } from './components/DisciplinaryMatrix';
import { QaMatrix } from './components/QaMatrix';
import { RequiredDocumentsMatrix } from './components/RequiredDocumentsMatrix';
import { CompanyPolicyMatrix } from './components/CompanyPolicyMatrix';
import { HealthSafetyMatrix } from './components/HealthSafetyMatrix';

const selectStyles = (color?: string): StylesConfig<OptionType, false> => ({
  control: (base) => ({
    ...base,
    minHeight: 38,
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    '&:hover': { borderColor: color || '#38bdf8' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? color || '#38bdf8'
      : state.isFocused
        ? `${color || '#38bdf8'}1a`
        : 'white',
    color: state.isSelected ? 'white' : base.color
  })
});

const MODULE_COMPONENTS: Record<string, React.ComponentType<ModuleComponentProps>> = {
  passport: PassportMatrix,
  rtw: RtwMatrix,
  visa: VisaMatrix,
  dbs: DbsMatrix,
  immigration: ImmigrationMatrix,
  appraisal: AppraisalMatrix,
  spot: SpotCheckMatrix,
  supervision: SupervisionMatrix,
  training: TrainingMatrix,
  induction: InductionMatrix,
  disciplinary: DisciplinaryMatrix,
  qa: QaMatrix,
  'required-documents': RequiredDocumentsMatrix,
 

};


export default function EmployeeMatrixPage() {
  const [selectedModule, setSelectedModule] = useState<OptionType | null>(null);

  const moduleSelect = (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Module
      </label>
      <Select
        options={MODULES}
        value={selectedModule}
        onChange={(opt) => setSelectedModule(opt)}
        isSearchable
        placeholder="Select Module"
        styles={selectStyles()}
      />
    </div>
  );

  const ActiveModuleComponent = selectedModule
    ? MODULE_COMPONENTS[selectedModule.value]
    : null;

  return (
    <Card className="shadow-sm min-h-screen">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-theme/10 p-2">
            <Grid3X3 className="h-6 w-6 text-theme" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Matrix</h1>
            <p className="text-sm text-gray-500">
              Search employees by service, status and details
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!ActiveModuleComponent ? (
          <div className="max-w-sm">{moduleSelect}</div>
        ) : (
          <ActiveModuleComponent moduleSelect={moduleSelect} />
        )}
      </CardContent>
    </Card>
  );
}
