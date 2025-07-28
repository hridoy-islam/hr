import React from 'react';
import { EditableField } from '../components/EditableField';

interface DayOnOffTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const DayOnOffTab: React.FC<DayOnOffTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving,
  getMissingFields
}) => {
  const missingFields = getMissingFields('dayOnOff', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };

  return (
    <div className="space-y-4">
      {/* Duty Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <h3 className=" text-lg font-semibold text-gray-900">
          Duty
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <EditableField
            id="plannedDate"
            label="Planned Date"
            value={formData.plannedDate}
            type="date"
            onUpdate={(value) => onUpdate('plannedDate', value)}
            isSaving={isFieldSaving.plannedDate}
            required
            isMissing={isFieldMissing('plannedDate')}
          />

          <EditableField
            id="actualDate"
            label="Actual Date"
            value={formData.actualDate}
            type="date"
            onUpdate={(value) => onUpdate('actualDate', value)}
            isSaving={isFieldSaving.actualDate}
            required
            isMissing={isFieldMissing('actualDate')}
          />

          <EditableField
            id="plannedStartTime"
            label="Start Time"
            value={formData.plannedStartTime}
            type="time"
            onUpdate={(value) => onUpdate('plannedStartTime', value)}
            isSaving={isFieldSaving.plannedStartTime}
            required
            isMissing={isFieldMissing('plannedStartTime')}
          />

          <EditableField
            id="actualEndTime"
            label="End Time"
            value={formData.actualEndTime}
            type="time"
            onUpdate={(value) => onUpdate('actualEndTime', value)}
            isSaving={isFieldSaving.actualEndTime}
            required
            isMissing={isFieldMissing('actualEndTime')}
          />

          <EditableField
            id="duration"
            label="Duration"
            value={formData.duration}
            type="text"
            onUpdate={(value) => onUpdate('duration', value)}
            isSaving={isFieldSaving.duration}
            placeholder="HH:MM"
            required
            isMissing={isFieldMissing('duration')}
          />
        </div>
      </div>

      {/* Book On Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <h3 className=" text-lg font-semibold text-gray-900">
          Book On
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <EditableField
            id="bookOnMethod"
            label="Method"
            value={formData.bookOnMethod}
            type="text"
            onUpdate={(value) => onUpdate('bookOnMethod', value)}
            isSaving={isFieldSaving.bookOnMethod}
          />

          <EditableField
            id="bookOnDate"
            label="Date"
            value={formData.bookOnDate}
            type="date"
            onUpdate={(value) => onUpdate('bookOnDate', value)}
            isSaving={isFieldSaving.bookOnDate}
          />

          <EditableField
            id="bookOnTime"
            label="Time"
            value={formData.bookOnTime}
            type="time"
            onUpdate={(value) => onUpdate('bookOnTime', value)}
            isSaving={isFieldSaving.bookOnTime}
          />

          <div className="md:col-span-2">
            <EditableField
              id="bookOnNotes"
              label="Notes"
              value={formData.bookOnNotes}
              type="textarea"
              onUpdate={(value) => onUpdate('bookOnNotes', value)}
              isSaving={isFieldSaving.bookOnNotes}
            />
          </div>
        </div>
      </div>

      {/* Book Off Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <h3 className="  border-gray-200  text-lg font-semibold text-gray-900">
          Book Off
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <EditableField
            id="bookOffMethod"
            label="Method"
            value={formData.bookOffMethod}
            type="text"
            onUpdate={(value) => onUpdate('bookOffMethod', value)}
            isSaving={isFieldSaving.bookOffMethod}
          />

          <EditableField
            id="bookOffDate"
            label="Date"
            value={formData.bookOffDate}
            type="date"
            onUpdate={(value) => onUpdate('bookOffDate', value)}
            isSaving={isFieldSaving.bookOffDate}
          />

          <EditableField
            id="bookOffTime"
            label="Time"
            value={formData.bookOffTime}
            type="time"
            onUpdate={(value) => onUpdate('bookOffTime', value)}
            isSaving={isFieldSaving.bookOffTime}
          />

          <div className="md:col-span-2">
            <EditableField
              id="bookOffNotes"
              label="Notes"
              value={formData.bookOffNotes}
              type="textarea"
              onUpdate={(value) => onUpdate('bookOffNotes', value)}
              isSaving={isFieldSaving.bookOffNotes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayOnOffTab;