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
  beneficiary: z.string().nonempty('Beneficiary is required')
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function PeoplePlannerCompanyDetails() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { user } = useSelector((state: any) => state.auth);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(
    null
  );
  const { toast } = useToast();
  const { id } = useParams();

  const defaultValues: Partial<ProfileFormValues> = {
    name: profileData?.name || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
    phone: profileData?.phone || '',
    sortCode: profileData?.sortCode || '',
    accountNo: profileData?.accountNo || '',
    beneficiary: profileData?.beneficiary || ''
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
    <div className="flex flex-col space-y-2 p-2 md:p-2">
      <h1 className="mb-2 text-2xl font-semibold ">Company Details</h1>
      <div className="flex flex-col  rounded-lg bg-white p-4 shadow-sm">
        <div className="flex basis-1/6 items-center justify-start">
          <div className="relative h-48 w-48 overflow-hidden ROUNDED">
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
        <div className=" basis-5/6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="">
                <div className="grid grid-cols-3 gap-2 pb-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Your Name..." {...field} />
                        </FormControl>
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
                          <Input
                            placeholder="example@example.com"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="sortCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Your Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Your Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="beneficiary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficiary</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Your Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                  >
                    Update Details
                  </Button>
                  {/* <Button variant="theme" type="submit">
                    Update Details
                  </Button> */}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        entityId={id}
      />
    </div>
  );
}
