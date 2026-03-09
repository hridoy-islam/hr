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
    // Update the current time every minute to toggle QR button availability in real-time
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if a shift is active RIGHT NOW
  const isShiftActive = (shift: any) => {
    if (!shift.startDate || !shift.startTime || !shift.endTime) return false;

    const shiftStartDate = moment(shift.startDate).format('YYYY-MM-DD');
    const shiftStart = moment(
      `${shiftStartDate} ${shift.startTime}`,
      'YYYY-MM-DD HH:mm'
    );
    let shiftEnd = moment(
      `${shiftStartDate} ${shift.endTime}`,
      'YYYY-MM-DD HH:mm'
    );

    if (shiftEnd.isBefore(shiftStart)) {
      shiftEnd.add(1, 'day');
    }

    return currentTime.isBetween(shiftStart, shiftEnd, null, '[]');
  };

  const handleOpenQr = (rotaId: string, action: 'clockin' | 'clockout') => {
    setSelectedRotaId(rotaId);
    setQrAction(action);
    setQrModalOpen(true);
  };

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

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const groupedShifts = groupShiftsByMonth(shifts);

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

                      return (
                        <div
                          key={shift._id || index}
                          className="group flex flex-col items-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-theme/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                        >
                          {/* Date Block */}
                          <div className="mb-4 flex w-full shrink-0 justify-start sm:mb-0 sm:mr-6 sm:w-auto">
                            <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-xl border border-blue-100 bg-theme/10 text-theme">
                              <span className="mb-0.5 text-[11px] font-bold uppercase tracking-widest">
                                {getDayName(shift.startDate)}
                              </span>
                              <span className="text-2xl font-black leading-none">
                                {getDateNumber(shift.startDate)}
                              </span>
                            </div>
                          </div>

                          {/* Content Wrapper */}
                          <div className="w-full flex-1">
                            {isLeave ? (
                              // --- LEAVE STATE ---
                              <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-10 lg:gap-6">
                                {/* Shift Name */}
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Shift Name
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift.shiftName || 'Standard'}
                                  </span>
                                </div>

                                {/* Department */}
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Department
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift?.departmentId?.departmentName ||
                                      'General'}
                                  </span>
                                </div>

                                {/* Leave Pill */}
                                <div className="col-span-2 flex h-full items-center pt-2 lg:col-span-6 lg:border-l lg:border-slate-100 lg:pl-6 lg:pt-0">
                                  <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                    Leave / Day Off
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-10 lg:gap-6">
                                {/* Shift Name */}
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Shift Name
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift.shiftName || 'Standard'}
                                  </span>
                                </div>

                                {/* Department */}
                                <div className="col-span-1 lg:col-span-2">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Department
                                  </span>
                                  <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                    {shift?.departmentId?.departmentName ||
                                      'General'}
                                  </span>
                                </div>

                                {/* Start Time */}
                                <div className="col-span-1 lg:col-span-1  ">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Start
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {shift.startTime}
                                  </span>
                                </div>

                                {/* End Time */}
                                <div className="col-span-1 lg:col-span-1">
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    End
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {shift.endTime}
                                  </span>
                                </div>

                                {/* Duration */}
                                <div className="col-span-1 lg:col-span-2">
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

                                {/* QR Action */}
                                <div className="col-span-1 flex items-center justify-end lg:col-span-2 lg:pr-2">
                                  {isActive ? (
                                    isCurrentlyClockedIn ? (
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
                                        disabled={
                                          !canClockInToThisShift && isToday
                                        }
                                        title={
                                          !canClockInToThisShift && isToday
                                            ? 'Clock out of your previous shift first'
                                            : ''
                                        }
                                      >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        {!canClockInToThisShift && isToday
                                          ? 'Complete prior shift'
                                          : 'Clock In'}
                                      </Button>
                                    )
                                  ) : (
                                    <div className="w-full text-right">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        QR Access Locked
                                      </span>
                                    </div>
                                  )}
                                </div>
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
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="m-0 flex h-[100dvh] w-screen max-w-[100vw] flex-col items-center justify-center rounded-none border-none bg-black/95 p-0">
          <DialogClose className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
            <X className="h-6 w-6" />
          </DialogClose>

          <div className="flex flex-col items-center justify-center space-y-8 p-6 text-center">
            <h2 className="text-3xl font-bold capitalize tracking-tight text-white">
              Shift 
              Verification
            </h2>
            <p className="max-w-sm text-white">
              Present this QR code to the scanner to verify your{' '}
              {qrAction === 'clockin' ? 'arrival' : 'departure'} for this shift.
            </p>

            <div className="rounded-3xl bg-white p-8 shadow-2xl">
              {selectedRotaId && (
                <QRCodeSVG
                  value={JSON.stringify({
                    rotaId: selectedRotaId,
                    action: qrAction
                  })}
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
