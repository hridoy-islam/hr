import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import TabSection from '../TabSection';
import { User } from '../../../types/user.types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Select from 'react-select';
import { CustomDatePicker } from '@/components/shared/CustomDatePicker';

const EmploymentData = ({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localData, setLocalData] = useState<User>(userData);

  // Update local data when userData changes
  useEffect(() => {
    setLocalData(userData);
  }, [userData]);

  const handleInputChange = (field: keyof User, value: any) => {
    setLocalData((prevData) => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localData);
    }
  };

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const employmentOptions = [
    { value: 'Full-Time', label: 'Full-Time' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Self-Employed', label: 'Self-Employed' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Freelance', label: 'Freelance' }
  ];

  return (
    <TabSection
      title="Employment"
      description="Your employment history and current status"
      userData={userData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={onCancel}
      onEdit={onEdit}
    >
      <div className="space-y-8">
        {/* Employment Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Currently employed?
          </label>
          {isEditing ? (
            <Select
              options={yesNoOptions}
              value={yesNoOptions.find(
                (opt) => opt.value === localData.isEmployed
              )}
              onChange={(selectedOption) =>
                handleInputChange('isEmployed', selectedOption?.value || '')
              }
              placeholder="Select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: state.isFocused ? '#6366F1' : '#D1D5DB',
                  boxShadow: state.isFocused ? '0 0 0 1px #6366F1' : undefined,
                  '&:hover': {
                    borderColor: state.isFocused ? '#6366F1' : '#9CA3AF'
                  }
                })
              }}
            />
          ) : (
            <div className="text-gray-900">{localData.isEmployed || '-'}</div>
          )}
        </div>

        {/* Current Employment */}
        {localData.isEmployed === 'yes' && (
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Current Employment
            </h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employer Name
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      defaultValue={localData.currentEmployment?.employer}
                      onChange={(e) =>
                        handleInputChange('currentEmployment', {
                          ...localData.currentEmployment,
                          employer: e.target.value
                        })
                      }
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">
                      {localData.currentEmployment?.employer || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      defaultValue={localData.currentEmployment?.jobTitle}
                      onChange={(e) =>
                        handleInputChange('currentEmployment', {
                          ...localData.currentEmployment,
                          jobTitle: e.target.value
                        })
                      }
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">
                      {localData.currentEmployment?.jobTitle || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  {isEditing ? (
                    <CustomDatePicker
                      selected={
                        localData.currentEmployment?.startDate
                          ? new Date(localData.currentEmployment.startDate)
                          : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          handleInputChange('currentEmployment', {
                            ...localData.currentEmployment,
                            startDate: date.toISOString()
                          });
                        }
                      }}
                      placeholder="Start date"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">
                      {localData.currentEmployment?.startDate
                        ? new Date(
                            localData.currentEmployment.startDate
                          ).toLocaleDateString()
                        : '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employment Type
                  </label>
                  {isEditing ? (
                    <Select
                      options={employmentOptions}
                      value={
                        localData.currentEmployment?.employmentType
                          ? employmentOptions.find(
                              (opt) =>
                                opt.value ===
                                localData.currentEmployment?.employmentType
                            )
                          : null
                      }
                      onChange={(selectedOption) =>
                        handleInputChange('currentEmployment', {
                          ...localData.currentEmployment,
                          employmentType: selectedOption
                            ? selectedOption.value
                            : ''
                        })
                      }
                      placeholder="Select type"
                      className="mt-1"
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          borderColor: state.isFocused ? '#6366F1' : '#D1D5DB',
                          boxShadow: state.isFocused
                            ? '0 0 0 1px #6366F1'
                            : undefined,
                          '&:hover': {
                            borderColor: state.isFocused ? '#6366F1' : '#9CA3AF'
                          }
                        })
                      }}
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">
                      {localData.currentEmployment?.employmentType || '-'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Main Responsibilities
                  </label>
                  {isEditing ? (
                    <Textarea
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      defaultValue={
                        localData.currentEmployment?.responsibilities
                      }
                      onChange={(e) =>
                        handleInputChange('currentEmployment', {
                          ...localData.currentEmployment,
                          responsibilities: e.target.value
                        })
                      }
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">
                      {localData.currentEmployment?.responsibilities || '-'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Has Previous Employment */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Previous employment?
          </label>
          {isEditing ? (
            <Select
              options={yesNoOptions}
              value={yesNoOptions.find(
                (opt) => opt.value === localData.hasPreviousEmployment
              )}
              onChange={(selectedOption) =>
                handleInputChange(
                  'hasPreviousEmployment',
                  selectedOption?.value || ''
                )
              }
              placeholder="Select"
              styles={{
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused
                    ? '#4F46E5'
                    : provided.borderColor,
                  boxShadow: state.isFocused ? '0 0 0 1px #4F46E5' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#4F46E5' : '#D1D5DB'
                  }
                })
              }}
              menuPortalTarget={document.body}
            />
          ) : (
            <div className="text-gray-900">
              {localData.hasPreviousEmployment || '-'}
            </div>
          )}
        </div>

        {/* Previous Employment List */}
        {localData.hasPreviousEmployment === 'yes' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Previous Employment
              </h3>
              {isEditing && (
                <Button
                  type="button"
                  className="inline-flex items-center rounded-md border border-transparent bg-watney px-3 py-2 text-sm font-medium leading-4 text-white hover:bg-watney/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() =>
                    handleInputChange('previousEmployments', [
                      ...(localData.previousEmployments || []),
                      {
                        employer: '',
                        jobTitle: '',
                        startDate: '',
                        endDate: '',
                        reasonForLeaving: '',
                        responsibilities: '',
                        contactPermission: ''
                      }
                    ])
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Previous Job
                </Button>
              )}
            </div>
            {localData.previousEmployments &&
            localData.previousEmployments.length > 0 ? (
              <div className="space-y-4">
                {localData.previousEmployments.map((job, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    {isEditing && (
                      <button
                        className="absolute right-2 top-0 rounded-md bg-white p-2 text-red-600 shadow-md hover:bg-red-600 hover:text-white"
                        title="Remove"
                        onClick={() =>
                          handleInputChange(
                            'previousEmployments',
                            localData.previousEmployments.filter(
                              (_, i) => i !== index
                            )
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Employer Name
                        </label>
                        {isEditing ? (
                          <Input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={job.employer}
                            onChange={(e) =>
                              handleInputChange('previousEmployments', [
                                ...localData.previousEmployments.slice(
                                  0,
                                  index
                                ),
                                { ...job, employer: e.target.value },
                                ...localData.previousEmployments.slice(
                                  index + 1
                                )
                              ])
                            }
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.employer || '-'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Job Title
                        </label>
                        {isEditing ? (
                          <Input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={job.jobTitle}
                            onChange={(e) =>
                              handleInputChange('previousEmployments', [
                                ...localData.previousEmployments.slice(
                                  0,
                                  index
                                ),
                                { ...job, jobTitle: e.target.value },
                                ...localData.previousEmployments.slice(
                                  index + 1
                                )
                              ])
                            }
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.jobTitle || '-'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date
                        </label>
                        {isEditing ? (
                          <CustomDatePicker
                            selected={
                              job.startDate ? new Date(job.startDate) : null
                            }
                            onChange={(date: Date | null) => {
                              if (date) {
                                handleInputChange('previousEmployments', [
                                  ...localData.previousEmployments.slice(
                                    0,
                                    index
                                  ),
                                  { ...job, startDate: date.toISOString() },
                                  ...localData.previousEmployments.slice(
                                    index + 1
                                  )
                                ]);
                              }
                            }}
                            placeholder="Start date"
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.startDate
                              ? new Date(job.startDate).toLocaleDateString()
                              : '-'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          End Date
                        </label>
                        {isEditing ? (
                          <CustomDatePicker
                            selected={
                              job.endDate ? new Date(job.endDate) : null
                            }
                            onChange={(date: Date | null) => {
                              if (date) {
                                handleInputChange('previousEmployments', [
                                  ...localData.previousEmployments.slice(
                                    0,
                                    index
                                  ),
                                  { ...job, endDate: date.toISOString() },
                                  ...localData.previousEmployments.slice(
                                    index + 1
                                  )
                                ]);
                              }
                            }}
                            placeholder="End date"
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.endDate
                              ? new Date(job.endDate).toLocaleDateString()
                              : '-'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Reason for Leaving
                        </label>
                        {isEditing ? (
                          <Input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={job.reasonForLeaving}
                            onChange={(e) =>
                              handleInputChange('previousEmployments', [
                                ...localData.previousEmployments.slice(
                                  0,
                                  index
                                ),
                                { ...job, reasonForLeaving: e.target.value },
                                ...localData.previousEmployments.slice(
                                  index + 1
                                )
                              ])
                            }
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.reasonForLeaving || '-'}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Main Responsibilities
                        </label>
                        {isEditing ? (
                          <Textarea
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={job.responsibilities}
                            onChange={(e) =>
                              handleInputChange('previousEmployments', [
                                ...localData.previousEmployments.slice(
                                  0,
                                  index
                                ),
                                { ...job, responsibilities: e.target.value },
                                ...localData.previousEmployments.slice(
                                  index + 1
                                )
                              ])
                            }
                          />
                        ) : (
                          <div className="mt-1 text-gray-900">
                            {job.responsibilities || '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-6 text-center">
                <p className="text-gray-500">No previous employment records</p>
              </div>
            )}
          </div>
        )}

        {/* Employment Gaps - Only shown if hasPreviousEmployment is "yes" */}
        {localData.hasPreviousEmployment === 'yes' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gaps in my employment history?
            </label>
            {isEditing ? (
              <Select
                options={yesNoOptions}
                value={yesNoOptions.find(
                  (opt) => opt.value === localData.hasEmploymentGaps
                )}
                onChange={(selectedOption) =>
                  handleInputChange(
                    'hasEmploymentGaps',
                    selectedOption?.value || ''
                  )
                }
                placeholder="Select"
                styles={{
                  menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: state.isFocused
                      ? '#4F46E5'
                      : provided.borderColor,
                    boxShadow: state.isFocused ? '0 0 0 1px #4F46E5' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#4F46E5' : '#D1D5DB'
                    }
                  })
                }}
                menuPortalTarget={document.body}
              />
            ) : (
              <div className="mb-4 text-gray-900">
                {localData.hasEmploymentGaps || '-'}
              </div>
            )}
            {localData.hasEmploymentGaps === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gaps Details
                </label>
                {isEditing ? (
                  <Textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    defaultValue={localData.employmentGapsExplanation}
                    onChange={(e) =>
                      handleInputChange(
                        'employmentGapsExplanation',
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <div className="mt-1 text-gray-900">
                    {localData.employmentGapsExplanation || '-'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </TabSection>
  );
};

export default EmploymentData;
