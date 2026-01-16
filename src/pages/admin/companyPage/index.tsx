import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { countries } from '@/types';

// --- IMPORTS FOR REACT SELECT ---
import Select from 'react-select';

// --- Types ---

export interface TCompany {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address2?: string;
  cityOrTown?: string;
  stateOrProvince?: string;
  postcode?: string;
  country?: string;
  accountNo?: string;
  sortCode?: string;
  beneficiaryName?: string;
  themeColor?: string;
  image?: string;
  status?: string;
}

// --- Zod Schemas ---

const baseSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  cityOrTown: z.string().optional(),
  stateOrProvince: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  accountNo: z.string().optional(),
  sortCode: z.string().optional(),
  beneficiaryName: z.string().optional(),
  themeColor: z.string().optional(),
  image: z.string().optional()
});

const createCompanySchema = baseSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const editCompanySchema = baseSchema.extend({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal(''))
});

type CompanyFormValues = z.infer<typeof createCompanySchema>;

export function CompanyPage() {
  const user = useSelector((state: any) => state.auth.user);
  const [companies, setCompanies] = useState<TCompany[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<TCompany | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');

  const [statusActionData, setStatusActionData] = useState<{
    id: string;
    currentStatus: string;
    name: string;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const { toast } = useToast();

  // Prepare Country Options for React Select
  // Assuming 'countries' is array of strings or objects. We normalize to { label, value }
  const countryOptions = countries.map((c: any) => ({
    label: c.name || c,
    value: c.name || c
  }));

  const schema = companyToEdit ? editCompanySchema : createCompanySchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      themeColor: '#000000'
    }
  });

  const watchedThemeColor = watch('themeColor');

  const fetchData = async (
    page: number,
    limit: number,
    search: string = ''
  ) => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/users?role=company`, {
        params: {
          page,
          limit,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setTotalPages(response.data.data.meta.totalPage);
      setCompanies(response.data.data.result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error?.response?.data.message || 'Failed to fetch company data'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const onSubmit = async (data: CompanyFormValues) => {
    setSubmitLoading(true);
    try {
      const payload: any = { ...data };

      if (companyToEdit) {
        if (!payload.password) delete payload.password;

        await axiosInstance.patch(`/users/${companyToEdit._id}`, payload);
        toast({
          title: 'Success',
          description: 'Company updated successfully',
          className: 'bg-supperagent text-white'
        });
      } else {
        payload.role = 'company';
        payload.logo = '';
        await axiosInstance.post(`/auth/signup`, payload);
        toast({
          title: 'Success',
          description: 'Company created successfully',
          className: 'bg-supperagent text-white'
        });
      }
      fetchData(currentPage, entriesPerPage);
      handleCloseDialog();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error.response?.data?.message || 'Operation failed. Try again.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const editCompany = (company: TCompany) => {
    setCompanyToEdit(company);
    reset({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      address2: company.address2 || '',
      cityOrTown: company.cityOrTown || '',
      stateOrProvince: company.stateOrProvince || '',
      postcode: company.postcode || '',
      country: company.country || '',
      accountNo: company.accountNo || '',
      sortCode: company.sortCode || '',
      beneficiaryName: company.beneficiaryName || '',
      themeColor: company.themeColor || '#38bdf8',
      password: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCompanyToEdit(null);
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      themeColor: '#38bdf8',
      password: ''
    });
  };

  const handleCompanyDetail = (company: TCompany) => {
    navigate(`/admin/company/${company?._id}`);
  };

  const initiateStatusChange = (company: TCompany) => {
    setStatusActionData({
      id: company._id,
      currentStatus: company.status || 'active',
      name: company.name
    });
  };

  const confirmStatusChange = async () => {
    if (!statusActionData) return;

    setStatusLoading(true);
    const { id, currentStatus } = statusActionData;
    const newStatus = currentStatus === 'active' ? 'block' : 'active';

    setCompanies((prevCompanies) =>
      prevCompanies.map((company) =>
        company._id === id ? { ...company, status: newStatus } : company
      )
    );

    try {
      await axiosInstance.patch(`/users/${id}`, { status: newStatus });
      toast({
        title: 'Success',
        description: `Company has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
        className: 'bg-supperagent text-white'
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company._id === id ? { ...company, status: currentStatus } : company
        )
      );
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive'
      });
    } finally {
      setStatusLoading(false);
      setStatusActionData(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-md">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-2xl font-bold">Company List</h1>
            <div className="flex flex-row gap-4">
              <Input
                placeholder="Search companies by email"
                className="min-w-[300px] border-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                onClick={handleSearch}
                size="sm"
                className="h-9 min-w-[100px]"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <Button
            variant="default"
            onClick={() => {
              setCompanyToEdit(null);
              reset({
                name: '',
                email: '',
                phone: '',
                address: '',
                themeColor: '#38bdf8'
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>
      </div>

      <div className="rounded-md">
        {initialLoading ? (
          <div className="flex justify-center py-8">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>

                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>
                      <Avatar className="h-10 w-10 border bg-gray-100">
                        <AvatarImage src={company?.image} alt={company?.name} />
                        <AvatarFallback className="bg-gray-200 text-gray-600">
                          {company?.name?.substring(0, 2).toUpperCase() || 'NA'}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone}</TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant={
                          company.status === 'active'
                            ? 'default'
                            : 'destructive'
                        }
                        className={`h-8 px-2 text-xs font-medium ${company.status !== 'active' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => initiateStatusChange(company)}
                      >
                        {company.status === 'active' ? 'Active' : 'Suspend'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCompanyDetail(company)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {companies.length > 0 && totalPages > 1 && (
          <div className="mt-4">
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[95vh] w-full overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              {companyToEdit ? 'Edit Company' : 'Add New Company'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="h-6 w-1 rounded-full bg-supperagent"></div>
                  <h3 className="font-semibold text-gray-900">
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {companyToEdit ? (
                        'New Password (Optional)'
                      ) : (
                        <span>
                          Password <span className="text-red-500">*</span>
                        </span>
                      )}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="h-6 w-1 rounded-full bg-supperagent"></div>
                  <h3 className="font-semibold text-gray-900">
                    Address Details
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">
                      Address Line 1 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      {...register('address')}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" {...register('address2')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <Label htmlFor="country">Country</Label>
                      <Controller
                        control={control}
                        name="country"
                        render={({ field: { onChange, value, ref } }) => (
                          <Select
                            ref={ref}
                            options={countryOptions}
                            value={
                              countryOptions.find((c) => c.value === value) ||
                              null
                            }
                            onChange={(val) => onChange(val?.value)}
                            placeholder="Select Country"
                            className=""
                            classNamePrefix="react-select"
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                borderRadius: '8px',
                                minHeight: 'px',
                                borderColor: errors.country
                                  ? 'rgb(239, 68, 68)'
                                  : base.borderColor,
                                boxShadow: state.isFocused
                                  ? '0 0 0 1px rgba(59,130,246,0.5)'
                                  : 'none',
                                '&:hover': {
                                  borderColor: errors.country
                                    ? 'rgb(239, 68, 68)'
                                    : base.borderColor
                                }
                              }),

                              menu: (base) => ({
                                ...base,
                                borderRadius: '8px',
                                overflow: 'hidden'
                              }),

                              menuList: (base) => ({
                                ...base,
                                maxHeight: '150px',
                                overflowY: 'auto',
                                padding: 0
                              })
                            }}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cityOrTown">City/Town</Label>
                      <Input id="cityOrTown" {...register('cityOrTown')} />
                    </div>
                   
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <Label htmlFor="stateOrProvince">State/Province</Label>
                      <Input
                        id="stateOrProvince"
                        {...register('stateOrProvince')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" {...register('postcode')} />
                    </div>

                    
                  </div>
                </div>
              </div>

              {/* Column 3: Finance & Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="h-6 w-1 rounded-full bg-supperagent"></div>
                  <h3 className="font-semibold text-gray-900">
                    Finance & Branding
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountNo">Account No</Label>
                    <Input id="accountNo" {...register('accountNo')} />
                  </div>
                  <div>
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input id="sortCode" {...register('sortCode')} />
                  </div>
                  <div>
                    <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                    <Input
                      id="beneficiaryName"
                      {...register('beneficiaryName')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="themeColor">Theme Color</Label>
                    <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 p-1 shadow-sm">
                      <input
                        id="themeColor"
                        type="color"
                        className="h-9 w-12 cursor-pointer border-none bg-transparent"
                        {...register('themeColor')}
                      />
                      <div className="mx-1 h-6 w-px bg-gray-200"></div>
                      <span className="flex-1 font-mono text-sm text-gray-600">
                        {watchedThemeColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="-mx-6 -mb-6 mt-4 flex justify-end gap-3 border-t bg-gray-50 p-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="min-w-[140px] bg-supperagent hover:bg-supperagent/90"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Details'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={!!statusActionData}
        onOpenChange={(open) => !open && setStatusActionData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{' '}
              <strong>
                {statusActionData?.currentStatus === 'active'
                  ? 'Suspend'
                  : 'Activate'}
              </strong>{' '}
              the company
              <span className="font-semibold text-gray-900">
                {' '}
                {statusActionData?.name}
              </span>
              ?
              {statusActionData?.currentStatus === 'active' && (
                <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <p>
                    Warning: Suspending a company will immediately prevent all
                    their users from accessing the system.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmStatusChange();
              }}
              disabled={statusLoading}
              className={
                statusActionData?.currentStatus === 'active'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {statusLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : statusActionData?.currentStatus === 'active' ? (
                'Yes, Suspend'
              ) : (
                'Yes, Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
