import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface RightToWorkTabProps {
  formData: any;
  onUpdate: (parentField: string, fieldName: string, value: any) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  onDateChange: (fieldName: string, dateStr: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const RightToWorkTab: React.FC<RightToWorkTabProps> = ({
  formData,
  onUpdate,
  onCheckboxChange,
  onDateChange,
  isFieldSaving
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="rightToWork.hasExpiry"
            label="Has Expiry Date"
            value={formData.rightToWork.hasExpiry}
            type="checkbox"
            onUpdate={(checked) => onUpdate('rightToWork', 'hasExpiry', checked)}
            isSaving={isFieldSaving['rightToWork.hasExpiry']}
          />

          {formData.rightToWork.hasExpiry && (
            <EditableField
              id="rightToWork.expiryDate"
              label="Expiry Date"
              value={formData.rightToWork.expiryDate ? formData.rightToWork.expiryDate.format('YYYY-MM-DD') : ''}
              type="date"
              onUpdate={(value) => onUpdate('rightToWork', 'expiryDate', value)}
              isSaving={isFieldSaving['rightToWork.expiryDate']}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RightToWorkTab;