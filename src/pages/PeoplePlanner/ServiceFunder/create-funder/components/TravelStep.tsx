import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import Select from 'react-select';
import { ServiceFunderFormData } from './validation';
import { FormField } from './FromField';

const travelTypeOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Actual', value: 'actual' },
];

export const TravelStep: React.FC = () => {
  const { control, formState: { errors } } = useFormContext<ServiceFunderFormData>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Travel Type"
          required
          error={errors.travelType?.message}
        >
          <Controller
            name="travelType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={travelTypeOptions}
                placeholder="Select travel type"
                isClearable
              />
            )}
          />
        </FormField>
      </div>
    </div>
  );
};
