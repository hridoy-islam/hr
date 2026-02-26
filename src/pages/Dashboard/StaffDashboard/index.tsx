import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, UserIcon, Bell } from 'lucide-react';

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

const getDayName = (dateStr: string) => moment(dateStr).format('ddd').toUpperCase();
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
  if (normalizedType.includes('urgent')) return 'bg-red-500 text-white hover:bg-red-600';
  if (normalizedType.includes('reminder')) return 'bg-amber-500 text-white hover:bg-amber-600';
  if (normalizedType.includes('event')) return 'bg-violet-500 text-white hover:bg-violet-600';
  if (normalizedType.includes('general')) return 'bg-blue-500 text-white hover:bg-blue-600';
  return 'bg-slate-500 text-white hover:bg-slate-600';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!eid) return;

      try {
        setLoading(true);
        // Fetch User, Rota, and Notices simultaneously
        const [userRes, rotaRes, noticeRes] = await Promise.all([
          axiosInstance.get(`/users/${eid}`),
          axiosInstance.get(`/rota/upcoming-rota?employeeId=${eid}`),
          axiosInstance.get(`/hr/notice`, {
            params: { page: 1, limit: 10, userId: eid } // Limit to 10 notices
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

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const groupedShifts = groupShiftsByMonth(shifts);

  return (
    <div className="rounded-md bg-white p-6 shadow-sm min-h-screen">
      {/* Header Section */}
     <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome Back{userData?.firstName ? `, ${userData.firstName}` : '!'}
        </h1>
        
        {/* Company Name Added Here */}
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 -mt-5">
        {/* LEFT COLUMN: UPCOMING SHIFTS (Spans 2 columns on large screens) */}
        <div className="lg:col-span-2">
          <div className="flex flex-row items-center justify-between mb-5">
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
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                  {/* Month Header */}
                  <div className="z-10 py-3">
                    <h2 className="text-lg font-bold tracking-tight">
                      {monthYear}
                    </h2>
                  </div>

                  {/* Shifts List */}
                  <div className="flex flex-col gap-3">
                    {monthShifts.map((shift, index) => {
                      const isLeave = !shift.startTime && !shift.endTime;

                      return (
                        <div
                          key={shift._id || index}
                          className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-theme hover:shadow-md sm:flex-row"
                        >
                          <div className="flex flex-1 items-center gap-5 p-4 sm:gap-6 sm:p-5">
                            {/* Date Block */}
                            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-indigo-100 bg-theme/5 text-theme">
                              <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest">
                                {getDayName(shift.startDate)}
                              </span>
                              <span className="text-xl font-black leading-none text-theme">
                                {getDateNumber(shift.startDate)}
                              </span>
                            </div>

                            {/* Shift Details Wrapper */}
                            <div className="flex flex-1 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
                              <div className="w-full sm:w-auto sm:min-w-[130px]">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  Shift Name
                                </span>
                                <span className="inline-flex items-center rounded-md bg-theme/10 px-2.5 py-1 text-xs font-semibold text-theme">
                                  {shift.shiftName || 'Standard'}
                                </span>
                              </div>

                              {isLeave ? (
                                <div className="flex w-full flex-1 items-center">
                                  <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                    Leave / Day Off
                                  </span>
                                </div>
                              ) : (
                                <div className="grid w-full flex-1 grid-cols-3 items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6">
                                  <div>
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Start</span>
                                    <span className="text-sm font-bold">{shift.startTime}</span>
                                  </div>
                                  <div>
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">End</span>
                                    <span className="text-sm font-bold">{shift.endTime}</span>
                                  </div>
                                  <div>
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</span>
                                    <span className="text-sm font-semibold">{calculateDuration(shift.startTime, shift.endTime)} h</span>
                                  </div>
                                </div>
                              )}
                            </div>
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

        {/* RIGHT COLUMN: NOTICE BOARD (Spans 1 column on large screens) */}
        <div className="flex flex-col gap-4 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8 pt-8 lg:pt-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme/10 text-theme">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Notice</h2>
              <p className="text-xs text-slate-500">Latest announcements</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {notices.length === 0 ? (
              <Card className="border border-slate-200 bg-slate-50 py-10 text-center shadow-none">
                <div className="flex flex-col items-center">
                  <AlertCircle className="mb-3 h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">No recent notices</h3>
                </div>
              </Card>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice._id}
                  className="group overflow-hidden border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Badge className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getNoticeTypeStyle(notice.noticeType)}`}>
                      {notice.noticeType}
                    </Badge>
                  </div>
                  
                  <p className="mb-3 text-sm leading-relaxed text-slate-700 line-clamp-3">
                    {notice.noticeDescription}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{moment(notice.noticeDate).format('MMM DD, YYYY')}</span>
                    </div>

                    {notice.noticeBy && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <UserIcon className="h-3 w-3 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {notice.noticeBy?.firstName || notice.noticeBy?.lastName
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
            <Button variant="outline" className="w-full mt-2 text-xs" onClick={() => navigate('notice-board')}>
              View All Notices
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;