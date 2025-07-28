import React from 'react';
import { EditableField } from '../components/EditableField';
import moment from 'moment';

interface EqualityTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const EqualityTab: React.FC<EqualityTabProps> = ({
  formData,
  onUpdate,
  getMissingFields,
  onSelectChange,
  isFieldSaving
}) => {
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Civil Partnership', label: 'Civil Partnership' }
  ];

  const religionOptions = [
    { value: 'christianity', label: 'Christianity' },
    { value: 'islam', label: 'Islam' },
    { value: 'hinduism', label: 'Hinduism' },
    { value: 'buddhism', label: 'Buddhism' },
    { value: 'sikhism', label: 'Sikhism' },
    { value: 'judaism', label: 'Judaism' },
    { value: 'atheism', label: 'Atheism' },
    { value: 'agnosticism', label: 'Agnosticism' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const missingFields = getMissingFields('equality', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Equality Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="gender"
            label="Gender"
            value={formData.gender}
            type="select"
            options={genderOptions}
            onUpdate={(value) => onSelectChange('gender', value)}
            isSaving={isFieldSaving.gender}
            required
            isMissing={isFieldMissing('gender')}
          />

          <EditableField
            id="maritalStatus"
            label="Marital Status"
            value={formData.maritalStatus}
            type="select"
            options={maritalStatusOptions}
            onUpdate={(value) => onSelectChange('maritalStatus', value)}
            isSaving={isFieldSaving.maritalStatus}
            required
            isMissing={isFieldMissing('maritalStatus')}
          />

          <EditableField
            id="ethnicOrigin"
            label="Ethnic Origin"
            value={formData.ethnicOrigin}
            onUpdate={(value) => onUpdate('ethnicOrigin', value)}
            isSaving={isFieldSaving.ethnicOrigin}
            placeholder="Enter ethnic origin"
          />
          <EditableField
            id="religion"
            label="Religion"
            value={formData.religion}
            type="select"
            options={religionOptions}
            onUpdate={(value) => onUpdate('religion', value)}
            isSaving={isFieldSaving.religion}
            placeholder="Enter religion"
          />
        </div>
      </div>
    </div>
  );
};

export default EqualityTab;
