import React from 'react';
import { EditableField } from '../components/EditableField';
import { countries } from '@/types';

interface ContactTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const ContactTab: React.FC<ContactTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  isFieldSaving,
  getMissingFields
}) => {
  const missingFields = getMissingFields('contact', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="phone"
            label="Phone Number"
            value={formData.phone}
            type="text"
            onUpdate={(value) => onUpdate('phone', value)}
            isSaving={isFieldSaving.phone}
            required
            placeholder="Enter phone number"
            isMissing={isFieldMissing('phone')}
          />

          <EditableField
            id="fax"
            label="Fax Number"
            value={formData.fax}
            type="text"
            onUpdate={(value) => onUpdate('fax', value)}
            isSaving={isFieldSaving.fax}
            placeholder="Enter fax number"
          />
          <EditableField
            id="email"
            label="Email"
            value={formData.email}
            type="email"
            onUpdate={(value) => onUpdate('email', value)}
            isSaving={isFieldSaving.email}
            placeholder="Enter the email Contact"
            required
            isMissing={isFieldMissing('email')}
          />

          <EditableField
            id="mobilePhone"
            label="Mobile Phone"
            value={formData.homePhone}
            type="text"
            onUpdate={(value) => onUpdate('mobilePhone', value)}
            isSaving={isFieldSaving.mobilePhone}
            placeholder="Enter Mobile phone number"
            required
            isMissing={isFieldMissing('mobilePhone')}
          />

          <EditableField
            id="otherPhone"
            label="Other Phone"
            value={formData.otherPhone}
            type="text"
            onUpdate={(value) => onUpdate('otherPhone', value)}
            isSaving={isFieldSaving.otherPhone}
            placeholder="Enter other phone number"
          />
          <EditableField
            id="website"
            label="Website"
            value={formData.website}
            type="text"
            onUpdate={(value) => onUpdate('website', value)}
            isSaving={isFieldSaving.website}
            placeholder="Enter website URL"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactTab;
