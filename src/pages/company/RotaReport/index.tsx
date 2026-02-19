import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  MoveLeft,
  CalendarRange,
  X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import AddRotaDialog from './components/AddRotaDialog';

// ─── Types ────────────────────────────────────────────────────────────────────
type User = {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department?: string;
  image?: string;
  designationId?: { title: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (firstName?: string, lastName?: string, name?: string) => {
  if (firstName && lastName)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2)
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return 'U';
};

const calculateDurationMinutes = (
  startTime?: string,
  endTime?: string,
  leaveType?: string
): number => {
  if (!startTime || !endTime) return 0;
  const start = moment(startTime, 'HH:mm');
  let end = moment(endTime, 'HH:mm');
  if (end.isBefore(start)) end = end.add(1, 'day');
  return end.diff(start, 'minutes');
};

const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return '0'; // display 0 instead of 00:00
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

const ShiftBlock = ({
  leaveType,
  shiftName,
  startTime,
  endTime,
  colors
}: {
  leaveType?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  colors: { bg: string; border: string; text: string };
}) => {
  const title = leaveType || shiftName || '';
  const durationMins = calculateDurationMinutes(startTime, endTime, leaveType);
  const duration = formatDuration(durationMins);

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text
      }}
      className="
        group/shift relative mx-auto flex min-h-[44px] w-full min-w-[50px] cursor-pointer
        flex-col items-center justify-center rounded-md border p-1 shadow-sm
        transition-all duration-200 hover:scale-105 hover:brightness-105
      "
    >
      <div className="pointer-events-none absolute inset-0 rounded-md bg-white/40 opacity-0 transition-opacity group-hover/shift:opacity-100" />

      <span className="mt-0.5 w-full truncate text-center text-sm font-semibold leading-tight opacity-80">
        {duration}
      </span>
    </div>
  );
};

// ─── Leave Type Colors ────────────────────────────────────────────────────────
const leaveTypeColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  DO: { bg: '#E0F7FA', border: '#B2EBF2', text: '#006064' }, // Day Off
  AL: { bg: '#FFF3E0', border: '#FFE0B2', text: '#E65100' }, // Annual Leave
  S: { bg: '#FFEBEE', border: '#FFCDD2', text: '#B71C1C' }, // Sick
  ML: { bg: '#F3E5F5', border: '#E1BEE7', text: '#4A148C' }, // Maternity Leave
  NT: { bg: '#ECEFF1', border: '#CFD8DC', text: '#37474F' } // No Task
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanyRotaReport() {
  const { id: companyId } = useParams();
  const [currentDate, setCurrentDate] = useState(moment());
  const [users, setUsers] = useState<User[]>([]);
  const [rotas, setRotas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerAnchorRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Interaction States
  const [selectedContext, setSelectedContext] = useState<{
    employee: User | null;
    date: any;
  }>({ employee: null, date: null });
  const [selectedRota, setSelectedRota] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddRotaOpen, setIsAddRotaOpen] = useState(false);

  // Date range: [startDate, endDate]
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [rangeStart, rangeEnd] = dateRange;

  // Whether user has clicked "Custom" to enter custom range mode
  const [isCustomMode, setIsCustomMode] = useState(false);
  // Applied range — only set when user clicks Apply (triggers fetch)
  const [appliedRange, setAppliedRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [appliedStart, appliedEnd] = appliedRange;
  const isCustomRange = !!(appliedStart && appliedEnd);

  const fetchUsersAndRotas = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const userRes = await axiosInstance.get(
        `/users?limit=all&role=employee&company=${companyId}`
      );
      const fetchedUsers =
        userRes.data?.data?.result || userRes.data?.data || [];
      setUsers(fetchedUsers);

      const startDate = isCustomRange
        ? moment(appliedStart).format('YYYY-MM-DD')
        : currentDate.clone().startOf('month').format('YYYY-MM-DD');

      const endDate = isCustomRange
        ? moment(appliedEnd).format('YYYY-MM-DD')
        : currentDate.clone().endOf('month').format('YYYY-MM-DD');

      const rotaRes = await axiosInstance.get(
        `/rota?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}&limit=all`
      );
      setRotas(rotaRes.data?.data?.result || rotaRes.data?.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast({
        title: err?.response?.data?.message || 'Failed to fetch staff/rotas',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, currentDate, toast, isCustomRange, appliedStart, appliedEnd]);

  useEffect(() => {
    fetchUsersAndRotas();
  }, [fetchUsersAndRotas]);

  // rotaMap keyed by employeeId → dateKey
  const rotaMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    rotas.forEach((rota) => {
      const empId = rota.employeeId;
      const dateKey = moment(rota.startDate).format('YYYY-MM-DD');
      if (!map[empId]) map[empId] = {};
      map[empId][dateKey] = rota;
    });
    return map;
  }, [rotas]);

  // Total duration per employee — calculated from fetched rotas (already date-range filtered by API)
  const employeeTotalDuration = useMemo(() => {
    const totals: Record<string, number> = {};
    rotas.forEach((rota) => {
      const empId = rota.employeeId;
      const mins = calculateDurationMinutes(
        rota.startTime,
        rota.endTime,
        rota.leaveType
      );
      totals[empId] = (totals[empId] || 0) + mins;
    });
    return totals;
  }, [rotas]);

  const getEmployeeColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return {
      bg: `hsl(${h}, 70%, 92%)`,
      border: `hsl(${h}, 70%, 80%)`,
      text: `hsl(${h}, 70%, 30%)`
    };
  };

  const groupedUsers = useMemo(() => {
    const groups: Record<string, User[]> = {};
    users.forEach((user) => {
      const groupName = user.department || user.role || 'Staff';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(user);
    });
    return groups;
  }, [users]);

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

  const prevMonth = () => setCurrentDate((d) => d.clone().subtract(1, 'month'));
  const nextMonth = () => setCurrentDate((d) => d.clone().add(1, 'month'));

  const handlePickerChange = (date: Date | null) => {
    if (date) setCurrentDate(moment(date));
    setPickerOpen(false);
  };

  const handleCellClick = (user: User, day: moment.Moment) => {
    const dateKey = day.format('YYYY-MM-DD');
    const existingRota = rotaMap[user._id]?.[dateKey];
    setSelectedContext({ employee: user, date: day });
    if (existingRota) {
      setSelectedRota(existingRota);
      setIsEditOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };

  const handleRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
  };

  const handleApply = () => {
    if (rangeStart && rangeEnd) {
      setAppliedRange([rangeStart, rangeEnd]);
      setIsCustomMode(false); // collapse picker back to badge view
    }
  };

  const clearRange = () => {
    setDateRange([null, null]);
    setAppliedRange([null, null]);
    setIsCustomMode(false);
  };

  return (
    <div className="flex h-full w-full max-w-[100vw] flex-col overflow-hidden rounded-md bg-white p-4 text-black shadow-sm">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 14px; width: 14px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 8px; border: 3px solid #F8FAFC; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
        .custom-scrollbar::-webkit-scrollbar-corner { background: #F8FAFC; }
        .scrollbar-top-wrapper { transform: rotateX(180deg); }
        .scrollbar-top-wrapper > table { transform: rotateX(180deg); }

        
      `}</style>

      {/* ── Header ── */}
      <div className="mb-4 flex flex-none flex-wrap items-center justify-between gap-3">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Report</h1>
        </div>

        {/* Center: Unified Date Control */}
        <div className="flex items-center gap-2">
          {isCustomRange && !isCustomMode ? (
            /* ── Applied custom range badge — click to re-edit, × to clear ── */
            <div className="flex items-center gap-1 rounded-full border border-theme/30 bg-theme/5 p-1">
              <button
                onClick={() => setIsCustomMode(true)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-theme transition-all hover:text-blue-900"
              >
                <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" />
                {moment(appliedStart).format('DD MMM YYYY')}
                {' → '}
                {moment(appliedEnd).format('DD MMM YYYY')}
              </button>
              <button
                onClick={clearRange}
                title="Back to month view"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-theme transition-all hover:bg-red-100 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : isCustomMode ? (
            /* ── Custom Range picker + Apply ── */
            <div className="rota-range-picker flex items-center gap-2 rounded-full border border-blue-300 bg-white p-1 shadow-sm">
              <CalendarRange className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-theme" />
              <DatePicker
                selectsRange
                startDate={rangeStart}
                endDate={rangeEnd}
                onChange={handleRangeChange}
                dateFormat="dd MMM yyyy"
                placeholderText="Select date range..."
                isClearable={false}
                className="w-52 border-none bg-transparent text-xs font-semibold text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                onClick={handleApply}
                disabled={!rangeStart || !rangeEnd}
                className="flex h-7 items-center gap-1 rounded-full bg-theme px-3 text-[11px] font-bold text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setIsCustomMode(false);
                  if (!isCustomRange) setDateRange([null, null]);
                }}
                className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            /* ── Month Slider Mode ── */
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/50 p-1">
              <Button
                variant="ghost"
                onClick={prevMonth}
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-theme hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="relative">
                <button
                  ref={pickerAnchorRef}
                  onClick={() => setPickerOpen((o) => !o)}
                  className="flex w-36 items-center justify-center gap-2 border-none text-sm font-bold uppercase text-black"
                >
                  <CalendarDays className="h-4 w-4" />
                  {currentDate.format('MMM YYYY')}
                </button>
                {pickerOpen && (
                  <div className="absolute left-1/2 z-50 -translate-x-1/2 rounded-lg border-none">
                    <DatePicker
                      selected={currentDate.toDate()}
                      onChange={handlePickerChange}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      onClickOutside={() => setPickerOpen(false)}
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={nextMonth}
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-theme hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Custom button — replaces the slider when clicked */}
              <button
                onClick={() => setIsCustomMode(true)}
                className="ml-1 flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <CalendarRange className="h-3 w-3" />
                Custom
              </button>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-9 gap-2"
          >
            <MoveLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex h-[60vh] flex-1 items-center justify-center">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <div className="custom-scrollbar scrollbar-top-wrapper relative min-h-0 w-full flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="sticky bottom-0 top-0 z-40 bg-[#F8FAFC]">
              <tr>
                <th className="sticky bottom-0 left-0 top-0 z-50 min-w-[160px] border-b border-r border-gray-200 bg-[#F8FAFC] p-4 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] sm:min-w-[240px]">
                  <span className="text-xs font-bold uppercase text-black">
                    Staff Member
                  </span>
                </th>
                {daysArray.map((day) => {
                  const isToday = day.isSame(moment(), 'day');
                  const isWeekend = day.day() === 0 || day.day() === 6;
                  return (
                    <th
                      key={day.format('YYYY-MM-DD')}
                      className={`min-w-[52px] border-b border-r border-gray-200 py-2 text-center
                        ${isToday ? 'bg-theme/50 text-white' : isWeekend ? 'bg-theme/5' : ''}
                      `}
                    >
                      <div className="text-[10px] font-bold uppercase text-black">
                        {day.format('ddd')}
                      </div>
                      <div
                        className={`text-sm font-black ${
                          isToday
                            ? 'mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-theme text-white'
                            : 'text-black'
                        }`}
                      >
                        {day.format('D')}
                      </div>
                      {isCustomRange && (
                        <div className="text-[9px] font-medium text-gray-400">
                          {day.format('MMM')}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
                <React.Fragment key={groupName}>
                  {groupUsers.map((user) => {
                    const totalMins = employeeTotalDuration[user._id] || 0;
                    const totalLabel = formatDuration(totalMins);
                    const userColors = getEmployeeColor(user._id);

                    return (
                      <tr
                        key={user._id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        {/* Fixed Staff Name + Total Duration */}
                        <td className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-200">
                              <AvatarImage
                                src={user.image || '/placeholder.png'}
                                alt={user.firstName || 'User'}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gray-100 text-[11px] font-black text-black">
                                {getInitials(
                                  user.firstName,
                                  user.lastName,
                                  user.name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-black">
                                {user.firstName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.name}
                              </p>

                              <div className="flex flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-medium text-gray-500">
                                  {user?.designationId?.title}
                                </p>
                                {/* Total duration badge — reflects fetched date range */}
                               <div
  style={{
    backgroundColor: userColors.bg,
    color: userColors.text,
    borderColor: userColors.border
  }}
  className="flex-shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-semibold tracking-wider"
>
  Total: {totalLabel}
</div>

                              </div>
                            </div>
                          </div>
                        </td>

                        {daysArray.map((day, idx) => {
                          const dateKey = day.format('YYYY-MM-DD');
                          const rota = rotaMap[user._id]?.[dateKey];

                          return (
                            <td
                              key={idx}
                              onClick={() => handleCellClick(user, day)}
                              className="group min-w-[65px] cursor-pointer border-b border-r border-gray-200 p-1 text-center hover:bg-slate-100/80"
                            >
                              {rota ? (
                                <ShiftBlock
                                  leaveType={rota.leaveType}
                                  shiftName={rota.shiftName}
                                  startTime={rota.startTime}
                                  endTime={rota.endTime}
                                  colors={
                                    rota.leaveType
                                      ? leaveTypeColors[rota.leaveType] ||
                                        userColors
                                      : userColors
                                  }
                                />
                              ) : (
                                <div className="mx-auto flex h-9 w-full min-w-[50px] items-center justify-center rounded-lg border border-dashed border-transparent text-gray-300 opacity-0 transition-all group-hover:border-gray-300 group-hover:bg-gray-50 group-hover:opacity-100">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
