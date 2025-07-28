import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ServiceUserFormData } from './validation';
import { User, MapPin, Phone, Briefcase, FileText, User2, UserCircleIcon } from 'lucide-react';

export const ReviewStep: React.FC = () => {
  const { watch } = useFormContext<ServiceUserFormData>();
  const formData = watch();

  const sections = [
    {
      title: 'Personal Information',
      icon: User,
      fields: [
        { label: 'Type', value: formData.type },
        { label: 'Title', value: formData.title },
        { label: 'First Name', value: formData.firstName },
        { label: 'Middle Initial', value: formData.middleInitial },
        { label: 'Last Name', value: formData.lastName },
        { label: 'Preferred Name', value: formData.preferredName },
        { label: 'Date of Birth', value: formData.dateOfBirth },
        
        { label: 'Address', value: formData.address },
        { label: 'City / Town', value: formData.city },
        { label: 'Country', value: formData.country },
        { label: 'Post Code', value: formData.postCode },
        { label: 'Start Date', value: formData.startDate },
        { label: 'Last Duty Date', value: formData.lastDutyDate },
        { label: 'Status', value: formData.status },
        { label: 'Service Priority', value: formData.servicePriority },
      ]
    },
    {
      title: 'Equality',
      icon: UserCircleIcon,
      fields: [
         { label: 'Gender', value: formData.gender },
        { label: 'Marital Status', value: formData.maritalStatus },
        { label: 'Ethnic Origin', value: formData.ethnicOrigin },
        { label: 'Religion', value: formData.religion }
      ]
      },
    {
      title: 'Contact Information',
      icon: Phone,
      fields: [
        { label: 'Phone', value: formData.phone },
        { label: 'Fax', value: formData.fax },
        { label: 'Mobile', value: formData.mobile },
        { label: 'Other', value: formData.other },
        { label: 'Email', value: formData.email },
        { label: 'Website', value: formData.website }
      ]
    },
    {
      title: 'Others',
      icon: Briefcase,
      fields: [
        { label: 'Service Location Ex ID', value: formData.serviceLocationExId },
        {
          label: 'Timesheet Signature Required',
          value: typeof formData.timesheetSignature === 'boolean'
            ? formData.timesheetSignature ? 'Yes' : 'No'
            : formData.timesheetSignature
        },
        ...(formData.timesheetSignature
          ? [
              {
                label: 'Timesheet Signature Not Required Note',
                value: formData.timesheetSignatureNote
              }
            ]
          : [])
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const Icon = section.icon;
        const hasData = section.fields.some((field) => field.value);

        if (!hasData) return null;

        return (
          <div key={index} className="rounded-lg bg-gray-50 p-6">
            <div className="mb-4 flex items-center">
              <div className="mr-3 rounded-lg bg-blue-100 p-2">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.fields.map((field, fieldIndex) => {
                if (!field.value) return null;

                const displayValue =
                  typeof field.value === 'object' && field.value !== null
                    ? field.value.label || field.value.value
                    : field.value;

                return (
                  <div
                    key={fieldIndex}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <dt className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1">
                      {field.label}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 break-words">
                      {displayValue}
                    </dd>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
