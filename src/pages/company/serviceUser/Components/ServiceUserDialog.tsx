import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 1. Define the Zod schema
const serviceUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  room: z.string().min(1, { message: 'Room is required' }),
  phone: z.string().optional(),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')), // Allows empty string submission without triggering email error
});

// Infer the TypeScript type from the schema
type ServiceUserFormValues = z.infer<typeof serviceUserSchema>;

export function ServiceUserDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: any) {
  // 2. Initialize react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceUserFormValues>({
    resolver: zodResolver(serviceUserSchema),
    defaultValues: {
      name: '',
      room: '',
      phone: '',
      email: '',
    },
  });

  // 3. Reset form data when the dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || '',
        room: initialData?.room || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
      });
    }
  }, [initialData, open, reset]);

  // 4. Handle valid submission
  const handleValidSubmit = (data: ServiceUserFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Service User</DialogTitle>
        </DialogHeader>
        
        {/* Pass handleSubmit from react-hook-form */}
        <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">
              Room <span className="text-red-500">*</span>
            </Label>
            <Input
              id="room"
              placeholder="e.g. Room 101"
              {...register('room')}
            />
            {errors.room && (
              <p className="text-sm text-red-500">{errors.room.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone </Label>
            <Input
              id="phone"
              placeholder="e.g. +1 234 567 890"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. john@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="border-none bg-theme text-white hover:bg-theme/90"
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}