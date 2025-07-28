import React from 'react';
import { EditableField } from '../components/EditableField';

interface PurchaseOrderTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: any) => void;
  onDateChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: string, formData: Record<string, any>) => string[];
}

const purchaseOrderOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

const PurchaseOrderTab: React.FC<PurchaseOrderTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
  getMissingFields,
}) => {
  const missingFields = getMissingFields('po', formData);
  const isFieldMissing = (key: string) => missingFields.includes(key);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Purchase Order Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="purchaseOrder"
            label="Requires Purchase Order?"
            type="select"
            options={purchaseOrderOptions}
            value={formData.purchaseOrder}
            onUpdate={(value) => onSelectChange('purchaseOrder', value)}
            isSaving={isFieldSaving.purchaseOrder}
            required
            isMissing={isFieldMissing('purchaseOrder')}
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderTab;
