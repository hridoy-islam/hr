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
import { Loader2, Save } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useParams } from 'react-router-dom';

// Interface for the form data — now includes ALL fields from the schema
interface ScheduleCheckValues {
  dbsCheckDate: number;
  rtwCheckDate: number;
  passportCheckDate: number;
  visaCheckDate: number;
  appraisalCheckDate: number;
  immigrationCheckDate: number;
  spotCheckDate: number;
  supervisionCheckDate: number;
  disciplinaryCheckDate: number;
  qaCheckDate: number; // ← added
  spotCheckDuration: number;
  supervisionDuration: number;
  qaCheckDuration: number; // ← added
}

export default function CompanyScheduleCheckPage() {
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const {id} = useParams()
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const form = useForm<ScheduleCheckValues>({
    defaultValues: {
      dbsCheckDate: 0,
      rtwCheckDate: 0,
      passportCheckDate: 0,
      visaCheckDate: 0,
      appraisalCheckDate: 0,
      immigrationCheckDate: 0,
      spotCheckDate: 0,
      supervisionCheckDate: 0,
      disciplinaryCheckDate: 0,
      qaCheckDate: 0, // ← added
      spotCheckDuration: 0,
      supervisionDuration: 0,
      qaCheckDuration: 0 // ← added
    }
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/schedule-check?companyId=${id}`);
        const results = response.data?.data?.result;

        if (results && results.length > 0) {
          const data = results[0];
          setExistingId(data._id);
          
          form.reset({
            dbsCheckDate: data.dbsCheckDate || 0,
            rtwCheckDate: data.rtwCheckDate || 0,
            passportCheckDate: data.passportCheckDate || 0,
            visaCheckDate: data.visaCheckDate || 0,
            appraisalCheckDate: data.appraisalCheckDate || 0,
            immigrationCheckDate: data.immigrationCheckDate || 0,
            spotCheckDate: data.spotCheckDate || 0,
            supervisionCheckDate: data.supervisionCheckDate || 0,
            disciplinaryCheckDate: data.disciplinaryCheckDate || 0,
            qaCheckDate: data.qaCheckDate || 0, // ← added
            spotCheckDuration: data.spotCheckDuration || 0,
            supervisionDuration: data.supervisionDuration || 0,
            qaCheckDuration: data.qaDuration || 0 // ← added
          });
        }
      } catch (error: any) {
        console.error('Error fetching schedule settings:', error);
        toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to load schedule settings.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, toast]);

  const onSubmit = async (data: ScheduleCheckValues) => {
    try {
      setSubmitting(true);
      let response;

      if (existingId) {
        response = await axiosInstance.patch(`/schedule-check/${existingId}`, {
          ...data,
          companyId: id
        });
      } else {
        response = await axiosInstance.post(`/schedule-check`, {
          ...data,
          companyId: id
        });
        if (response.data?.data?._id) {
          setExistingId(response.data.data._id);
        }
      }

      if (response.data?.success) {
        toast({
          title: 'Success',
          description: 'Schedule check settings saved successfully.',
          className: 'bg-theme border-none text-white'
        });
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const reminderDesc = "Number of days before expiry when the company will receive a reminder.";
  const durationDesc = "Total duration (in days) until the next check is expire";

  return (
    <div className="mx-auto space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Compliance & Activity Reminders</CardTitle>
          <CardDescription>
            Set how many days in advance you’d like to be reminded about expiring checks, 
            and define how long each activity should last.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                
                {/* DBS */}
                <FormField
                  control={form.control}
                  name="dbsCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DBS Check Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 30"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RTW */}
                <FormField
                  control={form.control}
                  name="rtwCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Right to Work (RTW) Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 30"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Passport */}
                <FormField
                  control={form.control}
                  name="passportCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Expiry Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 60"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Visa */}
                <FormField
                  control={form.control}
                  name="visaCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Expiry Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 60"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Appraisal */}
                <FormField
                  control={form.control}
                  name="appraisalCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appraisal Due Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 14"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Immigration */}
                <FormField
                  control={form.control}
                  name="immigrationCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immigration Status Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 45"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Disciplinary */}
                <FormField
                  control={form.control}
                  name="disciplinaryCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplinary Review Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 90"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* QA Check */}
                <FormField
                  control={form.control}
                  name="qaCheckDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Assurance (QA) Reminder (Days)</FormLabel>
                      <FormDescription>{reminderDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 30"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Divider */}
                <div className="col-span-full my-4 border-t border-gray-100"></div>

                {/* Spot Check Duration */}
                <FormField
                  control={form.control}
                  name="spotCheckDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spot Check Frequency (Days)</FormLabel>
                      <FormDescription>{durationDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 7"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Supervision Duration */}
                <FormField
                  control={form.control}
                  name="supervisionDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervision Frequency (Days)</FormLabel>
                      <FormDescription>{durationDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 30"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* QA Duration */}
                <FormField
                  control={form.control}
                  name="qaCheckDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Assurance Frequency (Days)</FormLabel>
                      <FormDescription>{durationDesc}</FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 14"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Optional: Add spot/supervision reminder fields if needed later */}
                {/* For now, only durations are used per your schema usage pattern */}

              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-theme px-8 text-white hover:bg-theme/90"
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