import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';

interface IdentificationTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
    onDateChange: (fieldName: string, dateStr: string) => void;

}

const IdentificationTab: React.FC<IdentificationTabProps> = ({
  formData,
  onDateChange,
  onUpdate,
  isFieldSaving,
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

          <EditableField
            id="passportNo"
            label="Passport Number"
            value={formData.passportNo}
            onUpdate={(value) => onUpdate('passportNo', value)}
            isSaving={isFieldSaving.nhsNumber}
            placeholder="Enter Passport No"
          />

          <EditableField
            id="passportExpiry"
            label="Passport Expiry Date"
            value={
              formData.passportExpiry
                ? moment(formData.passportExpiry).format('YYYY-MM-DD')
                : ''
            }
            type="date"
            onUpdate={(value) => onUpdate('passportExpiry', value)}
            isSaving={isFieldSaving.passportExpiry}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentificationTab;
