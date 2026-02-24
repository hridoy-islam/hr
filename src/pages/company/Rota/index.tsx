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
  Copy,
  Users,
  MoveLeft,
  AlertTriangle,
  X,
  File,
  GripVertical
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateRotaDialog from './components/CreateRotaDialog';
import EditRotaSidebar from './components/EditRotaSidebar';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import AddRotaDialog from './components/AddRotaDialog';
import CopyRotaDialog from './components/CopyRotaDialog';
import BulkAssignDialog from './components/BulkAssignDialog';

// react-dnd imports
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
  index?: number;
};

const DRAG_TYPE = 'ROW';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (firstName?: string, lastName?: string, name?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2)
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return 'U';
};

// ─── ShiftBlock ───────────────────────────────────────────────────────────────
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
  colors: 'theme' | { bg: string; border: string; text: string };
}) => {
  const title = leaveType || shiftName || '';
  const hasTime = startTime && endTime && !leaveType;
  const isTheme = colors === 'theme';

  return (
    <div
      style={
        !isTheme
          ? {
              backgroundColor: colors.bg,
              borderColor: colors.border,
              color: colors.text
            }
          : undefined
      }
      className={`
        group/shift relative mx-auto flex min-h-[44px] w-full min-w-[50px] cursor-pointer 
        flex-col items-center justify-center rounded-md border p-1 shadow-sm 
        transition-all duration-200 hover:scale-105 hover:brightness-105
        ${isTheme ? 'bg-theme border-theme text-white' : ''}
      `}
    >
      <div className="pointer-events-none absolute inset-0 rounded-md bg-white/40 opacity-0 transition-opacity group-hover/shift:opacity-100" />
      <span className="text-md w-full truncate text-center font-bold uppercase leading-tight tracking-widest">
        {title}
      </span>
      {hasTime && (
        <span className="mt-0.5 w-full truncate text-center text-xs font-semibold leading-tight tracking-wide opacity-90">
          {startTime}-{endTime}
        </span>
      )}
    </div>
  );
};

// ─── DraggableRow ─────────────────────────────────────────────────────────────
interface DraggableRowProps {
  user: User;
  rowIndex: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  daysArray: moment.Moment[];
  rotaMap: Record<string, Record<string, any>>;
  leaveTypeColors: Record<string, { bg: string; border: string; text: string }>;
  handleCellClick: (user: User, day: moment.Moment) => void;
}

