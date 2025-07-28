import React from 'react';
import { EditableField } from '../components/EditableField';

interface AdhocInvoice {
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  invoiceType?: string;
  invoiceValue?: number | string;
  invoiceSummary?: string;
  note?: string;
}

interface AdhocInvoiceTabProps {
  formData: {
    adhocInvoice: AdhocInvoice[];
  };
  onUpdate: (field: string, value: any, index?: number) => void;
  onSelectChange: (field: string, value: any, index: number) => void;
  onDateChange: (field: string, value: string, index: number) => void;
  isFieldSaving: Record<string, boolean>;
}

const invoiceTypeOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Custom', value: 'custom' }
];

const getMissingAdhocFields = (invoice: AdhocInvoice) => {
  const requiredFields: (keyof AdhocInvoice)[] = [
    'invoiceStartDate',
    'invoiceEndDate',
    'invoiceType',
    'invoiceValue'
  ];
  return requiredFields.filter(
    (field) => invoice[field] === '' || invoice[field] === undefined || invoice[field] === null
  );
};

const AdhocInvoiceTab: React.FC<AdhocInvoiceTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving
}) => {
  const invoices =
  formData.adhocInvoice && formData.adhocInvoice.length > 0
    ? formData.adhocInvoice
    : [
        {
          invoiceStartDate: '',
          invoiceEndDate: '',
          invoiceType: undefined,
          invoiceValue: '',
          invoiceSummary: '',
          note: ''
        }
      ];


  const isFieldMissing = (index: number, field: keyof AdhocInvoice) => {
    const invoice = invoices[index];
    const missing = getMissingAdhocFields(invoice);
    return missing.includes(field);
  };

  const handleAddMore = () => {
    const newInvoiceEntry: AdhocInvoice = {
      invoiceStartDate: '',
      invoiceEndDate: '',
      invoiceType: undefined,
      invoiceValue: '',
      invoiceSummary: '',
      note: ''
    };
    onUpdate('adhocInvoice', [...invoices, newInvoiceEntry]);
  };

  const handleRemove = (index: number) => {
    const updated = [...invoices];
    updated.splice(index, 1);
    onUpdate('adhocInvoice', updated);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Adhoc Invoice Details
        </h3>

        {invoices.length === 0 && (
          <p className="text-gray-500">No invoice data available. Add a new invoice below.</p>
        )}

        {invoices.map((invoice, index) => (
          <div
            key={index}
            className="space-y-6  border-gray-200   last:border-b-0 last:pb-0 last:mb-0 relative group"
          >
            {invoices.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove this invoice"
              >
                ×
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                id={`invoiceStartDate-${index}`}
                label="Invoice Start Date"
                type="date"
                value={invoice.invoiceStartDate || ''}
                onUpdate={(value) => onDateChange('invoiceStartDate', value, index)}
                isSaving={isFieldSaving[`invoiceStartDate-${index}`]}
                required
                isMissing={isFieldMissing(index, 'invoiceStartDate')}
              />

              <EditableField
                id={`invoiceEndDate-${index}`}
                label="Invoice End Date"
                type="date"
                value={invoice.invoiceEndDate || ''}
                onUpdate={(value) => onDateChange('invoiceEndDate', value, index)}
                isSaving={isFieldSaving[`invoiceEndDate-${index}`]}
                required
                isMissing={isFieldMissing(index, 'invoiceEndDate')}
              />

              <EditableField
                id={`invoiceType-${index}`}
                label="Invoice Type"
                type="select"
                options={invoiceTypeOptions}
                value={invoice.invoiceType || ''}
                onUpdate={(value) => onSelectChange('invoiceType', value, index)}
                isSaving={isFieldSaving[`invoiceType-${index}`]}
                required
                isMissing={isFieldMissing(index, 'invoiceType')}
              />

              <EditableField
                id={`invoiceValue-${index}`}
                label="Invoice Value"
                type="number"
                value={invoice.invoiceValue || ''}
                onUpdate={(value) => onUpdate('invoiceValue', value, index)}
                isSaving={isFieldSaving[`invoiceValue-${index}`]}
                required
                isMissing={isFieldMissing(index, 'invoiceValue')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                id={`invoiceSummary-${index}`}
                label="Invoice Summary"
                type="textarea"
                value={invoice.invoiceSummary || ''}
                onUpdate={(value) => onUpdate('invoiceSummary', value, index)}
                isSaving={isFieldSaving[`invoiceSummary-${index}`]}
              />

              <EditableField
                id={`note-${index}`}
                label="Note"
                type="textarea"
                value={invoice.note || ''}
                onUpdate={(value) => onUpdate('note', value, index)}
                isSaving={isFieldSaving[`note-${index}`]}
              />
            </div>
          </div>
        ))}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleAddMore}
          className="mt-4 px-4 py-2 rounded-md bg-supperagent text-white hover:bg-supperagent/90 transition"
          >
            Add More
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdhocInvoiceTab;
