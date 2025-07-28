import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { validateRequestOtp } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { jwtDecode } from 'jwt-decode';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Link } from 'react-router-dom';

import OTP from "../../../assets/imges/home/OTP.png"

export default function Otp() {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const [error, setError] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const inputRefs = useRef([]);
  const router = useRouter();
  const email = localStorage.getItem('tp_otp_email');

  const handleKeyDown = (e) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'Tab' &&
      !e.metaKey
    ) {
      e.preventDefault();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const index = inputRefs.current.indexOf(e.target);
      if (index > 0) {
        setOtp((prevOtp) => [
          ...prevOtp.slice(0, index - 1),
          '',
          ...prevOtp.slice(index)
        ]);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleInput = (e) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      setOtp((prevOtp) => [
        ...prevOtp.slice(0, index),
        target.value,
        ...prevOtp.slice(index + 1)
      ]);
      if (index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (!new RegExp(`^[0-9]{${otp.length}}$`).test(text)) {
      return;
    }
    const digits = text.split('');
    setOtp(digits);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (!email) router.push('/forgot-password');
    const result: any = await dispatch(
      validateRequestOtp({ email, otp: otpCode })
    );
    if (result?.payload?.success) {
      const decoded = jwtDecode(result?.payload?.data?.resetToken);
      localStorage.setItem(
        'tp_user_data',
        JSON.stringify({ ...decoded, token: result?.payload?.data?.resetToken })
      );
      router.push('/new-password');
    } else {
      setError('Invalid OTP');
    }
  };

  return (
    <>
      <div className="container bg-purple-50 py-4 h-svh flex-col items-center justify-center bg-primary lg:max-w-none lg:px-0">
        <div className=" flex lg:w-9/12 gap-6 items-center mx-auto shadow-2xl justify-center space-y-2 sm:w-[480px] lg:p-7">
          <div className="mb-4 flex items-center justify-center">
            <img src={OTP} alt="OTP" className="w-full" />            
          </div>
          <Card className="p-6">
            <div className="mb-2 flex flex-col space-y-2 text-left">
              <h1 className="text-md font-semibold tracking-tight text-supperagent">
                Verification Code
              </h1>
              <p className="text-sm text-muted">
                Enter the verification code sent to your email
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <section className="bg-white py-5">
                <div className="container">
                  <div>
                    <p className="text-dark mb-1.5 text-sm font-medium dark:text-white">
                      Secure code
                    </p>
                    <form id="otp-form" className="flex gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={handleInput}
                          onKeyDown={handleKeyDown}
                          onFocus={handleFocus}
                          onPaste={handlePaste}
                          ref={(el) => (inputRefs.current[index] = el)}
                          className="shadow-xs border-stroke text-gray-5 dark:border-dark-3 flex w-[64px] items-center justify-center rounded-lg border bg-white p-2 text-center text-2xl font-medium outline-none dark:bg-white/5 sm:text-4xl"
                        />
                      ))}
                    </form>
                    <Button
                      disabled={otp.some((digit) => digit === '')}
                      onClick={handleOtpSubmit}
                      className="ml-auto mt-5 w-full bg-supperagent text-white hover:bg-background"
                      variant="outline"
                    >
                      Verify OTP
                    </Button>
                  </div>
                </div>
              </section>
            </div>
            {/* <ForgotForm /> */}
            <p className="mt-4 px-8 text-center text-sm text-muted">
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className=" underline underline-offset-4 text-supperagent"
              >
                Sign up
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
