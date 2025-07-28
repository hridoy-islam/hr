import React from 'react';
import { EditableField } from '../components/EditableField';
import moment from 'moment';

interface PersonalInfoTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  isFieldSaving,
}) => {
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Prof' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Civil Partnership', label: 'Civil Partnership' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EditableField
            id="title"
            label="Title"
            value={formData.title}
            type="select"
            options={titleOptions}
            onUpdate={(value) => onSelectChange('title', value)}
            isSaving={isFieldSaving.title}
            required
          />

          <EditableField
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onUpdate={(value) => onUpdate('firstName', value)}
            isSaving={isFieldSaving.firstName}
            required
            placeholder="Enter first name"
          />

          <EditableField
            id="initial"
            label="Middle Initial"
            value={formData.initial}
            onUpdate={(value) => onUpdate('initial', value)}
            isSaving={isFieldSaving.initial}
            placeholder="Enter middle initial"
            maxLength={1}
          />

          <EditableField
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onUpdate={(value) => onUpdate('lastName', value)}
            isSaving={isFieldSaving.lastName}
            required
            placeholder="Enter last name"
          />

          <EditableField
            id="dateOfBirth"
            label="Date of Birth"
            value={formData.dateOfBirth ? moment(formData.dateOfBirth).format('YYYY-MM-DD') : ''}
            type="date"
            onUpdate={(value) => onDateChange('dateOfBirth', value)}
            isSaving={isFieldSaving.dateOfBirth}
            required
          />

          <EditableField
            id="gender"
            label="Gender"
            value={formData.gender}
            type="select"
            options={genderOptions}
            onUpdate={(value) => onSelectChange('gender', value)}
            isSaving={isFieldSaving.gender}
            required
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
          />

          <EditableField
            id="ethnicOrigin"
            label="Ethnic Origin"
            value={formData.ethnicOrigin}
            onUpdate={(value) => onUpdate('ethnicOrigin', value)}
            isSaving={isFieldSaving.ethnicOrigin}
            placeholder="Enter ethnic origin"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Identification Numbers
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="nationalInsuranceNumber"
            label="National Insurance Number"
            value={formData.nationalInsuranceNumber}
            onUpdate={(value) => onUpdate('nationalInsuranceNumber', value)}
            isSaving={isFieldSaving.nationalInsuranceNumber}
            placeholder="Enter NI number"
          />

          <EditableField
            id="nhsNumber"
            label="NHS Number"
            value={formData.nhsNumber}
            onUpdate={(value) => onUpdate('nhsNumber', value)}
            isSaving={isFieldSaving.nhsNumber}
            placeholder="Enter NHS number"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;