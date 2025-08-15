import React, { useEffect, useState } from 'react';
import TabSection from '../TabSection';
import { User } from '../../../types/user.types';
import { Input } from '@/components/ui/input';

interface AddressDataProps {
  userData: User;
  isEditing?: boolean;
  onSave?: (data: User) => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const AddressData: React.FC<AddressDataProps> = ({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localData, setLocalData] = useState<User>(userData);

  const handleInputChange = (field: keyof User['addressData'], value: any) => {
    setLocalData(prevData => ({
      ...prevData,
 
  
        [field]: value
      
    }));
  };

  const handleSameAsResidentialChange = (checked: boolean) => {
    if (checked) {
      setLocalData(prevData => ({
        ...prevData,
        
          sameAsResidential: true,
          postalAddressLine1: prevData?.residentialAddressLine1 || '',
          postalAddressLine2: prevData?.residentialAddressLine2 || '',
          postalCity: prevData?.residentialCity || '',
          postalPostCode: prevData?.residentialPostCode || '',
          postalCountry: prevData?.residentialCountry || ''
        
      }));
    } else {
      setLocalData(prevData => ({
        ...prevData,
        
          ...prevData,
          sameAsResidential: false
        
      }));
    }
  };

  useEffect(() => {
    setLocalData(userData);
  }, [userData]);

  const handleSave = () => {
    if (onSave) {
      onSave(localData);
    }
  };

  return (
    <TabSection
      title="Address Information"
      description="Your residential and postal addresses"
      userData={userData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={onCancel}
      onEdit={onEdit}
    >
      <div className="space-y-8">
        {/* Residential Address */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Residential Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.residentialAddressLine1 || ''}
                  onChange={(e) => handleInputChange('residentialAddressLine1', e.target.value)}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.residentialAddressLine1 || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.residentialAddressLine2 || ''}
                  onChange={(e) => handleInputChange('residentialAddressLine2', e.target.value)}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.residentialAddressLine2 || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.residentialCity || ''}
                  onChange={(e) => handleInputChange('residentialCity', e.target.value)}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.residentialCity || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Postcode</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.residentialPostCode || ''}
                  onChange={(e) => handleInputChange('residentialPostCode', e.target.value)}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.residentialPostCode || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.residentialCountry || ''}
                  onChange={(e) => handleInputChange('residentialCountry', e.target.value)}
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.residentialCountry || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Postal Address */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Postal Address</h3>
            
            {isEditing && (
              <div className="flex items-center">
                <input
                  id="sameAsResidential"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={localData?.sameAsResidential || false}
                  onChange={(e) => handleSameAsResidentialChange(e.target.checked)}
                />
                <label htmlFor="sameAsResidential" className="ml-2 block text-sm text-gray-700">
                  Same as Residential
                </label>
              </div>
            )}
          </div>

          {(!localData?.sameAsResidential || !isEditing) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.postalAddressLine1 || ''}
                    onChange={(e) => handleInputChange('postalAddressLine1', e.target.value)}
                    disabled={localData?.sameAsResidential}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.postalAddressLine1 || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.postalAddressLine2 || ''}
                    onChange={(e) => handleInputChange('postalAddressLine2', e.target.value)}
                    disabled={localData?.sameAsResidential}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.postalAddressLine2 || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.postalCity || ''}
                    onChange={(e) => handleInputChange('postalCity', e.target.value)}
                    disabled={localData?.sameAsResidential}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.postalCity || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Postcode</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.postalPostCode || ''}
                    onChange={(e) => handleInputChange('postalPostCode', e.target.value)}
                    disabled={localData?.sameAsResidential}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.postalPostCode || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.postalCountry || ''}
                    onChange={(e) => handleInputChange('postalCountry', e.target.value)}
                    disabled={localData?.sameAsResidential}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.postalCountry || '-'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </TabSection>
  );
};

export default AddressData;