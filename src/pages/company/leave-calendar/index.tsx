import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { Button } from '@/components/ui/button';
import moment from '@/lib/moment-setup';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MoveLeft,
  X,
  CalendarRange
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import Select from 'react-select';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Types
type LeaveDay = {
  leaveDate: string;
  leaveType: string;
  _id?: string;
};

type Leave = {
  _id: string;
  holidayYear: string;
  userId:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        [key: string]: any;
      };
  companyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  holidayStatus?: string;
  holidayType: string;
  totalDays?: number;
  totalHours?: number;
  leaveDays?: LeaveDay[];
};

const generateHolidayYears = (backward = 20, forward = 50) => {
  const currentYear = moment().year();
  const years: string[] = [];
  for (let i = backward; i > 0; i--) {
    years.push(`${currentYear - i}-${currentYear - i + 1}`);
  }
  years.push(`${currentYear}-${currentYear + 1}`);
  for (let i = 1; i <= forward; i++) {
    years.push(`${currentYear + i}-${currentYear + i + 1}`);
  }
  return years;
};

const getLeaveTheme = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('holiday')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-700',
      icon: '🏖️'
    };
  }
  if (t.includes('absence')) {
    return {
      bg: 'bg-amber-50',
      border: 'border-orange-300',
      text: 'text-orange-800',
      icon: '🚫'
    };
  }
  if (t.includes('sick')) {
    return {
      bg: 'bg-red-50',
      border: 'border-red-600',
      text: 'text-red-600',
      icon: '🩺'
    };
  }
  if (t.includes('family')) {
    return {
      bg: 'bg-violet-50',
      border: 'border-purple-400',
      text: 'text-purple-700',
      icon: '👨‍👩‍👧‍👦'
    };
  }
  return {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    icon: '📅'
  };
};

const leaveLegend = [
  { type: 'holiday', label: 'Holiday', color: 'bg-blue-700' },
  { type: 'absence', label: 'Absence', color: 'bg-orange-800' },
  { type: 'sick', label: 'Sick Leave', color: 'bg-red-600' },
  { type: 'family', label: 'Family Leave', color: 'bg-purple-700' }
];

const leaveTypeOptions = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'absence', label: 'Absence' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'family', label: 'Family Leave' }
];

const getNormalizedDates = (leave: Leave) => {
  let startStr = leave.startDate;
  let endStr = leave.endDate;

  if (leave.leaveDays && leave.leaveDays.length > 0) {
    const dates = [...leave.leaveDays]
      .map((d) => d.leaveDate)
      .sort((a, b) => a.localeCompare(b));
    startStr = dates[0];
    endStr = dates[dates.length - 1];
  }

  const cleanStart = startStr
    ? startStr.substring(0, 10)
    : moment().format('YYYY-MM-DD');
  const cleanEnd = endStr
    ? endStr.substring(0, 10)
    : moment().format('YYYY-MM-DD');

  return {
    start: moment(cleanStart, 'YYYY-MM-DD').startOf('day'),
    end: moment(cleanEnd, 'YYYY-MM-DD').startOf('day')
  };
};

