import { useState, useRef, useEffect } from 'react';
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
import { 
  CalendarIcon, 
  Camera, 
  Loader2, 
  Upload, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios'; // Ensure this path is correct
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const personalDetailsSchema = z.object({
  image: z.string().url().optional(),
  title: z.string().min(1, { message: 'Please select a title' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  initial: z.string().optional(),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  nationalInsuranceNumber: z.string().optional(),
  nhsNumber: z.string().optional(),
  // passportNo: z.string().min(1, { message: 'Passport number is required' }),
  // passportExpiry: z.date({ required_error: 'Passport expiry date is required' }),
  applicationDate: z.date({ required_error: 'Application date is required' }),
  availableFromDate: z.date({ required_error: 'Available from date is required' }),
  employmentType: z.string().min(1, { message: 'Please select employment type' }),
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
  const { user } = useSelector((state: any) => state.auth);
  const { id } = useParams();

  // --- Upload State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(defaultValues?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      branch: defaultValues?.branch || '',
      // passportNo: defaultValues?.passportNo || '',
      // passportExpiry: defaultValues?.passportExpiry || undefined,
      image: defaultValues?.image || undefined
    }
  });

  // Sync uploaded URL with form
  useEffect(() => {
    if (uploadedDocUrl) {
      form.setValue('image', uploadedDocUrl);
    }
  }, [uploadedDocUrl, form]);

  function onSubmit(data: PersonalDetailsData) {
    onSaveAndContinue(data);
  }

  function handleSaveButton() {
    const data = form.getValues() as PersonalDetailsData;
    onSave(data);
  }

  // --- File Upload Logic ---
  const validateFile = (file: File) => {
    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return false;
    }
    // Allow images only
    if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (JPG, PNG).');
        return false;
    }
    return true;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // Removed ID check to allow upload even if creating new user (optional)

    if (!validateFile(file)) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    // If ID exists, attach it, otherwise handle based on your backend API requirements
    if (id) formData.append('entityId', id); 
    formData.append('file_type', 'profileImage'); 
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const url = res.data?.data?.fileUrl; // Adjust based on your API response structure
      
      if (!url) throw new Error('No file URL returned from server');

      setUploadedDocUrl(url);
      setIsDialogOpen(false); // Close dialog on success
      
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Options ---
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
          <CardContent className="space-y-6 p-0">
            <h1 className="text-2xl">Personal Details</h1>
            
            {/* Profile Picture Upload Section */}
            <div className="flex basis-1/6 items-center justify-start">
              <div className="relative h-48 w-48 overflow-hidden rounded-full border border-gray-200">
                <img
                  src={uploadedDocUrl || '/user.png'}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />

                <Button
                  type="button"
                  size="icon"
                  onClick={() => setIsDialogOpen(true)}
                  className="absolute bottom-2 right-8 z-10 rounded-full bg-theme hover:bg-theme/90"
                >
                  <Camera className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="mt-2 flex flex-col">
                    <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Select
                        options={titleOptions}
                        value={titleOptions.find((opt) => opt.value === field.value)}
                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : '')}
                        placeholder="Select Title"
                        isClearable
                        styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#e2e8f0',
                              '&:hover': { borderColor: '#cbd5e1' },
                              boxShadow: 'none',
                            }),
                          }}
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
                    <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date: Date) => field.onChange(date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select date of birth"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        isClearable
                        maxDate={new Date()}
                        wrapperClassName="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h1 className="text-2xl mt-6">Official Numbers</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nationalInsuranceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National Insurance Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="passportNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Expiry Date <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date: Date) => field.onChange(date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select passport expiry"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
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
              /> */}
            </div>

            <h1 className="text-2xl mt-6">Application Details</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Date <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date: Date) => field.onChange(date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select application date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        wrapperClassName="w-full"
                        isClearable
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
                    <FormLabel>Available From Date <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date: Date) => field.onChange(date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select available from date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-theme focus:ring-2 focus:ring-theme"
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
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem className="mt-2 flex flex-col">
                    <FormLabel>Employment Type <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Select
                        options={employmentTypeOptions}
                        value={employmentTypeOptions.find((opt) => opt.value === field.value)}
                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : '')}
                        placeholder="Select Employment Type"
                        isClearable
                        styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#e2e8f0',
                              '&:hover': { borderColor: '#cbd5e1' },
                              boxShadow: 'none',
                            }),
                          }}
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
                    <FormLabel>Position <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormLabel>Application Source <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Select
                        options={sourceOptions}
                        value={sourceOptions.find((opt) => opt.value === field.value)}
                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : '')}
                        placeholder="Select Source"
                        isClearable
                        styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#e2e8f0',
                              '&:hover': { borderColor: '#cbd5e1' },
                              boxShadow: 'none',
                            }),
                          }}
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
                    <FormLabel>Branch <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
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

      {/* --- Image Upload Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new photo for your profile. Max size 5MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              <div
                onClick={triggerFileInput}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all
                  ${
                    isUploading
                      ? 'cursor-wait border-blue-300 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mb-2 h-10 w-10 animate-spin text-theme" />
                    <p className="text-sm font-medium text-theme">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload photo
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG (Max 5MB)
                    </p>
                  </>
                )}

                {uploadError && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}