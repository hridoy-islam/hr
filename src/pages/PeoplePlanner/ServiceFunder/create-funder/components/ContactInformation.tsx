import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { ServiceFunderFormData } from './validation';
import { FormField } from './FromField';

export const ContactInformationStep: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<ServiceFunderFormData>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Phone"
          error={errors.phone?.message}
        >
          <Input
            {...register('phone')}
            placeholder="Enter phone number"
            type="tel"
          />
        </FormField>

        <FormField
          label="Fax"
          error={errors.fax?.message}
        >
          <Input
            {...register('fax')}
            placeholder="Enter fax number"
            type="tel"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Mobile"
          error={errors.mobile?.message}
        >
          <Input
            {...register('mobile')}
            placeholder="Enter mobile number"
            type="tel"
          />
        </FormField>

        <FormField
          label="Other"
          error={errors.other?.message}
        >
          <Input
            {...register('other')}
            placeholder="Enter other contact"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Email"
          required
          error={errors.email?.message}
        >
          <Input
            {...register('email')}
            placeholder="Enter email address"
            type="email"
          />
        </FormField>

        <FormField
          label="Website"
          error={errors.website?.message}
        >
          <Input
            {...register('website')}
            placeholder="Enter website URL"
            type="url"
          />
        </FormField>
      </div>
    </div>
  );
};