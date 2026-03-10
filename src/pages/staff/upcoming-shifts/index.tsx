import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

// Helper to group shifts by 'Month Year' (e.g., "February 2026")
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

// Date Formatting Helpers
const getDayName = (dateStr: string) =>
  moment(dateStr).format('ddd').toUpperCase();
const getDateNumber = (dateStr: string) => moment(dateStr).format('DD');

// Duration Calculation using Moment.js
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-';

  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');

  if (end.isBefore(start)) {
    end.add(1, 'day'); // Handle overnight shifts
  }

  const duration = moment.duration(end.diff(start));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const UpcomingShiftPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { eid } = useParams();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage] = useState(20);

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const [qrAction, setQrAction] = useState<'clockin' | 'clockout'>('clockin');

  // Real-time validation state (updates every minute)
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

    // Construct full moment objects for the shift's start and end times
    const shiftStartDate = moment(shift.startDate).format('YYYY-MM-DD');
    const shiftStart = moment(
      `${shiftStartDate} ${shift.startTime}`,
      'YYYY-MM-DD HH:mm'
    );

    // Default end time assumes the same day
    let shiftEnd = moment(
      `${shiftStartDate} ${shift.endTime}`,
      'YYYY-MM-DD HH:mm'
    );

    // Handle overnight shifts (e.g., 22:00 to 06:00)
    if (shiftEnd.isBefore(shiftStart)) {
      shiftEnd.add(1, 'day');
    }

    // Return true if current time is between start and end times (inclusive)
    return currentTime.isBetween(shiftStart, shiftEnd, null, '[]');
  };

  const handleOpenQr = (rotaId: string, action: 'clockin' | 'clockout') => {
    setSelectedRotaId(rotaId);
    setQrAction(action);
    setQrModalOpen(true);
  };

  // Initial Fetch (Page 1)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!eid) return;

      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/rota/upcoming-rota?employeeId=${eid}&limit=${entriesPerPage}&page=1`
        );

        setShifts(res.data?.data?.result || []);
        setTotalPages(res.data?.data?.meta?.totalPage || 1);
        setCurrentPage(1); // Reset to page 1 on mount
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [eid, entriesPerPage]);

  // Load More Handler
  const handleLoadMore = async () => {
    if (!eid || currentPage >= totalPages) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      const res = await axiosInstance.get(
        `/rota/upcoming-rota?employeeId=${eid}&limit=${entriesPerPage}&page=${nextPage}`
      );

      const newShifts = res.data?.data?.result || [];

      // Append new data to existing state
      setShifts((prevShifts) => [...prevShifts, ...newShifts]);
      setTotalPages(res.data?.data?.meta?.totalPage || 1);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error fetching more shifts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
    <div className="rounded-md bg-white shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 rounded-md border-b border-slate-200 bg-gradient-to-r from-theme/5 to-transparent p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Upcoming Shifts</h1>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mt-5 space-y-10">
          {Object.keys(groupedShifts).length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 text-slate-500">
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
              <h3 className="text-sm font-semibold text-slate-900">
                No shifts scheduled
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                You currently have no upcoming shifts assigned.
              </p>
            </div>
          ) : (
            Object.entries(groupedShifts).map(([monthYear, monthShifts]) => (
              <div key={monthYear} className="relative -mt-5">
                <div className="z-10 py-3">
                  <h2 className="text-lg font-bold tracking-tight text-slate-800">
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
                        className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-theme hover:shadow-md sm:flex-row"
                      >
                        {/* Changed p-4 to use flex-col on mobile and flex-row on larger screens */}
                        <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                          {/* Date Container */}
                          <div className="flex shrink-0 items-center gap-4">
                            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-theme/5 bg-theme/5 text-theme">
                              <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest">
                                {getDayName(shift.startDate)}
                              </span>
                              <span className="text-xl font-black leading-none text-theme">
                                {getDateNumber(shift.startDate)}
                              </span>
                            </div>
                          </div>

                          {/* Wrapper for Info & Grid */}
                          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                            {/* Shift Name & Department (Side-by-side on mobile, bottom border added for mobile separation) */}
                            <div className="flex w-full flex-row gap-4 border-b border-slate-100 pb-3 sm:w-auto sm:gap-6 sm:border-0 sm:pb-0">
                              <div className="flex-1 sm:w-auto sm:min-w-[130px] sm:flex-none">
                                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  Shift Name
                                </span>
                                <span className="inline-flex items-center rounded-md bg-theme/10 px-2.5 py-1 text-xs font-semibold text-theme">
                                  {shift.shiftName || 'Standard'}
                                </span>
                              </div>

                              <div className="flex-1 sm:w-auto sm:min-w-[130px] sm:flex-none">
                                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  Department
                                </span>
                                <span className="inline-flex items-center rounded-md bg-theme/10 px-2.5 py-1 text-xs font-semibold text-theme">
                                  {shift?.departmentId?.departmentName || ''}
                                </span>
                              </div>
                            </div>

                            {isLeave ? (
                              <div className="flex w-full flex-1 items-center sm:justify-start">
                                <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                  Leave / Day Off
                                </span>
                              </div>
                            ) : (
                              /* Grid changed to 2 columns for mobile, 4 columns for desktop */
                              <div className="grid w-full flex-1 grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4 sm:items-center sm:gap-4 sm:pl-6">
                                <div>
                                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Start
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {shift.startTime}
                                  </span>
                                </div>
                                <div>
                                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    End
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {shift.endTime}
                                  </span>
                                </div>
                                <div>
                                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Duration
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {calculateDuration(
                                      shift.startTime,
                                      shift.endTime
                                    )}{' '}
                                    h
                                  </span>
                                </div>

                                {/* Real-time Action Field */}
                                <div className="flex items-end justify-start sm:items-center sm:justify-end sm:pr-2">
                                  {isActive ? (
                                    isCurrentlyClockedIn ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        /* Full width on mobile, auto width on desktop */
                                        className="w-full bg-red-500 hover:bg-red-600 sm:w-auto"
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
                                        className="w-full sm:w-auto"
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
                                    <div className="w-full text-left sm:text-right">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        QR Access Locked
                                      </span>
                                    </div>
                                  )}
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

        {currentPage < totalPages && shifts.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Button onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading...' : 'Load More Shifts'}
            </Button>
          </div>
        )}
      </div>

      {/* Full-Screen QR Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="m-0 flex h-[100dvh] w-screen max-w-[100vw] flex-col items-center justify-center rounded-none border-none bg-black/95 p-0">
          <DialogClose className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
            <X className="h-6 w-6" />
          </DialogClose>

          <div className="flex flex-col items-center justify-center space-y-8 p-6 text-center">
            <h2 className="text-3xl font-bold capitalize tracking-tight text-white">
              Shift Verification
            </h2>
            <p className="max-w-sm text-white">
              Present this QR code to the scanner to verify your{' '}
              {qrAction === 'clockin' ? 'arrival' : 'departure'} for this shift.
            </p>

            <div className="rounded-3xl bg-white p-8 shadow-2xl">
              {selectedRotaId && (
                <QRCodeSVG
                  value={ selectedRotaId}
                  size={300}
                  level={'H'} // High error correction so scanners read it easily
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

export default UpcomingShiftPage;
