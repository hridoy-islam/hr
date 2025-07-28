import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Select from 'react-select';
import { Textarea } from '@/components/ui/textarea';

const demographicinfoSchema = z
  .object({
    // Demographic Information
    gender: z.string().min(1, 'Gender is required'),
    maritalStatus: z.string().min(1, 'Marital status is required'),
    ethnicOrigin: z.string().optional(),

    hasDisability: z.boolean(),
    disabilityDetails: z.string().optional(),
    needsReasonableAdjustment: z.boolean(),
    reasonableAdjustmentDetails: z.string().optional()
  })
  .refine(
    (data) => {
      // Simple check: if the user has a disability, disability details must be filled in
      if (data.hasDisability && !data.disabilityDetails) {
        return false; // Require disability details if hasDisability is true
      }

      // Simple check: if the user needs a reasonable adjustment, the details must be filled in
      if (data.needsReasonableAdjustment && !data.reasonableAdjustmentDetails) {
        return false; // Require reasonable adjustment details if needsReasonableAdjustment is true
      }

      return true; // If both checks pass, return true
    },
    {
      message:
        'Please provide disability details or reasonable adjustment details if required.',
      path: ['disabilityDetails', 'reasonableAdjustmentDetails'] // Error message points to the relevant fields
    }
  );
type DemographyData = z.infer<typeof demographicinfoSchema>;

interface AddressStepProps {
  defaultValues?: Partial<DemographyData>;
  onSaveAndContinue: (data: DemographyData) => void;
  onSave: (data: DemographyData) => void;
  onBack: () => void; // Add this prop for the back button
}

export function DemographicInfoStep({
  defaultValues,
  onSaveAndContinue,
  onSave,
  onBack
}: AddressStepProps) {
  const form = useForm<DemographyData>({
    resolver: zodResolver(demographicinfoSchema),
    defaultValues: {
      gender: defaultValues?.gender || '', // Default gender is 'Male'
      maritalStatus: defaultValues?.maritalStatus || '', // Default marital status is 'Single'
      ethnicOrigin: defaultValues?.ethnicOrigin || '', // Default ethnic origin is empty
      hasDisability: defaultValues?.hasDisability || undefined, // Default for disability is false
      disabilityDetails: defaultValues?.disabilityDetails || '', // Default disability details are empty
      needsReasonableAdjustment:
        defaultValues?.needsReasonableAdjustment || undefined, // Default for adjustment is false
      reasonableAdjustmentDetails:
        defaultValues?.reasonableAdjustmentDetails || '' // Default adjustment details are empty
    }
  });

  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const hasDisability = form.watch('hasDisability');
  const needsAdjustment = form.watch('needsReasonableAdjustment');

  function onSubmit(data: DemographyData) {
    onSaveAndContinue(data);
    console.log(data);
  }

  function handleSave() {
    const data = form.getValues();
    onSave(data);
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
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Demographic Information */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(selectedOption) =>
                        field.onChange(
                          selectedOption ? selectedOption.value : ''
                        )
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
                  <FormLabel>Marital Status</FormLabel>
                  <FormControl>
                    <Select
                      options={maritalStatusOptions}
                      value={maritalStatusOptions.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(selectedOption) =>
                        field.onChange(
                          selectedOption ? selectedOption.value : ''
                        )
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
                <FormItem className='-mt-2.5'>
                  <FormLabel>Ethnic Origin</FormLabel>
                  <FormControl>
                    <Textarea className='border-gray-300' {...field} placeholder="Ethnic background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

         

            {/* 1) Disability toggle */}
            <FormField
              control={form.control}
              name="hasDisability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have a disability?</FormLabel>
                  <FormControl>
                    <Select
                      options={booleanOptions}
                      value={booleanOptions.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(option) => field.onChange(option?.value)}
                      placeholder="Select"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2) Show this only when hasDisability === true */}
            {hasDisability && (
              <FormField
                control={form.control}
                name="disabilityDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disability Details</FormLabel>
                    <FormControl>
                      <Textarea className='border-gray-300'  {...field} placeholder="If yes, please specify" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="needsReasonableAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need Reasonable Adjustment?</FormLabel>
                  <FormControl>
                    <Select
                      options={booleanOptions}
                      value={booleanOptions.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(option) => field.onChange(option?.value)}
                      placeholder="Select"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4) Show this only when needsReasonableAdjustment === true */}
            {needsAdjustment && (
              <FormField
                control={form.control}
                name="reasonableAdjustmentDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Details</FormLabel>
                    <FormControl>
                      <Textarea className='border-gray-300' {...field} placeholder="If yes, please specify" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              className="border-none bg-black text-white hover:bg-black/90"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Back
            </Button>

            <Button
              type="submit"
              className=" bg-supperagent text-white hover:bg-supperagent/90"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </form>
    </Form>
  );
}
