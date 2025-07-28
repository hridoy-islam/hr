import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { useSelector } from 'react-redux';

import { useParams } from 'react-router-dom';
import moment from 'moment';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { countries, nationalities, relationships } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const equalityInfoSchema = z.object({
  equalityInformation: z.object({
    nationality: z.string().min(1, { message: 'Nationality is required' }),
    religion: z.string().min(1, { message: 'Religion is required' }),
    hasDisability: z.boolean({
      required_error: 'Disability status is required'
    }),
    disabilityDetails: z
      .string()
      .optional()
      .refine(
        (val, ctx) => {
          if (ctx?.parent?.hasDisability && (!val || val.trim() === '')) {
            return false;
          }
          return true;
        },
        { message: 'Disability details are required' }
      )
  }),
  beneficiary: z.object({
    fullName: z.string().min(1, { message: 'Full name is required' }),
    relationship: z.string().min(1, { message: 'Relationship is required' }),
    email: z.string().email({ message: 'Valid email is required' }),
    mobile: z.string().min(1, { message: 'Mobile number is required' }),
    sameAddress: z.boolean().optional(),
    address: z
      .object({
        line1: z.string().min(1, { message: 'Address Line 1 is required' }),
        line2: z.string().optional(),
        city: z.string().min(1, { message: 'City is required' }),
        state: z.string().optional(),
        postCode: z.string().min(1, { message: 'Postcode is required' }),
        country: z.string().min(1, { message: 'Country is required' })
      })
      .optional()
      .refine(
        (val, ctx) => {
          if (!ctx?.parent?.sameAddress && !val) {
            return false;
          }
          return true;
        },
        { message: 'Address is required unless sameAddress is checked' }
      )
  })
});

type EqualityInfoData = z.infer<typeof equalityInfoSchema>;

interface EqualityInfoStepProps {
  defaultValues?: Partial<EqualityInfoData>;
  onSaveAndContinue: (data: EqualityInfoData) => void;
  onSave: (data: EqualityInfoData) => void;
  onBack: () => void;
}

export function EqualityInfomation({
  defaultValues,
  onSaveAndContinue,
  onSave,
  onBack
}: EqualityInfoStepProps) {
  const { user } = useSelector((state: any) => state.auth);

  const { id } = useParams();

  const form = useForm<EqualityInfoData>({
    resolver: zodResolver(equalityInfoSchema),
    defaultValues: {
      equalityInformation: {
        nationality: defaultValues?.equalityInformation?.nationality || '', // Default as empty string, populated from country list
        religion: defaultValues?.equalityInformation?.religion || '', // Default as empty string
        hasDisability:
          defaultValues?.equalityInformation?.hasDisability ?? false, // Default to false
        disabilityDetails:
          defaultValues?.equalityInformation?.disabilityDetails || '' // Empty string, optional if hasDisability is false
      },
      beneficiary: {
        fullName: defaultValues?.beneficiary?.fullName || '', // Default empty string
        relationship: defaultValues?.beneficiary?.relationship || '', // Default empty string
        email: defaultValues?.beneficiary?.email || '', // Default empty string
        mobile: defaultValues?.beneficiary?.mobile || '', // Default empty string
        sameAddress: defaultValues?.beneficiary?.sameAddress ?? false, // Default to false, if true hide address fields
        address: {
          line1: defaultValues?.beneficiary?.address?.line1 || '', // Required field, default empty string
          line2: defaultValues?.beneficiary?.address?.line2 || '', // Optional field, default empty string
          city: defaultValues?.beneficiary?.address?.city || '', // Required field, default empty string
          state: defaultValues?.beneficiary?.address?.state || '', // Optional field, default empty string
          postCode: defaultValues?.beneficiary?.address?.postCode || '', // Required field, default empty string
          country: defaultValues?.beneficiary?.address?.country || '' // Country dropdown, default empty string
        }
      }
    }
  });

  function onSubmit(data: EqualityInfoData) {
    onSaveAndContinue(data);
    console.log(data);
  }

  function handleSave() {
    const data = form.getValues() as EqualityInfoData;
    onSave(data);
  }

  const countryList = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'IN', name: 'India' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
    // Add more as needed
  ];

  const hasDisability = form.watch('equalityInformation.hasDisability');
  const sameAddress = form.watch('beneficiary.sameAddress');

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            {/* Equality Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="equalityInformation.nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equalityInformation.religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Religion</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter religion" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equalityInformation.hasDisability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you have a disability?</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'true')
                        }
                        defaultValue={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasDisability === true && (
                <FormField
                  control={form.control}
                  name="equalityInformation.disabilityDetails"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Disability Details</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please describe your disability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Beneficiary Information */}
            <h1 className='font-semibold text-xl '>Beneficiary Information</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="beneficiary.fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiary.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiary.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiary.mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="Enter mobile number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="beneficiary.sameAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Same Address</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) =>
                        field.onChange(value === 'true')
                      }
                      defaultValue={field.value?.toString()}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="text-sm">Yes</FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="text-sm">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!sameAddress && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="beneficiary.address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter address line 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiary.address.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter address line 2 (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiary.address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiary.address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter state (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiary.address.postCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter postcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiary.address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalities.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                type="button" // ✅ Prevents form submission
                className="border-none bg-black text-white hover:bg-black/90"
                onClick={(e) => {
                  e.preventDefault(); // ✅ Prevent default form behavior
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
    </>
  );
}
