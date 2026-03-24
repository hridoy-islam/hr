import React from 'react';
import { EditableField } from '../components/EditableField';
import moment from '@/lib/moment-setup';

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
  isFieldSaving
}) => {
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Prof' }
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

  const idDocumentOptions = [
    { value: 'Passport', label: 'Passport' },
    { value: 'Driving Licence', label: 'Driving Licence' }
  ];

  const employmentTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'bank', label: 'Bank/Casual' }
  ];

  return (
    <div className="space-y-8">
      {/* 1. General Personal Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            placeholder="M"
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
            value={
              formData.dateOfBirth
                ? moment(formData.dateOfBirth).format('DD-MM-YYYY')
                : ''
            }
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

      {/* 2. Identification & Document Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Identification Numbers
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EditableField
            id="nationalInsuranceNumber"
            label="NI Number"
            value={formData.nationalInsuranceNumber}
            onUpdate={(value) => onUpdate('nationalInsuranceNumber', value)}
            isSaving={isFieldSaving.nationalInsuranceNumber}
            placeholder="QQ 12 34 56 C"
          />
          <EditableField
            id="nhsNumber"
            label="NHS Number"
            value={formData.nhsNumber}
            onUpdate={(value) => onUpdate('nhsNumber', value)}
            isSaving={isFieldSaving.nhsNumber}
            placeholder="Enter NHS number"
          />
          <EditableField
            id="idDocumentType"
            label="Primary ID Document"
            value={formData.idDocumentType}
            type="select"
            options={idDocumentOptions}
            onUpdate={(value) => onSelectChange('idDocumentType', value)}
            isSaving={isFieldSaving.idDocumentType}
            required
          />

          {/* Toggle Logic: Show Driving Licence if selected, otherwise show Passport */}
          {formData.idDocumentType === 'Driving Licence' ? (
            <>
              <EditableField
                id="drivingLicenceNo"
                label="Driving Licence No"
                value={formData.drivingLicenceNo}
                onUpdate={(value) => onUpdate('drivingLicenceNo', value)}
                isSaving={isFieldSaving.drivingLicenceNo}
                placeholder="Enter Licence No"
                required
              />
              <EditableField
                id="drivingLicenceExpiry"
                label="Licence Expiry"
                value={
                  formData.drivingLicenceExpiry
                    ? moment(formData.drivingLicenceExpiry).format('DD-MM-YYYY')
                    : ''
                }
                type="date"
                onUpdate={(value) =>
                  onDateChange('drivingLicenceExpiry', value)
                }
                isSaving={isFieldSaving.drivingLicenceExpiry}
                required
              />
            </>
          ) : (
            <>
              <EditableField
                id="passportNo"
                label="Passport Number"
                value={formData.passportNo}
                onUpdate={(value) => onUpdate('passportNo', value)}
                isSaving={isFieldSaving.passportNo}
                placeholder="Enter Passport No"
                required
              />
              <EditableField
                id="passportExpiry"
                label="Passport Expiry"
                value={
                  formData.passportExpiry
                    ? moment(formData.passportExpiry).format('DD-MM-YYYY')
                    : ''
                }
                type="date"
                onUpdate={(value) => onDateChange('passportExpiry', value)}
                isSaving={isFieldSaving.passportExpiry}
                required
              />
            </>
          )}
        </div>
      </div>

      {/* 3. Employment & Application Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Application & Employment
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EditableField
            id="employmentType"
            label="Employment Type"
            value={formData.employmentType}
            type="select"
            options={employmentTypeOptions}
            onUpdate={(value) => onSelectChange('employmentType', value)}
            isSaving={isFieldSaving.employmentType}
          />
          <EditableField
            id="position"
            label="Position"
            value={formData.position}
            onUpdate={(value) => onUpdate('position', value)}
            isSaving={isFieldSaving.position}
            placeholder="e.g. Registered Nurse"
          />
          {/* <EditableField
            id="contractHours"
            label="Contract Hours"
            value={formData.contractHours}
            onUpdate={(value) => onUpdate('contractHours', value)}
            isSaving={isFieldSaving.contractHours}
            placeholder="e.g. 37.5"
          /> */}
          <EditableField
            id="branch"
            label="Branch"
            value={formData.branch}
            onUpdate={(value) => onUpdate('branch', value)}
            isSaving={isFieldSaving.branch}
            placeholder="Enter branch location"
          />
          <EditableField
            id="applicationDate"
            label="Application Date"
            value={
              formData.applicationDate
                ? moment(formData.applicationDate).format('DD-MM-YYYY')
                : ''
            }
            type="date"
            onUpdate={(value) => onDateChange('applicationDate', value)}
            isSaving={isFieldSaving.applicationDate}
          />
          <EditableField
            id="availableFromDate"
            label="Available From"
            value={
              formData.availableFromDate
                ? moment(formData.availableFromDate).format('DD-MM-YYYY')
                : ''
            }
            type="date"
            onUpdate={(value) => onDateChange('availableFromDate', value)}
            isSaving={isFieldSaving.availableFromDate}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
