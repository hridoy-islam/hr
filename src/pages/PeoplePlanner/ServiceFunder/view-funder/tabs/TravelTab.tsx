import React from 'react';
import { EditableField } from '../components/EditableField';

interface TravelTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const travelTypeOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Actual', value: 'actual' }
];

const TravelTab: React.FC<TravelTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  getMissingFields,
  isFieldSaving
}) => {
  const missingFields = getMissingFields('travel', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Travel Information
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="travelType"
            label="Travel Type"
            value={formData.travelType}
            type="select"
            options={travelTypeOptions}
            onUpdate={(value) => onSelectChange('travelType', value)}
            isSaving={isFieldSaving.travelType}
            required
            isMissing={isFieldMissing('travelType')}
          />
        </div>
      </div>
    </div>
  );
};

export default TravelTab;