const DraggableRow: React.FC<DraggableRowProps> = ({
  user,
  rowIndex,
  moveRow,
  daysArray,
  rotaMap,
  leaveTypeColors,
  handleCellClick
}) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DRAG_TYPE,
    item: { rowIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop<
    { rowIndex: number },
    void,
    { isOver: boolean }
  >({
    accept: DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.rowIndex;
      const hoverIndex = rowIndex;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      item.rowIndex = hoverIndex;
    }
  });

  // Attach drop to the row, drag handle only to the grip icon
  drop(dragPreview(ref));

  return (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/60 ${
        isDragging ? 'opacity-40 bg-blue-50' : ''
      } ${isOver ? 'bg-slate-100' : ''}`}
    >
      {/* Sticky name cell */}
      <td className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div
            ref={drag as any}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <Avatar className="h-9 w-9 border border-gray-200 flex-shrink-0">
            <AvatarImage
              src={user.image || '/placeholder.png'}
              alt={user.firstName || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-100 text-[11px] font-black text-black">
              {getInitials(user.firstName, user.lastName, user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">
              {user.firstName
                ? `${user.firstName} ${user.lastName}`
                : user.name}
            </p>
            <p className="text-[10px] font-medium text-gray-500">
              {user?.designationId?.title}
            </p>
          </div>
        </div>
      </td>

      {/* Day cells */}
      {daysArray.map((day, idx) => {
        const dateKey = day.format('YYYY-MM-DD');
        const rota = rotaMap[user._id]?.[dateKey];

        let shiftColors: any = 'theme';
        if (rota) {
          if (rota.leaveType && leaveTypeColors[rota.leaveType]) {
            shiftColors = leaveTypeColors[rota.leaveType];
          } else if (rota.color) {
            shiftColors =
              typeof rota.color === 'string'
                ? { bg: rota.color, border: rota.color, text: '#FFFFFF' }
                : rota.color;
          }
        }

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
                colors={shiftColors}
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
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyRota() {
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    employee: User | null;
    date: any;
  }>({ employee: null, date: null });
  const [selectedRota, setSelectedRota] = useState<any>(null);
  const [skippedRecords, setSkippedRecords] = useState<any[]>([]);
  const [isAddRotaOpen, setIsAddRotaOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isCopyRotaOpen, setIsCopyRotaOpen] = useState(false);
  const [companyColor, setCompanyColor] = useState(null);

  // Ref to avoid stale closure in moveRow
  const usersRef = useRef<User[]>(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsersAndRotas = useCallback(
    async (isInitial = false) => {
      if (!companyId) return;
      if (isInitial || (users.length === 0 && rotas.length === 0)) {
        setIsLoading(true);
      }

      try {
        const userRes = await axiosInstance.get(
          `/users?limit=all&role=employee&company=${companyId}`
        );
        const fetchedUsers: User[] =
          userRes.data?.data?.result || userRes.data?.data || [];

        // ── Assign index if missing ──────────────────────────────────────────
        const usersNeedingIndex = fetchedUsers.filter(
          (u) => u.index === undefined || u.index === null
        );

        if (usersNeedingIndex.length > 0) {
          // Sort existing indexed users first, then append unindexed
          const indexed = fetchedUsers
            .filter((u) => u.index !== undefined && u.index !== null)
            .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

          let nextIndex =
            indexed.length > 0
              ? Math.max(...indexed.map((u) => u.index ?? 0)) + 1
              : 0;

          // Update unindexed users via API
          await Promise.all(
            usersNeedingIndex.map(async (u) => {
              const assignedIndex = nextIndex++;
              try {
                await axiosInstance.patch(`/users/${u._id}`, {
                  index: assignedIndex
                });
                u.index = assignedIndex;
              } catch (e) {
                console.error(`Failed to set index for user ${u._id}`, e);
              }
            })
          );
        }

        // Sort users by index ascending
        const sortedUsers = [...fetchedUsers].sort(
          (a, b) => (a.index ?? 0) - (b.index ?? 0)
        );
        setUsers(sortedUsers);

        const startOfMonth = currentDate
          .clone()
          .startOf('month')
          .format('YYYY-MM-DD');
        const endOfMonth = currentDate
          .clone()
          .endOf('month')
          .format('YYYY-MM-DD');

        const rotaRes = await axiosInstance.get(
          `/rota?companyId=${companyId}&startDate=${startOfMonth}&endDate=${endOfMonth}&limit=all`
        );
        const fetchedRotas =
          rotaRes.data?.data?.result || rotaRes.data?.data || [];
        setRotas(fetchedRotas);

        const companyRes = await axiosInstance.get(`/users/${companyId}`);
        setCompanyColor(companyRes.data?.data?.themeColor);
      } catch (err: any) {
        console.error('Error:', err);
        toast({ title: 'Failed to fetch data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, currentDate, toast, users.length, rotas.length]
  );

  useEffect(() => {
    fetchUsersAndRotas(true);
  }, [companyId, currentDate]);

  // ── Drag-and-drop row move ─────────────────────────────────────────────────
  /**
   * Called during hover — reorders the list in state immediately for a smooth
   * drag experience, then persists the new indices to the API on drop.
   */
  const moveRow = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      setUsers((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(hoverIndex, 0, removed);

        // Reassign sequential indices
        const reindexed = updated.map((u, i) => ({ ...u, index: i }));

        // Persist to API (fire-and-forget during drag, await on drop)
        // We debounce by doing it inside a setTimeout so rapid hover events
        // don't flood the API; the last call wins.
        persistIndices(reindexed);

        return reindexed;
      });
    },
    []
  );

  // Debounce ref so we only call API after dragging settles
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistIndices = useCallback(
    (updatedUsers: User[]) => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(async () => {
        try {
          await Promise.all(
            updatedUsers.map((u) =>
              axiosInstance.patch(`/users/${u._id}`, { index: u.index })
            )
          );
        } catch (e) {
          console.error('Failed to persist user indices', e);
          toast({
            title: 'Failed to save order',
            description: 'User order could not be saved to server.',
            variant: 'destructive'
          });
        }
      }, 600); // 600ms debounce
    },
    [toast]
  );

  // ── Derived data ───────────────────────────────────────────────────────────
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

  const leaveTypeColors: Record<
    string,
    { bg: string; border: string; text: string }
  > = {
    DO: { bg: '#E0F7FA', border: '#B2EBF2', text: '#006064' },
    AL: { bg: '#93c47d', border: '#93c47d', text: '#ffffff' },
    S:  { bg: '#ff0000', border: '#FFCDD2', text: '#ffffff' },
    ML: { bg: '#F3E5F5', border: '#E1BEE7', text: '#4A148C' },
    NT: { bg: '#ECEFF1', border: '#CFD8DC', text: '#37474F' }
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
    const count = currentDate.daysInMonth();
    return Array.from({ length: count }, (_, i) =>
      currentDate.clone().date(i + 1)
    );
  }, [currentDate]);

  const prevMonth = () => setCurrentDate((d) => d.clone().subtract(1, 'month'));
  const nextMonth = () => setCurrentDate((d) => d.clone().add(1, 'month'));

  const handlePickerChange = (date: Date | null) => {
    if (date) setCurrentDate(moment(date));
    setPickerOpen(false);
  };

  const handleAddRotaSuccess = (newRota: any) => {
    setRotas((prev) => [...prev, newRota]);
  };

  const handleUpdateRotaSuccess = (updatedRota: any) => {
    setRotas((prev) =>
      prev.map((r) => (r._id === updatedRota._id ? updatedRota : r))
    );
  };

  const handleDeleteRotaSuccess = (deletedRotaId: string) => {
    setRotas((prev) => prev.filter((r) => r._id !== deletedRotaId));
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

  // Flat ordered users list (for drag — we manage order ourselves, not groups)
  const orderedUsers = users;

  // Build a flat row index map so DraggableRow can reference the correct global index
  const userIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    orderedUsers.forEach((u, i) => {
      map[u._id] = i;
    });
    return map;
  }, [orderedUsers]);

  return (
    <DndProvider backend={HTML5Backend}>
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
        <div className="flex flex-none items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Staff Rota</h1>
          </div>

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
              className="h-8 w-8 rounded-full hover:bg-theme hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(-1)} variant="outline" className="h-9 gap-2">
              <MoveLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={() => setIsCopyRotaOpen(true)}
              variant="outline"
              className="h-9 gap-2 bg-emerald-800 text-white hover:bg-emerald-700 border-none"
            >
              <Copy className="h-4 w-4" /> Copy Rota
            </Button>
            <Button
              onClick={() => navigate('report')}
              variant="outline"
              className="h-9 gap-2 bg-purple-800 text-white hover:bg-purple-700 border-none"
            >
              <File className="h-4 w-4" /> Report
            </Button>
            <Button
              onClick={() => setIsBulkAssignOpen(true)}
              variant="outline"
              className="h-9 gap-2 bg-orange-800 text-white hover:bg-orange-700 border-none"
            >
              <Users className="h-4 w-4" /> Bulk Assign
            </Button>
            <Button onClick={() => setIsAddRotaOpen(true)} className="h-9 gap-2">
              <Plus className="h-4 w-4" /> Add Rota
            </Button>
          </div>
        </div>

        {/* ── Skipped Records Banner ── */}
        {skippedRecords.length > 0 && (
          <div className="relative mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <button
              onClick={() => setSkippedRecords([])}
              className="absolute right-3 top-3 text-amber-500 transition-colors hover:text-amber-700"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-900">
                  Action Completed with Warnings ({skippedRecords.length} shifts skipped)
                </h3>
                <p className="mb-3 mt-1 text-xs font-medium text-amber-700">
                  The following shifts were not created because the staff already had an assignment on those dates:
                </p>
                <div className="custom-scrollbar grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {skippedRecords.map((rec, idx) => (
                    <div key={idx} className="flex flex-col justify-center rounded-md border border-amber-100 bg-white p-2 shadow-sm">
                      <span className="truncate text-[13px] font-bold text-gray-800">
                        {rec.firstName} {rec.lastName}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                        {moment(rec.date).format('ddd, MMM DD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex h-[60vh] flex-1 items-center justify-center">
            <div className="flex h-[60vh] justify-center py-6">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar scrollbar-top-wrapper relative min-h-0 w-full flex-1 overflow-auto bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="sticky bottom-0 top-0 z-40 bg-gray-50">
                <tr>
                  <th className="sticky bottom-0 left-0 top-0 z-50 min-w-[160px] border-b border-r border-gray-200 bg-[#F8FAFC] p-4 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] sm:min-w-[240px]">
                    <span className="text-xs font-bold uppercase text-black">Staff Member</span>
                  </th>
                  {daysArray.map((day) => {
                    const isToday = day.isSame(moment(), 'day');
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    return (
                      <th
                        key={day.format('D')}
                        className={`min-w-[52px] border-b border-r border-gray-200 py-2 text-center
                          ${isToday ? 'bg-theme/50 text-white' : isWeekend ? 'bg-theme/5' : ''}
                        `}
                      >
                        <div className={`text-xs font-bold uppercase ${isWeekend ? 'text-black' : 'text-black'}`}>
                          {day.format('ddd')}
                        </div>
                        <div className={`text-sm font-black ${isToday ? 'mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-theme text-white' : 'text-black'}`}>
                          {day.format('D')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
                  <React.Fragment key={groupName}>
                    {groupUsers.map((user) => (
                      <DraggableRow
                        key={user._id}
                        user={user}
                        rowIndex={userIndexMap[user._id]}
                        moveRow={moveRow}
                        daysArray={daysArray}
                        rotaMap={rotaMap}
                        leaveTypeColors={leaveTypeColors}
                        handleCellClick={handleCellClick}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Dialogs & Sidebars ── */}
        <CreateRotaDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          employee={selectedContext.employee}
          date={selectedContext.date}
          companyId={companyId}
          onSuccess={handleAddRotaSuccess}
          companyColor={companyColor}
        />

        <EditRotaSidebar
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          rota={selectedRota}
          employee={selectedContext.employee}
          onSuccess={handleUpdateRotaSuccess}
          onDeleteSuccess={handleDeleteRotaSuccess}
          companyColor={companyColor}
        />

        <AddRotaDialog
          isOpen={isAddRotaOpen}
          onClose={() => setIsAddRotaOpen(false)}
          users={users}
          companyId={companyId}
          onSuccess={handleAddRotaSuccess}
          companyColor={companyColor}
        />

        <BulkAssignDialog
          isOpen={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          users={users}
          companyId={companyId}
          onSuccess={fetchUsersAndRotas}
          setGlobalSkippedRecords={setSkippedRecords}
          companyColor={companyColor}
        />

        <CopyRotaDialog
          isOpen={isCopyRotaOpen}
          onClose={() => setIsCopyRotaOpen(false)}
          companyId={companyId}
          onSuccess={fetchUsersAndRotas}
          setGlobalSkippedRecords={setSkippedRecords}
          companyColor={companyColor}
        />
      </div>
    </DndProvider>
  );
}