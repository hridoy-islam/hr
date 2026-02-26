import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Bell, Calendar } from 'lucide-react';

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
    end.add(1, 'day');
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

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  const groupedShifts = groupShiftsByMonth(shifts);

  return (
    <div className="rounded-md bg-white  shadow-sm">
      <div className="flex  flex-col items-start justify-between gap-4 rounded-md border-b border-slate-200 bg-gradient-to-r from-theme/5 to-transparent p-5 md:flex-row md:items-center">
        {/* Left Side: Icon & Title */}
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
        {/* Rota Section */}
        <div className="mt-5 space-y-10">
          {Object.keys(groupedShifts).length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 text-slate-400">
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
              <div key={monthYear} className="relative  -mt-5">
                {/* Month Header */}
                <div className="z-10 py-3">
                  <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    {monthYear}
                  </h2>
                </div>

                {/* Shifts List */}
                <div className="flex flex-col gap-3 ">
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
                            {/* Left Side: Shift Name/Type */}
                            <div className="w-full sm:w-auto sm:min-w-[130px]">
                              <div>
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  Shift Name
                                </span>
                              </div>
                              <span className="inline-flex items-center rounded-md bg-theme/10 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {shift.shiftName || 'Standard'}
                              </span>
                            </div>

                            {/* Render conditionally based on if it's a leave day or working shift */}
                            {isLeave ? (
                              <div className="flex w-full flex-1 items-center">
                                <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                  Leave / Day Off
                                </span>
                              </div>
                            ) : (
                              <div className="grid w-full flex-1 grid-cols-3 items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6">
                                {/* Start Time */}
                                <div>
                                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Start
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {shift.startTime}
                                  </span>
                                </div>

                                {/* End Time */}
                                <div>
                                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    End
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {shift.endTime}
                                  </span>
                                </div>

                                {/* Duration */}
                                <div>
                                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Duration
                                  </span>
                                  <span className="text-sm font-semibold text-slate-600">
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {currentPage < totalPages && shifts.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Button onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-slate-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load More Shifts'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingShiftPage;
