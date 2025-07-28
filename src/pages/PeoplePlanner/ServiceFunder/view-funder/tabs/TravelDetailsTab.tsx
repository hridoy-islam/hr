import React from 'react';
import { EditableField } from '../components/EditableField';

interface TravelDetail {
  fromDate: string;
  distance: string;
  type: string;
  reason: string;
  linkedInvoiceRateSheet: string;
}

interface TravelRateDetailTabProps {
  formData: {
    travelDetails: TravelDetail[];
  };
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const travelTypeOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Actual', value: 'actual' }
];

const linkedInvoiceRateSheetOptions = [
  { label: 'Standard Rate Sheet', value: 'standard' },
  { label: 'Custom Rate Sheet A', value: 'customA' },
  { label: 'Custom Rate Sheet B', value: 'customB' }
];

// Get missing fields for one travel entry
const getMissingTravelFields = (travelDetails: TravelDetail) => {
  const requiredFields = ['fromDate', 'type', 'linkedInvoiceRateSheet']; // Add more if needed
  return requiredFields.filter(
    (field) =>
      travelDetails[field as keyof TravelDetail] === '' ||
      travelDetails[field as keyof TravelDetail] === undefined
  );
};

const TravelRateDetailTab: React.FC<TravelRateDetailTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
}) => {
  const travelDetails =
    formData.travelDetails && formData.travelDetails.length > 0
      ? formData.travelDetails
      : [
          {
            fromDate: '',
            distance: '',
            type: '',
            reason: '',
            linkedInvoiceRateSheet: ''
          }
        ];

  const handleFieldChange = (index: number, field: keyof TravelDetail, value: any) => {
    const updated = [...travelDetails];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('travelDetails', updated);
  };

  const addNewTravelDetail = () => {
    const updated = [
      ...travelDetails,
      {
        fromDate: '',
        distance: '',
        type: '',
        reason: '',
        linkedInvoiceRateSheet: ''
      }
    ];
    onUpdate('travelDetails', updated);
  };

  const isFieldMissing = (index: number, field: keyof TravelDetail) => {
    const travelDetail = travelDetails[index];
    const missing = getMissingTravelFields(travelDetail);
    return missing.includes(field);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Travel Details
        </h3>

        {travelDetails.map((entry, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <EditableField
              id={`travelDetails.${index}.fromDate`}
              label="From Date"
              type="date"
              value={entry.fromDate}
              onUpdate={(value) => handleFieldChange(index, 'fromDate', value)}
              isSaving={isFieldSaving[`travelDetails.${index}.fromDate`]}
              required
              isMissing={isFieldMissing(index, 'fromDate')}
            />

            <EditableField
              id={`travelDetails.${index}.distance`}
              label="Distance"
              type="text"
              value={entry.distance}
              onUpdate={(value) => handleFieldChange(index, 'distance', value)}
              isSaving={isFieldSaving[`travelDetails.${index}.distance`]}
            />

            <EditableField
              id={`travelDetails.${index}.type`}
              label="Travel Type"
              type="select"
              options={travelTypeOptions}
              value={entry.type}
              onUpdate={(value) => handleFieldChange(index, 'type', value)}
              isSaving={isFieldSaving[`travelDetails.${index}.type`]}
              required
              isMissing={isFieldMissing(index, 'type')}
            />

            <EditableField
              id={`travelDetails.${index}.reason`}
              label="Reason"
              type="textarea"
              value={entry.reason}
              onUpdate={(value) => handleFieldChange(index, 'reason', value)}
              isSaving={isFieldSaving[`travelDetails.${index}.reason`]}
            />

            <EditableField
              id={`travelDetails.${index}.linkedInvoiceRateSheet`}
              label="Linked Invoice Rate Sheet"
              type="select"
              options={linkedInvoiceRateSheetOptions}
              value={entry.linkedInvoiceRateSheet}
              onUpdate={(value) => handleFieldChange(index, 'linkedInvoiceRateSheet', value)}
              isSaving={isFieldSaving[`travelDetails.${index}.linkedInvoiceRateSheet`]}
              required
              isMissing={isFieldMissing(index, 'linkedInvoiceRateSheet')}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addNewTravelDetail}
          className="mt-4 px-4 py-2 rounded-md bg-supperagent text-white hover:bg-supperagent/90 transition"
        >
          + Add Travel Detail
        </button>
      </div>
    </div>
  );
};

export default TravelRateDetailTab;