// Main Component
export default function CompanyLeaveCalendarPage() {
  const { id: companyId } = useParams();
  const [currentDate, setCurrentDate] = useState(moment());
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerAnchorRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentYearNum = moment().year();
  const currentYearStr = `${currentYearNum}-${currentYearNum + 1}`;
  const yearOptions = useMemo(
    () =>
      generateHolidayYears(20, 50).map((year) => ({
        value: year,
        label: year
      })),
    []
  );
  const [selectedYear, setSelectedYear] = useState(currentYearStr);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [rangeStart, rangeEnd] = dateRange;
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [appliedRange, setAppliedRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [appliedStart, appliedEnd] = appliedRange;
  const isCustomRange = !!(appliedStart && appliedEnd);

  // Leave Details Modal state
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const topScrollWrapperRef = useRef<HTMLDivElement>(null);
  const topScrollInnerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  const fetchLeaves = useCallback(
    async (isInitial = false) => {
      if (!companyId) return;
      if (isInitial) setIsLoading(true);
      try {
        const fromDateStr =
          isCustomRange && appliedStart
            ? moment(appliedStart).format('YYYY-MM-DD')
            : currentDate.clone().startOf('month').format('YYYY-MM-DD');

        const toDateStr =
          isCustomRange && appliedEnd
            ? moment(appliedEnd).format('YYYY-MM-DD')
            : currentDate.clone().endOf('month').format('YYYY-MM-DD');

        const leaveRes = await axiosInstance.get(`/hr/leave`, {
          params: {
            companyId,
            holidayYear: selectedYear,
            fromDate: fromDateStr,
            toDate: toDateStr,
            limit: 'all'
          }
        });

        setLeaves(leaveRes.data?.data?.result || leaveRes.data?.data || []);
      } catch (err: any) {
        console.error('Error:', err);
        toast({ title: 'Failed to fetch leaves', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [
      companyId,
      selectedYear,
      toast,
      isCustomRange,
      appliedStart,
      appliedEnd,
      currentDate
    ]
  );

  useEffect(() => {
    fetchLeaves(true);
  }, [fetchLeaves]);

  const daysArray = useMemo(() => {
    if (isCustomRange && appliedStart && appliedEnd) {
      const days = [];
      let current = moment(appliedStart).clone();
      const end = moment(appliedEnd);
      while (current.isSameOrBefore(end, 'day')) {
        days.push(current.clone());
        current.add(1, 'day');
      }
      return days;
    }
    const count = currentDate.daysInMonth();
    return Array.from({ length: count }, (_, i) =>
      currentDate.clone().date(i + 1)
    );
  }, [currentDate, isCustomRange, appliedStart, appliedEnd]);

  const leavesPerDay = useMemo(() => {
    const validLeaves = leaves.filter(
      (leave) => leave.status?.toLowerCase() !== 'rejected'
    );

    return daysArray.map((day) => {
      return validLeaves.filter((l) => {
        const { start, end } = getNormalizedDates(l);
        return (
          day.isSameOrAfter(start, 'day') && day.isSameOrBefore(end, 'day')
        );
      });
    });
  }, [leaves, daysArray]);

  const prevMonth = () => setCurrentDate((d) => d.clone().subtract(1, 'month'));
  const nextMonth = () => setCurrentDate((d) => d.clone().add(1, 'month'));

  const handlePickerChange = (date: Date | null) => {
    if (date) setCurrentDate(moment(date));
    setPickerOpen(false);
  };

  const handleRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
  };

  // Auto-scroll to today's date on initial load
  useEffect(() => {
    // Wait until data is loaded and ensure wrapper exists
    if (isLoading || !tableWrapperRef.current) return;

    // Find the index of today in the current daysArray
    const todayIndex = daysArray.findIndex((day) =>
      day.isSame(moment(), 'day')
    );

    if (todayIndex === -1) return;

    // Use a timeout to ensure the DOM has fully painted before scrolling
    const timer = setTimeout(() => {
      if (!tableWrapperRef.current) return;

      const thElements = tableWrapperRef.current.querySelectorAll('th');

      if (thElements && thElements[todayIndex]) {
        tableWrapperRef.current.scrollTo({
          left: thElements[todayIndex].offsetLeft,
          behavior: initialScrollDone.current ? 'smooth' : 'auto'
        });

        initialScrollDone.current = true;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [daysArray, isLoading]);

  const handleApply = () => {
    if (rangeStart && rangeEnd) {
      setAppliedRange([rangeStart, rangeEnd]);
      setIsCustomMode(false);
    }
  };

  const clearRange = () => {
    setDateRange([null, null]);
    setAppliedRange([null, null]);
    setIsCustomMode(false);
  };

  // Scrollbar Sync
  useEffect(() => {
    const syncScrollWidth = () => {
      if (tableWrapperRef.current && topScrollInnerRef.current) {
        const tableScrollWidth = tableWrapperRef.current.scrollWidth;
        topScrollInnerRef.current.style.width = `${tableScrollWidth}px`;
      }
    };

    syncScrollWidth();
    const resizeObserver = new ResizeObserver(() => syncScrollWidth());
    if (tableWrapperRef.current) {
      resizeObserver.observe(tableWrapperRef.current);
    }
    const timer = setTimeout(syncScrollWidth, 200);

    window.addEventListener('resize', syncScrollWidth);
    return () => {
      window.removeEventListener('resize', syncScrollWidth);
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [daysArray, isLoading, leaves]);

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollWrapperRef.current) {
      topScrollWrapperRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const getEmployeeName = (leave: Leave): string => {
    if (typeof leave.userId === 'object' && leave.userId !== null) {
      const u = leave.userId;
      if (u.firstName || u.lastName) {
        return `${u.firstName || ''} ${u.lastName || ''}`.trim();
      }
      if (u.name) return u.name;
    }
    return 'Employee';
  };

  return (
    <div className="flex h-full w-full max-w-[100vw] flex-col overflow-hidden bg-slate-50 p-4 text-black">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 8px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .hide-x-scrollbar::-webkit-scrollbar:horizontal { height: 0px; display: none; }
        .hide-x-scrollbar { overflow-x: auto; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-3 pb-5">
        <div className="flex flex-none items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Leave Calendar
            </h1>

            <div className="flex items-center gap-3">
              <label className="text-[13px] font-semibold uppercase tracking-wider">
                Holiday Year
              </label>
              <div className="z-50 w-[160px]">
                <Select
                  options={yearOptions}
                  value={yearOptions.find((opt) => opt.value === selectedYear)}
                  onChange={(option) => {
                    const val = option?.value || currentYearStr;
                    setSelectedYear(val);
                    const startYear = val.split('-')[0];
                    setCurrentDate(moment(`${startYear}-01-01`, 'YYYY-MM-DD'));
                    setDateRange([null, null]);
                    setAppliedRange([null, null]);
                    setIsCustomMode(false);
                  }}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e2e8f0',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-2">
            {isCustomRange && !isCustomMode ? (
              <div className="flex items-center gap-1 rounded-md border border-theme/20 bg-theme/5 p-1 px-2">
                <button
                  onClick={() => setIsCustomMode(true)}
                  className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-theme hover:text-blue-900"
                >
                  <CalendarRange className="h-4 w-4" />
                  {moment(appliedStart).isSame(moment(appliedEnd), 'day')
                    ? moment(appliedStart).format('DD MMM YYYY')
                    : `${moment(appliedStart).format('DD MMM')} - ${moment(appliedEnd).format('DD MMM YYYY')}`}
                </button>
                <button
                  onClick={clearRange}
                  className="ml-1 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : isCustomMode ? (
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                <CalendarRange className="ml-2 h-4 w-4 text-slate-400" />
                <DatePicker
                  selectsRange
                  startDate={rangeStart}
                  endDate={rangeEnd}
                  onChange={handleRangeChange}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Select date range..."
                  isClearable={false}
                  className="w-52 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!rangeStart || !rangeEnd}
                  className="ml-1 h-7 rounded px-3 text-[11px] font-semibold"
                >
                  Apply
                </Button>
                <button
                  onClick={() => {
                    setIsCustomMode(false);
                    if (!isCustomRange) setDateRange([null, null]);
                  }}
                  className="mr-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                <Button
                  variant="ghost"
                  onClick={prevMonth}
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <button
                    ref={pickerAnchorRef}
                    onClick={() => setPickerOpen((o) => !o)}
                    className="flex w-[140px] items-center justify-center gap-2 text-[13px] font-bold uppercase text-slate-700 hover:text-theme"
                  >
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {currentDate.format('MMM YYYY')}
                  </button>
                  {pickerOpen && (
                    <div className="absolute left-1/2 z-50 mt-2 -translate-x-1/2 rounded-lg border border-slate-200 bg-white shadow-xl">
                      <DatePicker
                        selected={currentDate.toDate()}
                        onChange={handlePickerChange}
                        dateFormat="MM/yyyy"
                        showMonthYearPicker
                        inline
                        onClickOutside={() => setPickerOpen(false)}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={nextMonth}
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="mx-1 h-4 w-[1px] bg-slate-200"></div>
                <Button
                  variant="ghost"
                  onClick={() => setIsCustomMode(true)}
                  className="h-8 px-3 text-[12px] font-medium"
                >
                  Custom
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Button
              onClick={() => navigate(-1)}
              className="h-9 gap-2 border-slate-200 shadow-sm"
            >
              <MoveLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end">
          <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            {leaveLegend.map((item) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-[10px] font-semibold text-slate-700">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      {isLoading ? (
        <div className="flex h-[60vh] flex-1 items-center justify-center">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <div
          className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          style={{ height: 'calc(100vh - 160px)' }}
        >
          {/* Scrollbar mirror */}
          <div
            ref={topScrollWrapperRef}
            className="custom-scrollbar invisible-hover-scrollbar w-full shrink-0 overflow-x-auto overflow-y-hidden border-b border-slate-100 bg-slate-50"
            style={{ height: '12px' }}
            onScroll={handleTopScroll}
          >
            <div
              ref={topScrollInnerRef}
              style={{ height: '1px', display: 'block' }}
            />
          </div>

          <div
            ref={tableWrapperRef}
            className="custom-scrollbar hide-x-scrollbar w-full flex-1 overflow-auto bg-white"
            onScroll={handleTableScroll}
          >
            <table className="h-full w-full border-collapse text-left">
              <thead className="sticky top-0 z-40 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  {daysArray.map((day) => {
                    const isToday = day.isSame(moment(), 'day');
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    return (
                      <th
                        key={day.format('D')}
                        className={`w-[200px] min-w-[200px] max-w-[200px] border-x border-b border-slate-200 py-2.5 text-center ${
                          isToday
                            ? 'bg-theme/5'
                            : isWeekend
                              ? 'bg-slate-50/70'
                              : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`text-[10px] font-bold uppercase ${isToday ? 'text-theme' : 'text-slate-800'}`}
                          >
                            {day.format('ddd')}
                          </div>
                          <div
                            className={`text-[13px] font-black ${
                              isToday
                                ? 'flex h-6 w-6 items-center justify-center rounded-full bg-theme text-white shadow-sm'
                                : 'text-slate-700'
                            }`}
                          >
                            {day.format('D')}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                <tr className="h-full">
                  {daysArray.map((day, idx) => {
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    const dayLeaves = leavesPerDay[idx];

                    return (
                      <td
                        key={idx}
                        className={`min-w-[200px] border-x border-slate-200 p-1 align-top transition-colors hover:bg-slate-100/40 ${
                          isWeekend ? 'bg-slate-50/70' : ''
                        }`}
                      >
                        <div className="flex min-h-[40px] w-full flex-col gap-1">
                          {dayLeaves.map((leave, lIdx) => {
                            const theme = getLeaveTheme(leave.holidayType);
                            const status = (leave.status || '').toLowerCase();
                            const statusBadgeClass =
                              status === 'pending'
                                ? 'bg-red-500 text-white'
                                : status === 'approved'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-400 text-white';

                            const employeeName = getEmployeeName(leave);

                            return (
                              <div
                                key={leave._id || lIdx}
                                onClick={() => setSelectedLeave(leave)}
                                className={`flex min-h-[45px] w-full cursor-pointer flex-col justify-center overflow-hidden rounded-md border ${theme.border} ${theme.bg} px-2 py-1.5 shadow-sm transition-all duration-200 hover:opacity-80`}
                              >
                                <div className="mb-1 flex items-center justify-start gap-2">
                                  <div
                                    className={`flex items-center gap-1 ${theme.text} truncate`}
                                  >
                                    <span className="shrink-0 text-xs">
                                      {theme.icon}
                                    </span>
                                    <span className="truncate text-[11px] font-semibold uppercase tracking-wide">
                                      {leaveTypeOptions.find(
                                        (item) =>
                                          item.value === leave.holidayType
                                      )?.label || leave.holidayType}
                                    </span>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
                                  >
                                    {leave.status || 'N/A'}
                                  </span>
                                </div>

                                <div className="pb-1 text-xs font-bold">
                                  <h1>{employeeName}</h1>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      <Dialog
        open={!!selectedLeave}
        onOpenChange={(open) => !open && setSelectedLeave(null)}
      >
        <DialogContent className="overflow-hidden border-slate-200 bg-white p-6 shadow-xl sm:max-w-md">
          {selectedLeave &&
            (() => {
              const theme = getLeaveTheme(selectedLeave.holidayType);
              const status = (selectedLeave.status || '').toLowerCase();
              const statusBadgeClass =
                status === 'pending'
                  ? 'bg-red-500 text-white'
                  : status === 'approved'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-400 text-white';

              const { start, end } = getNormalizedDates(selectedLeave);
              const employeeName = getEmployeeName(selectedLeave);

              return (
                <div className="flex flex-col gap-3">
                  {/* Title Row: Type + Status */}
                  <DialogTitle className="flex items-center justify-start gap-2">
                    <div className={`flex items-center gap-1.5 ${theme.text}`}>
                      <span className="text-sm">{theme.icon}</span>
                      <span className="text-[13px] font-bold uppercase tracking-wide">
                        {leaveTypeOptions.find(
                          (item) => item.value === selectedLeave.holidayType
                        )?.label || selectedLeave.holidayType}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
                    >
                      {selectedLeave.status || 'N/A'}
                    </span>
                  </DialogTitle>

                  {/* Employee Name */}
                  <p className="text-[13px] font-semibold text-slate-800">
                    {employeeName}
                  </p>

                  {/* Date Range + Duration */}
                  <p className="text-[13px] font-semibold text-slate-700">
                    {start.isSame(end, 'day')
                      ? start.format('DD MMM YYYY')
                      : `${start.format('DD MMM YYYY')} – ${end.format('DD MMM YYYY')}`}
                    {(selectedLeave.totalDays || selectedLeave.totalHours) && (
                      <span className="ml-1.5 text-xs font-semibold text-slate-500">
                        (
                        {selectedLeave.totalDays
                          ? `${selectedLeave.totalDays} Day${selectedLeave.totalDays > 1 ? 's' : ''}`
                          : ''}
                        {selectedLeave.totalDays && selectedLeave.totalHours
                          ? ' • '
                          : ''}
                        {selectedLeave.totalHours
                          ? `${selectedLeave.totalHours} Hours`
                          : ''}
                        )
                      </span>
                    )}
                  </p>

                  {/* Reason */}
                  <div className="min-h-[60px] rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    {selectedLeave.reason || (
                      <span className="italic text-slate-400">
                        No specific reason provided for this request.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
