import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import TabSection from '../TabSection';
import { User } from '../../../types/user.types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FundingDataProps {
  userData: User;
  isEditing?: boolean;
  onSave?: (data: User) => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const fundingOptions = [
  { value: 'Self-funded', label: 'Self-funded' },
  { value: 'Student Loan', label: 'Student Loan' },
  { value: 'Employer-sponsored', label: 'Employer-sponsored' },
  { value: 'Bursary/Grant', label: 'Bursary/Grant' }
];

const FundingData: React.FC<FundingDataProps> = ({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localData, setLocalData] = useState<User>(userData);

  const handleInputChange = <K extends keyof User>(
    field: K,
    value: User[K]
  ) => {
    setLocalData((prevData) => ({
      ...prevData,
      [field]: value
    }));
  };

  useEffect(() => {
    setLocalData(userData);
  }, [userData]);

  const handleSave = () => {
    if (onSave) {
      onSave(localData);
    }
  };

  const selectedFundingOption = fundingOptions.find(
    (option) => option.value === localData?.fundingType
  );

  return (
    <TabSection
      title="Funding Information"
      description=""
      userData={userData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={onCancel}
      onEdit={onEdit}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Funding Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Funding Type
            </label>
            {isEditing ? (
              <Select
                value={selectedFundingOption}
                onChange={(option) =>
                  handleInputChange('fundingType', option?.value || '')
                }
                options={fundingOptions}
                menuPortalTarget={
                  typeof window !== 'undefined' ? document.body : null
                }
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {localData?.fundingType || '-'}
              </div>
            )}
          </div>

          {/* Grant Details */}
          {localData?.fundingType === 'Bursary/Grant' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Grant Details
              </label>
              {isEditing ? (
                <Textarea
                  value={localData?.grantDetails || ''}
                  onChange={(e) =>
                    handleInputChange('grantDetails', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.grantDetails || '-'}
                </div>
              )}
            </div>
          )}

          {/* Employer-sponsored Fields */}
          {localData?.fundingType === 'Employer-sponsored' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Funding Company Name
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.fundingCompanyName || ''}
                    onChange={(e) =>
                      handleInputChange('fundingCompanyName', e.target.value)
                    }
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.fundingCompanyName || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.fundingContactPerson || ''}
                    onChange={(e) =>
                      handleInputChange('fundingContactPerson', e.target.value)
                    }
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.fundingContactPerson || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={localData?.fundingEmail || ''}
                    onChange={(e) =>
                      handleInputChange('fundingEmail', e.target.value)
                    }
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.fundingEmail || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={localData?.fundingPhoneNumber || ''}
                    onChange={(e) =>
                      handleInputChange('fundingPhoneNumber', e.target.value)
                    }
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData?.fundingPhoneNumber || '-'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </TabSection>
  );
};

export default FundingData;
