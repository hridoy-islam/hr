import { Button } from '@/components/ui/button';
import { requestOtp, validateRequestOtp } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import AuthLayout from '../components/auth-layout';
import OTP from '../../../assets/imges/home/OTP.png';

const OTP_LENGTH = 4;

export default function Otp() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const email = localStorage.getItem('tp_otp_email');

  useEffect(() => {
    if (!email) router.push('/forgot-password');
  }, [email, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'Tab' &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const index = inputRefs.current.indexOf(e.currentTarget);
      if (otp[index]) {
        setOtp((prev) => prev.map((d, i) => (i === index ? '' : d)));
      } else if (index > 0) {
        setOtp((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)));
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    const value = target.value.slice(-1);
    if (!/^[0-9]$/.test(value)) return;
    setOtp((prev) => prev.map((d, i) => (i === index ? value : d)));
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim();
    if (!new RegExp(`^[0-9]{${OTP_LENGTH}}$`).test(text)) return;
    setOtp(text.split(''));
    inputRefs.current[OTP_LENGTH - 1]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return router.push('/forgot-password');
    setError('');
    setInfo('');
    setSubmitting(true);
    const result: any = await dispatch(
      validateRequestOtp({ email, otp: otp.join('') })
    );
    setSubmitting(false);
    if (result?.payload?.success) {
      const resetToken = result.payload.data.resetToken;
      const decoded = jwtDecode(resetToken);
      localStorage.setItem(
        'tp_user_data',
        JSON.stringify({ ...decoded, token: resetToken })
      );
      router.push('/new-password');
    } else {
      setError('Invalid or expired code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setInfo('');
    setResending(true);
    const result: any = await dispatch(requestOtp({ email }));
    setResending(false);
    if (result?.payload?.success) {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setInfo('A new code has been sent to your email.');
    } else {
      setError(result?.payload || 'Could not resend code. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Verification Code"
      description={
        <>
          Enter the {OTP_LENGTH}-digit code sent to{' '}
          <strong className="text-gray-900">{email}</strong>.
        </>
      }
      image={OTP}
      imageAlt="Verification illustration"
      heading="Verify it's you to keep your account secure."
    >
      <form onSubmit={handleOtpSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            {info}
          </div>
        )}

        <div className="flex justify-between gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              className="h-16 w-full rounded-lg border border-gray-300 bg-white text-center text-3xl font-semibold text-gray-900 outline-none transition focus:border-supperagent focus:ring-2 focus:ring-supperagent/30"
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={submitting || otp.some((d) => d === '')}
          className="w-full bg-supperagent text-white hover:bg-supperagent/90"
        >
          {submitting ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-supperagent hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <Link to="/" className="text-supperagent hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
