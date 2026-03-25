import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Users,
  Calendar,
  ClipboardList,
  Menu
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
import { logout } from '@/redux/features/authSlice';
import moment from '@/lib/moment-setup';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';

export default function AttendanceScanner() {
  const [inputValue, setInputValue] = useState('');
  const [scanMode, setScanMode] = useState<
    'qr' | 'dob' | 'visitor' | 'serviceuser'
  >('qr');
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);

  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // DOB States
  const [selectedDob, setSelectedDob] = useState<Date | null>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // Visitor States
  const [visitorName, setVisitorName] = useState('');
  const [visitReason, setVisitReason] = useState('');

  // Service User States
  const [selectedServiceUser, setSelectedServiceUser] = useState<any>(null);
  const [allServiceUsers, setAllServiceUsers] = useState<any[]>([]);

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [feedbackMessage, setFeedbackMessage] = useState({
    title: '',
    description: ''
  });

  // Sidebar Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [activeServiceUsers, setActiveServiceUsers] = useState<any[]>([]);

  // All Employees for name lookup
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  // Logout Confirmation State
  const [logoutTarget, setLogoutTarget] = useState<{
    id: string;
    type: 'visitor' | 'service_user';
    name: string;
  } | null>(null);

  const isProcessing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: companyId } = useParams();

  const clockInSound = useMemo(() => new Audio('/clockin.mp3'), []);
  const clockOutSound = useMemo(() => new Audio('/clockout.mp3'), []);
  const loggedInSound = useMemo(() => new Audio('/loggedin.mp3'), []);
  const loggedOutSound = useMemo(() => new Audio('/loggedout.mp3'), []);
  const errorSound = useMemo(() => new Audio('/error.mp3'), []);

  // Split service users into active/inactive
  const activeServiceUsersList = activeServiceUsers.filter(
    (su) => su.status === 'active'
  );
  const inactiveServiceUsersList = activeServiceUsers.filter(
    (su) => su.status === 'inactive'
  );

  // --- Fetch Sidebar Data ---
  const fetchSidebarData = async () => {
    try {
      if (!companyId) return;
      const [empRes, visRes, suRes] = await Promise.all([
        axiosInstance.get(
          `/hr/attendance/employee-status?companyId=${companyId}&limit=all`
        ),
        axiosInstance.get(
          `/hr/attendance/visitor-status?companyId=${companyId}&limit=all`
        ),
        axiosInstance.get(
          `/hr/attendance/service-user-status?companyId=${companyId}&limit=all`
        )
      ]);
      setEmployees(empRes.data?.data?.result || empRes.data?.data || []);
      setActiveVisitors(visRes.data?.data?.result || visRes.data?.data || []);
      setActiveServiceUsers(suRes.data?.data?.result || suRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch sidebar status data', error);
    } finally {
      setIsSidebarLoading(false);
    }
  };

  // --- Fetch Master Lists ---
  const fetchMasterLists = async () => {
    try {
      if (!companyId) return;
      const [empRes, suRes] = await Promise.all([
        axiosInstance.get(
          `/users?company=${companyId}&limit=all&role=employee&fields=firstName lastName email phone name`
        ),
        axiosInstance.get(`/serviceuser?companyId=${companyId}&limit=all`)
      ]);

      setAllEmployees(empRes.data?.data?.result || empRes.data?.data || []);

      const suData =
        suRes.data?.data?.result ||
        suRes.data?.result ||
        suRes.data?.data ||
        suRes.data;
      setAllServiceUsers(Array.isArray(suData) ? suData : []);
    } catch (error) {
      console.error('Failed to fetch master lists', error);
    }
  };

  useEffect(() => {
    fetchSidebarData();
    fetchMasterLists();
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
        document.activeElement !== inputRef.current &&
        !logoutTarget &&
        !isMenuOpen
      ) {
        inputRef.current.focus();
      }
    };
    const interval = setInterval(keepFocused, 500);
    return () => clearInterval(interval);
  }, [scanMode, logoutTarget, isMenuOpen]);

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
        const action = response.data.data?.action;
        const returnedUserId = response.data.data?.data?.userId;

        let name = 'User';
        if (payload.userType === 'visitor') {
          name = payload.visitorName;
        } else if (payload.userType === 'service_user') {
          const su = allServiceUsers.find((s) => s._id === payload.userId);
          name = su
            ? su.name || `${su.firstName || ''} ${su.lastName || ''}`.trim()
            : 'Service User';
        } else if (matchedUser) {
          name =
            matchedUser.name ||
            `${matchedUser.firstName} ${matchedUser.lastName}`;
        } else {
          const emp = allEmployees.find((e) => e._id === returnedUserId);
          if (emp) name = emp.name || `${emp.firstName} ${emp.lastName}`;
        }

        const isVisitorOrServiceUser =
          payload.userType === 'visitor' || payload.userType === 'service_user';

        if (action === 'clock_in') {
          setFeedbackMessage({
            title: `Thank You, ${name}`,
            description: isVisitorOrServiceUser
              ? payload.userType === 'service_user'
                ? 'You are Logged Out'
                : 'You are Logged In'
              : 'You are Clocked In'
          });
          const soundToPlay =
            payload.userType === 'service_user'
              ? loggedOutSound
              : isVisitorOrServiceUser
              ? loggedInSound
              : clockInSound;
          soundToPlay.currentTime = 0;
          soundToPlay.play().catch(console.log);
        } else {
          setFeedbackMessage({
            title: `Thank You, ${name}`,
            description: isVisitorOrServiceUser
              ? payload.userType === 'service_user'
                ? 'You are Logged In'
                : 'You are Logged Out'
              : 'You are Clocked Out'
          });
          const soundToPlay =
            payload.userType === 'service_user'
              ? loggedInSound
              : isVisitorOrServiceUser
              ? loggedOutSound
              : clockOutSound;
          soundToPlay.currentTime = 0;
          soundToPlay.play().catch(console.log);
        }

        fetchSidebarData();
      } else {
        throw new Error('Verification Failed');
      }
    } catch (error: any) {
      setStatus('error');
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred. Please try again.';
      setFeedbackMessage({
        title: '',
        description: errorMessage
      });
      errorSound.currentTime = 0;
      errorSound.play().catch(console.log);
    } finally {
      setMatchedUser(null);
      setSelectedDob(null);
      setVisitorName('');
      setVisitReason('');
      setSelectedServiceUser(null);
      setInputValue('');

      setTimeout(() => {
        setStatus('idle');
        setFeedbackMessage({ title: '', description: '' });
        isProcessing.current = false;
      }, 4000);
    }
  };

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing.current || status !== 'idle') return;
    const scannedId = inputValue.trim();
    if (!scannedId) return;

    isProcessing.current = true;
    setInputValue('');
    await processClockEvent({ userId: scannedId, userType: 'employee' });
  };

  const submitDobSearch = async (date: Date | null) => {
    if (!date) return;
    try {
      setStatus('loading');
      const formattedDobLocal = moment(date).format('YYYY-MM-DD');
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
          description: 'No employee matches this DOB.',
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
      visitReason: visitReason.trim(),
      actionType
    });
  };

  const handleServiceUserSubmit = (actionType: 'clock_in' | 'clock_out') => {
    if (!selectedServiceUser) {
      toast({
        title: 'Selection Required',
        description: 'Please select a service user.',
        variant: 'destructive'
      });
      return;
    }
    isProcessing.current = true;
    processClockEvent({
      userId: selectedServiceUser.value,
      userType: 'service_user',
      actionType
    });
  };

  const handleConfirmSidebarLogout = () => {
    if (!logoutTarget) return;
    isProcessing.current = true;

    const isActive = activeServiceUsersList.some(
      (su) => su._id === logoutTarget.id
    );

    const payload: any = {
      actionType: isActive ? 'clock_out' : 'clock_in'
    };

    if (logoutTarget.type === 'visitor') {
      payload.userType = 'visitor';
      payload.visitorName = logoutTarget.name;
      payload.actionType = 'clock_out';
    } else if (logoutTarget.type === 'service_user') {
      payload.userType = 'service_user';
      payload.userId = logoutTarget.id;
    }

    processClockEvent(payload);
    setLogoutTarget(null);
  };

  const matchedActiveVisitor = activeVisitors.find(
    (v) => v.visitorName.toLowerCase() === visitorName.trim().toLowerCase()
  );
  const isVisitorClockedIn = !!matchedActiveVisitor;

  // We check inactive list (logged in status) to determine if they need to Log Out
  const isServiceUserLoggedIn =
    selectedServiceUser &&
    inactiveServiceUsersList.some((su) => su._id === selectedServiceUser.value);

  let sidebarTitle = 'Active Employees';
  let sidebarData = employees;
  let SidebarIcon = Users;

  if (scanMode === 'visitor') {
    sidebarTitle = 'Active Visitors';
    sidebarData = activeVisitors;
    SidebarIcon = ClipboardList;
  } else if (scanMode === 'serviceuser') {
    sidebarTitle = 'Active Service Users';
    sidebarData = activeServiceUsers;
    SidebarIcon = Users;
  }

  const dobInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = dobInputRef.current;
    if (!input) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const digits = target.value.replace(/\D/g, '').slice(0, 8);

      let formatted = '';
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = digits.slice(0, 2) + '-' + digits.slice(2);
      } else {
        formatted =
          digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4);
      }

      target.value = formatted;
      setInputValue(formatted);
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col gap-6 overflow-hidden bg-slate-50 p-4 md:p-6">
      {/* RIGHT SIDE MENU DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 right-0 top-0 z-[120] flex w-80 flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-2xl font-bold text-slate-800">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <Button
                  onClick={handleLogout}
                  className="h-14 w-full justify-start gap-3 rounded-xl border border-red-200 bg-red-100 px-6 text-lg font-bold text-red-700 shadow-sm hover:bg-red-200"
                >
                  <LogOut className="h-6 w-6" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {logoutTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[40vh] w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl"
            >
              <h3 className="mb-4 text-3xl font-bold text-slate-800">
                {logoutTarget.type === 'service_user'
                  ? activeServiceUsersList.some((su) => su._id === logoutTarget.id)
                    ? 'Confirm Login'
                    : 'Confirm Logout'
                  : 'Confirm Logout'}
              </h3>
              <p className="mb-8 text-xl text-slate-600">
                Are you sure you want to{' '}
                {logoutTarget.type === 'service_user'
                  ? activeServiceUsersList.some((su) => su._id === logoutTarget.id)
                    ? 'log in'
                    : 'log out'
                  : 'log out'}{' '}
                <strong className="text-slate-900">{logoutTarget.name}</strong>?
              </p>
              <div className="mt-16 flex justify-between gap-4">
                <Button
                  variant="outline"
                  className="h-14 px-6 text-lg font-semibold"
                  onClick={() => setLogoutTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className={`h-14 px-8 text-lg font-bold text-white transition-colors ${
                    logoutTarget.type === 'service_user'
                      ? activeServiceUsersList.some((su) => su._id === logoutTarget.id)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleConfirmSidebarLogout}
                >
                  Yes,{' '}
                  {logoutTarget.type === 'service_user'
                    ? activeServiceUsersList.some((su) => su._id === logoutTarget.id)
                      ? 'Log In'
                      : 'Log Out'
                    : 'Log Out'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex w-full justify-end">
        <Button
          onClick={() => setIsMenuOpen(true)}
          className="h-14 gap-2 rounded-xl text-lg"
        >
          <Menu className="h-6 w-6" />
          Menu
        </Button>
      </div>

      {/* 4 FULL-WIDTH BUTTONS */}
      <div className="z-20 grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
        <Button
          className={`h-16 w-full rounded-xl text-sm font-bold shadow-sm transition-all sm:h-20 sm:text-base md:text-sm lg:text-xl ${
            scanMode === 'qr'
              ? 'bg-theme text-white ring-2 ring-theme/50'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
          onClick={() => setScanMode('qr')}
        >
          QR Code
        </Button>
        <Button
          className={`h-16 w-full rounded-xl text-sm font-bold shadow-sm transition-all sm:h-20 sm:text-base md:text-sm lg:text-xl ${
            scanMode === 'dob'
              ? 'bg-theme text-white ring-2 ring-theme/50'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          onClick={() => {
            setScanMode('dob');
            setMatchedUser(null);
            setSelectedDob(null);
            setInputValue('');
          }}
        >
          <span className="leading-tight">
            Clock In
            <br className="md:hidden lg:hidden" /> by DoB
          </span>
        </Button>
        <Button
          className={`h-16 w-full rounded-xl text-sm font-bold shadow-sm transition-all sm:h-20 sm:text-base md:text-sm lg:text-xl ${
            scanMode === 'serviceuser'
              ? 'bg-theme text-white ring-2 ring-theme/50'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
          onClick={() => {
            setScanMode('serviceuser');
            setSelectedServiceUser(null);
          }}
        >
          Service User
        </Button>
        <Button
          className={`h-16 w-full rounded-xl text-sm font-bold shadow-sm transition-all sm:h-20 sm:text-base md:text-sm lg:text-xl ${
            scanMode === 'visitor'
              ? 'bg-theme text-white ring-2 ring-theme/50'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          onClick={() => {
            setScanMode('visitor');
            setVisitorName('');
            setVisitReason('');
          }}
        >
          Visitor
        </Button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex h-full flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* SCANNER CONTROLS - always left large panel */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="relative flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-theme/5 blur-[100px]" />

            <div className="z-10 flex w-full flex-1 flex-col items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl"
              >
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative flex flex-col items-center space-y-8 text-center"
                    >
                      {/* --- DOB MODE --- */}
                      {scanMode === 'dob' && (
                        <div className="w-full space-y-6">
                          {!matchedUser && (
                            <div className="flex flex-col items-center">
                              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-theme/10">
                                <Calendar className="h-12 w-12 text-theme" />
                              </div>
                              <h2 className="text-2xl font-bold text-slate-800 lg:text-3xl">
                                Clock In/Out Via Date of Birth (DD-MM-YYYY)
                              </h2>
                            </div>
                          )}

                          {!matchedUser ? (
                            <div className="relative z-50 flex w-full flex-col gap-3 sm:flex-row">
                              <div className="flex-1 [&_.react-datepicker-wrapper]:w-full">
                                <DatePicker
                                  selected={selectedDob}
                                  onChange={(date: Date | null) => {
                                    setSelectedDob(date);
                                    if (date) {
                                      setInputValue(
                                        moment(date).format('DD-MM-YYYY')
                                      );
                                    } else {
                                      setInputValue('');
                                    }
                                  }}
                                  onChangeRaw={(e: any) => {
                                    if (
                                      !e ||
                                      !e.target ||
                                      typeof e.target.value !== 'string'
                                    ) {
                                      return;
                                    }

                                    let val = e.target.value;
                                    const inputType = e.nativeEvent?.inputType;
                                    const isDeleting =
                                      inputType === 'deleteContentBackward' ||
                                      inputType === 'deleteContentForward';

                                    val = val.replace(/[^0-9-]/g, '');
                                    val = val.replace(/--+/g, '-');

                                    let parts = val.split('-');

                                    if (parts[0] && parts[0].length > 2) {
                                      parts[1] =
                                        parts[0].slice(2) + (parts[1] || '');
                                      parts[0] = parts[0].slice(0, 2);
                                    }
                                    if (parts[1] && parts[1].length > 2) {
                                      parts[2] =
                                        parts[1].slice(2) + (parts[2] || '');
                                      parts[1] = parts[1].slice(0, 2);
                                    }
                                    if (parts[2] && parts[2].length > 4) {
                                      parts[2] = parts[2].slice(0, 4);
                                    }

                                    val = parts.join('-');

                                    if (!isDeleting) {
                                      if (
                                        val.length === 2 &&
                                        !val.includes('-')
                                      ) {
                                        val += '-';
                                      } else if (
                                        val.length === 5 &&
                                        val.split('-').length === 2
                                      ) {
                                        val += '-';
                                      }
                                    }

                                    if (val.length > 10) val = val.slice(0, 10);

                                    e.target.value = val;
                                    setInputValue(val);

                                    if (val.length === 10) {
                                      const [dd, mm, yyyy] = val.split('-');
                                      if (
                                        dd?.length === 2 &&
                                        mm?.length === 2 &&
                                        yyyy?.length === 4
                                      ) {
                                        const date = new Date(
                                          `${yyyy}-${mm}-${dd}`
                                        );
                                        if (!isNaN(date.getTime())) {
                                          setSelectedDob(date);
                                        }
                                      }
                                    } else if (selectedDob !== null) {
                                      setSelectedDob(null);
                                    }
                                  }}
                                  dateFormat="dd-MM-yyyy"
                                  showYearDropdown
                                  showMonthDropdown
                                  dropdownMode="select"
                                  maxDate={new Date()}
                                  wrapperClassName="w-full"
                                  customInput={
                                    <input
                                      type="text"
                                      value={inputValue}
                                      onChange={(e) =>
                                        setInputValue(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (inputValue.length === 10) {
                                            const [dd, mm, yyyy] =
                                              inputValue.split('-');
                                            const date = new Date(
                                              `${yyyy}-${mm}-${dd}`
                                            );
                                            if (!isNaN(date.getTime()))
                                              submitDobSearch(date);
                                          }
                                        }
                                      }}
                                      maxLength={10}
                                      placeholder="DD-MM-YYYY"
                                      className="h-16 w-full rounded-2xl border-2 border-slate-200 px-6 py-4 text-center text-2xl font-semibold shadow-sm focus:border-theme focus:outline-none focus:ring-0"
                                    />
                                  }
                                />
                              </div>
                              <Button
                                disabled={inputValue.length !== 10}
                                className="h-16 rounded-2xl bg-theme px-10 text-xl font-bold text-white shadow-sm transition-colors hover:bg-theme/90 sm:w-auto"
                                onClick={() => {
                                  if (inputValue.length === 10) {
                                    const [dd, mm, yyyy] =
                                      inputValue.split('-');
                                    const date = new Date(
                                      `${yyyy}-${mm}-${dd}`
                                    );
                                    if (!isNaN(date.getTime()))
                                      submitDobSearch(date);
                                  }
                                }}
                              >
                                Next
                              </Button>
                            </div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm"
                            >
                              <h3 className="mb-8 text-3xl font-bold text-slate-800">
                                Are you{' '}
                                {matchedUser.name ||
                                  `${matchedUser.firstName} ${matchedUser.lastName}`}
                                ?
                              </h3>
                              <div className="flex w-full gap-6">
                                <Button
                                  className="h-16 flex-1 rounded-xl bg-green-600 text-xl font-bold text-white shadow-md hover:bg-green-700"
                                  onClick={() =>
                                    processClockEvent({
                                      userId: matchedUser._id,
                                      userType: 'employee',
                                      actionType: 'clock_in'
                                    })
                                  }
                                >
                                  Clock In
                                </Button>
                                <Button
                                  className="h-16 flex-1 rounded-xl bg-red-600 text-xl font-bold text-white shadow-md hover:bg-red-700"
                                  onClick={() =>
                                    processClockEvent({
                                      userId: matchedUser._id,
                                      userType: 'employee',
                                      actionType: 'clock_out'
                                    })
                                  }
                                >
                                  Clock Out
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                className="mt-6 h-14 w-full text-lg font-semibold"
                                onClick={() => {
                                  setMatchedUser(null);
                                  setSelectedDob(null);
                                  setInputValue('');
                                }}
                              >
                                No, try again
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* --- VISITOR MODE --- */}
                      {scanMode === 'visitor' && (
                        <div className="w-full space-y-6">
                          <div className="flex flex-col items-center">
                            <h2 className="text-3xl font-bold text-slate-800">
                              Visitor Log-In / Out
                            </h2>
                          </div>

                          <div className="space-y-6 text-left">
                            <div className="space-y-3">
                              <Label className="text-xl font-semibold">
                                Full Name{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="e.g. John Doe"
                                value={visitorName}
                                onChange={(e) =>
                                  setVisitorName(e.target.value)
                                }
                                className="h-16 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 text-xl shadow-sm focus-visible:ring-theme"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xl font-semibold">
                                Reason for visit
                              </Label>
                              <Input
                                placeholder="e.g. Meeting with HR"
                                value={visitReason}
                                onChange={(e) =>
                                  setVisitReason(e.target.value)
                                }
                                className="h-16 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 text-xl shadow-sm focus-visible:ring-theme"
                              />
                            </div>

                            <div className="flex w-full pt-6">
                              <Button
                                className="h-20 w-full rounded-2xl bg-green-600 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-green-700"
                                onClick={() => handleVisitorSubmit('clock_in')}
                              >
                                Log In
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- SERVICE USER MODE --- */}
                      {scanMode === 'serviceuser' && (
                        <div className="w-full space-y-6">
                          <div className="flex flex-col items-center">
                            <h2 className="text-3xl font-bold text-slate-800">
                              Service User Log-In / Out
                            </h2>
                          </div>

                          <div className="relative z-50 space-y-6 text-left">
                            <div className="space-y-3">
                              <Select
                                options={allServiceUsers.map((su) => ({
                                  value: su._id,
                                  label:
                                    `Room: ${su.room || ''} - ${su.name || ''}`.trim() ||
                                    'Unknown'
                                }))}
                                value={selectedServiceUser}
                                onChange={setSelectedServiceUser}
                                placeholder="Select Service User"
                                className="text-xl font-medium"
                                isClearable
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: '72px',
                                    borderRadius: '1rem',
                                    borderColor: '#e2e8f0',
                                    borderWidth: '2px',
                                    boxShadow:
                                      '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                                  })
                                }}
                              />
                            </div>

                            <div className="flex w-full pt-6">
                              {selectedServiceUser &&
                                (isServiceUserLoggedIn ? (
                                  <Button
                                    className="h-20 w-full rounded-2xl bg-red-600 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-red-700"
                                    onClick={() =>
                                      handleServiceUserSubmit('clock_in') // 'clock_in' on Backend maps to Log Out
                                    }
                                  >
                                    Log Out
                                  </Button>
                                ) : (
                                  <Button
                                    className="h-20 w-full rounded-2xl bg-green-600 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-green-700"
                                    onClick={() =>
                                      handleServiceUserSubmit('clock_out') // 'clock_out' on Backend maps to Log In
                                    }
                                  >
                                    Log In
                                  </Button>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- QR MODE --- */}
                      {scanMode === 'qr' && (
                        <>
                          <div className="relative flex h-48 w-48 items-center justify-center">
                            <div className="absolute inset-0 animate-[ping_3s_ease-in-out_infinite] rounded-full bg-theme/10" />
                            <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-theme/30" />
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-theme shadow-xl shadow-theme/30">
                              <ScanLine className="h-16 w-16 animate-pulse text-white" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-3xl font-bold tracking-tight text-black">
                              Scan your QR code to Clock In/Out
                            </p>
                          </div>
                          <form
                            onSubmit={handleQRSubmit}
                            className="flex w-full flex-col items-center pt-4"
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              disabled={status !== 'idle'}
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              className="h-20 w-full rounded-2xl border-4 border-theme bg-slate-50 px-8 py-4 text-center font-mono text-3xl font-bold tracking-[0.1em] text-slate-800 shadow-md transition-all placeholder:text-slate-300 focus:border-theme focus:outline-none focus:ring-0"
                              placeholder=""
                            />
                          </form>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* LOADING STATE */}
                  {status === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center space-y-6 py-12"
                    >
                      <Loader2 className="h-32 w-32 animate-spin text-theme" />
                      <h2 className="text-3xl font-bold text-slate-800">
                        Processing...
                      </h2>
                    </motion.div>
                  )}

                  {/* SUCCESS STATE */}
                  {status === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center space-y-8 py-12 text-center"
                    >
                      <CheckCircle2 className="h-36 w-36 text-green-500" />
                      <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-slate-800">
                          {feedbackMessage.title}
                        </h2>
                        <p className="text-3xl font-semibold text-green-600">
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
                      className="flex flex-col items-center space-y-8 py-12 text-center"
                    >
                      <XCircle className="h-36 w-36 text-red-500" />
                      <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-slate-800">
                          {feedbackMessage.title}
                        </h2>
                        <p className="text-3xl font-semibold text-red-500">
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

        {/* RIGHT SIDEBAR — two columns for serviceuser, single for others */}
        {scanMode === 'serviceuser' ? (
          <>
            {/* ACTIVE COLUMN (Logged Out Status) */}
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[18%] lg:self-stretch">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-theme/10 p-3">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-theme" />
                <h2 className="text-sm font-bold ">
                  Logged Out Service User
                </h2>
              </div>
              <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 220px)' }}>
                <div className="space-y-2 p-2">
                  {isSidebarLoading ? (
                    <div className="flex justify-center py-4">
                      <BlinkingDots size="medium" color="bg-theme" />
                    </div>
                  ) : activeServiceUsersList.length > 0 ? (
                    activeServiceUsersList.map((item) => {
                      const suName =
                        item.name ||
                        `${item.firstName || ''} ${item.lastName || ''}`.trim();
                      return (
                        <div
                          key={item._id}
                          className="flex flex-row justify-between gap-1 rounded-xl border border-slate-100 bg-white p-2 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            {item.room && (
                              <span className="rounded-full bg-theme px-2 py-0.5 text-[10px] font-semibold text-white">
                                Room: {item.room}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setLogoutTarget({
                                id: item._id,
                                type: 'service_user',
                                name: suName
                              })
                            }
                              className="text-xs font-semibold text-green-600 hover:text-green-700"
                          >
                            Login
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No Logged Out Service User.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* INACTIVE COLUMN (Logged In Status) */}
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[18%] lg:self-stretch">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-green-50 p-3">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-600" />
                <h2 className="text-sm font-bold ">
                  Logged In Service User 
                </h2>
              </div>
              <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 220px)' }}>
                <div className="space-y-2 p-2">
                  {isSidebarLoading ? (
                    <div className="flex justify-center py-4">
                      <BlinkingDots size="medium" color="bg-theme" />
                    </div>
                  ) : inactiveServiceUsersList.length > 0 ? (
                    inactiveServiceUsersList.map((item) => {
                      const suName =
                        item.name ||
                        `${item.firstName || ''} ${item.lastName || ''}`.trim();
                      return (
                        <div
                          key={item._id}
                          className="flex flex-row justify-between items-center gap-1 rounded-xl border border-slate-100 bg-white p-2 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            {item.room && (
                              <span className="w-fit rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Room: {item.room}
                              </span>
                            )}
                          </div>
                          
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No Logged In Service Users.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          /* SINGLE SIDEBAR for qr / dob / visitor */
          <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[35%] lg:self-stretch">
            <div className="flex items-center border-b border-slate-100 bg-slate-50 p-4">
              <h2 className="flex items-center text-lg font-bold text-slate-800">
                <SidebarIcon className="mr-2 h-5 w-5 text-theme" />
                {sidebarTitle}
              </h2>
            </div>

            <ScrollArea className="max-h-[58vh] flex-1">
              <div className="space-y-3 p-2">
                {isSidebarLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <BlinkingDots size="medium" color="bg-theme" />
                  </div>
                ) : sidebarData.length > 0 ? (
                  sidebarData.map((item) => {
                    if (scanMode === 'visitor') {
                      return (
                        <div
                          key={item._id}
                          className="flex flex-col rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex max-w-[70%] flex-row items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.visitorName}
                              </p>
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                Active
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setLogoutTarget({
                                  id: item._id,
                                  type: 'visitor',
                                  name: item.visitorName
                                })
                              }
                              className="text-xs font-semibold text-red-500 hover:text-red-700"
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item._id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-slate-800">
                            {item.name || `${item.firstName} ${item.lastName}`}
                          </p>
                        </div>
                        <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-slate-400">
                    No {sidebarTitle.toLowerCase()} found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}