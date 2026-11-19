import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/routes/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

import AuthLayout from '../components/auth-layout';
import resetpass from '../../../assets/imges/home/resetpassword.png';

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type UserFormValue = z.infer<typeof formSchema>;

const getResetData = (): { email?: string; token?: string } => {
  try {
    return JSON.parse(localStorage.getItem('tp_user_data') || '{}');
  } catch {
    return {};
  }
};

export default function NewPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Read once on mount: the data is cleared after a successful reset
  const [{ email, token }] = useState(getResetData);

  useEffect(() => {
    if (!success && (!email || !token)) router.push('/forgot-password');
  }, [email, token, router, success]);

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const onSubmit = async (data: UserFormValue) => {
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset`,
        { email, newPassword: data.newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token as string
          }
        }
      );
      localStorage.removeItem('tp_user_data');
      localStorage.removeItem('tp_otp_email');
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Could not update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={success ? 'Password Updated' : 'Set New Password'}
      description={
        success ? undefined : (
          <>
            Choose a new password for{' '}
            <strong className="text-gray-900">{email}</strong>.
          </>
        )
      }
      image={resetpass}
      imageAlt="Reset password illustration"
      heading="Almost there — choose a secure password."
    >
      {success ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Password updated successfully
              </p>
              <p className="mt-1 text-sm text-green-700">
                You can now sign in to your account using your new password.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.push('/')}
            className="w-full bg-supperagent text-white hover:bg-supperagent/90"
          >
            Login
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password..."
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password..."
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={loading}
              type="submit"
              className="w-full bg-supperagent text-white hover:bg-supperagent/90"
            >
              {loading ? 'Saving...' : 'Set Password'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Remembered it?{' '}
              <Link to="/" className="text-supperagent hover:underline">
                Back to Sign In
              </Link>
            </p>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
