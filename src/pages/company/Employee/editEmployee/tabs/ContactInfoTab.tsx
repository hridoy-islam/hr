import React from 'react';
import { EditableField } from '../EditableField';
import { countries } from '@/types';
import { Loader2, MapPin, Phone } from 'lucide-react';

// --- Layout Components (Reused from PersonalInfoTab for consistency) ---

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

interface ContactInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  isFieldSaving
}) => {
  const countryOptions = countries.map(country => ({ value: country, label: country }));
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Contact Methods */}
        {/* <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={Phone} title="Contact Information" />
          <div className="flex flex-col">
            <FormRow 
              label="Email Address" 
              isSaving={isFieldSaving['email']} 
              required
            >
              <EditableField
                id="email"
                label=""
                value={formData.email}
                type="email"
                onUpdate={(value) => onUpdate('email', value)}
                isSaving={isFieldSaving['email']}
                required
              />
            </FormRow>

            <FormRow 
              label="Mobile Phone" 
              isSaving={isFieldSaving['mobilePhone']} 
              required
            >
              <EditableField
                id="mobilePhone"
                label=""
                value={formData.mobilePhone}
                onUpdate={(value) => onUpdate('mobilePhone', value)}
                isSaving={isFieldSaving['mobilePhone']}
                required
              />
            </FormRow>

            <FormRow 
              label="Home Phone" 
              isSaving={isFieldSaving['homePhone']}
            >
              <EditableField
                id="homePhone"
                label=""
                value={formData.homePhone}
                onUpdate={(value) => onUpdate('homePhone', value)}
                isSaving={isFieldSaving['homePhone']}
              />
            </FormRow>
          </div>
        </div> */}

        {/* Right Column: Address Details */}
        <div className=" rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={MapPin} title="Address Details" />
          <div className="flex flex-col">
            <FormRow 
              label="Street Address" 
              isSaving={isFieldSaving['address']}
            >
              <EditableField
                id="address"
                label=""
                value={formData.address}
                type="textarea"
                rows={1}
                className="resize-none"
                onUpdate={(value) => onUpdate('address', value)}
                isSaving={isFieldSaving['address']}
              />
            </FormRow>

            <FormRow 
              label="City / Town" 
              isSaving={isFieldSaving['cityOrTown']}
            >
              <EditableField
                id="cityOrTown"
                label=""
                value={formData.cityOrTown}
                onUpdate={(value) => onUpdate('cityOrTown', value)}
                isSaving={isFieldSaving['cityOrTown']}
              />
            </FormRow>

            <FormRow 
              label="State / Province" 
              isSaving={isFieldSaving['stateOrProvince']}
            >
              <EditableField
                id="stateOrProvince"
                label=""
                value={formData.stateOrProvince}
                onUpdate={(value) => onUpdate('stateOrProvince', value)}
                isSaving={isFieldSaving['stateOrProvince']}
              />
            </FormRow>

            <FormRow 
              label="Post Code" 
              isSaving={isFieldSaving['postCode']}
            >
              <EditableField
                id="postCode"
                label=""
                value={formData.postCode}
                onUpdate={(value) => onUpdate('postCode', value)}
                isSaving={isFieldSaving['postCode']}
              />
            </FormRow>

            <FormRow 
              label="Country" 
              isSaving={isFieldSaving['country']}
            >
              <EditableField
                id="country"
                label=""
                value={formData.country}
                type="select"
                options={countryOptions}
                onUpdate={(value) => onSelectChange('country', value)}
                isSaving={isFieldSaving['country']}
              />
            </FormRow>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactInfoTab;