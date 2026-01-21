import React from 'react';
import { EditableField } from '../EditableField';
import moment from 'moment';
import { Loader2, FileText, Globe } from 'lucide-react';

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

interface IdentificationTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
  onDateChange: (fieldName: string, dateStr: string) => void;
}

const IdentificationTab: React.FC<IdentificationTabProps> = ({
  formData,
  onDateChange,
  onUpdate,
  isFieldSaving,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Official Numbers */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={FileText} title="Official Numbers" />
          <div className="flex flex-col">
            <FormRow 
              label="National Insurance No." 
              isSaving={isFieldSaving['nationalInsuranceNumber']}
            >
              <EditableField
                id="nationalInsuranceNumber"
                label=""
                value={formData.nationalInsuranceNumber}
                onUpdate={(value) => onUpdate('nationalInsuranceNumber', value)}
                isSaving={isFieldSaving['nationalInsuranceNumber']}
              />
            </FormRow>

            <FormRow 
              label="NHS Number" 
              isSaving={isFieldSaving['nhsNumber']}
            >
              <EditableField
                id="nhsNumber"
                label=""
                value={formData.nhsNumber}
                onUpdate={(value) => onUpdate('nhsNumber', value)}
                isSaving={isFieldSaving['nhsNumber']}
              />
            </FormRow>
          </div>
        </div>

        

      </div>
    </div>
  );
};

export default IdentificationTab;