import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';

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
  // Safely get the expiry date as a Moment object or null
  const expiryDate = formData.rightToWork.expiryDate 
    ? moment.isMoment(formData.rightToWork.expiryDate) 
      ? formData.rightToWork.expiryDate 
      : moment(formData.rightToWork.expiryDate)
    : null;

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
              value={expiryDate ? expiryDate.format('YYYY-MM-DD') : ''}
              type="date"
              onUpdate={(value) => {
                // Convert the string date to a Moment object before updating
                const dateValue = value ? moment(value) : null;
                onUpdate('rightToWork', 'expiryDate', dateValue);
              }}
              isSaving={isFieldSaving['rightToWork.expiryDate']}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RightToWorkTab;