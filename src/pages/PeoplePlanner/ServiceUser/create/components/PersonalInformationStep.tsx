import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceUserFormData } from './validation';
import { FormField } from './FromField';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/types';

const typeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'organization', label: 'Organization' },
  { value: 'individual-with-medication', label: 'Individual With Medication' },
 
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



export const PersonalInformationStep: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ServiceUserFormData>();

  const watchedTitle = watch('title');
  const watchedType = watch('type');

  const countryOptions = countries.map((country) => ({
    value: country,
    label: country
  }));

    const watchedStatus = watch('status');
    const watchedServicePriority = watch('servicePriority');
  
    // Optional: Ensure values are set on mount if needed
    useEffect(() => {
      if (!watchedStatus) setValue('status', null);
      if (!watchedServicePriority) setValue('servicePriority', null);
    }, []);

    

  const watchedCountry = watch('country');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       

        <FormField
          label="Type"
          required
          error={errors.title?.message}
        >
          <Select
            value={watchedType}
            onChange={(value) => setValue('type', value)}
            options={typeOptions}
            placeholder="Select Type"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>
        <FormField
          label="Title"
          required
          error={errors.title?.message}
        >
          <Select
            value={watchedTitle}
            onChange={(value) => setValue('title', value)}
            options={titleOptions}
            placeholder="Select title"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>

        <FormField
          label="First Name"
          required
          error={errors.firstName?.message}
        >
          <Input
            {...register('firstName')}
            placeholder="Enter first name"
          />
        </FormField>

        <FormField
          label="Middle Initial"
          error={errors.middleInitial?.message}
        >
          <Input
            {...register('middleInitial')}
            placeholder="M"
            maxLength={1}
          />
        </FormField>

        <FormField
          label="Last Name"
          required
          error={errors.lastName?.message}
        >
          <Input
            {...register('lastName')}
            placeholder="Enter last name"
          />
        </FormField>
     
        <FormField
          label="Preferred Name"
          error={errors.preferredName?.message}
        >
          <Input
            {...register('preferredName')}
            placeholder="Enter preferred name"
          />
        </FormField>

        <FormField
          label="Date of Birth"
          required
          error={errors.dateOfBirth?.message}
        >
          <Input
            {...register('dateOfBirth')}
            type="date"
          />
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
          />
        </FormField>

        <FormField label="Post Code" required error={errors.postCode?.message}>
          <Input
            {...register('postCode')}
            placeholder="Enter post code"
            className="uppercase"
          />
        </FormField>


      
    </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Start Date"
          required
          error={errors.startDate?.message}
        >
          <Input
            {...register('startDate')}
            type="date"
          />
        </FormField>

        <FormField
          label="Last Duty Date"
          error={errors.lastDutyDate?.message}
        >
          <Input
            {...register('lastDutyDate')}
            type="date"
          />
        </FormField>
     
        <FormField
          label="Status"
          required
          error={errors.status?.message}
        >
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
      </div>
  </div>
  );
};