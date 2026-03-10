import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, UserIcon, Bell, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

// --- Types ---
interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: {
    firstName: string;
    lastName: string;
    name?: string;
  };
  status: string;
}

// --- Helpers ---
const groupShiftsByMonth = (shifts: any[]) => {
  return shifts.reduce(
    (groups, shift) => {
      const dateObj = new Date(shift.startDate);
      const monthYear = dateObj.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(shift);
      return groups;
    },
    {} as Record<string, any[]>
  );
};

const getDayName = (dateStr: string) =>
  moment(dateStr).format('ddd').toUpperCase();
const getDateNumber = (dateStr: string) => moment(dateStr).format('DD');

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-';

  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');

  if (end.isBefore(start)) {
    end.add(1, 'day');
  }

  const duration = moment.duration(end.diff(start));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getNoticeTypeStyle = (type: string) => {
  const normalizedType = type?.toLowerCase() || '';
  if (normalizedType.includes('urgent'))
    return 'bg-red-500 text-white hover:bg-red-600';
  if (normalizedType.includes('reminder'))
    return 'bg-amber-500 text-white hover:bg-amber-600';
  if (normalizedType.includes('event'))
    return 'bg-violet-500 text-white hover:bg-violet-600';
  if (normalizedType.includes('general'))
    return 'bg-theme/90 text-white hover:bg-theme';
  return 'bg-slate-500 text-white hover:bg-slate-500';
};

const StaffDashboardPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth.user);
  const { id, eid } = useParams();

  const [userData, setUserData] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Modal & Real-time validation State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const [qrAction, setQrAction] = useState<'clockin' | 'clockout'>('clockin');
  const [currentTime, setCurrentTime] = useState(moment());


   useEffect(() => {
     if (qrModalOpen) {
       const timer = setTimeout(() => {
         setQrModalOpen(false);
       }, 5000); // 5 seconds

       return () => clearTimeout(timer);
     }
   }, [qrModalOpen]);
  
  useEffect(() => {
    // Update the current time every minute to toggle QR button availability in real-time
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if a shift is active OR starting within 1 hour
  const isShiftActive = (shift: any) => {
    if (!shift.startDate || !shift.startTime || !shift.endTime) return false;

    const shiftStartDate = moment(shift.startDate).format('YYYY-MM-DD');

    // The actual scheduled start time
    const shiftStart = moment(
      `${shiftStartDate} ${shift.startTime}`,
      'YYYY-MM-DD HH:mm'
    );

    // Define the early clock-in window (1 hour before startTime)
    const earlyClockInWindow = moment(shiftStart).subtract(1, 'hour');

    let shiftEnd = moment(
      `${shiftStartDate} ${shift.endTime}`,
      'YYYY-MM-DD HH:mm'
    );

    // Handle shifts that cross over midnight
    if (shiftEnd.isBefore(shiftStart)) {
      shiftEnd.add(1, 'day');
    }

    // UPDATED: Now allows clocking in starting 1 hour before shiftStart
    // until the shiftEnd
    return currentTime.isBetween(earlyClockInWindow, shiftEnd, null, '[]');
  };

  const handleOpenQr = (rotaId: string, action: 'clockin' | 'clockout') => {
    setSelectedRotaId(rotaId);
    setQrAction(action);
    setQrModalOpen(true);
  };

  // --- NEW: Silent background fetch for Rota Data ---
  const fetchRotaData = async () => {
    if (!eid) return;
    try {
      const rotaRes = await axiosInstance.get(
        `/rota/upcoming-rota?employeeId=${eid}`
      );
      setShifts(rotaRes.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching background rota data:', error);
    }
  };

  // --- NEW: 5-minute interval for refetching ---
  useEffect(() => {
    const fetchInterval = setInterval(
      () => {
        fetchRotaData();
      },
      5 * 60 * 1000
    ); // 5 minutes in milliseconds

    return () => clearInterval(fetchInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eid]);

  // --- NEW: Handle QR Modal Open/Close ---
  const handleQrModalChange = (isOpen: boolean) => {
    setQrModalOpen(isOpen);
    if (!isOpen) {
      // Refetch data silently when the modal closes
      fetchRotaData();
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!eid) return;

      try {
        setLoading(true);
        const [userRes, rotaRes, noticeRes] = await Promise.all([
          axiosInstance.get(`/users/${eid}`),
          axiosInstance.get(`/rota/upcoming-rota?employeeId=${eid}`),
          axiosInstance.get(`/hr/notice`, {
            params: { page: 1, limit: 10, userId: eid }
          })
        ]);

        setUserData(userRes.data?.data);
        setShifts(rotaRes.data?.data?.result || []);
        setNotices(noticeRes.data?.data?.result || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [eid]);

  // Find if there is an active clock-in for ANY shift today (Cross-rota validation)
  const activeClockInShiftIdToday = useMemo(() => {
    const todayStr = moment().format('YYYY-MM-DD');
    const activeShift = shifts.find((s) => {
      if (moment(s.startDate).format('YYYY-MM-DD') !== todayStr) return false;
      const logs = s.attendanceLogs || [];
      if (logs.length === 0) return false;

      const latestLog = logs[logs.length - 1];
      // Return true if there is a clockIn but no clockOut
      return (
        latestLog.clockIn && (!latestLog.clockOut || latestLog.clockOut === '')
      );
    });
    return activeShift?._id;
  }, [shifts]);
  const groupedShifts = useMemo(() => groupShiftsByMonth(shifts), [shifts]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

 

  return (
    <div className="min-h-screen rounded-md bg-white p-6 shadow-sm">
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome Back{userData?.firstName ? `, ${userData.firstName}` : '!'}
        </h1>

        {/* Company Name */}
        {userData?.company?.name && (
          <div className="text-left sm:text-right">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider ">
              Organization
            </span>
            <span className="text-lg font-bold text-slate-800 sm:text-xl">
              {userData.company.name}
            </span>
          </div>
        )}
      </div>

      <div className="-mt-5 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN: UPCOMING SHIFTS */}
        <div className="lg:col-span-2">
          <div className="mb-5 flex flex-row items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Upcoming Shifts
            </h2>
            <Button
              variant={'link'}
              className="font-semibold text-theme"
              onClick={() => navigate('upcoming-shifts')}
            >
              View All
            </Button>
          </div>

          <div className="space-y-10">
            {Object.keys(groupedShifts).length === 0 ? (
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50 py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 h-12 w-12">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold">No shifts scheduled</h3>
                <p className="mt-1 text-sm text-slate-500">
                  You currently have no upcoming shifts assigned.
                </p>
              </div>
            ) : (
              Object.entries(groupedShifts).map(([monthYear, monthShifts]) => (
                <div key={monthYear} className="relative">
                  <div className="z-10 py-3">
                    <h2 className="text-lg font-bold tracking-tight">
                      {monthYear}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {monthShifts.map((shift, index) => {
                      const isLeave = !shift.startTime && !shift.endTime;
                      const isActive = !isLeave && isShiftActive(shift);

                      // Attendance Log Logic Check
                      const logs = shift.attendanceLogs || [];
                      const latestLog = logs[logs.length - 1];
                      const isCurrentlyClockedIn =
                        latestLog &&
                        latestLog.clockIn &&
                        (!latestLog.clockOut || latestLog.clockOut === '');

                      // Check if they are locked out because of another shift today
                      const isToday =
                        moment(shift.startDate).format('YYYY-MM-DD') ===
                        moment().format('YYYY-MM-DD');
                      const canClockInToThisShift =
                        !activeClockInShiftIdToday ||
                        activeClockInShiftIdToday === shift._id;

                      const showClockOut = isActive && isCurrentlyClockedIn;
                      const showClockIn =
                        isActive &&
                        !isCurrentlyClockedIn &&
                        (!isToday || canClockInToThisShift);
                      const showAnyButton = showClockIn || showClockOut;

                      return (
                        <div
                          key={shift._id || index}
                          className="group flex flex-col items-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-theme/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                        >
                          {/* Date Block & Mobile Action Button */}
                          <div className="mb-4 flex w-full shrink-0 items-center justify-between sm:mb-0 sm:mr-6 sm:w-auto sm:justify-start sm:gap-4">
                            <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-xl border border-theme/10 bg-theme/10 text-theme">
                              <span className="mb-0.5 text-[11px] font-bold uppercase tracking-widest">
                                {getDayName(shift.startDate)}
                              </span>
                              <span className="text-2xl font-black leading-none">
                                {getDateNumber(shift.startDate)}
                              </span>
                            </div>

                            {/* Mobile/Tablet View Action Button */}
                            {showAnyButton && (
                              <div className="block lg:hidden">
                                {showClockOut ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="text-md w-[40vw] bg-red-500 shadow-sm hover:bg-red-600"
                                    onClick={() =>
                                      handleOpenQr(shift._id, 'clockout')
                                    }
                                  >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Clock Out
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="text-md w-[40vw] bg-theme"
                                    onClick={() =>
                                      handleOpenQr(shift._id, 'clockin')
                                    }
                                  >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Clock In
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content Wrapper */}
                          <div className="w-full flex-1">
                            {isLeave ? (
                              /* --- LEAVE STATE --- */
                              <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-8 lg:gap-6">
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Shift Name
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift.shiftName || 'Standard'}
                                  </span>
                                </div>

                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Department
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift?.departmentId?.departmentName ||
                                      'General'}
                                  </span>
                                </div>

                                <div className="col-span-2 flex h-full items-center pt-2 lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 lg:pt-0">
                                  <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                    Leave / Day Off
                                  </span>
                                </div>
                              </div>
                            ) : (
                              /* --- ACTIVE SHIFT STATE --- */
                              <div
                                className={`grid grid-cols-2 items-center gap-4 lg:gap-6 ${
                                  showAnyButton
                                    ? 'lg:grid-cols-10'
                                    : 'lg:grid-cols-8'
                                }`}
                              >
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Shift Name
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift.shiftName || 'Standard'}
                                  </span>
                                </div>

                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Department
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift?.departmentId?.departmentName ||
                                      'General'}
                                  </span>
                                </div>

                                <div className="col-span-1 lg:col-span-1">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Start
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {shift.startTime}
                                  </span>
                                </div>

                                <div className="col-span-1 lg:col-span-1">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    End
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {shift.endTime}
                                  </span>
                                </div>

                                <div className="col-span-2 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Duration
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {calculateDuration(
                                      shift.startTime,
                                      shift.endTime
                                    )}{' '}
                                    h
                                  </span>
                                </div>

                                {/* QR Action (Desktop View) */}
                                {showAnyButton && (
                                  <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:pr-2">
                                    {showClockOut ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full bg-red-500 shadow-sm hover:bg-red-600 sm:w-auto"
                                        onClick={() =>
                                          handleOpenQr(shift._id, 'clockout')
                                        }
                                      >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Clock Out
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="w-full bg-theme text-white shadow-sm hover:bg-blue-700 sm:w-auto"
                                        onClick={() =>
                                          handleOpenQr(shift._id, 'clockin')
                                        }
                                      >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Clock In
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: NOTICE BOARD */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-8 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme/10 text-theme">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Notice
              </h2>
              <p className="text-xs text-slate-500">Latest announcements</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {notices.length === 0 ? (
              <Card className="border border-slate-200 bg-slate-50 py-10 text-center shadow-none">
                <div className="flex flex-col items-center">
                  <AlertCircle className="mb-3 h-8 w-8 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    No recent notices
                  </h3>
                </div>
              </Card>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice._id}
                  className="group overflow-hidden border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Badge
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getNoticeTypeStyle(notice.noticeType)}`}
                    >
                      {notice.noticeType}
                    </Badge>
                  </div>

                  <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-slate-700">
                    {notice.noticeDescription}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {moment(notice.noticeDate).format('MMM DD, YYYY')}
                      </span>
                    </div>

                    {notice.noticeBy && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <UserIcon className="h-3 w-3 text-slate-500" />
                        <span className="font-medium text-slate-500">
                          {notice.noticeBy?.firstName ||
                          notice.noticeBy?.lastName
                            ? `${notice.noticeBy?.firstName ?? ''} ${notice.noticeBy?.lastName ?? ''}`.trim()
                            : notice.noticeBy?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {notices.length >= 10 && (
            <Button
              variant="outline"
              className="mt-2 w-full text-xs"
              onClick={() => navigate('notice-board')}
            >
              View All Notices
            </Button>
          )}
        </div>
      </div>

      {/* Full-Screen QR Modal */}
      {/* UPDATED: trigger silent fetch on close by passing handleQrModalChange */}
      <Dialog open={qrModalOpen} onOpenChange={handleQrModalChange}>
        <DialogContent className="m-0 flex h-[100dvh] w-screen max-w-[100vw] flex-col items-center justify-center rounded-none border-none bg-black/95 p-0">
          <DialogClose className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
            <X className="h-6 w-6" />
          </DialogClose>

          <div className="flex flex-col items-center justify-center space-y-8 p-16 text-center md:p-6">
            <p className="max-w-sm font-semibold text-white">
              Scan this QR code to confirm your{' '}
              {qrAction === 'clockin' ? 'arrival' : 'departure'}.
            </p>

            <div className="rounded-3xl bg-white p-8 shadow-2xl">
              {selectedRotaId && (
                <QRCodeSVG
                  value={selectedRotaId}
                  size={300}
                  level={'H'}
                  includeMargin={false}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffDashboardPage;
