import { useEffect, useState } from 'react';
import { Pen, Plus, Trash, Search, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

export interface TSubscriptionPlan {
  _id: string;
  title: string;
  price?: number; // Made optional to prevent TS errors on old data
  deviceNumber: number;
  employeeNumber: number;
}

export default function SubscriptionPlanPage() {
  const [plans, setPlans] = useState<TSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<TSubscriptionPlan | null>(
    null
  );

  // Delete States
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    deviceNumber: '',
    employeeNumber: ''
  });

  const fetchData = async (
    page: number,
    entriesPerPage: number,
    searchTerm = ''
  ) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/subscription-plans`, {
        params: {
          page,
          limit: entriesPerPage,
          searchTerm: searchTerm || undefined
        }
      });

      const result = response.data.data?.result || response.data.data || [];
      const meta = response.data.data?.meta || {};

      setPlans(result);
      setTotalPages(meta.totalPage || 1);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Failed to fetch subscription plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(1, entriesPerPage, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      deviceNumber: '',
      employeeNumber: ''
    });
    setCurrentPlan(null);
  };

  // --- FIX IS HERE ---
  const handleOpenDialog = (plan?: TSubscriptionPlan) => {
    if (plan) {
      // Edit Mode
      setCurrentPlan(plan);
      setFormData({
        title: plan.title || '',
        // Safely handle if price is undefined, null, or 0
        price:
          plan.price !== undefined && plan.price !== null
            ? plan.price.toString()
            : '',
        deviceNumber: plan.deviceNumber?.toString() || '',
        employeeNumber: plan.employeeNumber?.toString() || ''
      });
    } else {
      // Create Mode
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const payload = {
        title: formData.title,
        price: Number(formData.price), // Ensure this is converted to number
        deviceNumber: Number(formData.deviceNumber),
        employeeNumber: Number(formData.employeeNumber)
      };

      if (currentPlan?._id) {
        // Edit Mode
        await axiosInstance.patch(
          `/subscription-plans/${currentPlan._id}`,
          payload
        );
        toast({
          title: 'Plan updated successfully'
        });
      } else {
        // Create Mode
        await axiosInstance.post(`/subscription-plans`, payload);
        toast({
          title: 'Plan created successfully',
          className: 'bg-supperagent text-white'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData(currentPage, entriesPerPage, searchTerm);
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: error?.response?.data?.message || 'Failed to save plan',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await axiosInstance.delete(`/subscription-plans/${planToDelete}`);
      toast({
        title: 'Plan deleted successfully'
      });
      fetchData(currentPage, entriesPerPage, searchTerm);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Failed to delete plan',
        variant: 'destructive'
      });
    } finally {
      setOpenDeleteDialog(false);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-black">
            Subscription Plans
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by plan title"
              className="h-8 min-w-[250px]"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="min-w-[100px] bg-supperagent text-white hover:bg-supperagent/90"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No subscription plans found.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Device Limit</TableHead>
                  <TableHead>Employee Limit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell className="font-medium">{plan.title}</TableCell>

                    <TableCell>{plan.deviceNumber}</TableCell>
                    <TableCell>{plan.employeeNumber}</TableCell>
                    <TableCell>
                      {plan.price !== undefined && plan.price !== null
                        ? Number(plan.price).toFixed(2)
                        : '0.00'}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 bg-supperagent p-0 text-white hover:bg-supperagent/90"
                        onClick={() => handleOpenDialog(plan)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 bg-red-600 p-0 text-white hover:bg-red-600/90"
                        onClick={() => {
                          setPlanToDelete(plan._id);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {plans.length > 40 && (
              <div className="pt-4">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentPlan
                ? 'Edit Subscription Plan'
                : 'Create Subscription Plan'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Plan Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Basic Plan"
                  required
                />
              </div>
              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  {/* <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /> */}
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceNumber">Device Limit</Label>
                <Input
                  id="deviceNumber"
                  type="number"
                  min="0"
                  value={formData.deviceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceNumber: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">Employee Limit</Label>
                <Input
                  id="employeeNumber"
                  type="number"
                  min="0"
                  value={formData.employeeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeNumber: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-supperagent"
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? 'Saving...' : 'Save Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-700 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
