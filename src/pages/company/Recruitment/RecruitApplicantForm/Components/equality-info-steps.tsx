import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { countries, nationalities, relationships } from "@/types";

import ReactSelect from "react-select";

const addressSchema = z.object({
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postCode: z.string().min(1, "Postcode is required"),
  country: z.string().min(1, "Country is required"),
});

const equalityInfoSchema = z.object({
  equalityInformation: z.object({
    nationality: z.string().min(1, "Nationality is required"),
    religion: z.string().min(1, "Religion is required"),
  }),
  beneficiary: z.object({
    fullName: z.string().min(1, "Full name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    email: z.string().email("Valid email is required"),
    mobile: z.string().min(1, "Mobile number is required"),
    sameAddress: z.boolean({
      required_error: "Please select Yes or No",
    }),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).superRefine((data, ctx) => {
    // Only validate address when sameAddress is false
    if (!data.sameAddress) {
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address is required when 'Same Address' is No",
          path: ["address"],
        });
        return;
      }
      
      // Check required address fields when sameAddress is false
      if (!data.address.line1 || data.address.line1.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address Line 1 is required",
          path: ["address", "line1"],
        });
      }
      
      if (!data.address.city || data.address.city.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required",
          path: ["address", "city"],
        });
      }
      
      if (!data.address.postCode || data.address.postCode.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Postcode is required",
          path: ["address", "postCode"],
        });
      }
      
      if (!data.address.country || data.address.country.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Country is required",
          path: ["address", "country"],
        });
      }
    }
    // When sameAddress is true, we completely skip address validation
  }),
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
  onBack,
}: EqualityInfoStepProps) {
  const { user } = useSelector((state: any) => state.auth);
  const { id } = useParams();

  const form = useForm<EqualityInfoData>({
    resolver: zodResolver(equalityInfoSchema),
    defaultValues: {
      equalityInformation: {
        nationality: defaultValues?.equalityInformation?.nationality || "",
        religion: defaultValues?.equalityInformation?.religion || "",
      },
      beneficiary: {
        fullName: defaultValues?.beneficiary?.fullName || "",
        relationship: defaultValues?.beneficiary?.relationship || "",
        email: defaultValues?.beneficiary?.email || "",
        mobile: defaultValues?.beneficiary?.mobile || "",
        sameAddress: defaultValues?.beneficiary?.sameAddress ?? undefined,
        address: {
          line1: defaultValues?.beneficiary?.address?.line1 || "",
          line2: defaultValues?.beneficiary?.address?.line2 || "",
          city: defaultValues?.beneficiary?.address?.city || "",
          state: defaultValues?.beneficiary?.address?.state || "",
          postCode: defaultValues?.beneficiary?.address?.postCode || "",
          country: defaultValues?.beneficiary?.address?.country || "",
        },
      },
    },
  });

  function onSubmit(data: EqualityInfoData) {
    onSaveAndContinue(data);
    // console.log(data);
  }

  const sameAddress = form.watch("beneficiary.sameAddress");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            {/* Equality Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Nationality */}
              <FormField
                control={form.control}
                name="equalityInformation.nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <ReactSelect
                        options={nationalities.map((c) => ({
                          label: c,
                          value: c,
                        }))}
                        value={
                          field.value
                            ? { label: field.value, value: field.value }
                            : null
                        }
                        onChange={(selected) =>
                          field.onChange(selected?.value || "")
                        }
                        placeholder="Select nationality"
                        isClearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Religion */}
              <FormField
                control={form.control}
                name="equalityInformation.religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Religion <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <ReactSelect
                        options={[
                          { label: "Islam", value: "Islam" },
                          { label: "Hinduism", value: "Hinduism" },
                          { label: "Christianity", value: "Christianity" },
                          { label: "Buddhism", value: "Buddhism" },
                          { label: "Other", value: "Other" },
                        ]}
                        value={
                          field.value
                            ? { label: field.value, value: field.value }
                            : null
                        }
                        onChange={(selected) =>
                          field.onChange(selected?.value || "")
                        }
                        placeholder="Select religion"
                        isClearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Beneficiary Information */}
            <h1 className="font-semibold text-xl">
             Next Of kin
            </h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="beneficiary.fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Relationship */}
              <FormField
                control={form.control}
                name="beneficiary.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <ReactSelect
                        options={relationships.map((c) => ({
                          label: c,
                          value: c,
                        }))}
                        value={
                          field.value
                            ? { label: field.value, value: field.value }
                            : null
                        }
                        onChange={(selected) =>
                          field.onChange(selected?.value || "")
                        }
                        placeholder="Select relationship"
                        isClearable
                      />
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
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Mobile <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Same Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) =>
                        field.onChange(value === "true")
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
                      <FormLabel>Address Line 1 <span className="text-red-500">*</span></FormLabel>
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
                {/* Country with ReactSelect */}
                <FormField
                  control={form.control}
                  name="beneficiary.address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <ReactSelect
                          options={nationalities.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          value={
                            field.value
                              ? { label: field.value, value: field.value }
                              : null
                          }
                          onChange={(selected) =>
                            field.onChange(selected?.value || "")
                          }
                          placeholder="Select country"
                          isClearable
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
                      <FormLabel>City <span className="text-red-500">*</span></FormLabel>
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
                        <Input {...field} placeholder="Enter state (optional)" />
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
                      <FormLabel>Postcode <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter postcode" />
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
                className="bg-theme text-white hover:bg-theme/90"
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