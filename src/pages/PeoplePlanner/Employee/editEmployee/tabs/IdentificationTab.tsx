import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface IdentificationTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const IdentificationTab: React.FC<IdentificationTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="nationalInsuranceNumber"
            label="National Insurance Number"
            value={formData.nationalInsuranceNumber}
            onUpdate={(value) => onUpdate('nationalInsuranceNumber', value)}
            isSaving={isFieldSaving['nationalInsuranceNumber']}
          />

          <EditableField
            id="nhsNumber"
            label="NHS Number"
            value={formData.nhsNumber}
            onUpdate={(value) => onUpdate('nhsNumber', value)}
            isSaving={isFieldSaving['nhsNumber']}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentificationTab;