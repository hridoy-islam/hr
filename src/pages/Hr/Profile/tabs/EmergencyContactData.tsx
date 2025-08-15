import React, { useEffect, useState } from 'react';
import TabSection from '../TabSection';
import { User } from '../../../types/user.types';
import { Input } from '@/components/ui/input';

const EmergencyContactData = ({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localData, setLocalData] = useState<User>(userData);

  const handleInputChange = (field: keyof User[''], value: any) => {
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

  return (
    <TabSection
      title="Emergency Contact"
      description="Contact information in case of emergency"
      userData={userData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={onCancel}
      onEdit={onEdit}
    >
      <div className="space-y-8">
        {/* Residential Address */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Emergency Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.emergencyFullName || ''}
                  onChange={(e) =>
                    handleInputChange('emergencyFullName', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.emergencyFullName || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Relationship
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.emergencyRelationship || ''}
                  onChange={(e) =>
                    handleInputChange('emergencyRelationship', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.emergencyRelationship || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.emergencyContactNumber || ''}
                  onChange={(e) =>
                    handleInputChange('emergencyContactNumber', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.emergencyContactNumber || '-'}
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
                  value={localData?.emergencyEmail || ''}
                  onChange={(e) =>
                    handleInputChange('emergencyEmail', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.emergencyEmail || '-'}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={localData?.emergencyAddress || ''}
                  onChange={(e) =>
                    handleInputChange('emergencyAddress', e.target.value)
                  }
                />
              ) : (
                <div className="mt-1 text-gray-900">
                  {localData?.emergencyAddress || '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TabSection>
  );
};

export default EmergencyContactData;
