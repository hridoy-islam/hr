import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import { nationalities } from '@/types';

interface EqualityInfoTabProps {
  formData: any;
  onUpdate: (parentField: string, fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const EqualityInfoTab: React.FC<EqualityInfoTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onCheckboxChange,
  isFieldSaving
}) => {
  const nationalityOptions = nationalities.map(nationality => ({ value: nationality, label: nationality }));
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="equalityInformation.nationality"
            label="Nationality"
            value={formData.equalityInformation.nationality}
            type="select"
            options={nationalityOptions}
            onUpdate={(value) => onUpdate('equalityInformation', 'nationality', value)}
            isSaving={isFieldSaving['equalityInformation.nationality']}
          />

          <EditableField
            id="equalityInformation.religion"
            label="Religion"
            value={formData.equalityInformation.religion}
            onUpdate={(value) => onUpdate('equalityInformation', 'religion', value)}
            isSaving={isFieldSaving['equalityInformation.religion']}
          />

          
        </div>
      </CardContent>
    </Card>
  );
};

export default EqualityInfoTab;