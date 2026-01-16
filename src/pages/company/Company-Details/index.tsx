import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { Camera } from 'lucide-react';

import { useParams } from 'react-router-dom';
import { ImageUploader } from './Components/userImage-uploader';

const profileFormSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z.string().email({ message: 'Enter a valid email address' }),
  address: z.string().nonempty('Address Line 1 is required'),
  phone: z.string().optional(),
  sortCode: z.string().nonempty('Sort Code is required'),
  accountNo: z.string().nonempty('Account Number is required'),
  beneficiaryName: z.string().nonempty('Beneficiary is required')
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CompanyDetails() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { user } = useSelector((state: any) => state.auth);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(
    null
  );
  const { toast } = useToast();

  const defaultValues: Partial<ProfileFormValues> = {
    name: profileData?.name || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
    phone: profileData?.phone || '',
    sortCode: profileData?.sortCode || '',
    accountNo: profileData?.accountNo || '',
    beneficiaryName: profileData?.beneficiaryName || ''
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const fetchProfileData = async () => {
    try {
      const response = await axiosInstance.get(`/users/${user._id}`);
      const data = response.data.data;
      setProfileData(data);
      form.reset(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Unable to fetch profile data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await axiosInstance.patch(`/users/${user._id}`, data);
      toast({
        title: 'Company Details Updated',
        className: 'border-none text-white'
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        className: 'bg-destructive border-none text-white'
      });
    }
  };

  const handleUploadComplete = (data) => {
    setUploadOpen(false);
    fetchProfileData();
  };

  return (
  <div >
    <div className="rounded-lg bg-white p-6 shadow-lg space-y-4">
      {/* Header */}
      <h1 className=" font-bold text-2xl  text-gray-900">Company Details</h1>

      {/* Form + Profile Image */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-gray-200">
            <img
              src={
                profileData?.image ||
                'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
              }
              alt={user?.name || 'Profile'}
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

        {/* Form */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Your Name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Your Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sort Code */}
                <FormField
                  control={form.control}
                  name="sortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Sort Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Account Number */}
                <FormField
                  control={form.control}
                  name="accountNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Account Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Beneficiary */}
                <FormField
                  control={form.control}
                  name="beneficiaryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Beneficiary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                >
                  Update Details
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>

    {/* Image Uploader */}
    <ImageUploader
      open={uploadOpen}
      onOpenChange={setUploadOpen}
      onUploadComplete={handleUploadComplete}
      entityId={user._id}
    />
  </div>
);

}
