import React from 'react';
import { EditableField } from '../components/EditableField';

interface MiscellaneousTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  onSelectChange: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const MiscellaneousTab: React.FC<MiscellaneousTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  isFieldSaving,
  getMissingFields
}) => {
  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const missingFields = getMissingFields('other', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Employment and Service Details
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="serviceLocationExId"
            label="Service Location Ex ID"
            value={formData.serviceLocationExId || ''}
            type="text"
            onUpdate={(value) => onUpdate('serviceLocationExId', value)}
            isSaving={isFieldSaving.serviceLocationExId}
            required
            isMissing={isFieldMissing('serviceLocationExId')}
          />

          <EditableField
            id="timesheetSignature"
            label="Timesheet Signature Required"
            value={formData.timesheetSignature}
            type="select"
            options={booleanOptions}
            onUpdate={(value) => onSelectChange('timesheetSignature', value)}
            isSaving={isFieldSaving.timesheetSignature}
            required
            isMissing={isFieldMissing('timesheetSignature')}
          />
        </div>

        {formData.timesheetSignature === true && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <EditableField
              id="timesheetSignatureNote"
              label="Timesheet Signature Not Required Note"
              value={formData.timesheetSignatureNote || ''}
              type="textarea"
              onUpdate={(value) => onUpdate('timesheetSignatureNote', value)}
              isSaving={isFieldSaving.timesheetSignatureNote}
              required
              isMissing={isFieldMissing('timesheetSignatureNote')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MiscellaneousTab;
