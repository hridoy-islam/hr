import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, CalendarClock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Interface for the form data
interface ScheduleCheckValues {
  dbsCheckDate: number;
  rtwCheckDate: number;
  passportCheckDate: number;
}

export default function CompanyScheduleCheckPage() {
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // Initialize form without Zod resolver
  const form = useForm<ScheduleCheckValues>({
    defaultValues: {
      dbsCheckDate: 0,
      rtwCheckDate: 0,
      passportCheckDate: 0
    }
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        // Fetch data filtering by companyId
        const response = await axiosInstance.get(
          `/schedule-check?companyId=${user._id}`
        );
        
        const results = response.data?.data?.result;

        // Check if data exists (taking the first result as per requirement)
        if (results && results.length > 0) {
          const data = results[0];
          setExistingId(data._id);
          
          // Populate form with existing data
          form.reset({
            dbsCheckDate: data.dbsCheckDate,
            rtwCheckDate: data.rtwCheckDate,
            passportCheckDate: data.passportCheckDate
          });
        }
      } catch (error) {
        console.error('Error fetching schedule settings:', error);
        toast({
          title: 'Error',
          description: error?.response?.data?.message ||'Failed to load schedule settings.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user._id, form, toast]);

  // Handle Submit (Create or Update)
  const onSubmit = async (data: ScheduleCheckValues) => {
    try {
      setSubmitting(true);
      let response;

      if (existingId) {
        // --- UPDATE (PATCH) ---
        response = await axiosInstance.patch(
          `/schedule-check/${existingId}`,
          {
            ...data,
            companyId: user._id
          }
        );
      } else {
        // --- CREATE (POST) ---
        response = await axiosInstance.post(`/schedule-check`, {
          ...data,
          companyId: user._id
        });
        
        // If created successfully, set the new ID so future saves are updates
        if (response.data?.data?._id) {
          setExistingId(response.data.data._id);
        }
      }

      if (response.data?.success) {
        toast({
          title: 'Success',
          description: 'Schedule check settings saved successfully.',
          className: 'bg-supperagent border-none text-white'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message ||'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 ">
      

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Check Intervals</CardTitle>
          <CardDescription>
            Define the validity period (in days) for mandatory compliance checks.
            System will schedule checks based on these intervals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                
                {/* DBS Check Date */}
                <FormField
                  control={form.control}
                  name="dbsCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DBS Check Interval (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 365"
                          {...field}
                          value={field.value === 0 ? '' : field.value} // Show empty string if 0
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? 0 : Number(val));
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RTW Check Date */}
                <FormField
                  control={form.control}
                  name="rtwCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RTW Check Interval (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 180"
                          {...field}
                          value={field.value === 0 ? '' : field.value} // Show empty string if 0
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? 0 : Number(val));
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Passport Check Date */}
                <FormField
                  control={form.control}
                  name="passportCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Check Interval (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 3650"
                          {...field}
                          value={field.value === 0 ? '' : field.value} // Show empty string if 0
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? 0 : Number(val));
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-supperagent px-8 text-white hover:bg-supperagent/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}