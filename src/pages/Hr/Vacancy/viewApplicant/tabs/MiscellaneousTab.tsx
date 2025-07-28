import React from 'react';
import { EditableField } from '../components/EditableField';
import moment from 'moment';

interface MiscellaneousTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  onSelectChange: (field: string, value: string) => void;
  onCheckboxChange: (field: string, value: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const MiscellaneousTab: React.FC<MiscellaneousTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  onCheckboxChange,
  isFieldSaving,
}) => {
 const employmentTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'intern', label: 'Intern' }
  ];

  const sourceOptions = [
    { value: 'Job Board', label: 'Job Board' },
    { value: 'Company Website', label: 'Company Website' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Recruitment Agency', label: 'Recruitment Agency' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Career Fair', label: 'Career Fair' },
    { value: 'Direct Application', label: 'Direct Application' },
    { value: 'Other', label: 'Other' },
  ];

  // const statusOptions = [
  //   { value: 'Applied', label: 'Applied' },
  //   { value: 'Under Review', label: 'Under Review' },
  //   { value: 'Interview Scheduled', label: 'Interview Scheduled' },
  //   { value: 'Interviewed', label: 'Interviewed' },
  //   { value: 'Offer Extended', label: 'Offer Extended' },
  //   { value: 'Hired', label: 'Hired' },
  //   { value: 'Rejected', label: 'Rejected' },
  //   { value: 'Withdrawn', label: 'Withdrawn' },
  // ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Application Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="applicationDate"
            label="Application Date"
            value={formData.applicationDate ? moment(formData.applicationDate).format('YYYY-MM-DD') : ''}
            type="date"
            onUpdate={(value) => onDateChange('applicationDate', value)}
            isSaving={isFieldSaving.applicationDate}
            required
          />

          <EditableField
            id="availableFromDate"
            label="Available From Date"
            value={formData.availableFromDate ? moment(formData.availableFromDate).format('YYYY-MM-DD') : ''}
            type="date"
            onUpdate={(value) => onDateChange('availableFromDate', value)}
            isSaving={isFieldSaving.availableFromDate}
            required
          />

          <EditableField
            id="position"
            label="Position Applied For"
            value={formData.position}
            onUpdate={(value) => onUpdate('position', value)}
            isSaving={isFieldSaving.position}
            required
            placeholder="Enter position title"
          />

          <EditableField
            id="employmentType"
            label="Employment Type"
            value={formData.employmentType}
            type="select"
            options={employmentTypeOptions}
            onUpdate={(value) => onSelectChange('employmentType', value)}
            isSaving={isFieldSaving.employmentType}
            required
          />

          <EditableField
            id="source"
            label="Application Source"
            value={formData.source}
            type="select"
            options={sourceOptions}
            onUpdate={(value) => onSelectChange('source', value)}
            isSaving={isFieldSaving.source}
            required
          />

          <EditableField
            id="branch"
            label="Branch/Department"
            value={formData.branch}
            onUpdate={(value) => onUpdate('branch', value)}
            isSaving={isFieldSaving.branch}
            required
            placeholder="Enter branch or department"
          />

          {/* <EditableField
            id="status"
            label="Application Status"
            value={formData.status}
            type="select"
            options={statusOptions}
            onUpdate={(value) => onSelectChange('status', value)}
            isSaving={isFieldSaving.status}
            required
          /> */}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Accessibility & Support
        </h3>
        
        <div className="space-y-6">
          <EditableField
            id="hasDisability"
            label="Has Disability"
            value={formData.hasDisability}
            type="checkbox"
            onUpdate={(value) => onCheckboxChange('hasDisability', value)}
            isSaving={isFieldSaving.hasDisability}
          />

          {formData.hasDisability && (
            <EditableField
              id="disabilityDetails"
              label="Disability Details"
              value={formData.disabilityDetails}
              type="textarea"
              onUpdate={(value) => onUpdate('disabilityDetails', value)}
              isSaving={isFieldSaving.disabilityDetails}
              placeholder="Please provide details about the disability"
              rows={3}
            />
          )}

          <EditableField
            id="needsReasonableAdjustment"
            label="Needs Reasonable Adjustment"
            value={formData.needsReasonableAdjustment}
            type="checkbox"
            onUpdate={(value) => onCheckboxChange('needsReasonableAdjustment', value)}
            isSaving={isFieldSaving.needsReasonableAdjustment}
          />

          {formData.needsReasonableAdjustment && (
            <EditableField
              id="reasonableAdjustmentDetails"
              label="Reasonable Adjustment Details"
              value={formData.reasonableAdjustmentDetails}
              type="textarea"
              onUpdate={(value) => onUpdate('reasonableAdjustmentDetails', value)}
              isSaving={isFieldSaving.reasonableAdjustmentDetails}
              placeholder="Please describe the reasonable adjustments needed"
              rows={3}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MiscellaneousTab;