import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import { countries, relationships } from '@/types';

interface BeneficiaryTabProps {
  formData: any;
  onUpdate: (parentField: string, fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const BeneficiaryTab: React.FC<BeneficiaryTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onCheckboxChange,
  isFieldSaving
}) => {
  const relationshipOptions = relationships.map(relation => ({ value: relation, label: relation }));
  const countryOptions = countries.map(country => ({ value: country, label: country }));
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="beneficiary.fullName"
            label="Full Name"
            value={formData.beneficiary.fullName}
            onUpdate={(value) => onUpdate('beneficiary', 'fullName', value)}
            isSaving={isFieldSaving['beneficiary.fullName']}
          />

          <EditableField
            id="beneficiary.relationship"
            label="Relationship"
            value={formData.beneficiary.relationship}
            type="select"
            options={relationshipOptions}
            onUpdate={(value) => onUpdate('beneficiary', 'relationship', value)}
            isSaving={isFieldSaving['beneficiary.relationship']}
          />

          <EditableField
            id="beneficiary.email"
            label="Email"
            type="email"
            value={formData.beneficiary.email}
            onUpdate={(value) => onUpdate('beneficiary', 'email', value)}
            isSaving={isFieldSaving['beneficiary.email']}
          />

          <EditableField
            id="beneficiary.mobile"
            label="Mobile"
            value={formData.beneficiary.mobile}
            onUpdate={(value) => onUpdate('beneficiary', 'mobile', value)}
            isSaving={isFieldSaving['beneficiary.mobile']}
          />

          <EditableField
            id="beneficiary.sameAddress"
            label="Same as Employee Address"
            value={formData.beneficiary.sameAddress}
            type="checkbox"
            onUpdate={(checked) => onUpdate('beneficiary', 'sameAddress', checked)}
            isSaving={isFieldSaving['beneficiary.sameAddress']}
          />

          {!formData.beneficiary.sameAddress && (
            <>
              <div className="md:col-span-2">
                <EditableField
                  id="beneficiary.address.line1"
                  label="Address Line 1"
                  value={formData.beneficiary.address.line1}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    line1: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.line1']}
                />
              </div>

              <div className="md:col-span-2">
                <EditableField
                  id="beneficiary.address.line2"
                  label="Address Line 2"
                  value={formData.beneficiary.address.line2}
                  onUpdate={(value) => onUpdate('beneficiary', 'address', {
                    ...formData.beneficiary.address,
                    line2: value
                  })}
                  isSaving={isFieldSaving['beneficiary.address.line2']}
                />
              </div>

              <EditableField
                id="beneficiary.address.city"
                label="City"
                value={formData.beneficiary.address.city}
                onUpdate={(value) => onUpdate('beneficiary', 'address', {
                  ...formData.beneficiary.address,
                  city: value
                })}
                isSaving={isFieldSaving['beneficiary.address.city']}
              />

              <EditableField
                id="beneficiary.address.state"
                label="State"
                value={formData.beneficiary.address.state}
                onUpdate={(value) => onUpdate('beneficiary', 'address', {
                  ...formData.beneficiary.address,
                  state: value
                })}
                isSaving={isFieldSaving['beneficiary.address.state']}
              />

              <EditableField
                id="beneficiary.address.postCode"
                label="Post Code"
                value={formData.beneficiary.address.postCode}
                onUpdate={(value) => onUpdate('beneficiary', 'address', {
                  ...formData.beneficiary.address,
                  postCode: value
                })}
                isSaving={isFieldSaving['beneficiary.address.postCode']}
              />

              <EditableField
                id="beneficiary.address.country"
                label="Country"
                value={formData.beneficiary.address.country}
                type="select"
                options={countryOptions}
                onUpdate={(value) => onUpdate('beneficiary', 'address', {
                  ...formData.beneficiary.address,
                  country: value
                })}
                isSaving={isFieldSaving['beneficiary.address.country']}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BeneficiaryTab;