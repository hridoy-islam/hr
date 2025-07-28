import React from 'react';
import { EditableField } from '../components/EditableField';

interface EquipmentTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const EquipmentTab: React.FC<EquipmentTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,

  isFieldSaving
}) => {
  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Equipment Required
        </h3>

        <EditableField
          id="glovesAprons"
          label="Gloves and Aprons"
          type="checkbox"
          value={formData.glovesAprons}
          onUpdate={(value) => onUpdate('glovesAprons', value)}
          isSaving={isFieldSaving.glovesAprons}
        />

        <EditableField
          id="uniform"
          label="Uniform"
          type="checkbox"
          value={formData.uniform}
          onUpdate={(value) => onUpdate('uniform', value)}
          isSaving={isFieldSaving.uniform}
        />

        <EditableField
          id="idBadge"
          label="ID Badge"
          type="checkbox"
          value={formData.idBadge}
          onUpdate={(value) => onUpdate('idBadge', value)}
          isSaving={isFieldSaving.idBadge}
        />
      </div>
    </div>
  );
};

export default EquipmentTab;
