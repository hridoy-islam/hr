import React from 'react';
import { EditableField } from '../components/EditableField';
import { countries } from '@/types';

interface AddressTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const AddressTab: React.FC<AddressTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  isFieldSaving,
}) => {
const countryOptions = countries.map((country) => ({
  value: country,
  label: country
}));

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Address Information
        </h3>
        
        <div className="space-y-6">
          <EditableField
            id="address"
            label="Street Address"
            value={formData.address}
            type="textarea"
            onUpdate={(value) => onUpdate('address', value)}
            isSaving={isFieldSaving.address}
            required
            placeholder="Enter full street address"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              id="cityOrTown"
              label="City/Town"
              value={formData.cityOrTown}
              onUpdate={(value) => onUpdate('cityOrTown', value)}
              isSaving={isFieldSaving.cityOrTown}
              required
              placeholder="Enter city or town"
            />

            <EditableField
              id="stateOrProvince"
              label="State/Province/County"
              value={formData.stateOrProvince}
              onUpdate={(value) => onUpdate('stateOrProvince', value)}
              isSaving={isFieldSaving.stateOrProvince}
              required
              placeholder="Enter state, province, or county"
            />

            <EditableField
              id="postCode"
              label="Postal Code"
              value={formData.postCode}
              onUpdate={(value) => onUpdate('postCode', value)}
              isSaving={isFieldSaving.postCode}
              required
              placeholder="Enter postal code"
            />

            <EditableField
              id="country"
              label="Country"
              value={formData.country}
              type="select"
              options={countryOptions}
              onUpdate={(value) => onSelectChange('country', value)}
              isSaving={isFieldSaving.country}
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            id="email"
            label="Email Address"
            value={formData.email}
            type="email"
            onUpdate={(value) => onUpdate('email', value)}
            isSaving={isFieldSaving.email}
            required
            placeholder="Enter email address"
          />

          <EditableField
            id="mobilePhone"
            label="Mobile Phone"
            value={formData.mobilePhone}
            type="text"
            onUpdate={(value) => onUpdate('mobilePhone', value)}
            isSaving={isFieldSaving.mobilePhone}
            placeholder="Enter mobile phone number"
          />

          <EditableField
            id="homePhone"
            label="Home Phone"
            value={formData.homePhone}
            type="text"
            onUpdate={(value) => onUpdate('homePhone', value)}
            isSaving={isFieldSaving.homePhone}
            placeholder="Enter home phone number"
          />

          <EditableField
            id="otherPhone"
            label="Other Phone"
            value={formData.otherPhone}
            type="text"
            onUpdate={(value) => onUpdate('otherPhone', value)}
            isSaving={isFieldSaving.otherPhone}
            placeholder="Enter other phone number"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressTab;