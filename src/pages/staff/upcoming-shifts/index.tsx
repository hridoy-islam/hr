import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

// Helper to group shifts by 'Month Year'
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



// Duration Calculation
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-';
  const start = moment(startTime, 'HH:mm');
  let end = moment(endTime, 'HH:mm');
  if (end.isBefore(start)) end.add(1, 'day');
  const duration = moment.duration(end.diff(start));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const UpcomingShiftPage = () => {
  const { eid } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage] = useState(20);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const [qrAction, setQrAction] = useState<'clockin' | 'clockout'>('clockin');
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 60000);
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

  const fetchRotaDataSilently = async () => {
    if (!eid) return;
    try {
      const limit = currentPage * entriesPerPage;
      const res = await axiosInstance.get(
        `/rota/upcoming-rota?employeeId=${eid}&limit=${limit}&page=1`
      );
      setShifts(res.data?.data?.result || []);
      setTotalPages(res.data?.data?.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching background rota data:', error);
    }
  };

  useEffect(() => {
    const fetchInterval = setInterval(
      () => fetchRotaDataSilently(),
      5 * 60 * 1000
    );
    return () => clearInterval(fetchInterval);
  }, [eid, currentPage, entriesPerPage]);


  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (qrModalOpen) {
      timer = setTimeout(() => {
        setQrModalOpen(false);
        // Clean up state after closing
        setSelectedRotaId(null);
      }, 5000); // 5000ms = 5 seconds
    }

    return () => clearTimeout(timer);
  }, [qrModalOpen]);

  
  const handleQrModalChange = (isOpen: boolean) => {
    setQrModalOpen(isOpen);
    if (!isOpen) fetchRotaDataSilently();
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!eid) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/rota/upcoming-rota?employeeId=${eid}&limit=${entriesPerPage}&page=1`
        );
        setShifts(res.data?.data?.result || []);
        setTotalPages(res.data?.data?.meta?.totalPage || 1);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [eid, entriesPerPage]);

  const handleLoadMore = async () => {
    if (!eid || currentPage >= totalPages) return;
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const res = await axiosInstance.get(
        `/rota/upcoming-rota?employeeId=${eid}&limit=${entriesPerPage}&page=${nextPage}`
      );
      setShifts((prev) => [...prev, ...(res.data?.data?.result || [])]);
      setCurrentPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const activeClockInShiftIdToday = useMemo(() => {
    const todayStr = moment().format('YYYY-MM-DD');
    const activeShift = shifts.find((s) => {
      if (moment(s.startDate).format('YYYY-MM-DD') !== todayStr) return false;
      const logs = s.attendanceLogs || [];
      const latestLog = logs[logs.length - 1];
      return latestLog?.clockIn && !latestLog?.clockOut;
    });
    return activeShift?._id;
  }, [shifts]);

  const groupedShifts = useMemo(() => groupShiftsByMonth(shifts), [shifts]);

  const handleOpenQr = (rotaId: string, action: 'clockin' | 'clockout') => {
    setSelectedRotaId(rotaId);
    setQrAction(action);
    setQrModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 rounded-md border-b border-slate-200 bg-gradient-to-r from-theme/5 to-transparent p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">Upcoming Shifts</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="mt-5 space-y-10">
          {Object.keys(groupedShifts).length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 py-16 text-center shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                No shifts scheduled
              </h3>
            </div>
          ) : (
            Object.entries(groupedShifts).map(([monthYear, monthShifts]) => (
              <div key={monthYear} className="relative">
                <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-800">
                  {monthYear}
                </h2>
                <div className="flex flex-col gap-3">
                  {monthShifts.map((shift, index) => {
                    const isLeave = !shift.startTime && !shift.endTime;
                    const isActive = !isLeave && isShiftActive(shift);

                    const logs = shift.attendanceLogs || [];
                    const latestLog = logs[logs.length - 1];
                    const isCurrentlyClockedIn =
                      latestLog?.clockIn && !latestLog?.clockOut;

                    // Logic for showing buttons
                    const showClockOut = isCurrentlyClockedIn;
                    const showClockIn =
                      isActive &&
                      !activeClockInShiftIdToday &&
                      !isCurrentlyClockedIn;
                    const showAnyButton = showClockIn || showClockOut;

                    return (
                      <div
                        key={shift._id || index}
                        className="group flex flex-col items-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-theme/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                      >
                        <div className="mb-4 flex w-full shrink-0 items-center justify-between sm:mb-0 sm:mr-6 sm:w-auto sm:justify-start sm:gap-4">
                          <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-xl border border-theme/10 bg-theme/10 text-theme">
                            <span className="mb-0.5 text-[11px] font-bold uppercase tracking-widest">
                              {getDayName(shift.startDate)}
                            </span>
                            <span className="text-2xl font-black leading-none">
                              {getDateNumber(shift.startDate)}
                            </span>
                          </div>

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

                        <div className="w-full flex-1">
                          {isLeave ? (
                            <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-8">
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
                              <div className="col-span-1 lg:col-span-4">
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                  Leave / Day Off
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`grid grid-cols-2 items-center gap-4 ${showAnyButton ? 'lg:grid-cols-12' : 'lg:grid-cols-10'}`}
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
                              <div className="col-span-2">
                                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  Start Time
                                </span>
                                <span className="text-sm font-bold">
                                  {shift.startTime}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  End Time
                                </span>
                                <span className="text-sm font-bold">
                                  {shift.endTime}
                                </span>
                              </div>
                              <div className="col-span-2 lg:col-span-2">
                                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  Duration
                                </span>
                                <span className="text-sm font-bold">
                                  {calculateDuration(
                                    shift.startTime,
                                    shift.endTime
                                  )}{' '}
                                  h
                                </span>
                              </div>

                              {showAnyButton && (
                                <div className="hidden lg:col-span-2 lg:flex lg:justify-end">
                                  <Button
                                    size="sm"
                                    variant={
                                      showClockOut ? 'destructive' : 'default'
                                    }
                                    className={
                                      showClockOut ? 'bg-red-500' : 'bg-theme'
                                    }
                                    onClick={() =>
                                      handleOpenQr(
                                        shift._id,
                                        showClockOut ? 'clockout' : 'clockin'
                                      )
                                    }
                                  >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    {showClockOut ? 'Clock Out' : 'Clock In'}
                                  </Button>
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

        {currentPage < totalPages && shifts.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Button onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading...' : 'Load More Shifts'}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={qrModalOpen} onOpenChange={handleQrModalChange}>
        <DialogContent className="m-0 flex h-[100dvh] w-screen max-w-[100vw] flex-col items-center justify-center rounded-none border-none bg-black/95 p-0">
          <DialogClose className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white">
            <X className="h-6 w-6" />
          </DialogClose>
          <div className="flex flex-col items-center space-y-8  p-16 text-center md:p-6">
            <p className="max-w-sm font-semibold text-white">
              Scan this QR code to confirm your{' '}
              {qrAction === 'clockin' ? 'arrival' : 'departure'}.
            </p>
            <div className="rounded-3xl bg-white p-8">
              {selectedRotaId && (
                <QRCodeSVG value={selectedRotaId} size={280} level="H" />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpcomingShiftPage;
