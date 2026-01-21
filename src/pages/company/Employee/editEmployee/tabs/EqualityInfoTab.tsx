import React from 'react';
import { EditableField } from '../EditableField';
import { nationalities } from '@/types';
import { Loader2, HeartHandshake } from 'lucide-react';

// --- Layout Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
    <Icon className="h-4 w-4 text-theme" />
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
      {title}
    </h3>
  </div>
);

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  isSaving?: boolean;
}

const FormRow = ({ label, children, className = '', required, isSaving }: FormRowProps) => (
  <div className={`group flex flex-col border-b border-gray-100 last:border-0 sm:flex-row ${className}`}>
    {/* Label Column */}
    <div className="flex items-center justify-between bg-gray-50/30 px-4 py-3 sm:w-1/3 lg:w-2/5 xl:w-1/3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900">
          {label}
        </span>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme" />}
    </div>
    {/* Input Column */}
    <div className="flex items-center bg-white px-4 py-2 sm:w-2/3 lg:w-3/5 xl:w-2/3">
      <div className="w-full">
        {children}
      </div>
    </div>
  </div>
);

// --- Main Component ---

interface EqualityInfoTabProps {
  formData: any;
  onUpdate: (parentField: string, fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const EqualityInfoTab: React.FC<EqualityInfoTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  const nationalityOptions = nationalities.map(nationality => ({ value: nationality, label: nationality }));
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Diversity Information */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={HeartHandshake} title="Diversity Information" />
          <div className="flex flex-col">
            <FormRow 
              label="Nationality" 
              isSaving={isFieldSaving['equalityInformation.nationality']}
            >
              <EditableField
                id="equalityInformation.nationality"
                label=""
                value={formData.equalityInformation?.nationality || ''}
                type="select"
                options={nationalityOptions}
                onUpdate={(value) => onUpdate('equalityInformation', 'nationality', value)}
                isSaving={isFieldSaving['equalityInformation.nationality']}
              />
            </FormRow>

            <FormRow 
              label="Religion" 
              isSaving={isFieldSaving['equalityInformation.religion']}
            >
              <EditableField
                id="equalityInformation.religion"
                label=""
                value={formData.equalityInformation?.religion || ''}
                onUpdate={(value) => onUpdate('equalityInformation', 'religion', value)}
                isSaving={isFieldSaving['equalityInformation.religion']}
              />
            </FormRow>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EqualityInfoTab;