import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import moment from 'moment'; // Changed from date-fns to moment
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Camera,
  Loader2,
  Check,
  Crown,
  Save,
  Palette,
  History
} from 'lucide-react';
import Select from 'react-select';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { countries } from '@/types';
import { ImageUploader } from './components/userImage-uploader';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Types ---
export interface TSubscriptionPlan {
  _id: string;
  title: string;
  deviceNumber: number;
  employeeNumber: number;
}

// Interface for Reports
export interface TCompanyReport {
  _id: string;
  companyId: string;
  subscriptionPlanId: string;
  logMessage: string;
  amount: number;
  createdAt: string;
}

// --- Zod Schema ---
const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  address2: z.string().optional().nullable(),
  cityOrTown: z.string().optional().nullable(),
  stateOrProvince: z.string().optional().nullable(),
  postCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  accountNo: z.string().optional().nullable(),
  sortCode: z.string().optional().nullable(),
  beneficiaryName: z.string().optional().nullable(),
  themeColor: z.string().optional().nullable(),
  password: z.string().optional()
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Subscription State
  const [plans, setPlans] = useState<TSubscriptionPlan[]>([]);

  // Logs State
  const [logs, setLogs] = useState<TCompanyReport[]>([]);

  // Tracks the ID of the plan currently being confirmed in the dialog
  const [planToConfirm, setPlanToConfirm] = useState<string | null>(null);

  // Tracks the ID of the plan currently being processed (showing spinner)
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Form State
  const [submitLoading, setSubmitLoading] = useState(false);

  // Prepare Country Options
  const countryOptions =
    countries?.map((c: any) => ({
      label: c.name || c,
      value: c.name || c
    })) || [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      themeColor: '#000000'
    }
  });

  const watchedThemeColor = watch('themeColor');

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [companyRes, plansRes, reportsRes] = await Promise.all([
        axiosInstance.get(`/users/${id}`),
        axiosInstance.get(`/subscription-plans`),
        axiosInstance.get(`/company-report?companyId=${id}`)
      ]);

      const companyData = companyRes.data?.data;
      setCompany(companyData);
      setPlans(plansRes.data?.data?.result || []);
      setLogs(reportsRes.data?.data?.result || []);

      reset({
        name: companyData.name || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
        address2: companyData.address2 || '',
        cityOrTown: companyData.cityOrTown || '',
        stateOrProvince: companyData.stateOrProvince || '',
        postCode: companyData.postCode || '',
        country: companyData.country || '',
        accountNo: companyData.accountNo || '',
        sortCode: companyData.sortCode || '',
        beneficiaryName: companyData.beneficiaryName || '',
        themeColor: companyData.themeColor || '#000000',
        password: ''
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // --- Handlers ---

  const onSubmit = async (data: CompanyFormValues) => {
    setSubmitLoading(true);
    try {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;

      await axiosInstance.patch(`/users/${id}`, payload);

      toast({
        title: 'Success',
        description: 'Company details updated successfully',
        className: 'bg-theme text-white'
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.response?.data?.message || 'Update failed'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUploadComplete = () => {
    fetchData();
    toast({
      title: 'Success',
      description: 'Profile image updated successfully',
      className: 'bg-theme text-white'
    });
  };

  // 1. Trigger the confirmation dialog
  const initiatePlanSelection = (planId: string) => {
    setPlanToConfirm(planId);
  };

  // 2. Execute logic after confirmation
  const executePlanChange = async () => {
    if (!planToConfirm) return;

    const planId = planToConfirm;
    setPlanToConfirm(null); // Close dialog
    setProcessingPlanId(planId); // Show spinner on the specific button

    try {
      await axiosInstance.patch(`/users/${id}`, { subscriptionId: planId });
      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
        className: 'bg-theme text-white'
      });
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to update subscription'
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* --- Top Header Area --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <Button size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-sm">
                <img
                  src={
                    company?.image ||
                    'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
                  }
                  alt={`${company?.name}`}
                  className="h-full w-full object-cover"
                />
              </div>

              <Button
                size="icon"
                onClick={() => setUploadOpen(true)}
                className="absolute -bottom-1 -right-1 z-20 h-7 w-7 rounded-full border border-white shadow-md"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                {company?.name}
                {company?.subscriptionId?.title && (
                  <span className=" font-medium ">
                    - {company.subscriptionId.title}
                  </span>
                )}
              </h1>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${company?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}
                ></span>
                {company?.status === 'active' ? 'Active' : 'Suspend'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="destructive">Suspend Account</Button>
        </div>
      </div>

      {/* --- Main Grid Layout --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* --- Left Side: Tabs (Col Span 2) --- */}
        <div className="space-y-6 md:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4 h-12 w-full justify-start rounded-lg border border-gray-200 bg-white p-1">
              <TabsTrigger
                value="general"
                className="px-6 data-[state=active]:bg-theme data-[state=active]:text-white"
              >
                General Information
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="px-6 data-[state=active]:bg-theme data-[state=active]:text-white"
              >
                Subscription
              </TabsTrigger>
            </TabsList>

            {/* Tab: General Information */}
            <TabsContent value="general">
              <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                  <CardContent className="space-y-6 pt-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-5 w-1 rounded-full bg-theme"></div>
                        <h3 className="font-semibold text-gray-900">
                          Basic Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Company Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...register('name')}
                            className={errors.name ? 'border-red-500' : ''}
                          />
                          {errors.name && (
                            <p className="text-xs text-red-500">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              {...register('email')}
                              disabled
                              className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-500">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              {...register('phone')}
                              className={`pl-9 ${errors.phone ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-xs text-red-500">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">
                            Change Password (Optional)
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Leave empty to keep current"
                            {...register('password')}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-5 w-1 rounded-full bg-theme"></div>
                        <h3 className="font-semibold text-gray-900">
                          Location Details
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="address">
                              Address Line 1{' '}
                              <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                id="address"
                                {...register('address')}
                                className={`pl-9 ${errors.address ? 'border-red-500' : ''}`}
                              />
                            </div>
                            {errors.address && (
                              <p className="text-xs text-red-500">
                                {errors.address.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address2">Address Line 2</Label>
                            <Input id="address2" {...register('address2')} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div className="space-y-2">
                            <Label htmlFor="cityOrTown">City</Label>
                            <Input
                              id="cityOrTown"
                              {...register('cityOrTown')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stateOrProvince">State</Label>
                            <Input
                              id="stateOrProvince"
                              {...register('stateOrProvince')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input id="postcode" {...register('postCode')} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Controller
                              control={control}
                              name="country"
                              render={({ field: { onChange, value, ref } }) => (
                                <Select
                                  ref={ref}
                                  options={countryOptions}
                                  value={
                                    countryOptions.find(
                                      (c: any) => c.value === value
                                    ) || null
                                  }
                                  onChange={(val: any) => onChange(val?.value)}
                                  placeholder="Select"
                                  classNamePrefix="react-select"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderRadius: '6px',
                                      minHeight: '40px',
                                      borderColor: '#e2e8f0'
                                    }),
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999
                                    })
                                  }}
                                  menuPortalTarget={document.body}
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Financial */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-5 w-1 rounded-full bg-theme"></div>
                        <h3 className="font-semibold text-gray-900">
                          Financial Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Bank Details
                          </Label>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label
                                htmlFor="accountNo"
                                className="text-xs text-muted-foreground"
                              >
                                Account No
                              </Label>
                              <Input
                                id="accountNo"
                                {...register('accountNo')}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor="sortCode"
                                className="text-xs text-muted-foreground"
                              >
                                Sort Code
                              </Label>
                              <Input id="sortCode" {...register('sortCode')} />
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor="beneficiaryName"
                                className="text-xs text-muted-foreground"
                              >
                                Beneficiary Name
                              </Label>
                              <Input
                                id="beneficiaryName"
                                {...register('beneficiaryName')}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* App Config */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-5 w-1 rounded-full bg-theme"></div>
                        <h3 className="font-semibold text-gray-900">
                          App Configuration
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="themeColor"
                            className="flex items-center gap-2"
                          >
                            <Palette className="h-4 w-4" /> Theme Color
                          </Label>
                          <div className="flex items-center gap-3 rounded-lg border p-3">
                            <input
                              id="themeColor"
                              type="color"
                              className="h-10 w-10 cursor-pointer border-none bg-transparent"
                              {...register('themeColor')}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium">
                                {watchedThemeColor}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Primary brand color
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Footer */}
                  {isDirty && (
                    <CardFooter className="sticky bottom-0 z-10 flex justify-end">
                      <div className="flex items-center gap-3">
                        <Button type="submit" disabled={submitLoading}>
                          {submitLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </form>
            </TabsContent>

            {/* Tab: Subscription */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Plans</CardTitle>
                  <CardDescription>
                    Select a plan for this company.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No subscription plans available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {plans.map((plan) => {
                        const companySubId =
                          typeof company?.subscriptionId === 'object'
                            ? company?.subscriptionId?._id
                            : company?.subscriptionId;

                        const isSelected = companySubId === plan._id;
                        const isProcessing = processingPlanId === plan._id;

                        return (
                          <div
                            key={plan._id}
                            className={`flex items-center justify-between rounded-lg border p-4 transition-all ${isSelected ? 'border-theme bg-theme/5' : 'hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? 'bg-theme text-white' : 'bg-gray-100 text-gray-500'}`}
                              >
                                <Crown className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {plan.title}
                                </h4>
                                <div className="flex gap-3 text-sm text-gray-500">
                                  <span>{plan.deviceNumber} Devices</span>
                                  <span>•</span>
                                  <span>{plan.employeeNumber} Employees</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              // Open alert dialog instead of direct API call
                              onClick={() => initiatePlanSelection(plan._id)}
                              disabled={!!processingPlanId || isSelected}
                              variant={isSelected ? 'default' : 'outline'}
                              className={
                                isSelected
                                  ? 'bg-theme hover:bg-theme/90'
                                  : ''
                              }
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : isSelected ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" /> Current
                                </>
                              ) : (
                                'Select Plan'
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* --- Right Side: Logs --- */}
        <div className="md:col-span-1">
          <Card className="flex h-full flex-col border-l-4 border-l-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" /> Activity Logs
                </span>
                <span
                  onClick={() => navigate('/admin/report')}
                  className="cursor-pointer text-sm font-medium text-black hover:underline"
                >
                  View All
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-0">
              {/* Scrollable Container for Table */}
              <div className="max-h-[600px] overflow-y-auto p-4 ">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Message</TableHead>
                      <TableHead className="text-right text-xs">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-xs text-gray-500"
                        >
                          No transaction history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((report) => (
                        <TableRow key={report._id} className="text-xs">
                          <TableCell className="align-top font-medium text-muted-foreground">
                            <div className="flex flex-col">
                              <span>
                                {report.createdAt
                                  ? moment(report.createdAt).format(
                                      'DD MMM YYYY'
                                    )
                                  : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            {report.logMessage}
                          </TableCell>
                          <TableCell className="text-right align-top font-semibold">
                            {report.amount > 0 ? (
                              <span className="text-green-600">
                                {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(report.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(report.amount)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        entityId={id as string}
      />

      {/* --- Confirmation Alert Dialog --- */}
      <AlertDialog
        open={!!planToConfirm}
        onOpenChange={(open) => !open && setPlanToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the subscription plan for this
              company? This may affect their billing and feature access
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executePlanChange}
              className="bg-theme hover:bg-theme/90"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
