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
import Select from 'react-select';

import { CalendarIcon, Camera } from 'lucide-react';

import { useSelector } from 'react-redux';
import { ImageUploader } from '@/components/shared/image-uploader';
import { useParams } from 'react-router-dom';
import moment from 'moment';

const personalDetailsSchema = z.object({
  profilePictureUrl: z.string().url().optional(),
  title: z.string().min(1, { message: 'Please select a title' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  initial: z.string().optional(),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),

  nationalInsuranceNumber: z.string().optional(),
  nhsNumber: z.string().optional(),

  applicationDate: z.date({ required_error: 'Application date is required' }),
  availableFromDate: z.date({
    required_error: 'Available from date is required'
  }),

  employmentType: z
    .string()
    .min(1, { message: 'Please select employment type' }),
  position: z.string().min(1, { message: 'Position is required' }),
  source: z.string().min(1, { message: 'Source is required' }),
  branch: z.string().min(1, { message: 'Branch location is required' })
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailsStepProps {
  defaultValues?: Partial<PersonalDetailsData>;
  onSaveAndContinue: (data: PersonalDetailsData) => void;
  onSave: (data: PersonalDetailsData) => void;
}

export function PersonalDetailsStep({
  defaultValues,
  onSaveAndContinue,
  onSave
}: PersonalDetailsStepProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { user } = useSelector((state: any) => state.auth);
  const [profileData, setProfileData] = useState<PersonalDetailsData | null>(
    null
  );
  const [uploadOpen, setUploadOpen] = useState(false);

  const { id } = useParams();

  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      firstName: defaultValues?.firstName || '',
      initial: defaultValues?.initial || '',
      lastName: defaultValues?.lastName || '',
      dateOfBirth: defaultValues?.dateOfBirth || undefined,
      nationalInsuranceNumber: defaultValues?.nationalInsuranceNumber || '',
      nhsNumber: defaultValues?.nhsNumber || '',
      applicationDate: defaultValues?.applicationDate || undefined,
      availableFromDate: defaultValues?.availableFromDate || undefined,
      employmentType: defaultValues?.employmentType || '',
      position: defaultValues?.position || '',
      source: defaultValues?.source || '',
      branch: defaultValues?.branch || ''
    }
  });

  function onSubmit(data: PersonalDetailsData) {
    data.profilePictureUrl = photoFile
      ? URL.createObjectURL(photoFile)
      : undefined;
    onSaveAndContinue(data);
    console.log(data);
  }

  function handleSave() {
    const data = form.getValues() as PersonalDetailsData;
    data.profilePictureUrl = photoFile
      ? URL.createObjectURL(photoFile)
      : undefined;
    onSave(data);
  }

  const handleUploadComplete = (data) => {
    setUploadOpen(false);
  };
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' }
  ];

  const employmentTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'intern', label: 'Intern' }
  ];

  const sourceOptions = [
    { value: 'Job Board', label: 'Job Board' },
    { value: 'Company Website', label: 'Company Website' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Recruitment Agency', label: 'Recruitment Agency' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Career Fair', label: 'Career Fair' },
    { value: 'Direct Application', label: 'Direct Application' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <h1 className=" text-2xl ">Personal Details</h1>
            {/* Profile Picture Upload */}
            <div className="flex basis-1/6 items-center justify-start">
              <div className="relative h-48 w-48 overflow-hidden">
                <img
                  src={
                    profileData?.imageUrl ||
                    'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
                  }
                  alt={`${user?.name}`}
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

            {/* Title */}

            {/* Name Fields */}
            <div className=" grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="mt-2 flex flex-col">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Select
                        options={titleOptions}
                        value={titleOptions.find(
                          (opt) => opt.value === field.value
                        )}
                        onChange={(selectedOption) =>
                          field.onChange(
                            selectedOption ? selectedOption.value : ''
                          )
                        }
                        placeholder="Select Title"
                        isClearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={
                          field.value
                            ? moment(field.value).format('YYYY-MM-DD')
                            : ''
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Other Fields */}
            <h1 className=" text-2xl ">Official Numbers</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nationalInsuranceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National Insurance Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nhsNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NHS Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Application Details */}
            <h1 className=" text-2xl">Application Details</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={
                          field.value
                            ? moment(field.value).format('YYYY-MM-DD')
                            : ''
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableFromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available From Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={
                          field.value
                            ? moment(field.value).format('YYYY-MM-DD')
                            : ''
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem className="mt-2 flex flex-col">
                    <FormLabel>Employment Type</FormLabel>
                    <FormControl>
                      <Select
                        options={employmentTypeOptions}
                        value={employmentTypeOptions.find(
                          (opt) => opt.value === field.value
                        )}
                        onChange={(selectedOption) =>
                          field.onChange(
                            selectedOption ? selectedOption.value : ''
                          )
                        }
                        placeholder="Select Employment Type"
                        isClearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Source</FormLabel>
                    <FormControl>
                      <Select
                        options={sourceOptions}
                        value={sourceOptions.find(
                          (opt) => opt.value === field.value
                        )}
                        onChange={(selectedOption) =>
                          field.onChange(
                            selectedOption ? selectedOption.value : ''
                          )
                        }
                        placeholder="Select Source"
                        isClearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              {/* <Button
                type="submit"
                className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                onClick={handleSave}
              >
                Save
              </Button> */}

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

      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        entityId={id}
      />
    </>
  );
}
