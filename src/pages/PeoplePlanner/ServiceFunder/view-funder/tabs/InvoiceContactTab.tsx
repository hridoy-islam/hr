import React from 'react';
import { EditableField } from '../components/EditableField';

interface InvoiceContactTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: string, formData: Record<string, any>) => string[];
}

const deliveryTypeOptions = [
  { value: 'email', label: 'Email' },
  { value: 'postal', label: 'Postal' },
  { value: 'fax', label: 'Fax' }
];

const InvoiceContactTab: React.FC<InvoiceContactTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
  getMissingFields
}) => {
  const missingFields = getMissingFields('invoiceContact', formData);
  const isFieldMissing = (key: string) => missingFields.includes(key);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Invoice Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="invoice.phone"
            label="Phone"
            type="text"
            value={formData.invoice?.phone || ''}
            onUpdate={(value) => onUpdate('invoice.phone', value)}
            isSaving={isFieldSaving['invoice.phone']}
            isMissing={isFieldMissing('invoice.phone')}
          />

          <EditableField
            id="invoice.fax"
            label="Fax"
            type="text"
            value={formData.invoice?.fax || ''}
            onUpdate={(value) => onUpdate('invoice.fax', value)}
            isSaving={isFieldSaving['invoice.fax']}
            isMissing={isFieldMissing('invoice.fax')}
          />

          <EditableField
            id="invoice.mobile"
            label="Mobile"
            type="text"
            value={formData.invoice?.mobile || ''}
            onUpdate={(value) => onUpdate('invoice.mobile', value)}
            isSaving={isFieldSaving['invoice.mobile']}
            isMissing={isFieldMissing('invoice.mobile')}
          />

          <EditableField
            id="invoice.other"
            label="Other"
            type="text"
            value={formData.invoice?.other || ''}
            onUpdate={(value) => onUpdate('invoice.other', value)}
            isSaving={isFieldSaving['invoice.other']}
            isMissing={isFieldMissing('invoice.other')}
          />

          <EditableField
            id="invoice.email"
            label="Email"
            type="text"
            value={formData.invoice?.email || ''}
            onUpdate={(value) => onUpdate('invoice.email', value)}
            isSaving={isFieldSaving['invoice.email']}
            required
            isMissing={isFieldMissing('invoice.email')}
          />

          <EditableField
            id="invoice.website"
            label="Website"
            type="text"
            value={formData.invoice?.website || ''}
            onUpdate={(value) => onUpdate('invoice.website', value)}
            isSaving={isFieldSaving['invoice.website']}
            isMissing={isFieldMissing('invoice.website')}
          />

          <EditableField
            id="invoice.deliveryType"
            label="Invoice Delivery Type"
            type="select"
            value={formData.invoice?.deliveryType || null}
            options={deliveryTypeOptions}
            onUpdate={(value) => onSelectChange('invoice.deliveryType', value)}
            isSaving={isFieldSaving['invoice.deliveryType']}
            required
            isMissing={isFieldMissing('invoice.deliveryType')}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceContactTab;
