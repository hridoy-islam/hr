import { z } from 'zod';

export const serviceFunderSchema = z.object({
  // Personal Information
  type: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Type is required'
    }),

  title: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Title is required'
    }),

  image: z.any().optional(),

  firstName: z.string().min(1, 'First name is required'),

  middleInitial: z.string().optional(),

  lastName: z.string().min(1, 'Last name is required'),

  description: z.string().min(1, 'Description is required'),


  area: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Area is required'
    }),

  branch: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Branch is required'
    }),

  maritalStatus: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .optional(),

  ethnicOrigin: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .optional(),

  religion: z.string().optional(),

  // Address & Location
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  postCode: z.string().min(1, 'Post code is required'),

  // Contact Information
  phone: z.string().optional(),
  fax: z.string().optional(),
  mobile: z.string().optional(),
  other: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  website: z.string().optional(),

  // Employment / Service Details
  startDate: z.string().min(1, 'Start date is required'),

  status: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Status is required'
    }),

  travelType: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Travel type is required'
    }),

  invoice: z.object({
    linked: z
      .boolean()
      .refine((val) => val !== undefined, { message: 'Linked is required' }),
    type: z.string().min(1, 'Type is required'),
    name: z.string().min(1, 'Name is required'),
    address: z.string().min(1, 'Address is required'),
    cityTown: z.string().min(1, 'City / Town is required'),
    county: z.string().optional(),
    postCode: z.string().min(1, 'Post code is required'),
    customerExternalId: z.string().min(1, 'Customer External ID is required'),
    invoiceRun: z.string().min(1, 'Invoice run is required'),
    invoiceFormat: z.string().min(1, 'Invoice format is required'),
    invoiceGrouping: z.string().min(1, 'Invoice grouping is required'),

    deliveryType: z
    .object({
      value: z.string(),
      label: z.string()
    })
    .nullable()
    .refine((val) => val !== null && val !== undefined, {
      message: 'Delivery type is required'
    }),
    phone: z.string().optional(),
    fax: z.string().optional(),
    mobile: z.string().optional(),
    other: z.string().optional(),
    email: z.string().email('Please enter a valid email address'),
    website: z.string().url('Invalid URL').optional()
  }),
  purchaseOrder: z.boolean({
    required_error: 'Please select if a purchase order is required'
  })
});

export type ServiceFunderFormData = z.infer<typeof serviceFunderSchema>;
