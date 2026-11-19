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
import { requestOtp, resetError } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import AuthLayout from '../components/auth-layout';
import forgotpass from '../../../assets/imges/home/forgotPassword.png';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function ForgotPassword() {
  const { loading, error } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' }
  });

  useEffect(() => {
    dispatch(resetError());
  }, [dispatch]);

  const onSubmit = async (data: UserFormValue) => {
    const result: any = await dispatch(requestOtp(data));
    if (result?.payload?.success) {
      localStorage.setItem('tp_otp_email', data.email);
      router.push('/otp');
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      description="Enter your registered email and we will send you a verification code to set your password."
      image={forgotpass}
      imageAlt="Forgot password illustration"
      heading="Set or reset your password in a few steps."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
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
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Remembered your password?{' '}
            <Link to="/" className="text-supperagent hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}
