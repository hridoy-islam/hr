import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form'; // Added Controller
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Save, Lock, KeyRound, RotateCcw } from 'lucide-react';
import { ImageUploader } from './Components/userImage-uploader';
import Select from 'react-select'; // Import React Select
import { countries } from '@/types'; // Import countries data
import { useParams } from 'react-router-dom';

// --- Schema 1: Company Profile Data ---
const companyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email({ message: 'Enter a valid email address' }),
  phone: z.string().optional(),
  // Address Section
  address: z.string().min(1, 'Address Line 1 is required'),
  address2: z.string().optional(),
  cityOrTown: z.string().min(1, 'City/Town is required'),
  stateOrProvince: z.string().optional(),
  postCode: z.string().min(1, 'Post Code is required'),
  country: z.string().min(1, 'Country is required'),
  // Bank Section
  sortCode: z.string().min(1, 'Sort Code is required'),
  accountNo: z.string().min(1, 'Account Number is required'),
  beneficiaryName: z.string().min(1, 'Beneficiary is required')
});

// --- Schema 2: Password Reset ---
const passwordFormSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type CompanyFormValues = z.infer<typeof companyFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function CompanyDetails() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { user } = useSelector((state: any) => state.auth);
  const [companyImage, setCompanyImage] = useState<string | null>(null);
  const { toast } = useToast();
  const {id} = useParams()
  // Prepare Country Options
  // Assuming 'countries' from @/types is an array of objects like { name: 'USA', ... }
  // We map it to { value, label } for react-select
  const countryOptions =  countries?.map((c: any) => ({
      label: c.name || c,
      value: c.name || c
    })) || [];

  // --- Form 1: Company Details ---
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      address2: '',
      cityOrTown: '',
      stateOrProvince: '',
      postCode: '',
      country: '',
      sortCode: '',
      accountNo: '',
      beneficiaryName: ''
    },
    mode: 'onChange'
  });

  // Access isDirty to check if the form has been modified
  const { isDirty } = companyForm.formState;

  // --- Form 2: Password ---
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Fetch Data
  const fetchProfileData = async () => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      const data = response.data.data;

      setCompanyImage(data.image);

      companyForm.reset({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        address2: data.address2 || '',
        cityOrTown: data.cityOrTown || '',
        stateOrProvince: data.stateOrProvince || '',
        postCode: data.postCode || '',
        country: data.country || '',
        sortCode: data.sortCode || '',
        accountNo: data.accountNo || '',
        beneficiaryName: data.beneficiaryName || ''
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Unable to fetch company data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (id) fetchProfileData();
  }, [id]);

  // Handle Profile Update
  const onProfileSubmit = async (data: CompanyFormValues) => {
    try {
      await axiosInstance.patch(`/users/${id}`, data);
      toast({
        title: 'Success',
        description: 'Company details updated successfully.',
      });
      fetchProfileData();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update company details.',
        variant: 'destructive'
      });
    }
  };

  // Handle Password Reset
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await axiosInstance.patch(`/users/${id}`, {
        password: data.password
      });
      toast({
        title: 'Password Updated',
        description: 'Password has been changed successfully.',
      });
      passwordForm.reset();
      setPasswordDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password.',
        variant: 'destructive'
      });
    }
  };

  const handleUploadComplete = () => {
    setUploadOpen(false);
    fetchProfileData();
  };

  return (
    <div className="relative space-y-6 pb-24">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Image & Security Trigger */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative mb-4 h-48 w-48 overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-inner">
                <img
                  src={
                    companyImage ||
                    'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
                  }
                  alt="Company Logo"
                  className="h-full w-full object-cover"
                />
                <Button
                  size="icon"
                  className="absolute bottom-2 right-6 z-10 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => setUploadOpen(true)}
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {companyForm.watch('name') || 'Company Name'}
              </h2>
              <p className="text-sm text-gray-500">
                {companyForm.watch('email') || 'email@company.com'}
              </p>
            </div>
          </div>

          {/* Security Trigger Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b pb-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Security</h3>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Update your password to keep your account secure.
            </p>

            <Dialog
              open={passwordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full bg-red-500 text-white hover:bg-red-600">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your new password below.
                  </DialogDescription>
                </DialogHeader>

                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4 py-2"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right Column: Main Form Details */}
        <div className="lg:col-span-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <Form {...companyForm}>
              <form
                onSubmit={companyForm.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Company Details
                  </h1>
                </div>
                {/* Section 1: General Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    General Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              disabled
                              className="bg-gray-100 text-gray-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 2: Address Details */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Location Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="address2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apartment, suite, unit"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="cityOrTown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / Town</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="stateOrProvince"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="postCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Code / Zip</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* UPDATED: React Select Country Field */}
                    <FormField
                      control={companyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select
                              {...field}
                              options={countryOptions}
                              value={
                                countryOptions.find(
                                  (c: any) => c.value === field.value
                                ) || null
                              }
                              onChange={(val: any) => field.onChange(val?.value)}
                              placeholder="Select Country"
                              classNamePrefix="react-select"
                              menuPortalTarget={document.body}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderRadius: '6px',
                                  minHeight: '40px',
                                  borderColor: '#e2e8f0',
                                  fontSize: '0.875rem',
                                }),
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999
                                })
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 3: Financial Details */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={companyForm.control}
                      name="accountNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="sortCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Code</FormLabel>
                          <FormControl>
                            <Input placeholder="XX-XX-XX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="beneficiaryName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Account Holder" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {isDirty && (
                  <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className=" p-4 ">
                      <div className=" flex items-center justify-end">
                        
                        <div className="flex gap-4">
                          
                          <Button
                            type="submit"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Image Uploader Component */}
      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        entityId={id}
      />
    </div>
  );
}