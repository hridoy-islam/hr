import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Users,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
import { logout } from '@/redux/features/authSlice';
import moment from 'moment';
import { useToast } from '@/components/ui/use-toast';

export default function AttendanceScanner() {
  const [inputValue, setInputValue] = useState('');
  const [scanMode, setScanMode] = useState<'qr' | 'dob' | 'visitor'>('qr');

  // DOB States
  const [selectedDob, setSelectedDob] = useState<Date | null>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // Visitor States
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [feedbackMessage, setFeedbackMessage] = useState({
    title: '',
    description: ''
  });

  const [employees, setEmployees] = useState<any[]>([]); // Clocked-in employees for sidebar
  const [allEmployees, setAllEmployees] = useState<any[]>([]); // All employees for name lookup

  const isProcessing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { id: companyId } = useParams();

  const clockInSound = useMemo(() => new Audio('/clockin.mp3'), []);
  const clockOutSound = useMemo(() => new Audio('/clockout.mp3'), []);
  const errorSound = useMemo(() => new Audio('/error.mp3'), []);

  // --- Fetch Employees (Clocked In Status) ---
  const fetchCompanyEmployees = async () => {
    try {
      if (!companyId) return;
      const response = await axiosInstance.get(
        `/hr/attendance/employee-status?companyId=${companyId}&limit=all`
      );
      setEmployees(response.data?.data?.result || response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch employees status', error);
    }
  };

  // --- Fetch ALL Employees (For Name Lookup) ---
  const fetchAllEmployees = async () => {
    try {
      if (!companyId) return;
      const response = await axiosInstance.get(
        `/users?company=${companyId}&limit=all&role=employee&fields=firstName lastName email phone name`
      );
      setAllEmployees(response.data?.data?.result || response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch all employees', error);
    }
  };

  useEffect(() => {
    fetchCompanyEmployees();
    fetchAllEmployees(); // Fetch the master list on mount
    // const interval = setInterval(fetchCompanyEmployees, 100000);
    // return () => clearInterval(interval);
  }, [companyId]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  // --- Focus Management for QR ---
  useEffect(() => {
    const keepFocused = () => {
      if (
        scanMode === 'qr' &&
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        inputRef.current.focus();
      }
    };
    const interval = setInterval(keepFocused, 500);
    return () => clearInterval(interval);
  }, [scanMode]);

  // --- Core Clock Event logic ---
  const processClockEvent = async (payload: any) => {
    setStatus('loading');
    try {
      const finalPayload = { ...payload, companyId };
      const response = await axiosInstance.post(
        '/hr/attendance/clock-event',
        finalPayload
      );

      if (response.data?.success) {
        setStatus('success');

        const action = response.data.data?.action; // "clock_in" or "clock_out"
        const returnedUserId = response.data.data?.data?.userId;

        // Resolve User Name
        let name = '';
        if (payload.userType === 'visitor') {
          name = payload.visitorName;
        } else if (matchedUser) {
          name =
            matchedUser.name ||
            `${matchedUser.firstName} ${matchedUser.lastName}`;
        } else {
          // Attempt to find user in the ALL employees list
          const emp = allEmployees.find((e) => e._id === returnedUserId);
          if (emp) {
            name = emp.name || `${emp.firstName} ${emp.lastName}`;
          }
        }

        // Fallback if name wasn't found
        if (!name) name = 'Employee';

        if (action === 'clock_in') {
          setFeedbackMessage({
            title: `Thank you! ${name}`,
            description: 'You are Clocked In'
          });
          clockInSound.currentTime = 0;
          clockInSound.play().catch((err) => console.log('Audio blocked', err));
        } else {
          setFeedbackMessage({
            title: `Thank You! ${name}`,
            description: 'You are Clocked out'
          });
          clockOutSound.currentTime = 0;
          clockOutSound
            .play()
            .catch((err) => console.log('Audio blocked', err));
        }

        fetchCompanyEmployees();
      } else {
        throw new Error('Verification Failed');
      }
    } catch (error: any) {
      setStatus('error');
      setFeedbackMessage({
        title: 'Verification Failed.',
        description: 'Please contact the admin'
      });
      errorSound.currentTime = 0;
      errorSound.play().catch((err) => console.log('Audio blocked', err));
    } finally {
      // Reset forms
      setMatchedUser(null);
      setSelectedDob(null);
      setVisitorName('');
      setVisitorPhone('');

      setTimeout(() => {
        setStatus('idle');
        setFeedbackMessage({ title: '', description: '' });
        isProcessing.current = false;
      }, 4000);
    }
  };

  // --- QR Submit Handler ---
  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing.current || status !== 'idle') return;

    const scannedId = inputValue.trim();
    if (!scannedId) return;

    isProcessing.current = true;
    setInputValue('');
    await processClockEvent({ userId: scannedId, userType: 'employee' });
  };

  // --- DOB Handlers ---
  const handleDobChange = (date: Date | null) => {
    setSelectedDob(date);
  };

  const submitDobSearch = async (date: Date | null) => {
    if (!date) return;

    try {
      setStatus('loading');
      const formattedDobLocal = moment(date).format('YYYY-MM-DD');

      // We can use the already fetched allEmployees here for faster lookup,
      // or fetch fresh. Let's fetch fresh to ensure no one is missed.
      const response = await axiosInstance.get(
        `/users?company=${companyId}&limit=all&role=employee`
      );
      const usersList =
        response.data?.data?.result || response.data?.data || [];

      const foundUser = usersList.find((u: any) => {
        if (!u.dateOfBirth) return false;

        const userDobRaw =
          typeof u.dateOfBirth === 'string' ? u.dateOfBirth.split('T')[0] : '';
        const userDobLocal = moment(u.dateOfBirth).format('YYYY-MM-DD');
        const userDobUTC = moment.utc(u.dateOfBirth).format('YYYY-MM-DD');

        return (
          userDobRaw === formattedDobLocal ||
          userDobLocal === formattedDobLocal ||
          userDobUTC === formattedDobLocal
        );
      });

      if (foundUser) {
        setMatchedUser(foundUser);
        setStatus('idle');
      } else {
        toast({
          title: 'No Match Found',
          description: 'No employee matches this Date of Birth.',
          variant: 'destructive'
        });
        setStatus('idle');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search DOB.',
        variant: 'destructive'
      });
      setStatus('idle');
    }
  };

  // --- Visitor Submit Handler ---
  const handleVisitorSubmit = (actionType: 'clock_in' | 'clock_out') => {
    if (!visitorName.trim()) {
      toast({
        title: 'Name Required',
        description: "Please enter the visitor's name.",
        variant: 'destructive'
      });
      return;
    }
    isProcessing.current = true;
    processClockEvent({
      userType: 'visitor',
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      actionType
    });
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50 p-4 md:p-6">
      {/* TOP NAVIGATION: Separate Logout Button */}
      <div className="flex w-full justify-end">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2 border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex h-full flex-1 flex-col gap-2 lg:flex-row">
        {/* LEFT/TOP: BUTTONS + MAIN SCANNER UI */}
        <div className="flex flex-1 flex-col gap-4">
          {/* THE 3 SELECTION BUTTONS (Outside the card) */}
         <div className="w-full grid grid-cols-3 gap-3 z-20">
  <Button
    variant={scanMode === 'dob' ? 'default' : 'outline'}
    className={`text-xs sm:text-sm border-gray-300 shadow-sm bg-white ${
      scanMode === 'dob'
        ? 'bg-theme text-white border-theme'
        : 'text-slate-700'
    }`}
    onClick={() => {
      setScanMode('dob');
      setMatchedUser(null);
      setSelectedDob(null);
    }}
  >
    Try Another Way
  </Button>

  <Button
    variant={scanMode === 'visitor' ? 'default' : 'outline'}
    className={`text-xs sm:text-sm border-gray-300 shadow-sm bg-white ${
      scanMode === 'visitor'
        ? 'bg-theme text-white border-theme'
        : 'text-slate-700'
    }`}
    onClick={() => {
      setScanMode('visitor');
      setMatchedUser(null);
      setSelectedDob(null);
    }}
  >
    Visitor
  </Button>

  <Button
    variant={scanMode === 'qr' ? 'default' : 'outline'}
    className={`text-xs sm:text-sm border-gray-300 shadow-sm bg-white ${
      scanMode === 'qr'
        ? 'bg-theme text-white border-theme'
        : 'text-slate-700'
    }`}
    onClick={() => {
      setScanMode('qr');
      setMatchedUser(null);
      setSelectedDob(null);
    }}
  >
    QR Code
  </Button>
</div>

          {/* MAIN SCANNER UI CARD */}
          <div className="relative flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-theme/5 blur-[100px]" />

            {/* CENTER OF SCANNER UI: Form Content */}
            <div className="z-10 flex w-full flex-1 flex-col items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
              >
                <AnimatePresence mode="wait">
                  {/* === IDLE STATE === */}
                  {status === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative flex flex-col items-center space-y-8 text-center"
                    >
                      {/* --- MODE: DOB --- */}
                      {scanMode === 'dob' && (
                        <div className="w-full space-y-6">
                          <div className="flex flex-col items-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-theme/10">
                              <Calendar className="h-10 w-10 text-theme" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">
                              Clock In/Out Via Date of Birth
                            </h2>
                            <p className="mt-2 text-slate-500">
                              Select your date of birth to verify identity.
                            </p>
                          </div>

                          {!matchedUser ? (
                            <div className="relative z-50 w-full">
                              <DatePicker
                                selected={selectedDob}
                                onChange={handleDobChange}
                                onSelect={(date) => submitDobSearch(date)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    submitDobSearch(selectedDob);
                                  }
                                }}
                                maxDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                dateFormat="dd-MM-yyyy"
                                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg focus:border-theme focus:outline-none focus:ring-0"
                                placeholderText="Enter or select your date of birth"
                                wrapperClassName="w-full"
                              />
                            </div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-6"
                            >
                              <h3 className="mb-1 text-xl font-bold text-slate-800">
                                Are you{' '}
                                {matchedUser.name ||
                                  `${matchedUser.firstName} ${matchedUser.lastName}`}
                                ?
                              </h3>
                              <p className="mb-6 text-sm text-slate-500">
                                Please confirm your action below.
                              </p>

                              <div className="flex w-full gap-4">
                                <Button
                                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => {
                                    isProcessing.current = true;
                                    processClockEvent({
                                      userId: matchedUser._id,
                                      userType: 'employee',
                                      actionType: 'clock_in'
                                    });
                                  }}
                                >
                                  Clock In
                                </Button>
                                <Button
                                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                                  onClick={() => {
                                    isProcessing.current = true;
                                    processClockEvent({
                                      userId: matchedUser._id,
                                      userType: 'employee',
                                      actionType: 'clock_out'
                                    });
                                  }}
                                >
                                  Clock Out
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                className="mt-4 w-full"
                                onClick={() => {
                                  setMatchedUser(null);
                                  setSelectedDob(null);
                                }}
                              >
                                No, try again
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* --- MODE: VISITOR --- */}
                      {scanMode === 'visitor' && (
                        <div className="w-full space-y-6">
                          <div className="flex flex-col items-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-theme/10">
                              <ClipboardList className="h-10 w-10 text-theme" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">
                              Visitor Attendance
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                              Please enter your details to clock in or out.
                            </p>
                          </div>

                          <div className="space-y-4 text-left">
                            <div className="space-y-2">
                              <Label>
                                Full Name{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="e.g. John Doe"
                                value={visitorName}
                                onChange={(e) => setVisitorName(e.target.value)}
                                className="bg-slate-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone Number (Optional)</Label>
                              <Input
                                placeholder="e.g. +44 7700 900000"
                                value={visitorPhone}
                                onChange={(e) =>
                                  setVisitorPhone(e.target.value)
                                }
                                className="bg-slate-50"
                              />
                            </div>

                            <div className="flex w-full gap-4 pt-4">
                              <Button
                                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleVisitorSubmit('clock_in')}
                              >
                                Clock In
                              </Button>
                              <Button
                                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleVisitorSubmit('clock_out')}
                              >
                                Clock Out
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- MODE: QR / ID --- */}
                      {scanMode === 'qr' && (
                        <>
                          <div className="relative flex h-40 w-40 items-center justify-center">
                            <div className="absolute inset-0 animate-[ping_3s_ease-in-out_infinite] rounded-full bg-theme/10" />
                            <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-theme/30" />
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-theme shadow-lg shadow-theme/30">
                              <ScanLine className="h-12 w-12 animate-pulse text-white" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xl font-semibold tracking-tight text-black">
                              Scan your QR code or ID to Clock In/Out
                            </p>
                          </div>

                          <form
                            onSubmit={handleQRSubmit}
                            className="flex w-full flex-col items-center"
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              disabled={status !== 'idle'}
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              className="w-full rounded-xl border-2 border-theme bg-slate-50 px-6 py-4 text-center font-mono text-2xl tracking-[0.1em] text-slate-800 transition-all placeholder:text-slate-300 focus:border-theme focus:outline-none focus:ring-0"
                              placeholder="Type your ID..."
                            />
                          </form>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* === LOADING STATE === */}
                  {status === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center space-y-6 py-12"
                    >
                      <Loader2 className="h-24 w-24 animate-spin text-theme" />
                      <h2 className="text-2xl font-bold text-slate-800">
                        Processing...
                      </h2>
                    </motion.div>
                  )}

                  {/* === SUCCESS STATE === */}
                  {status === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center space-y-6 py-8 text-center"
                    >
                      <CheckCircle2 className="h-24 w-24 text-green-500" />
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800">
                          {feedbackMessage.title}
                        </h2>
                        <p className="text-2xl text-green-600">
                          {feedbackMessage.description}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* === ERROR STATE === */}
                  {status === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex flex-col items-center space-y-6 py-8 text-center"
                    >
                      <XCircle className="h-24 w-24 text-red-500" />
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800">
                          {feedbackMessage.title}
                        </h2>
                        <p className="text-2xl text-red-500">
                          {feedbackMessage.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {/* RIGHT/BOTTOM: EMPLOYEE STATUS */}
        {scanMode !== 'visitor' && (
        <div className="flex max-h-[600px] min-h-[400px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:max-h-full lg:w-[350px]">
          <div className="flex items-center border-b border-slate-100 bg-slate-50 p-4">
            <h2 className="flex items-center text-lg font-bold text-slate-800">
              <Users className="mr-2 h-5 w-5 text-theme" />
              Employee Status
            </h2>
          </div>

          <ScrollArea className="max-h-[75vh] flex-1">
            <div className="space-y-3 p-4">
              {employees.map((emp) => {
                const isClockedIn =
                  emp.latestAttendance?.latestStatus === 'clockin';

                return (
                  <div
                    key={emp._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {emp.name || `${emp.firstName} ${emp.lastName}`}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${isClockedIn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {isClockedIn ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                );
              })}
              {employees.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  No employees found.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>)}
      </div>
    </div>
  );
}
