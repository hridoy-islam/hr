import React, { useEffect, useState } from 'react';
import { EditableField } from '../components/EditableField';
import { Button } from '@/components/ui/button';

interface PrimaryBranchItem {
  fromDate: string;
  branch: { label: string; value: string } | null;
  area: { label: string; value: string } | null;
  note: string;
}

interface PrimaryBranchProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: () => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: string, formData: Record<string, any>) => string[];
}

// Dummy select options
const branchOptions = [
  { value: 'branch-1', label: 'Branch 1' },
  { value: 'branch-2', label: 'Branch 2' },
];

const areaOptions = [
  { value: 'area-1', label: 'Area 1' },
  { value: 'area-2', label: 'Area 2' },
];

const PrimaryBranchTab: React.FC<PrimaryBranchProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
  getMissingFields
}) => {
  const branchInfo: PrimaryBranchItem[] = formData.primaryBranch || [];

  // Sync changes to formData
  const handleChange = (
    index: number,
    field: keyof PrimaryBranchItem,
    value: any
  ) => {
    const updated = [...branchInfo];
    updated[index][field] = value;
    onUpdate('primaryBranch', updated);
  };

  const addMore = () => {
    const updated = [
      ...branchInfo,
      { fromDate: '', branch: null, area: null, note: '' }
    ];
    onUpdate('primaryBranch', updated);
  };

  const missingFields = getMissingFields('primaryBranch', formData);

  const isFieldMissing = (index: number, field: keyof PrimaryBranchItem) => {
    return missingFields.includes(`${field}[${index}]`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Primary Branch and Area
        </h3>

        {branchInfo.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <EditableField
              id={`fromDate-${index}`}
              label="From Date"
              value={item.fromDate}
              type="date"
              onUpdate={(val) => handleChange(index, 'fromDate', val)}
              isSaving={false}
              isMissing={isFieldMissing(index, 'fromDate')}
              required
            />

            <EditableField
              id={`branch-${index}`}
              label="Branch"
              value={item.branch ? item.branch.value : ''}
              type="select"
              options={branchOptions}
              onUpdate={(val) =>
                handleChange(
                  index,
                  'branch',
                  branchOptions.find((option) => option.value === val) || null
                )
              }
              isSaving={false}
              isMissing={isFieldMissing(index, 'branch')}
              required
            />

            <EditableField
              id={`area-${index}`}
              label="Area"
              value={item.area ? item.area.value : ''}
              type="select"
              options={areaOptions}
              onUpdate={(val) =>
                handleChange(
                  index,
                  'area',
                  areaOptions.find((option) => option.value === val) || null
                )
              }
              isSaving={false}
              isMissing={isFieldMissing(index, 'area')}
              required
            />

            <EditableField
              id={`note-${index}`}
              label="Note"
              value={item.note}
              type="textarea"
              onUpdate={(val) => handleChange(index, 'note', val)}
              isSaving={false}
            />
          </div>
        ))}

        <Button type="button" onClick={addMore}>
          + Add More
        </Button>
      </div>
    </div>
  );
};

export default PrimaryBranchTab;
