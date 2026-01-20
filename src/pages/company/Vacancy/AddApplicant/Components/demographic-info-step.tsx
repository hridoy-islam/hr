import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import Select from 'react-select';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

// 1. Improved Schema: Ensures details are non-empty if "Yes" is selected
const demographicinfoSchema = z
  .object({
    gender: z.string().min(1, 'Gender is required'),
    maritalStatus: z.string().min(1, 'Marital status is required'),
    ethnicOrigin: z.string().optional(),
    
    // Default booleans to false
    hasDisability: z.boolean().default(false), 
    disabilityDetails: z.string().optional(),
    
    needsReasonableAdjustment: z.boolean().default(false),
    reasonableAdjustmentDetails: z.string().optional()
  })
  .superRefine((data, ctx) => {
    // Check Disability
    if (data.hasDisability === true) {
      if (!data.disabilityDetails || data.disabilityDetails.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please provide details for your disability.',
          path: ['disabilityDetails']
        });
      }
    }

    // Check Adjustment
    if (data.needsReasonableAdjustment === true) {
      if (!data.reasonableAdjustmentDetails || data.reasonableAdjustmentDetails.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please provide details for the adjustment.',
          path: ['reasonableAdjustmentDetails']
        });
      }
    }
  });

type DemographyData = z.infer<typeof demographicinfoSchema>;

interface AddressStepProps {
  defaultValues?: Partial<DemographyData>;
  onSaveAndContinue: (data: DemographyData) => void;
  onSave: (data: DemographyData) => void;
  onBack: () => void;
}

export function DemographicInfoStep({
  defaultValues,
  onSaveAndContinue,
  onSave,
  onBack
}: AddressStepProps) {
  const form = useForm<DemographyData>({
    resolver: zodResolver(demographicinfoSchema),
    // 2. CRITICAL FIX: 'onChange' clears errors immediately as you type
    mode: 'onChange', 
    shouldUnregister: false, 
    defaultValues: {
      gender: defaultValues?.gender || '',
      maritalStatus: defaultValues?.maritalStatus || '',
      ethnicOrigin: defaultValues?.ethnicOrigin || '',
      hasDisability: defaultValues?.hasDisability || undefined,
      disabilityDetails: defaultValues?.disabilityDetails || '',
      needsReasonableAdjustment: defaultValues?.needsReasonableAdjustment || undefined,
      reasonableAdjustmentDetails: defaultValues?.reasonableAdjustmentDetails || ''
    }
  });

  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const hasDisability = form.watch('hasDisability');
  const needsAdjustment = form.watch('needsReasonableAdjustment');

  // 3. UX Improvement: Clear the text field if user switches back to "No"
  useEffect(() => {
    if (!hasDisability) {
      form.setValue('disabilityDetails', '');
      form.clearErrors('disabilityDetails');
    }
  }, [hasDisability, form]);

  useEffect(() => {
    if (!needsAdjustment) {
      form.setValue('reasonableAdjustmentDetails', '');
      form.clearErrors('reasonableAdjustmentDetails');
    }
  }, [needsAdjustment, form]);


  function onSubmit(data: DemographyData) {
    onSaveAndContinue(data);
  }

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Civil Partnership', label: 'Civil Partnership' }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 p-0">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Demographic Information */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find((opt) => opt.value === field.value)}
                      onChange={(selectedOption) =>
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }
                      placeholder="Select gender"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Marital Status <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Select
                      options={maritalStatusOptions}
                      value={maritalStatusOptions.find((opt) => opt.value === field.value)}
                      onChange={(selectedOption) =>
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }
                      placeholder="Select marital status"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ethnicOrigin"
              render={({ field }) => (
                <FormItem className="-mt-2.5">
                  <FormLabel>Ethnic Origin</FormLabel>
                  <FormControl>
                    <Textarea
                      className="border-gray-300"
                      {...field}
                      value={field.value || ''}
                      placeholder="Ethnic background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Disability Section --- */}
            <FormField
              control={form.control}
              name="hasDisability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have a disability?</FormLabel>
                  <FormControl>
                    <Select
                      options={booleanOptions}
                      value={booleanOptions.find((opt) => opt.value === field.value)}
                      onChange={(option) => field.onChange(option?.value ?? false)}
                      placeholder="Select"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasDisability === true && (
              <FormField
                control={form.control}
                name="disabilityDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disability Details <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        className="border-gray-300"
                        {...field}
                        value={field.value || ''} 
                        placeholder="Please specify details..."
                      />
                    </FormControl>
                    <FormMessage  />
                  </FormItem>
                )}
              />
            )}

            {/* --- Adjustment Section --- */}
            <FormField
              control={form.control}
              name="needsReasonableAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need Reasonable Adjustment?</FormLabel>
                  <FormControl>
                    <Select
                      options={booleanOptions}
                      value={booleanOptions.find((opt) => opt.value === field.value)}
                      onChange={(option) => field.onChange(option?.value ?? false)}
                      placeholder="Select"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsAdjustment === true && (
              <FormField
                control={form.control}
                name="reasonableAdjustmentDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Details <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        className="border-gray-300"
                        {...field}
                        value={field.value || ''}
                        placeholder="Please specify details..."
                      />
                    </FormControl>
                    <FormMessage  />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Back
            </Button>

            <Button
              type="submit"
              className="bg-theme text-white hover:bg-theme/90"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </form>
    </Form>
  );
}