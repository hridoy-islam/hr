import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';
import { useEffect } from 'react';
import { MoveLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const trainingFormSchema = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().optional(),
  // isRecurring: z.boolean({ required_error: 'Recurring status is required' }),
  validityDays: z
    .number()
    .int('Must be an integer')
    .positive('Must be positive')
    .optional()
    .refine((val) => typeof val === 'number' && !isNaN(val), {
      message: 'Validity days must be a number'
    }),
  reminderBeforeDays: z
    .number()
    .int('Must be an integer')
    .positive('Must be positive')
    .optional()
    .refine((val) => typeof val === 'number' && !isNaN(val), {
      message: 'Reminder days must be a number'
    })
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

export default function EditTraining() {
  const { id,tid } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      name: '',
      description: '',
      validityDays: undefined,
      reminderBeforeDays: undefined
    }
  });

  const { setValue, watch } = form;

  // Fetch the training data and set it in the form
  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const response = await axiosInstance.get(`/hr/training/${tid}`);
        const data = response.data.data;

        // Prefill the form with existing data
        setValue('name', data.name);
        setValue('description', data.description || '');
        setValue('validityDays', data.validityDays || undefined);
        setValue('reminderBeforeDays', data.reminderBeforeDays || undefined);
      } catch (error) {
        console.error('Error fetching training data:', error);
      }
    };

    if (id) fetchTraining();
  }, [id, setValue]);

  const onSubmit = async (data: TrainingFormData) => {
    try {
      await axiosInstance.patch(`/hr/training/${tid}`, data);

      // Check if update was successful

      toast({
        title: 'Training Updated',
        description: 'Training details have been successfully updated.'
      });

      navigate(-1);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Unknown error';

      toast({
        title: 'Update Failed',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div>
      <Card>
        <div className="p-4">
          <div className="flex w-full items-center justify-between pb-2">
            <h1 className="mb-2 text-2xl font-semibold">
              Edit Training Module
            </h1>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              onClick={() => navigate(-1)}
            >
              <MoveLeft /> Back
            </Button>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormLabel>Training Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter training name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter training description"
                        {...field}
                        className="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Recurring */}
              {/* <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                      />
                    </FormControl>
                    <FormLabel>Is this training recurring?</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Validity Days - conditional */}
              <div className="flex w-full flex-row items-center justify-between gap-4">
                <FormField
                  control={form.control}
                  name="validityDays"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Validity Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 90"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderBeforeDays"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Remind how many days before expiry?</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 10"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex w-full items-center justify-end gap-4">
                <Button
                  type="submit"
                  className="border-none bg-theme text-white hover:bg-theme/90"
                >
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
