import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import { countries } from '@/types';

interface ContactInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  isFieldSaving
}) => {
  const countryOptions = countries.map(country => ({ value: country, label: country }));
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EditableField
            id="email"
            label="Email"
            value={formData.email}
            type="email"
            onUpdate={(value) => onUpdate('email', value)}
            isSaving={isFieldSaving['email']}
            required
          />

          <EditableField
            id="homePhone"
            label="Home Phone"
            value={formData.homePhone}
            onUpdate={(value) => onUpdate('homePhone', value)}
            isSaving={isFieldSaving['homePhone']}
          />

          <EditableField
            id="mobilePhone"
            label="Mobile Phone"
            value={formData.mobilePhone}
            onUpdate={(value) => onUpdate('mobilePhone', value)}
            isSaving={isFieldSaving['mobilePhone']}
          />

          <EditableField
            id="otherPhone"
            label="Other Phone"
            value={formData.otherPhone}
            onUpdate={(value) => onUpdate('otherPhone', value)}
            isSaving={isFieldSaving['otherPhone']}
          />

          <div className="md:col-span-2">
            <EditableField
              id="address"
              label="Address"
              value={formData.address}
              onUpdate={(value) => onUpdate('address', value)}
              isSaving={isFieldSaving['address']}
            />
          </div>

          <EditableField
            id="cityOrTown"
            label="City/Town"
            value={formData.cityOrTown}
            onUpdate={(value) => onUpdate('cityOrTown', value)}
            isSaving={isFieldSaving['cityOrTown']}
          />

          <EditableField
            id="stateOrProvince"
            label="State/Province"
            value={formData.stateOrProvince}
            onUpdate={(value) => onUpdate('stateOrProvince', value)}
            isSaving={isFieldSaving['stateOrProvince']}
          />

          <EditableField
            id="postCode"
            label="Post Code"
            value={formData.postCode}
            onUpdate={(value) => onUpdate('postCode', value)}
            isSaving={isFieldSaving['postCode']}
          />

          <EditableField
            id="country"
            label="Country"
            value={formData.country}
            type="select"
            options={countryOptions}
            onUpdate={(value) => onSelectChange('country', value)}
            isSaving={isFieldSaving['country']}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoTab;