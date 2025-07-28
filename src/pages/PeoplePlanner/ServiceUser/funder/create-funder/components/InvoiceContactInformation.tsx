import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { ServiceFunderFormData } from './validation';
import { FormField } from './FromField';
import Select from 'react-select';

const deliveryTypeOptions = [
  { value: 'email', label: 'Email' },
  { value: 'postal', label: 'Postal' },
  { value: 'fax', label: 'Fax' },
];

export const InvoiceContactInformationStep: React.FC = () => {
  const { register, setValue, formState: { errors }, watch } = useFormContext<ServiceFunderFormData>();
  
  const invoiceErrors = errors.invoice || {};
  const watchedDeliveryType = watch('invoice.deliveryType'); // Watch for deliveryType field changes

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Phone"
          error={invoiceErrors?.phone?.message}
        >
          <Input
            {...register('invoice.phone')}
            placeholder="Enter phone number"
            type="tel"
          />
        </FormField>

        <FormField
          label="Fax"
          error={invoiceErrors?.fax?.message}
        >
          <Input
            {...register('invoice.fax')}
            placeholder="Enter fax number"
            type="tel"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Mobile"
          error={invoiceErrors?.mobile?.message}
        >
          <Input
            {...register('invoice.mobile')}
            placeholder="Enter mobile number"
            type="tel"
          />
        </FormField>

        <FormField
          label="Other"
          error={invoiceErrors?.other?.message}
        >
          <Input
            {...register('invoice.other')}
            placeholder="Enter other contact"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Email"
          required
          error={invoiceErrors?.email?.message}
        >
          <Input
            {...register('invoice.email')}
            placeholder="Enter email address"
            type="email"
          />
        </FormField>

        <FormField
          label="Website"
          error={invoiceErrors?.website?.message}
        >
          <Input
            {...register('invoice.website')}
            placeholder="Enter website URL"
            type="url"
          />
        </FormField>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
       
        <FormField
          label="Invoice Delivery Type"
          required
          error={errors.invoice?.deliveryType?.message}
        >
          <Select
            value={deliveryTypeOptions.find(option => option.value === (typeof watchedDeliveryType === 'string' ? watchedDeliveryType : watchedDeliveryType?.value)) || null}
            onChange={(option) => setValue('invoice.deliveryType', option || null)}
            options={deliveryTypeOptions}
            placeholder="Select Delivery Type"
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </FormField>
      </div>
    </div>
  );
};
