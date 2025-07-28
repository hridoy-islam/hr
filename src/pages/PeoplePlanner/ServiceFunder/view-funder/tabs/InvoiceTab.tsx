import React from 'react';
import { EditableField } from '../components/EditableField';

interface InvoiceTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: string, formData: Record<string, any>) => string[];
}

const linkedOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
];

const typeOptions = [
  { value: 'other-organisation', label: 'Other Organisation' },
  { value: 'private-client', label: 'Private Client' },
  { value: 'business', label: 'Business' }
];

const invoiceRunOptions = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' }
];

const invoiceFormatOptions = [
  { value: 'social-services-by-visit-no-name-or-adc', label: 'Social Services - By Visit - No Name or Adc' },
  { value: 'standard', label: 'Standard' }
];

const invoiceGroupingOptions = [
  { value: 'service-user', label: 'Service User' },
  { value: 'organization', label: 'Organization' }
];

const InvoiceTab: React.FC<InvoiceTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
  getMissingFields
}) => {
  const missingFields = getMissingFields('invoice', formData);
  const isFieldMissing = (key: string) => missingFields.includes(key);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Invoice Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="invoice.linked"
            label="Linked"
            type="select"
            options={linkedOptions}
            value={formData.invoice?.linked}
            onUpdate={(value) => onSelectChange('invoice.linked', value)}
            isSaving={isFieldSaving['invoice.linked']}
            required
            isMissing={isFieldMissing('invoice.linked')}
          />

          <EditableField
            id="invoice.type"
            label="Type"
            type="select"
            options={typeOptions}
            value={formData.invoice?.type}
            onUpdate={(value) => onSelectChange('invoice.type', value)}
            isSaving={isFieldSaving['invoice.type']}
            required
            isMissing={isFieldMissing('invoice.type')}
          />

          <EditableField
            id="invoice.name"
            label="Name"
            type="text"
            value={formData.invoice?.name || ''}
            onUpdate={(value) => onUpdate('invoice.name', value)}
            isSaving={isFieldSaving['invoice.name']}
            required
            isMissing={isFieldMissing('invoice.name')}
          />

          <EditableField
            id="invoice.address"
            label="Address"
            type="textarea"
            value={formData.invoice?.address || ''}
            onUpdate={(value) => onUpdate('invoice.address', value)}
            isSaving={isFieldSaving['invoice.address']}
            required
            isMissing={isFieldMissing('invoice.address')}
          />

          <EditableField
            id="invoice.cityTown"
            label="City / Town"
            type="text"
            value={formData.invoice?.cityTown || ''}
            onUpdate={(value) => onUpdate('invoice.cityTown', value)}
            isSaving={isFieldSaving['invoice.cityTown']}
            required
            isMissing={isFieldMissing('invoice.cityTown')}
          />

          <EditableField
            id="invoice.county"
            label="County"
            type="text"
            value={formData.invoice?.county || ''}
            onUpdate={(value) => onUpdate('invoice.county', value)}
            isSaving={isFieldSaving['invoice.county']}
            isMissing={isFieldMissing('invoice.county')}
          />

          <EditableField
            id="invoice.postCode"
            label="Post Code"
            type="text"
            value={formData.invoice?.postCode || ''}
            onUpdate={(value) => onUpdate('invoice.postCode', value)}
            isSaving={isFieldSaving['invoice.postCode']}
            required
            isMissing={isFieldMissing('invoice.postCode')}
          />

          <EditableField
            id="invoice.customerExternalId"
            label="Customer External ID"
            type="text"
            value={formData.invoice?.customerExternalId || ''}
            onUpdate={(value) => onUpdate('invoice.customerExternalId', value)}
            isSaving={isFieldSaving['invoice.customerExternalId']}
            required
            isMissing={isFieldMissing('invoice.customerExternalId')}
          />

          <EditableField
            id="invoice.invoiceRun"
            label="Invoice Run"
            type="select"
            options={invoiceRunOptions}
            value={formData.invoice?.invoiceRun}
            onUpdate={(value) => onSelectChange('invoice.invoiceRun', value)}
            isSaving={isFieldSaving['invoice.invoiceRun']}
            required
            isMissing={isFieldMissing('invoice.invoiceRun')}
          />

          <EditableField
            id="invoice.invoiceFormat"
            label="Invoice Format"
            type="select"
            options={invoiceFormatOptions}
            value={formData.invoice?.invoiceFormat}
            onUpdate={(value) => onSelectChange('invoice.invoiceFormat', value)}
            isSaving={isFieldSaving['invoice.invoiceFormat']}
            required
            isMissing={isFieldMissing('invoice.invoiceFormat')}
          />

          <EditableField
            id="invoice.invoiceGrouping"
            label="Invoice Grouping"
            type="select"
            options={invoiceGroupingOptions}
            value={formData.invoice?.invoiceGrouping}
            onUpdate={(value) => onSelectChange('invoice.invoiceGrouping', value)}
            isSaving={isFieldSaving['invoice.invoiceGrouping']}
            required
            isMissing={isFieldMissing('invoice.invoiceGrouping')}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceTab;
