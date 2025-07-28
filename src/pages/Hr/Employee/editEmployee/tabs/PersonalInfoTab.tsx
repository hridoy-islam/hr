import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';

interface PersonalInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onDateChange: (fieldName: string, dateStr: string) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  isFieldSaving
}) => {
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' }
  ];

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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EditableField
            id="title"
            label="Title"
            value={formData.title}
            type="select"
            options={titleOptions}
            onUpdate={(value) => onSelectChange('title', value)}
            isSaving={isFieldSaving['title']}
          />

          <EditableField
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onUpdate={(value) => onUpdate('firstName', value)}
            isSaving={isFieldSaving['firstName']}
            required
          />

          <EditableField
            id="initial"
            label="Initial"
            value={formData.initial}
            onUpdate={(value) => onUpdate('initial', value)}
            isSaving={isFieldSaving['initial']}
          />

          <EditableField
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onUpdate={(value) => onUpdate('lastName', value)}
            isSaving={isFieldSaving['lastName']}
            required
          />

          <EditableField
            id="dateOfBirth"
            label="Date of Birth"
            value={formData.dateOfBirth ? formData.dateOfBirth.format('YYYY-MM-DD') : ''}
            type="date"
            onUpdate={(value) => onDateChange('dateOfBirth', value)}
            isSaving={isFieldSaving['dateOfBirth']}
            max={moment().subtract(16, 'years').format('YYYY-MM-DD')}
          />

          <EditableField
            id="gender"
            label="Gender"
            value={formData.gender}
            type="select"
            options={genderOptions}
            onUpdate={(value) => onSelectChange('gender', value)}
            isSaving={isFieldSaving['gender']}
          />

          <EditableField
            id="maritalStatus"
            label="Marital Status"
            value={formData.maritalStatus}
            type="select"
            options={maritalStatusOptions}
            onUpdate={(value) => onSelectChange('maritalStatus', value)}
            isSaving={isFieldSaving['maritalStatus']}
          />

          <EditableField
            id="ethnicOrigin"
            label="Ethnic Origin"
            value={formData.ethnicOrigin}
            onUpdate={(value) => onUpdate('ethnicOrigin', value)}
            isSaving={isFieldSaving['ethnicOrigin']}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoTab;