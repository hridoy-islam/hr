

import ErrorMessage from '@/components/shared/error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


type Inputs = {
  title: string;
  description: string;
  permissions: Record<
    string,
    {
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }
  >;
};


const modules = [
  "noticeBoard",
  "leaveManagement",
  "vacancy",
  "myStuff",
  "employee",
  "attendance",
  "payroll",
  "recruitment",
  "settings"
];


export default function AddDesignation() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<Inputs>();

  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    // Normalize permissions for each module
    const permissionsPayload = modules.reduce((acc, module) => {
      acc[module] = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      };
      return acc;
    }, {} as Inputs["permissions"]);

    const payload: Inputs = {
      ...data,
      permissions: permissionsPayload
    };

    try {
      const response = await axiosInstance.post('/hr/designation', payload);
      if (response) {
        toast({
          title: 'Success!',
          description: 'Designation added successfully.'
        });
        navigate('/admin/hr/designation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add designation.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Designation</h1>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Designation Title
              </Label>
              <Input
                id="title"
                placeholder="Enter designation title..."
                {...register('title', { required: 'Title is required' })}
                className="mt-1"
              />
              <ErrorMessage message={errors.title?.message?.toString()} />
            </div>

            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                placeholder="Enter designation description..."
                className="mt-1 resize-y rounded-lg border border-gray-300 p-3 text-sm shadow-sm w-full"
                {...register('description', { required: 'Description is required' })}
              />
              <ErrorMessage message={errors.description?.message?.toString()} />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              className="bg-supperagent hover:bg-supperagent/90 text-white font-semibold px-6 py-2 rounded-md transition-colors"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
