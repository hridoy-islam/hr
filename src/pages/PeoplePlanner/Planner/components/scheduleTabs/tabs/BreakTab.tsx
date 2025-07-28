import React from 'react';
import { EditableField } from '../components/EditableField';
import { Button } from '@/components/ui/button';

interface Break {
  startDate: string; // e.g., "23/07/2025"
  startTime: string; // e.g., "14:30"
  endTime: string; // e.g., "15:00"
  type: string; // e.g., "Meeting", "Training", etc.
}

interface BreakTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const BreakTab: React.FC<BreakTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  const breaks: Break[] = formData.breaks || [];

  // Define options
  const typeOptions = [
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Training', label: 'Training' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Other', label: 'Other' }
  ];

  const updateBreakField = <K extends keyof Break>(
    index: number,
    field: K,
    value: Break[K]
  ) => {
    const updated = [...breaks];
    updated[index][field] = value;
    onUpdate('breaks', updated);
  };

  const addNewBreak = () => {
    const updated = [
      ...breaks,
      {
        startDate: '',
        startTime: '',
        endTime: '',
        type: ''
      }
    ];
    onUpdate('breaks', updated);
  };

  const removeBreak = (index: number) => {
    const updated = [...breaks];
    updated.splice(index, 1);
    onUpdate('breaks', updated);
  };

  return (
    <div className="space-y-2">
      {breaks.map((breakItem, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Break #{index + 1}
            </h3>
            <button
              onClick={() => removeBreak(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <EditableField
              id={`startDate-${index}`}
              label="Start Date"
              value={breakItem.startDate}
              type="date"
              onUpdate={(val) => updateBreakField(index, 'startDate', val)}
              isSaving={isFieldSaving[`startDate-${index}`]}
              required
            />
            
            <EditableField
              id={`startTime-${index}`}
              label="Start Time"
              value={breakItem.startTime}
              type="time"
              onUpdate={(val) => updateBreakField(index, 'startTime', val)}
              isSaving={isFieldSaving[`startTime-${index}`]}
              required
            />

            <EditableField
              id={`endTime-${index}`}
              label="End Time"
              value={breakItem.endTime}
              type="time"
              onUpdate={(val) => updateBreakField(index, 'endTime', val)}
              isSaving={isFieldSaving[`endTime-${index}`]}
              required
            />

            <EditableField
              id={`type-${index}`}
              label="Type"
              value={breakItem.type}
              type="select"
              options={typeOptions}
              onUpdate={(val) => updateBreakField(index, 'type', val)}
              isSaving={isFieldSaving[`type-${index}`]}
              required
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={addNewBreak}
          className=" rounded bg-supperagent  text-white hover:bg-supperagent/90"
        >
          Add Break
        </Button>
      </div>
    </div>
  );
};

export default BreakTab;