import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceFunderFormData } from './validation';
import { FormField } from './FromField';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/types';

const typeOptions = [
  { value: 'private', label: 'Private Client' },
  { value: 'otherOrganization', label: 'Other Organization' },
  { value: 'socialServices', label: 'Social Services' }
];
const titleOptions = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' }
];

const servicePriorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const branchOptions = [
  { value: 'north', label: 'North Branch' },
  { value: 'south', label: 'South Branch' },
  { value: 'east', label: 'East Branch' },
  { value: 'west', label: 'West Branch' }
];

const areaOptions = [
  { value: 'zone1', label: 'Zone 1' },
  { value: 'zone2', label: 'Zone 2' },
  { value: 'zone3', label: 'Zone 3' }
];

export const PersonalInformationStep: React.FC = () => {
  const {
    register,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<ServiceFunderFormData>();

  const watchedTitle = watch('title');
  const watchedType = watch('type');
  const watchedStatus = watch('status');
  const watchedServicePriority = watch('servicePriority');
  const watchedBranch = watch('branch');
  const watchedArea = watch('area');
  const watchedCountry = watch('country');

  const countryOptions = countries.map((country) => ({
    value: country,
    label: country
  }));

  // Initialize nullable select fields to null if undefined on mount
  useEffect(() => {
    if (watchedType === undefined) setValue('type', null);
    if (watchedTitle === undefined) setValue('title', null);
    if (watchedStatus === undefined) setValue('status', null);
    if (watchedServicePriority === undefined) setValue('servicePriority', null);
    if (watchedBranch === undefined) setValue('branch', null);
    if (watchedArea === undefined) setValue('area', null);
  }, [
    watchedType,
    watchedTitle,
    watchedStatus,
    watchedServicePriority,
    watchedBranch,
    watchedArea,
    setValue
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField label="Type" required error={errors.type?.message}>
          <Select
            value={watchedType}
            onChange={(value) => setValue('type', value)}
            options={typeOptions}
            placeholder="Select Type"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField label="Title" required error={errors.title?.message}>
          <Select
            value={watchedTitle}
            onChange={(value) => setValue('title', value)}
            options={titleOptions}
            placeholder="Select title"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField
          label="First Name"
          required
          error={errors.firstName?.message}
        >
          <Input {...register('firstName')} placeholder="Enter first name" />
        </FormField>

        <FormField label="Middle Initial" error={errors.middleInitial?.message}>
          <Input {...register('middleInitial')} placeholder="M" maxLength={1} />
        </FormField>

        <FormField label="Last Name" required error={errors.lastName?.message}>
          <Input {...register('lastName')} placeholder="Enter last name" />
        </FormField>

        <FormField label="Address" required error={errors.address?.message}>
          <Input
            {...register('address')}
            placeholder="Enter full address"
            className="flex w-full rounded-md border border-gray-300 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        <FormField label="City / Town" required error={errors.city?.message}>
          <Input {...register('city')} placeholder="Enter city or town" />
        </FormField>

        <FormField label="Country" required error={errors.country?.message}>
          <Select
            value={
              countryOptions.find(
                (option) => option.value === watchedCountry
              ) || null
            }
            onChange={(option) => setValue('country', option?.value || '')}
            options={countryOptions}
            placeholder="Select Country"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField label="Post Code" required error={errors.postCode?.message}>
          <Input
            {...register('postCode')}
            placeholder="Enter post code"
            className="uppercase"
          />
        </FormField>
        <FormField
          label="Description"
          required
          error={errors.description?.message}
        >
          <Textarea
            {...register('description')}
            placeholder="Enter description"
            className="h-24 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none "
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          label="Start Date"
          required
          error={errors.startDate?.message}
        >
          <Input {...register('startDate')} type="date" />
        </FormField>

        <FormField label="Last Duty Date" error={errors.lastDutyDate?.message}>
          <Input {...register('lastDutyDate')} type="date" />
        </FormField>

        <FormField label="Status" required error={errors.status?.message}>
          <Select
            value={watchedStatus}
            onChange={(selected) => setValue('status', selected)}
            options={statusOptions}
            placeholder="Select status"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField
          label="Service Priority"
          required
          error={errors.servicePriority?.message}
        >
          <Select
            value={watchedServicePriority}
            onChange={(selected) => setValue('servicePriority', selected)}
            options={servicePriorityOptions}
            placeholder="Select service priority"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField label="Branch" required error={errors.branch?.message}>
          <Select
            value={watchedBranch}
            onChange={(selected) => setValue('branch', selected)}
            options={branchOptions}
            placeholder="Select branch"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>

        <FormField label="Area" required error={errors.area?.message}>
          <Select
            value={watchedArea}
            onChange={(selected) => setValue('area', selected)}
            options={areaOptions}
            placeholder="Select area"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>
      </div>
    </div>
  );
};
