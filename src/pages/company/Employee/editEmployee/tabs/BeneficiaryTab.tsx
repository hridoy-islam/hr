import React from 'react';
import { EditableField } from '../EditableField';
import { countries, relationships } from '@/types';
import { Loader2, User, MapPin } from 'lucide-react';

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

interface BeneficiaryTabProps {
  formData: any;
  onUpdate: (parentField: string, fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const BeneficiaryTab: React.FC<BeneficiaryTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  const relationshipOptions = relationships.map(relation => ({ value: relation, label: relation }));
  const countryOptions = countries.map(country => ({ value: country, label: country }));
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Beneficiary Details */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={User} title="Next Of Kin Details" />
          <div className="flex flex-col">
            <FormRow 
              label="Full Name" 
              isSaving={isFieldSaving['beneficiary.fullName']}
            >
              <EditableField
                id="beneficiary.fullName"
                label=""
                value={formData.beneficiary.fullName}
                onUpdate={(value) => onUpdate('beneficiary', 'fullName', value)}
                isSaving={isFieldSaving['beneficiary.fullName']}
              />
            </FormRow>

            <FormRow 
              label="Relationship" 
              isSaving={isFieldSaving['beneficiary.relationship']}
            >
              <EditableField
                id="beneficiary.relationship"
                label=""
                value={formData.beneficiary.relationship}
                type="select"
                options={relationshipOptions}
                onUpdate={(value) => onUpdate('beneficiary', 'relationship', value)}
                isSaving={isFieldSaving['beneficiary.relationship']}
              />
            </FormRow>

            <FormRow 
              label="Email" 
              isSaving={isFieldSaving['beneficiary.email']}
            >
              <EditableField
                id="beneficiary.email"
                label=""
                type="email"
                value={formData.beneficiary.email}
                onUpdate={(value) => onUpdate('beneficiary', 'email', value)}
                isSaving={isFieldSaving['beneficiary.email']}
              />
            </FormRow>

            <FormRow 
              label="Mobile" 
              isSaving={isFieldSaving['beneficiary.mobile']}
            >
              <EditableField
                id="beneficiary.mobile"
                label=""
                value={formData.beneficiary.mobile}
                onUpdate={(value) => onUpdate('beneficiary', 'mobile', value)}
                isSaving={isFieldSaving['beneficiary.mobile']}
              />
            </FormRow>

            <FormRow 
              label="Same as Employee Address" 
              isSaving={isFieldSaving['beneficiary.sameAddress']}
            >
              <EditableField
                id="beneficiary.sameAddress"
                label=""
                value={formData.beneficiary.sameAddress}
                type="checkbox"
                onUpdate={(checked) => onUpdate('beneficiary', 'sameAddress', checked)}
                isSaving={isFieldSaving['beneficiary.sameAddress']}
              />
            </FormRow>
          </div>
        </div>

        {/* Right Column: Address Details (Conditional) */}
        {!formData.beneficiary.sameAddress && (
          <div className=" rounded-lg border border-gray-200 bg-white shadow-sm h-fit animate-in slide-in-from-left-4 fade-in duration-300">
            <SectionHeader icon={MapPin} title="Address Details" />
            <div className="flex flex-col">
              <FormRow 
                label="Address Line 1" 
                isSaving={isFieldSaving['beneficiary.address.line1']}
              >
                <EditableField
                  id="beneficiary.address.line1"
                  label=""
                  value={formData.beneficiary.address.line1}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    line1: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.line1']}
                />
              </FormRow>

              <FormRow 
                label="Address Line 2" 
                isSaving={isFieldSaving['beneficiary.address.line2']}
              >
                <EditableField
                  id="beneficiary.address.line2"
                  label=""
                  value={formData.beneficiary.address.line2}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    line2: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.line2']}
                />
              </FormRow>

              <FormRow 
                label="City" 
                isSaving={isFieldSaving['beneficiary.address.city']}
              >
                <EditableField
                  id="beneficiary.address.city"
                  label=""
                  value={formData.beneficiary.address.city}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    city: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.city']}
                />
              </FormRow>

              <FormRow 
                label="State" 
                isSaving={isFieldSaving['beneficiary.address.state']}
              >
                <EditableField
                  id="beneficiary.address.state"
                  label=""
                  value={formData.beneficiary.address.state}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    state: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.state']}
                />
              </FormRow>

              <FormRow 
                label="Post Code" 
                isSaving={isFieldSaving['beneficiary.address.postCode']}
              >
                <EditableField
                  id="beneficiary.address.postCode"
                  label=""
                  value={formData.beneficiary.address.postCode}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    postCode: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.postCode']}
                />
              </FormRow>

              <FormRow 
                label="Country" 
                isSaving={isFieldSaving['beneficiary.address.country']}
              >
                <EditableField
                  id="beneficiary.address.country"
                  label=""
                  value={formData.beneficiary.address.country}
                  type="select"
                  options={countryOptions}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    country: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.country']}
                />
              </FormRow>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BeneficiaryTab;