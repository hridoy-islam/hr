import { z } from 'zod';

export const serviceUserSchema = z.object({
  // Personal Information
  type: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().refine((val) => val !== null, 'Type is required'),

  title: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().refine((val) => val !== null, 'Title is required'),

  image: z.any().optional(),
  firstName: z.string().min(1, 'First name is required'),
  middleInitial: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),

  gender: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().refine((val) => val !== null, 'Gender is required'),

  maritalStatus: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().optional(),

  ethnicOrigin: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().optional(),

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
  lastDutyDate: z.string().optional(),

  status: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().refine((val) => val !== null, 'Status is required'),

  servicePriority: z.object({
    value: z.string(),
    label: z.string()
  }).nullable().refine((val) => val !== null, 'Service priority is required'),

  serviceLocationExId: z.string().min(1, 'Service Location Ex ID is required'),

  timesheetSignature: z.boolean(),

  timesheetSignatureNote: z.string().optional()
})
// Optional: Only require timesheetSignatureNote if timesheetSignature is true
.refine(
  (data) => {
    if (data.timesheetSignature === true) {
      return typeof data.timesheetSignatureNote === 'string' && data.timesheetSignatureNote.trim().length > 0;
    }
    return true;
  },
  {
    path: ['timesheetSignatureNote'],
    message: 'Note is required when Timesheet Signature is required',
  }
);

export type ServiceUserFormData = z.infer<typeof serviceUserSchema>;
