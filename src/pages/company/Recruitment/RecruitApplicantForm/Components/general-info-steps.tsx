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
    // ✅ Added rtwCheckDate
    rtwCheckDate: z.date({ 
      required_error: 'RTW check date is required' 
    }),

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

  const form = useForm<GeneralInfoData>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      availableFrom: defaultValues?.availableFrom
        ? new Date(defaultValues.availableFrom)
        : undefined,
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate)
        : undefined,
      // ✅ Added default value for rtwCheckDate
      rtwCheckDate: defaultValues?.rtwCheckDate
        ? new Date(defaultValues.rtwCheckDate)
        : undefined,
        
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

  function onSubmit(data: GeneralInfoData) {
    const processedData = {
      ...data,
      contractHours: data.contractHours && Number(data.contractHours)
    };
    onSaveAndContinue(processedData);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Available From */}
            <FormField
              control={form.control}
              name="availableFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Available From <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select available from date"
                      className="h-9 w-full rounded-sm border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
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
                  <FormLabel>
                    Start Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select start date"
                      className="h-9 w-full rounded-sm border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
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

            {/* ✅ RTW Check Date - Replaced Upload Field */}
            <FormField
              control={form.control}
              name="rtwCheckDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    RTW Check Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      minDate={new Date()} // Prevent future dates
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select check date"
                      className="h-9 w-full rounded-sm border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
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

            {/* Area */}
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Area <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract Hours */}
            <FormField
              control={form.control}
              name="contractHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contract Hours <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
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
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#e2e8f0',
                          '&:hover': { borderColor: '#cbd5e1' },
                          boxShadow: 'none'
                        })
                      }}
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
                  <FormLabel>
                    Payroll Number <span className="text-red-500">*</span>
                  </FormLabel>
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
                  <FormLabel>
                    Payment Method <span className="text-red-500">*</span>
                  </FormLabel>
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
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        control: (base) => ({
                          ...base,
                          borderColor: '#e2e8f0',
                          '&:hover': { borderColor: '#cbd5e1' },
                          boxShadow: 'none'
                        })
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
                      <FormLabel>
                        Bank Name <span className="text-red-500">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Account Number <span className="text-red-500">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Sort Code <span className="text-red-500">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Beneficiary Name <span className="text-red-500">*</span>
                      </FormLabel>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
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