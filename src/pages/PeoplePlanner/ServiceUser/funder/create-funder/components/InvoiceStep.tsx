import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ServiceFunderFormData } from './validation';
import Select from 'react-select';
import { FormField } from './FromField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const InvoiceStep: React.FC = () => {
  const {
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<ServiceFunderFormData>();

  // Watched values (prefixed with 'invoice.')
  const watchedLinked = watch('invoice.linked');
  const watchedType = watch('invoice.type');
  const watchedName = watch('invoice.name');
  const watchedAddress = watch('invoice.address');
  const watchedCityTown = watch('invoice.cityTown');
  const watchedCounty = watch('invoice.county');
  const watchedPostCode = watch('invoice.postCode');
  const watchedCustomerExternalId = watch('invoice.customerExternalId');
  const watchedInvoiceRun = watch('invoice.invoiceRun');
  const watchedInvoiceFormat = watch('invoice.invoiceFormat');
  const watchedInvoiceGrouping = watch('invoice.invoiceGrouping');

  // Options for select fields
  const linkedOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const typeOptions = [
    { value: 'other-organisation', label: 'Other Organisation' },
    { value: 'private-client', label: 'Private Client' },
    { value: 'business', label: 'Business' }
  ];

  const invoiceRunOptions = [
    { value: 'private', label: 'Private' },
    { value: 'public', label: 'Public' }
  ];

  const invoiceFormatOptions = [
    { value: 'social-services-by-visit-no-name-or-adc', label: 'Social Services - By Visit - No Name or Adc' },
    { value: 'standard', label: 'Standard' }
  ];

  const invoiceGroupingOptions = [
    { value: 'service-user', label: 'Service User' },
    { value: 'organization', label: 'Organization' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Linked (Boolean Select) */}
        <FormField label="Linked" required>
          <Select
            value={linkedOptions.find(option => option.value === watchedLinked)}
            onChange={(selectedOption) => setValue('invoice.linked', selectedOption?.value || false)}
            options={linkedOptions}
            placeholder="Select linked"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>

        {/* Type */}
        <FormField label="Type" required error={errors.invoice?.type?.message}>
          <Select
            value={typeOptions.find(option => option.value === watchedType)}
            onChange={(selectedOption) => setValue('invoice.type', selectedOption?.value || '')}
            options={typeOptions}
            placeholder="Select type"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>

        {/* Name */}
        <FormField label="Name" required error={errors.invoice?.name?.message}>
          <Input
            type="text"
            value={watchedName}
            onChange={(e) => setValue('invoice.name', e.target.value)}
            placeholder="Enter name"
          />
        </FormField>

        {/* Address */}
        <FormField label="Address" required error={errors.invoice?.address?.message}>
          <Textarea
            value={watchedAddress}
            onChange={(e) => setValue('invoice.address', e.target.value)}
            placeholder="Enter address"
            rows={3}
            className='resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus-visible:outline-none '
          />
        </FormField>

        {/* City / Town */}
        <FormField label="City / Town" required error={errors.invoice?.cityTown?.message}>
          <Input
            type="text"
            value={watchedCityTown}
            onChange={(e) => setValue('invoice.cityTown', e.target.value)}
            placeholder="Enter city/town"
          />
        </FormField>

        {/* County */}
        <FormField label="County" error={errors.invoice?.county?.message}>
          <Input
            type="text"
            value={watchedCounty}
            onChange={(e) => setValue('invoice.county', e.target.value)}
            placeholder="Enter county"
          />
        </FormField>

        {/* Post Code */}
        <FormField label="Post code" required error={errors.invoice?.postCode?.message}>
          <Input
            type="text"
            value={watchedPostCode}
            onChange={(e) => setValue('invoice.postCode', e.target.value)}
            placeholder="Enter post code"
          />
        </FormField>

        {/* Customer External ID */}
        <FormField label="Customer External ID" required error={errors.invoice?.customerExternalId?.message}>
          <Input
            type="text"
            value={watchedCustomerExternalId}
            onChange={(e) => setValue('invoice.customerExternalId', e.target.value)}
            placeholder="Enter customer external ID"
          />
        </FormField>

        {/* Invoice Run */}
        <FormField label="Invoice run" required error={errors.invoice?.invoiceRun?.message}>
          <Select
            value={invoiceRunOptions.find(option => option.value === watchedInvoiceRun)}
            onChange={(selectedOption) => setValue('invoice.invoiceRun', selectedOption?.value || '')}
            options={invoiceRunOptions}
            placeholder="Select invoice run"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>

        {/* Invoice Format */}
        <FormField label="Invoice format" required error={errors.invoice?.invoiceFormat?.message}>
          <Select
            value={invoiceFormatOptions.find(option => option.value === watchedInvoiceFormat)}
            onChange={(selectedOption) => setValue('invoice.invoiceFormat', selectedOption?.value || '')}
            options={invoiceFormatOptions}
            placeholder="Select invoice format"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>

        {/* Invoice Grouping */}
        <FormField label="Invoice grouping" required error={errors.invoice?.invoiceGrouping?.message}>
          <Select
            value={invoiceGroupingOptions.find(option => option.value === watchedInvoiceGrouping)}
            onChange={(selectedOption) => setValue('invoice.invoiceGrouping', selectedOption?.value || '')}
            options={invoiceGroupingOptions}
            placeholder="Select invoice grouping"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </FormField>
      </div>
    </div>
  );
};