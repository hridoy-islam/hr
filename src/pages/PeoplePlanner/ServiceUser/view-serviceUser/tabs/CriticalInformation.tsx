import React, { useState } from 'react';
import { EditableField } from '../components/EditableField';
import { countries } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from 'react-select';

interface CriticalInfoItem {
  date: string;
  type: { label: string; value: string | null } ;
  details: string;
}

interface AddressTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: () => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const typeOptions = [
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' }
];

const CriticalInfoTab: React.FC<AddressTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  getMissingFields,
  isFieldSaving
}) => {
  const [criticalInfo, setCriticalInfo] = useState<CriticalInfoItem[]>([
    { date: '', type: null, details: '' }
  ]);

  const handleCriticalChange = (
    index: number,
    field: keyof CriticalInfoItem,
    value: any
  ) => {
    const updated = [...criticalInfo];
    updated[index][field] = value;
    setCriticalInfo(updated);
     onUpdate('criticalInfo', updated);
  };

  const addMoreCriticalInfo = () => {
    setCriticalInfo([...criticalInfo, { date: '', type: null, details: '' }]);
  };

const getMissingCriticalFields = (criticalInfo: CriticalInfoItem): (keyof CriticalInfoItem)[] => {
  const missing: (keyof CriticalInfoItem)[] = [];

  if (!criticalInfo.date?.toString().trim()) {
    missing.push('date');
  }

  if (!criticalInfo.type || !criticalInfo.type.value?.toString().trim()) {
    missing.push('type');
  }

  if (!criticalInfo.details?.toString().trim()) {
    missing.push('details');
  }

  return missing;
};


  const isFieldMissing = (index: number, field: keyof CriticalInfoItem) => {
    const critical = criticalInfo[index];
    const missing = getMissingCriticalFields(critical);
    return missing.includes(field);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Critical Information Entries */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Critical Information
        </h3>

        {criticalInfo.map((info, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Date Field */}
            <EditableField
              id={`date-${index}`}
              label="Date"
              value={info.date}
              type="date"
              onUpdate={(val) => handleCriticalChange(index, 'date', val)}
              isSaving={false}
              isMissing={isFieldMissing(index, 'date')}
              required
            />

            {/* Type Field - with Select */}
            <EditableField
              id={`type-${index}`}
              label="Type"
              value={info.type ? info.type.value : null}
              type="select"
              options={typeOptions}
              onUpdate={(val) =>
                handleCriticalChange(
                  index,
                  'type',
                  typeOptions.find((option) => option.value === val) || null
                )
              }
              isSaving={isFieldSaving[`type-${index}`]}
              isMissing={isFieldMissing(index, 'type')}
              required
            />

            {/* Details Field */}
            <EditableField
              id={`details-${index}`}
              label="Details"
              value={info.details}
              type="textarea"
              onUpdate={(val) => handleCriticalChange(index, 'details', val)}
              isSaving={false} // or use isFieldSaving[`details-${index}`]
              isMissing={isFieldMissing(index, 'details')}
              required
            />
          </div>
        ))}

        <Button type="button" onClick={addMoreCriticalInfo}>
          + Add More
        </Button>
      </div>
    </div>
  );
};

export default CriticalInfoTab;
