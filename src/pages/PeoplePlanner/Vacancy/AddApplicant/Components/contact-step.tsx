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
import { countries } from '@/types';

// Zod validation schema for the contact information form
const contactSchema = z.object({
  homePhone: z
    .string()
    .regex(/^[\d+\-\s().]+$/, { message: 'Invalid phone number' })
    .optional(),
  mobilePhone: z
    .string()
    .regex(/^[\d+\-\s().]+$/, { message: 'Invalid phone number' })
    .optional(),
  otherPhone: z
    .string()
    .regex(/^[\d+\-\s().]+$/, { message: 'Invalid phone number' })
    .optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  address: z.string().trim().min(1, { message: 'Address is required' }),
  cityOrTown: z.string().trim().min(1, { message: 'City or Town is required' }),
  stateOrProvince: z
    .string()
    .trim()
    .min(1, { message: 'State or Province is required' }),
  postCode: z.string().trim().min(1, { message: 'Post Code is required' }),
  country: z.string().trim().min(1, { message: 'Country is required' })
});

type ContactData = z.infer<typeof contactSchema>;

interface ContactStepProps {
  defaultValues?: Partial<ContactData>;
  onSaveAndContinue: (data: ContactData) => void;
  onSave: (data: ContactData) => void;
  onBack: () => void;
}

export function ContactStep({
  defaultValues,
  onSaveAndContinue,
  onSave,
  onBack
}: ContactStepProps) {
  const form = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      homePhone: defaultValues?.homePhone || '',
      mobilePhone: defaultValues?.mobilePhone || '',
      otherPhone: defaultValues?.otherPhone || '',
      email: defaultValues?.email || '',
      address: defaultValues?.address || '',
      cityOrTown: defaultValues?.cityOrTown || '',
      stateOrProvince: defaultValues?.stateOrProvince || '',
      postCode: defaultValues?.postCode || '',
      country: defaultValues?.country || ''
    }
  });

  function onSubmit(data: ContactData) {
    onSaveAndContinue(data);
    console.log(data);
  }

  const countryOptions = countries.map((country) => ({
    value: country,
    label: country
  }));
  function handleSave() {
    const data = form.getValues();
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-10">
            {/* Contact Details */}
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="homePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Phone</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Phone</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Phone</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input className="w-full" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                Address Information
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cityOrTown"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City or Town</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stateOrProvince"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State or Province</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          options={countryOptions}
                          value={countryOptions.find(
                            (opt) => opt.value === field.value
                          )}
                          onChange={(selectedOption) =>
                            field.onChange(
                              selectedOption ? selectedOption.value : ''
                            )
                          }
                          placeholder="Select Country"
                          isClearable
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div className="flex justify-between p-4">
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
      </form>
    </Form>
  );
}
