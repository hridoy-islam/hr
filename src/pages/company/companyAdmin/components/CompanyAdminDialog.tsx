import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess: () => void;
}

export function CompanyAdminDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess
}: AttendanceDialogProps) {
  const { toast } = useToast();
  const { id: companyId } = useParams();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'companyAdmin',
      company: companyId
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role: 'companyAdmin',
        company: companyId
      });
    } else {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'companyAdmin',
        company: companyId
      });
    }
  }, [initialData, open, form]);

  const onSubmit = async (data: any) => {
    try {
      let response;

      if (initialData) {
        const payload: any = { ...data, company: companyId };
        if (!payload.password) delete payload.password;

        response = await axiosInstance.patch(
          `/users/${initialData._id}`,
          payload
        );
      } else {
        // Create new account using your provided endpoint
        response = await axiosInstance.post(`/auth/signup`, data);
      }

      if (
        response?.data?.success ||
        response?.status === 200 ||
        response?.status === 201
      ) {
        toast({
          title: initialData ? 'Account Updated' : 'Account Created',
          description: initialData
            ? 'Record updated successfully.'
            : 'You have successfully created an account.',
          className: 'bg-theme border-none text-white'
        });
        onSuccess(); // Refresh the table
        onOpenChange(false); // Close the modal
      } else {
        toast({
          title: 'Error',
          description: response.data?.message || 'Something went wrong',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Server not reachable',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Account' : 'New Company Admin Account'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              {...form.register('name', { required: true })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              {...form.register('email', { required: true })}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Password{' '}
              {initialData && (
                <span className="text-xs text-gray-400">
                  (Leave blank to keep current)
                </span>
              )}
            </label>
            <Input
              type="password"
              {...form.register('password', { required: !initialData })}
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-theme text-white hover:bg-theme/90"
            >
              {initialData ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
