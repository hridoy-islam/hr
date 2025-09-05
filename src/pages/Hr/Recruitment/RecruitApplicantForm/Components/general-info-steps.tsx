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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Select from 'react-select';
import { Camera } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ImageUploader } from '@/components/shared/image-uploader';

// Define option type for react-select
type OptionType = {
  value: string;
  label: string;
};

// Validation schema
const generalInfoSchema = z
  .object({
    availableFrom: z.date({
      required_error: 'Available from date is required'
    }),
    startDate: z.date({ required_error: 'Start date is required' }),
    wtrDocumentUrl: z.union([z.string().url(), z.literal('')]).optional(),
    area: z.string().min(1, { message: 'Area is required' }),
    contractHours: z.coerce
      .number()
      .min(1, { message: 'Contract Hours must be at least 1' }),
    carTravelAllowance: z.boolean().optional(),

    payroll: z.object({
      payrollNumber: z
        .string()
        .min(1, { message: 'Payroll number is required' }),
      paymentMethod: z
        .string()
        .min(1, { message: 'Payment method is required' }),
      // Optional bank fields
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      sortCode: z.string().optional(),
      beneficiary: z.string().optional()
    })
  })
  .superRefine((data, ctx) => {
    const { paymentMethod } = data.payroll;

    if (paymentMethod === 'Bank Transfer') {
      if (!data.payroll.bankName?.trim()) {
        ctx.addIssue({
          path: ['payroll', 'bankName'],
          code: z.ZodIssueCode.custom,
          message: 'Bank Name is required for Bank Transfer'
        });
      }
      if (!data.payroll.accountNumber?.trim()) {
        ctx.addIssue({
          path: ['payroll', 'accountNumber'],
          code: z.ZodIssueCode.custom,
          message: 'Account Number is required for Bank Transfer'
        });
      }
      if (!data.payroll.sortCode?.trim()) {
        ctx.addIssue({
          path: ['payroll', 'sortCode'],
          code: z.ZodIssueCode.custom,
          message: 'Sort Code is required for Bank Transfer'
        });
      }
      if (!data.payroll.beneficiary?.trim()) {
        ctx.addIssue({
          path: ['payroll', 'beneficiary'],
          code: z.ZodIssueCode.custom,
          message: 'Beneficiary Name is required for Bank Transfer'
        });
      }
    }
  });

type GeneralInfoData = z.infer<typeof generalInfoSchema>;

interface GeneralInfoStepProps {
  defaultValues?: Partial<GeneralInfoData>;
  onSaveAndContinue: (data: GeneralInfoData) => void;
  onSave: (data: GeneralInfoData) => void;
  applicantData?: any;
}

export function GeneralInformation({
  defaultValues,
  onSaveAndContinue,
  onSave,
  applicantData
}: GeneralInfoStepProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const { id } = useParams();

  const form = useForm<GeneralInfoData>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      availableFrom: defaultValues?.availableFrom
        ? new Date(defaultValues.availableFrom)
        : undefined,
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate)
        : undefined,
      wtrDocumentUrl: defaultValues?.wtrDocumentUrl || '',
      area: defaultValues?.area || '',
      contractHours: defaultValues?.contractHours ?? 0,
      carTravelAllowance: defaultValues?.carTravelAllowance ?? undefined,

      payroll: {
        payrollNumber: defaultValues?.payroll?.payrollNumber || '',
        paymentMethod: defaultValues?.payroll?.paymentMethod || '',
        bankName: defaultValues?.payroll?.bankName || '',
        accountNumber: defaultValues?.payroll?.accountNumber || '',
        sortCode: defaultValues?.payroll?.sortCode || '',
        beneficiary: defaultValues?.payroll?.beneficiary || ''
      }
    }
  });

  const [fileUrl, setFileUrl] = useState<string | null>(
    typeof defaultValues?.wtrDocumentUrl === 'string' &&
      defaultValues.wtrDocumentUrl
      ? defaultValues.wtrDocumentUrl
      : null
  );

  function onSubmit(data: GeneralInfoData) {
    const processedData = {
      ...data,
      contractHours: data.contractHours && Number(data.contractHours)
    };
    onSaveAndContinue(processedData);
  }
  function handleSave() {
    const data = form.getValues();
    onSave(data);
  }

  // Helper to convert boolean to select option
  const booleanToOption = (value?: boolean): OptionType | null => {
    if (value === undefined || value === null) return null;
    return { value: value.toString(), label: value ? 'Yes' : 'No' };
  };

  // Helper to convert string to select option
  const stringToOption = (value?: string): OptionType | null => {
    if (!value) return null;
    return { value, label: value };
  };


    const handleUploadComplete = (data) => {
    setUploadOpen(false);
  };



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 ">
          <div className="flex basis-1/6 items-center justify-start">
            <div className="relative h-48 w-48 overflow-hidden">
              <img
                src={
                  applicantData?.image ||
                  '/user.png'
                }
                alt={`${applicantData?.firstName} ${applicantData?.lastName}`}
                className="h-full w-full object-contain"
              />

              <Button
                size="icon"
                variant="theme"
                onClick={() => setUploadOpen(true)}
                className="absolute bottom-2 right-2 z-10"
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Available From */}
            <FormField
              control={form.control}
              name="availableFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available From</FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select available from date"
                      className="h-9  w-full  rounded-sm border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      isClearable
                      wrapperClassName="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select start date"
                      className="h-9  w-full  rounded-sm border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      isClearable
                      wrapperClassName="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WTR Document Upload */}
            <FormField
              control={form.control}
              name="wtrDocumentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WTR Document</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          field.onChange(url);
                          setFileUrl(url);
                        }
                      }}
                    />
                  </FormControl>
                  {fileUrl && (
                    <div className="mt-2">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        View uploaded document
                      </a>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Area */}
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="text" // change to text
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Enter contract hours"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Car Travel Allowance? */}
            <FormField
              control={form.control}
              name="carTravelAllowance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Travel Allowance?</FormLabel>
                  <FormControl>
                    <Select<OptionType>
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' }
                      ]}
                      value={booleanToOption(field.value)}
                      onChange={(option) =>
                        field.onChange(option?.value === 'true')
                      }
                      placeholder="Select an option"
                      className="react-select"
                      classNamePrefix="react-select"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payroll Number */}
            <FormField
              control={form.control}
              name="payroll.payrollNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payroll Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="payroll.paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Select<OptionType>
                      options={[
                        { value: 'Bank Transfer', label: 'Bank Transfer' },
                        { value: 'Cheque', label: 'Cheque' },
                        { value: 'Cash', label: 'Cash' }
                      ]}
                      value={stringToOption(field.value)}
                      onChange={(option) => field.onChange(option?.value)}
                      placeholder="Select method"
                      className="react-select"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('payroll.paymentMethod') === 'Bank Transfer' && (
              <>
                <FormField
                  control={form.control}
                  name="payroll.bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter bank name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payroll.accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payroll.sortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter sort code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payroll.beneficiary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter beneficiary name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <ImageUploader
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onUploadComplete={handleUploadComplete}
            entityId={id}
          />
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            {/* <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              className="text-sm"
            >
              Save Draft
            </Button> */}
            <Button
              type="submit"
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </form>
    </Form>
  );
}
