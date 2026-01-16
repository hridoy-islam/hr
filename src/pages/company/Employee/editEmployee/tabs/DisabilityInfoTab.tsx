import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface DisabilityInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const DisabilityInfoTab: React.FC<DisabilityInfoTabProps> = ({
  formData,
  onUpdate,
  onCheckboxChange,
  isFieldSaving
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Has Disability as Select */}
          <EditableField
            id="hasDisability"
            label="Has Disability"
            type="select"
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false }
            ]}
            value={formData.hasDisability}
            onUpdate={(value: string | boolean) =>
              onCheckboxChange(
                'hasDisability',
                value === 'true' || value === true
              )
            }
            isSaving={isFieldSaving['hasDisability']}
          />

          {formData.hasDisability && (
            <EditableField
              id="disabilityDetails"
              label="Disability Details"
              value={formData.disabilityDetails}
              onUpdate={(value) => onUpdate('disabilityDetails', value)}
              isSaving={isFieldSaving['disabilityDetails']}
            />
          )}

          {/* Needs Reasonable Adjustment as Select */}
          <EditableField
            id="needsReasonableAdjustment"
            label="Needs Reasonable Adjustment"
            type="select"
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false }
            ]}
            value={formData.needsReasonableAdjustment}
            onUpdate={(value: string | boolean) =>
              onCheckboxChange(
                'needsReasonableAdjustment',
                value === 'true' || value === true
              )
            }
            isSaving={isFieldSaving['needsReasonableAdjustment']}
          />

          {formData.needsReasonableAdjustment && (
            <EditableField
              id="reasonableAdjustmentDetails"
              label="Adjustment Details"
              value={formData.reasonableAdjustmentDetails}
              onUpdate={(value) =>
                onUpdate('reasonableAdjustmentDetails', value)
              }
              isSaving={isFieldSaving['reasonableAdjustmentDetails']}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DisabilityInfoTab;
