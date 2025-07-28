import React, { useEffect, useState } from 'react';
import TabSection from '../TabSection';
import { User } from '../../../types/user.types';
import Select from 'react-select';
import { Input } from '@/components/ui/input';
import { CustomDatePicker } from '@/components/shared/CustomDatePicker';
import { Textarea } from '@/components/ui/textarea';

const ComplianceData = ({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localData, setLocalData] = useState<User>(userData);

  // Handle input changes for all fields
  const handleInputChange = (field: keyof User, value: any) => {
    setLocalData(prev => ({
      ...prev,
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

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const visaOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];
  const enteredUKOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const completedUKCourseOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const visaRefusalOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const hearAboutUsOptions = [
    { label: 'Google Search', value: 'google' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Word of Mouth', value: 'word_of_mouth' },
    { label: 'Friend or Family', value: 'friend_family' },
    { label: 'University Fair', value: 'university' },
    { label: 'Online Advertisement', value: 'online' },
    { label: 'Education Agent', value: 'agent' },
    { label: 'School/College', value: 'school/college' },
    { label: 'Other', value: 'other' }
  ];



  const disabilityOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  
  const studentFinanceOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];


  return (
    <TabSection
      title="Miscellaneous"
      description=""
      userData={userData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={onCancel}
      onEdit={onEdit}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Do you require visa to come or stay to the UK? 
            </label>
            {isEditing ? (
              <Select
                options={visaOptions}
                value={visaOptions.find(
                  (option) => option.value === localData?.visaRequired
                )}
                onChange={(selected) =>
                  handleInputChange('visaRequired', {
                    ...localData,
                    visaRequired: selected?.value
                  })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {capitalizeFirstLetter(localData?.visaRequired || '-')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Have you entered into the UK before? 
            </label>
            {isEditing ? (
              <Select
                options={visaOptions}
                value={visaOptions.find(
                  (option) => option.value === localData?.enteredUKBefore
                )}
                onChange={(selected) =>
                  handleInputChange('enteredUKBefore', {
                    ...localData,
                    enteredUKBefore: selected?.value
                  })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {capitalizeFirstLetter(localData?.enteredUKBefore || '-')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Have you completed any course from the UK before?
            </label>
            {isEditing ? (
              <Select
                options={visaOptions}
                value={visaOptions.find(
                  (option) => option.value === localData?.completedUKCourse
                )}
                onChange={(selected) =>
                  handleInputChange('completedUKCourse', {
                    ...localData,
                    completedUKCourse: selected?.value
                  })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {capitalizeFirstLetter(localData?.completedUKCourse || '-')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Where did I hear about Watney College?
            </label>
            {isEditing ? (
              <Select
                options={hearAboutUsOptions}
                value={hearAboutUsOptions.find(
                  (option) => option.value === localData?.hearAboutUs
                )}
                onChange={(selected) =>
                  handleInputChange('hearAboutUs', {
                    ...localData,
                    hearAboutUs: selected?.value
                  })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {capitalizeFirstLetter(localData?.hearAboutUs || '-')}
              </div>
            )}
          </div>

          {/* Disability */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Do you have any disabilities or learning difficulties?
            </label>
            {isEditing ? (
              <Select
                options={disabilityOptions}
                value={disabilityOptions.find(
                  (option) => option.value === localData?.disability
                )}
                onChange={(selected) =>
                  handleInputChange('complianceData', {
                    ...localData,
                    disability: selected?.value
                  })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {capitalizeFirstLetter(localData?.disability || '-')}
              </div>
            )}
          </div>

          {/* Disability Details (Conditional) */}
          {localData?.disability === 'yes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Please provide disability details
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.disabilityDetails || ''}
                  onChange={(e) =>
                    handleInputChange('disabilityDetails', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.disabilityDetails || '-'}
                </div>
              )}
            </div>
          )}

          {/* Criminal Conviction */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Do I have any visa refusal?
            </label>
            {isEditing ? (
              <Select
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' }
                ]}
                value={{
                  value: localData?.visaRefusal || '',
                  label: localData?.visaRefusal ? 'Yes' : 'No'
                }}
                onChange={(selectedOption) =>
                  handleInputChange('criminalConviction', selectedOption?.value)
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            ) : (
              <div className="mt-1 text-gray-900">
                {localData?.visaRefusal ? 'Yes' : 'No'}
              </div>
            )}
          </div>

          {/* Conviction Details (Conditional) */}
          {(localData?.visaRefusal === 'yes' || localData?.visaRefusal) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Visa Refusal Details
              </label>
              {isEditing ? (
                <Textarea
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={localData?.visaRefusalDetail || ''}
                  onChange={(e) =>
                    handleInputChange('visaRefusalDetail', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.visaRefusalDetail || '-'}
                </div>
              )}
            </div>
          )}

         
        </div>
      </div>
    </TabSection>
  );
};

export default ComplianceData;
