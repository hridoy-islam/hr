import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
import { logout } from '@/redux/features/authSlice';

export default function AttendanceScanner() {
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [feedbackMessage, setFeedbackMessage] = useState({
    title: '',
    description: ''
  });
const isProcessing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // --- Audio Elements ---
  // Using useMemo to ensure audio objects are created only once
  const successSound = useMemo(() => new Audio('/qr-success.mp3'), []);
  const errorSound = useMemo(() => new Audio('/error.mp3'), []);

  // --- Voice Feedback Logic ---
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  // --- Focus Management ---
  useEffect(() => {
    const keepFocused = () => {
      if (
        !isSidebarOpen &&
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        inputRef.current.focus();
      }
    };
    const interval = setInterval(keepFocused, 500);
    return () => clearInterval(interval);
  }, [isSidebarOpen]);

  // --- Submit Handler ---
 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();

   // 1. SYNCHRONOUS GUARD: Check the ref immediately
   // This blocks the second click before the state even has a chance to update
   if (isProcessing.current || status !== 'idle') {
     return;
   }

   const scannedId = inputValue.trim();
   if (!scannedId) return;

   // 2. LOCK & CLEAR: Set the ref to true and clear input instantly
   isProcessing.current = true;
   setInputValue('');
   setStatus('loading');

   try {
     const response = await axiosInstance.post('/rota/attendance', {
       rotaId: scannedId
     });

     if (response.data?.success) {
       const { firstName, lastName } = response.data?.data?.employeeId || {};
       const userName = `${firstName || ''} ${lastName || ''}`.trim();

       setStatus('success');
       setFeedbackMessage({
         title: `Welcome, ${userName}`,
         description: 'Attendance recorded successfully.'
       });

       // Play Audio & Speech
       successSound.currentTime = 0;
       successSound.play().catch((err) => console.log('Audio blocked', err));
       speak(`Thank you ${userName}, attendance recorded.`);
     } else {
       throw new Error(response.data?.message || 'Invalid ID');
     }
   } catch (error: any) {
     const errMsg = error.response?.data?.message || 'Verification failed';
     setStatus('error');
     setFeedbackMessage({ title: 'Verification failed', description: errMsg });

     // Play Error Sound & Speech
     errorSound.currentTime = 0;
     errorSound.play().catch((err) => console.log('Audio blocked', err));
     speak(`Error. ${errMsg}`);
   } finally {
     // 3. COOLDOWN: Wait 4 seconds before allowing another scan
     setTimeout(() => {
       setStatus('idle');
       setFeedbackMessage({ title: '', description: '' });
       // UNLOCK the ref only after the UI is ready for the next person
       isProcessing.current = false;
     }, 4000);
   }
 };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      {/* Light Background Decorative Elements */}
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-theme/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-theme/5 blur-[120px]" />

      {/* Top Bar */}
      <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-end p-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5 text-black" />
        </Button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 mx-4 w-full max-w-3xl"
      >
        {/* Professional Kiosk Frame */}
        <div
          className={`overflow-hidden rounded-2xl border-4 bg-white/90 p-1 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-colors duration-500
    ${
      status === 'success'
        ? 'border-green-500/20'
        : status === 'error'
          ? 'border-red-500/20'
          : 'border-theme/20'
    }`}
        >
          <div className="rounded-4xl relative  bg-white px-8 py-16 md:px-16">
            {/* Status Glow Layer */}
            <div
              className={`rounded-4xl absolute inset-0 opacity-5 transition-colors duration-700
      `}
            />

            <AnimatePresence mode="wait">
              {/* IDLE STATE */}
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative flex flex-col items-center space-y-12 text-center"
                >
                  {/* Visual Scan Target */}
                  <div className="relative flex h-48 w-48 items-center justify-center">
                    <div className="absolute inset-0 animate-[ping_3s_ease-in-out_infinite] rounded-full bg-theme/10" />
                    <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-theme/30" />
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-theme shadow-lg shadow-theme/30">
                      <ScanLine className="h-16 w-16 animate-pulse text-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-2xl font-semibold tracking-tight text-black">
                      Please scan your QR code to clock in/out
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                    <div className="group relative">
                      <div className="absolute -inset-1 rounded-2xl bg-theme/20 opacity-0 blur transition duration-500 group-focus-within:opacity-100" />
                      <input
                        ref={inputRef}
                        type="text"
                        disabled={status !== 'idle'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="relative w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-6 text-center font-mono text-3xl tracking-[0.1em] text-slate-800 transition-all placeholder:text-slate-300 focus:border-theme focus:outline-none focus:ring-0"
                        placeholder="Type your ID"
                      />
                    </div>
                  </form>
                </motion.div>
              )}

              {/* LOADING STATE */}
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-8 py-16"
                >
                  <div className="relative h-32 w-32">
                    <Loader2
                      className="h-32 w-32 animate-spin text-theme opacity-20"
                      strokeWidth={1.5}
                    />
                    <Loader2
                      className="absolute inset-0 h-32 w-32 animate-[spin_1.5s_linear_infinite] text-theme"
                      strokeWidth={2.5}
                    />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                    Verifying...
                  </h2>
                </motion.div>
              )}

              {/* SUCCESS STATE */}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center space-y-8 py-4 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-green-500/20 blur-3xl" />
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-inner ring-[12px] ring-green-50/50">
                      <CheckCircle2 className="h-16 w-16" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight text-slate-800">
                      {feedbackMessage.title}
                    </h2>
                    <p className="text-2xl font-medium text-green-600">
                      {feedbackMessage.description}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex flex-col items-center space-y-8 py-4 text-center"
                >
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner ring-[12px] ring-red-50/50">
                    <XCircle className="h-16 w-16" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight text-slate-800">
                      {feedbackMessage.title}
                    </h2>
                    <p className="text-2xl font-medium text-red-500">
                      {feedbackMessage.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-[50] bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 right-0 top-0 z-[60] w-80 border-l border-slate-100 bg-white p-8 shadow-2xl"
            >
              <div className="mb-12 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-slate-100"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X />
                </Button>
              </div>

              <div className="space-y-4">
                <div className=" ">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="h-12 w-full justify-start gap-3 border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-4 rounded-xl p-4 text-slate-500 transition-all hover:bg-slate-50 hover:text-theme">
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
