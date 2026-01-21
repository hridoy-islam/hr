import React from 'react';
import { EditableField } from '../EditableField';
import { Loader2, Accessibility, Settings2 } from 'lucide-react';

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

interface DisabilityInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const DisabilityInfoTab: React.FC<DisabilityInfoTabProps> = ({
  formData,
  onUpdate,
  onCheckboxChange,
  isFieldSaving
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Disability Status */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={Accessibility} title="Disability Status" />
          <div className="flex flex-col">
            <FormRow 
              label="Has Disability" 
              isSaving={isFieldSaving['hasDisability']}
            >
              <EditableField
                id="hasDisability"
                label=""
                type="select"
                options={[
                  { label: 'Yes', value: 'true' },
                  { label: 'No', value: 'false' }
                ]}
                // Convert boolean to string for Select matching, handling generic/string inputs
                value={String(formData.hasDisability)}
                onUpdate={(value: string | boolean) =>
                  onCheckboxChange(
                    'hasDisability',
                    value === 'true' || value === true
                  )
                }
                isSaving={isFieldSaving['hasDisability']}
              />
            </FormRow>

            {formData.hasDisability && (
              <FormRow 
                label="Disability Details" 
                isSaving={isFieldSaving['disabilityDetails']}
              >
                <EditableField
                  id="disabilityDetails"
                  label=""
                  type="textarea"
                  value={formData.disabilityDetails}
                  onUpdate={(value) => onUpdate('disabilityDetails', value)}
                  isSaving={isFieldSaving['disabilityDetails']}
                />
              </FormRow>
            )}
          </div>
        </div>

        {/* Right Column: Workplace Adjustments */}
        <div className=" rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={Settings2} title="Workplace Adjustments" />
          <div className="flex flex-col">
            <FormRow 
              label="Needs Adjustments?" 
              isSaving={isFieldSaving['needsReasonableAdjustment']}
            >
              <EditableField
                id="needsReasonableAdjustment"
                label=""
                type="select"
                options={[
                  { label: 'Yes', value: 'true' },
                  { label: 'No', value: 'false' }
                ]}
                value={String(formData.needsReasonableAdjustment)}
                onUpdate={(value: string | boolean) =>
                  onCheckboxChange(
                    'needsReasonableAdjustment',
                    value === 'true' || value === true
                  )
                }
                isSaving={isFieldSaving['needsReasonableAdjustment']}
              />
            </FormRow>

            {formData.needsReasonableAdjustment && (
              <FormRow 
                label="Adjustment Details" 
                isSaving={isFieldSaving['reasonableAdjustmentDetails']}
              >
                <EditableField
                  id="reasonableAdjustmentDetails"
                  label=""
                  type="textarea"
                  value={formData.reasonableAdjustmentDetails}
                  onUpdate={(value) =>
                    onUpdate('reasonableAdjustmentDetails', value)
                  }
                  isSaving={isFieldSaving['reasonableAdjustmentDetails']}
                />
              </FormRow>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DisabilityInfoTab;