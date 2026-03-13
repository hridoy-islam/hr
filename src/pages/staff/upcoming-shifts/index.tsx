import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

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
      5 * 60 * 1000 // 5 minutes
    );
    return () => clearInterval(fetchInterval);
  }, [eid, currentPage, entriesPerPage]);

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

  const groupedShifts = useMemo(() => groupShiftsByMonth(shifts), [shifts]);

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

                  return (
                    <div
                      key={shift._id || index}
                      className="group flex flex-col items-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-theme/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                    >
                      {/* Date Block */}
                      <div className="mb-4 flex w-full shrink-0 items-center justify-between sm:mb-0 sm:mr-6 sm:w-auto sm:justify-start sm:gap-4">
                        <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-xl border border-theme/10 bg-theme/10 text-theme">
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
                          <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-10 lg:gap-6">
                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Shift Name
                              </span>
                              <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                {shift.shiftName || 'Standard'}
                              </span>
                            </div>

                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Department
                              </span>
                              <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                {shift?.departmentId?.departmentName ||
                                  'General'}
                              </span>
                            </div>

                            <div className="col-span-2 flex h-full items-center pt-2 lg:col-span-6  lg:pl-6 lg:pt-0">
                              <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                Leave / Day Off
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-10 lg:gap-6">
                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Shift Name
                              </span>
                              <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                {shift.shiftName || 'Standard'}
                              </span>
                            </div>

                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Department
                              </span>
                              <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                {shift?.departmentId?.departmentName ||
                                  'General'}
                              </span>
                            </div>

                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Start
                              </span>
                              <span className="text-sm font-bold text-black">
                                {shift.startTime}
                              </span>
                            </div>

                            <div className="col-span-1 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                End
                              </span>
                              <span className="text-sm font-bold text-black">
                                {shift.endTime}
                              </span>
                            </div>

                            <div className="col-span-2 lg:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                Duration
                              </span>
                              <span className="text-sm font-bold text-black">
                                {calculateDuration(
                                  shift.startTime,
                                  shift.endTime
                                )}{' '}
                                h
                              </span>
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

      {currentPage < totalPages && shifts.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load More Shifts'}
          </Button>
        </div>
      )}
    </div>
  </div>
);
};

export default UpcomingShiftPage;
