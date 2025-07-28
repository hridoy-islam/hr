import React from 'react';
import moment from 'moment';
import { countries } from '@/types';
import { EditableField } from '../components/EditableField';

interface GeneralInfoTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  isFieldSaving,
  getMissingFields
}) => {
  const missingFields = getMissingFields('general', formData);

  const isFieldMissing = (fieldKey: string) => {
    return missingFields.includes(fieldKey);
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    const duration = moment.duration(end.diff(start)).asMinutes();
    return `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Date & Time Section */}
      <div className="rounded border border-gray-200 bg-white p-2">
        <h3 className="mb-2 text-xs font-semibold text-gray-900">Date & Time</h3>
        <div className="grid grid-cols-3 gap-2">
          <EditableField
            id="date"
            label="Date"
            value={formData.date}
            type="date"
            onUpdate={(value) => onDateChange('date', value)}
            isSaving={isFieldSaving.date}
            required
            isMissing={isFieldMissing('date')}
            compact
          />
          <EditableField
            id="startTime"
            label="Start"
            value={formData.startTime}
            type="time"
            onUpdate={(value) => onUpdate('startTime', value)}
            isSaving={isFieldSaving.startTime}
            required
            isMissing={isFieldMissing('startTime')}
            compact
          />
          <EditableField
            id="endTime"
            label="End"
            value={formData.endTime}
            type="time"
            onUpdate={(value) => onUpdate('endTime', value)}
            isSaving={isFieldSaving.endTime}
            required
            isMissing={isFieldMissing('endTime')}
            compact
          />
          <EditableField
            id="duration"
            label="Duration"
            value={calculateDuration(formData.startTime, formData.endTime)}
            readOnly
            isSaving={false}
            compact
          />
          <EditableField
            id="timeInMinutes"
            label="Mins"
            value={formData.timeInMinutes}
            type="number"
            onUpdate={(value) => onUpdate('timeInMinutes', value)}
            isSaving={isFieldSaving.timeInMinutes}
            required
            isMissing={isFieldMissing('timeInMinutes')}
            compact
          />
          <EditableField
            id="travelTime"
            label="Travel (mins)"
            value={formData.travelTime}
            type="number"
            onUpdate={(value) => onUpdate('travelTime', value)}
            isSaving={isFieldSaving.travelTime}
            required
            isMissing={isFieldMissing('travelTime')}
            compact
          />
        </div>
      </div>

      {/* Service User & Funder Section */}
      <div className="rounded border border-gray-200 bg-white p-2">
        <h3 className="mb-2 text-xs font-semibold text-gray-900">Service User & Funder</h3>
        <div className="grid grid-cols-4 gap-2">
          <EditableField
            id="branch"
            label="Branch"
            value={formData.branch}
            type="select"
            options={[
              { value: 'Everycare Romford', label: 'Everycare Romford' },
            ]}
            onUpdate={(value) => onSelectChange('branch', value)}
            isSaving={isFieldSaving.branch}
            required
            isMissing={isFieldMissing('branch')}
            compact
          />
          <EditableField
            id="area"
            label="Area"
            value={formData.area}
            type="select"
            options={[
              { value: 'Care', label: 'Care' },
            ]}
            onUpdate={(value) => onSelectChange('area', value)}
            isSaving={isFieldSaving.area}
            required
            isMissing={isFieldMissing('area')}
            compact
          />
          <EditableField
            id="serviceUser"
            label="Service User"
            value={formData.serviceUser}
            type="select"
            options={[
              { value: 'Hasan Mahi', label: 'Hasan Mahi' },
            ]}
            onUpdate={(value) => onSelectChange('serviceUser', value)}
            isSaving={isFieldSaving.serviceUser}
            required
            isMissing={isFieldMissing('serviceUser')}
            compact
          />
          <EditableField
            id="serviceFunder"
            label="Funder"
            value={formData.serviceFunder}
            type="select"
            options={[
              { value: 'Independent Living Agency', label: 'Independent Living Agency' },
            ]}
            onUpdate={(value) => onSelectChange('serviceFunder', value)}
            isSaving={isFieldSaving.serviceFunder}
            required
            isMissing={isFieldMissing('serviceFunder')}
            compact
          />
        </div>
      </div>

      {/* Employee Section */}
      <div className="rounded border border-gray-200 bg-white p-2">
        <h3 className="mb-2 text-xs font-semibold text-gray-900">Employee</h3>
        <div className="grid grid-cols-3 gap-2">
          <EditableField
            id="employeeBranch"
            label="Branch"
            value={formData.employeeBranch}
            type="select"
            options={[
              { value: 'Everycare Romford', label: 'Everycare Romford' },
            ]}
            onUpdate={(value) => onSelectChange('employeeBranch', value)}
            isSaving={isFieldSaving.employeeBranch}
            required
            isMissing={isFieldMissing('employeeBranch')}
            compact
          />
          <EditableField
            id="employeeArea"
            label="Area"
            value={formData.employeeArea}
            type="select"
            options={[
              { value: 'Care', label: 'Care' },
            ]}
            onUpdate={(value) => onSelectChange('employeeArea', value)}
            isSaving={isFieldSaving.employeeArea}
            required
            isMissing={isFieldMissing('employeeArea')}
            compact
          />
          <EditableField
            id="employee"
            label="Employee"
            value={formData.employee}
            type="select"
            options={[
              { value: 'AKTER, FARHANA', label: 'AKTER, FARHANA' },
            ]}
            onUpdate={(value) => onSelectChange('employee', value)}
            isSaving={isFieldSaving.employee}
            required
            isMissing={isFieldMissing('employee')}
            compact
          />
        </div>
      </div>

      {/* Service & Rates Section */}
      <div className="rounded border border-gray-200 bg-white p-2">
        <h3 className="mb-2 text-xs font-semibold text-gray-900">Service & Rates</h3>
        <div className="grid grid-cols-4 gap-2">
          <EditableField
            id="serviceType"
            label="Service Type"
            value={formData.serviceType}
            type="select"
            options={[
              { value: 'Care', label: 'Care' },
            ]}
            onUpdate={(value) => onSelectChange('serviceType', value)}
            isSaving={isFieldSaving.serviceType}
            required
            isMissing={isFieldMissing('serviceType')}
            compact
          />
          <EditableField
            id="visitType"
            label="Visit Type"
            value={formData.visitType}
            type="select"
            options={[
              { value: 'Other', label: 'Other' },
            ]}
            onUpdate={(value) => onSelectChange('visitType', value)}
            isSaving={isFieldSaving.visitType}
            required
            isMissing={isFieldMissing('visitType')}
            compact
          />
          <EditableField
            id="payRate"
            label="Pay Rate"
            value={formData.payRate}
            type="number"
            onUpdate={(value) => onUpdate('payRate', value)}
            isSaving={isFieldSaving.payRate}
            required
            isMissing={isFieldMissing('payRate')}
            compact
          />
          <EditableField
            id="invoiceRate"
            label="Invoice Rate"
            value={formData.invoiceRate}
            type="number"
            onUpdate={(value) => onUpdate('invoiceRate', value)}
            isSaving={isFieldSaving.invoiceRate}
            required
            isMissing={isFieldMissing('invoiceRate')}
            compact
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="rounded border border-gray-200 bg-white p-2">
        <h3 className="mb-2 text-xs font-semibold text-gray-900">Summary</h3>
        <div className="grid grid-cols-3 gap-2">
          <EditableField
            id="cancellation"
            label="Cancellation"
            value={formData.cancellation}
            type="select"
            options={[
              { value: '', label: '' },
            ]}
            onUpdate={(value) => onSelectChange('cancellation', value)}
            isSaving={isFieldSaving.cancellation}
            compact
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoTab;