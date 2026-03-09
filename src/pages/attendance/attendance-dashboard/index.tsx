import React, { useState, useRef, useEffect } from 'react';
import { ScanLine, CheckCircle2, XCircle, Loader2, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
import { logout } from '@/redux/features/authSlice';
// Import your logout action and AppDispatch type from your Redux store setup

export default function AttendanceScanner() {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [feedbackMessage, setFeedbackMessage] = useState({
    title: '',
    description: ''
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Redux & Router hooks
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  // Force Focus Mechanism
  useEffect(() => {
    const keepFocused = () => {
      // Don't steal focus if the user is interacting with the logout button
      if (
        inputRef.current &&
        document.activeElement !== inputRef.current &&
        !document.activeElement?.closest('.logout-btn')
      ) {
        inputRef.current.focus();
      }
    };

    keepFocused();
    document.addEventListener('click', keepFocused);
    return () => document.removeEventListener('click', keepFocused);
  }, []);

  // Handle the Scanner Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scannedId = inputValue.trim();
    if (!scannedId) return;

    setStatus('loading');
    setInputValue('');

    try {
      const response = await axiosInstance.post('/rota/attendance', {
        rotaId: scannedId
      });

      if (response.data?.success) {
        const { firstName, lastName } = response.data?.data?.employeeId || {};

        setStatus('success');
        setFeedbackMessage({
          title: `Thank you, ${firstName || ''} ${lastName || ''}`.trim(),
          description: 'Attendance recorded successfully.'
        });
      } else {
        throw new Error(
          response.data?.message || 'Invalid ID or attendance failed.'
        );
      }
    } catch (error: any) {
      setStatus('error');
      setFeedbackMessage({
        title: 'Attendance Submission Failed',
        description:
          error.response?.data?.message ||
          error.message ||
          'Please contact the administrator.'
      });
    }

    // Reset the screen back to 'idle'
    setTimeout(() => {
      setStatus('idle');
      setFeedbackMessage({ title: '', description: '' });
      inputRef.current?.focus();
    }, 3000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-200 p-4">
      {/* Top Right Logout Button */}
      <div className="absolute right-6 top-6">
        <Button onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="w-full max-w-2xl rounded-2xl border border-gray-300 bg-white p-10 py-16 text-center ">
        {/* State: IDLE */}
        {status === 'idle' && (
          <div className="flex transform flex-col items-center space-y-6 transition-all">
            <div className="rounded-full bg-theme/5 p-6 text-theme">
              <ScanLine className="h-16 w-16 text-theme" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Attendance System
              </h1>
              <p className="text-xl font-medium text-slate-800">
                Please scan your QR code to proceed
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full pt-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your ID"
                autoFocus
                onBlur={(e) => {
                  // Only refocus if the user isn't clicking the logout button
                  if (!e.relatedTarget?.closest('.logout-btn')) {
                    e.target.focus();
                  }
                }}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-4 text-center text-lg font-medium tracking-widest text-gray-900 transition-colors focus:border-theme focus:outline-none focus:ring-4 focus:ring-theme/20"
              />
            </form>
          </div>
        )}

        {/* State: LOADING */}
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4 animate-in fade-in">
            <Loader2 className="h-16 w-16 animate-spin text-theme" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying...</h2>
          </div>
        )}

        {/* State: SUCCESS */}
        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4 duration-300 animate-in zoom-in-95">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {feedbackMessage.title}
            </h2>
            <p className="text-lg font-medium text-green-600">
              {feedbackMessage.description}
            </p>
          </div>
        )}

        {/* State: ERROR */}
        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4 duration-300 animate-in zoom-in-95">
            <XCircle className="h-20 w-20 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {feedbackMessage.title}
            </h2>
            <p className="text-lg font-medium text-red-600">
              {feedbackMessage.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
