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
  Plus,
  MoveLeft,
  CalendarRange,
  X,
  GripVertical
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// react-dnd
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// ─── Types ────────────────────────────────────────────────────────────────────
type Department = {
  _id: string;
  departmentName: string;
  index: number;
  parentDepartmentId?: any;
};
type DepartmentWiseIndex = { departmentId: string; index: number };
type UserDepartment = { _id: string; departmentName: string };
type User = {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  image?: string;
  designationId?: { title: string };
  departmentId?: UserDepartment[];
  departmentWiseIndex?: DepartmentWiseIndex[];
  index?: number;
};

// Hierarchy grouping types
type DeptGroup = { department: Department; users: User[] };
type HierarchicalGroup = {
  parentGroup: DeptGroup;
  childrenGroups: DeptGroup[];
};

const DRAG_TYPE = 'ROW';
const DEPT_DRAG_TYPE = 'DEPARTMENT';
const CHILD_DEPT_DRAG_TYPE = 'CHILD_DEPARTMENT';

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

const getDeptIndex = (user: User, deptId: string): number => {
  const e = user.departmentWiseIndex?.find((d) => d.departmentId === deptId);
  return e?.index ?? 9999;
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
  if (!totalMinutes || totalMinutes === 0) return '0';
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// ─── ShiftBlock ───────────────────────────────────────────────────────────────
const ShiftBlock = ({
  text,
  title,
  colors
}: {
  text: string;
  title?: string;
  colors: 'theme' | { bg: string; border: string; text: string };
}) => {
  const isTheme = colors === 'theme';

  return (
    <div
      style={
        !isTheme
          ? {
              backgroundColor: (colors as any).bg,
              borderColor: (colors as any).border,
              color: (colors as any).text
            }
          : undefined
      }
      className={`
        group/shift relative mx-auto flex min-h-[30px] w-full min-w-[50px] cursor-pointer
        flex-col items-center justify-center rounded-md border p-1 shadow-sm
        transition-all duration-200 hover:scale-105 hover:brightness-105
        ${isTheme ? 'border-theme bg-theme text-white' : ''}
      `}
      title={title}
    >
      <div className="pointer-events-none absolute inset-0 rounded-md bg-white/40 opacity-0 transition-opacity group-hover/shift:opacity-100" />
      <span className="w-full truncate text-center text-[11px] font-bold leading-tight opacity-90">
        {text}
      </span>
    </div>
  );
};

// ─── Leave Type Colors ────────────────────────────────────────────────────────
const leaveTypeColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  DO: { bg: '#E0F7FA', border: '#B2EBF2', text: '#006064' },
  AL: { bg: '#93c47d', border: '#93c47d', text: '#ffffff' },
  S: { bg: '#ff0000', border: '#FFCDD2', text: '#ffffff' },
  ML: { bg: '#F3E5F5', border: '#E1BEE7', text: '#4A148C' },
  NT: { bg: '#ECEFF1', border: '#CFD8DC', text: '#37474F' }
};

// ─── DraggableRow ─────────────────────────────────────────────────────────────
interface DraggableRowProps {
  user: User;
  deptRowIndex: number;
  departmentId: string;
  moveRow: (
    departmentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  daysArray: moment.Moment[];
  rotaMap: Record<string, Record<string, any[]>>;
  employeeTotalDuration: Record<string, Record<string, number>>;
}

const DraggableRow: React.FC<DraggableRowProps> = ({
  user,
  deptRowIndex,
  departmentId,
  moveRow,
  daysArray,
  rotaMap,
  employeeTotalDuration
}) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DRAG_TYPE,
    item: { deptRowIndex, departmentId },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  const [{ isOver }, drop] = useDrop<
    { deptRowIndex: number; departmentId: string },
    void,
    { isOver: boolean }
  >({
    accept: DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current || item.departmentId !== departmentId) return;
      const dragIndex = item.deptRowIndex;
      const hoverIndex = deptRowIndex;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(departmentId, dragIndex, hoverIndex);
      item.deptRowIndex = hoverIndex;
    }
  });

  drop(dragPreview(ref));

  const totalMins = employeeTotalDuration[departmentId]?.[user._id] || 0;
  const totalLabel = formatDuration(totalMins);

  return (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/60 ${
        isDragging ? 'bg-blue-50 opacity-40' : ''
      } ${isOver ? 'bg-slate-100' : ''}`}
    >
      <td className="sticky left-0 z-20 border-b border-r border-gray-200 bg-white p-3 shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <div
            ref={drag as any}
            className="flex-shrink-0 cursor-grab text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Avatar className="h-9 w-9 flex-shrink-0 border border-gray-200">
            <AvatarImage
              src={user.image || '/placeholder.png'}
              alt={user.firstName || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-100 text-[11px] font-black text-black">
              {getInitials(user.firstName, user.lastName, user.name)}
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
              <div className="flex-shrink-0 rounded-md border border-theme bg-theme px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                Total: {totalLabel}
              </div>
            </div>
          </div>
        </div>
      </td>

      {daysArray.map((day, idx) => {
        const dateKey = day.format('YYYY-MM-DD');
        const dayRotas = (rotaMap[user._id]?.[dateKey] || []).filter(
          (r: any) =>
            (typeof r.departmentId === 'object'
              ? r.departmentId._id
              : r.departmentId) === departmentId
        );

        return (
          <td
            key={idx}
            className="group min-w-[65px] border-b border-r border-gray-200 p-1 text-center hover:bg-slate-100/80"
          >
            {dayRotas.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {(() => {
                  let totalDayMins = 0;
                  const tooltipArr: string[] = [];

                  dayRotas.forEach((r) => {
                    totalDayMins += calculateDurationMinutes(
                      r.startTime,
                      r.endTime,
                      r.leaveType
                    );
                    tooltipArr.push(
                      r.leaveType ||
                        r.shiftName ||
                        `${r.startTime} - ${r.endTime}`
                    );
                  });

                  const firstRota = dayRotas[0];
                  let shiftColors: any = 'theme';

                  if (
                    firstRota.leaveType &&
                    leaveTypeColors[firstRota.leaveType]
                  ) {
                    shiftColors = leaveTypeColors[firstRota.leaveType];
                  } else if (firstRota.color) {
                    shiftColors =
                      typeof firstRota.color === 'string'
                        ? {
                            bg: firstRota.color,
                            border: firstRota.color,
                            text: '#FFFFFF'
                          }
                        : firstRota.color;
                  }

                  const displayText = formatDuration(totalDayMins);

                  return (
                    <ShiftBlock
                      text={displayText}
                      title={tooltipArr.join(' | ')}
                      colors={shiftColors}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="mx-auto flex h-[30px] w-full min-w-[50px] items-center justify-center rounded-lg border border-dashed border-transparent text-gray-300 opacity-0 transition-all group-hover:border-gray-300 group-hover:bg-gray-50 group-hover:opacity-100">
                <Plus className="h-4 w-4" />
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
};

// ─── DraggableChildGroup ──────────────────────────────────────────────────────
interface DraggableChildGroupProps {
  childGroup: DeptGroup;
  childIndex: number;
  parentId: string;
  moveChildGroup: (
    parentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  daysArray: moment.Moment[];
  rotaMap: Record<string, Record<string, any[]>>;
  employeeTotalDuration: Record<string, Record<string, number>>;
  departmentTotalDuration: Record<string, number>;
  moveRow: (
    departmentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
}

const DraggableChildGroup: React.FC<DraggableChildGroupProps> = ({
  childGroup,
  childIndex,
  parentId,
  moveChildGroup,
  daysArray,
  rotaMap,
  employeeTotalDuration,
  departmentTotalDuration,
  moveRow
}) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: CHILD_DEPT_DRAG_TYPE,
    item: { childIndex, parentId },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  const [{ isOver }, drop] = useDrop({
    accept: CHILD_DEPT_DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item: any, monitor) {
      if (!ref.current) return;
      if (item.parentId !== parentId) return; // Prevent dragging out of parent

      const dragIndex = item.childIndex;
      const hoverIndex = childIndex;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveChildGroup(parentId, dragIndex, hoverIndex);
      item.childIndex = hoverIndex;
    }
  });

  drop(dragPreview(ref));

  const deptTotalMins = departmentTotalDuration[childGroup.department._id] || 0;

  return (
    <>
      <tr
        ref={ref}
        className={`border-b border-t border-gray-200 transition-colors ${isOver ? 'bg-blue-50/50' : 'bg-slate-50'} ${isDragging ? 'opacity-40' : ''}`}
      >
        <td className="sticky left-0 z-20 border-r border-gray-200 bg-inherit px-2 py-2 shadow-[2px_0_0_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pl-4">
            <div className="flex items-center gap-2">
              <div
                ref={drag as any}
                className="flex-shrink-0 cursor-grab text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
                title="Drag to reorder child department"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <span className="text-theme">└─</span>
              <span className="text-xs font-bold uppercase tracking-widest ">
                {childGroup.department.departmentName}
              </span>
            </div>
            <div className="rounded border border-theme/20 bg-theme/10 px-2 py-1 text-[11px] font-bold text-theme">
              Total: {formatDuration(deptTotalMins)}
            </div>
          </div>
        </td>
        {daysArray.map((_, i) => (
          <td key={i} className="border-r border-gray-200 bg-inherit" />
        ))}
      </tr>
      {childGroup.users.map((user, deptRowIndex) => (
        <DraggableRow
          key={`${childGroup.department._id}-${user._id}`}
          user={user}
          deptRowIndex={deptRowIndex}
          departmentId={childGroup.department._id}
          moveRow={moveRow}
          daysArray={daysArray}
          rotaMap={rotaMap}
          employeeTotalDuration={employeeTotalDuration}
        />
      ))}
    </>
  );
};

// ─── DraggableHierarchyBlock ──────────────────────────────────────────────────
interface DraggableHierarchyBlockProps {
  hierarchy: HierarchicalGroup;
  deptIndex: number;
  moveDepartment: (dragIndex: number, hoverIndex: number) => void;
  moveChildGroup: (
    parentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  daysArray: moment.Moment[];
  rotaMap: Record<string, Record<string, any[]>>;
  employeeTotalDuration: Record<string, Record<string, number>>;
  departmentTotalDuration: Record<string, number>;
  moveRow: (
    departmentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
}

const DraggableHierarchyBlock: React.FC<DraggableHierarchyBlockProps> = ({
  hierarchy,
  deptIndex,
  moveDepartment,
  moveChildGroup,
  daysArray,
  rotaMap,
  employeeTotalDuration,
  departmentTotalDuration,
  moveRow
}) => {
  const ref = useRef<HTMLTableSectionElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DEPT_DRAG_TYPE,
    item: { deptIndex, departmentId: hierarchy.parentGroup.department._id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  const isUnassigned = hierarchy.parentGroup.department._id === 'unassigned';

  const [{ isOver }, drop] = useDrop<
    { deptIndex: number; departmentId: string },
    void,
    { isOver: boolean }
  >({
    accept: DEPT_DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current || isUnassigned || item.departmentId === 'unassigned')
        return;
      const dragIndex = item.deptIndex;
      const hoverIndex = deptIndex;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveDepartment(dragIndex, hoverIndex);
      item.deptIndex = hoverIndex;
    }
  });

  drop(dragPreview(ref));

  const deptTotalMins =
    departmentTotalDuration[hierarchy.parentGroup.department._id] || 0;

  return (
    <tbody
      ref={ref}
      className={`transition-all ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* 1. Parent Header Row */}
      <tr
        className={`border-b border-t border-gray-300 transition-colors ${isOver && !isUnassigned ? 'bg-theme' : 'bg-slate-200'}`}
      >
        <td className="sticky left-0 z-20 border-r border-gray-200 bg-inherit px-4 py-2 shadow-[2px_0_0_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isUnassigned ? (
                <div
                  ref={drag as any}
                  className="flex-shrink-0 cursor-grab text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
                  title="Drag to reorder hierarchy group"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              ) : (
                <div className="w-4 flex-shrink-0" />
              )}
              <span className="text-xs font-extrabold uppercase tracking-widest ">
                {hierarchy.parentGroup.department.departmentName}
              </span>
            </div>
            {!isUnassigned && (
              <div className="rounded border border-theme/20 bg-theme/10 px-2 py-1 text-[11px] font-bold text-theme">
                Total: {formatDuration(deptTotalMins)}
              </div>
            )}
          </div>
        </td>
        {daysArray.map((_, i) => (
          <td key={i} className="border-r border-gray-200 bg-inherit" />
        ))}
      </tr>

      {/* 2. Parent Users */}
      {hierarchy.parentGroup.users.map((user, rowIdx) => (
        <DraggableRow
          key={`${hierarchy.parentGroup.department._id}-${user._id}`}
          user={user}
          deptRowIndex={rowIdx}
          departmentId={hierarchy.parentGroup.department._id}
          moveRow={moveRow}
          daysArray={daysArray}
          rotaMap={rotaMap}
          employeeTotalDuration={employeeTotalDuration}
        />
      ))}

      {/* 3. Children Headers and Users via Sub-Component */}
      {hierarchy.childrenGroups.map((childGroup, childIndex) => (
        <DraggableChildGroup
          key={childGroup.department._id}
          childGroup={childGroup}
          childIndex={childIndex}
          parentId={hierarchy.parentGroup.department._id}
          moveChildGroup={moveChildGroup}
          daysArray={daysArray}
          rotaMap={rotaMap}
          employeeTotalDuration={employeeTotalDuration}
          departmentTotalDuration={departmentTotalDuration}
          moveRow={moveRow}
        />
      ))}
    </tbody>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyRotaReport() {
  const { id: companyId } = useParams();
  const [currentDate, setCurrentDate] = useState(moment());
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rotas, setRotas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerAnchorRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Date range
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

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsersAndRotas = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const deptRes = await axiosInstance.get(
        `/hr/department?companyId=${companyId}&limit=all`
      );
      const fetchedDepts: Department[] =
        deptRes.data?.data?.result || deptRes.data?.data || [];
      setDepartments(
        [...fetchedDepts].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      );

      const userRes = await axiosInstance.get(
        `/users?limit=all&role=employee&company=${companyId}`
      );
      const fetchedUsers: User[] =
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

  // ── Derived Grouping Data ───────────────────────────────────────────────────
  const groupedByDepartment = useMemo(() => {
    const hierarchies: HierarchicalGroup[] = [];
    const getDeptUsers = (dept: Department) =>
      users
        .filter((u) =>
          u.departmentId?.some(
            (d: any) => (typeof d === 'object' ? d._id : d) === dept._id
          )
        )
        .sort((a, b) => getDeptIndex(a, dept._id) - getDeptIndex(b, dept._id));

    const allDeptIds = new Set(departments.map((d) => d._id));

    // Root departments
    const roots = departments
      .filter(
        (d) =>
          !d.parentDepartmentId ||
          !allDeptIds.has(d.parentDepartmentId?._id || d.parentDepartmentId)
      )
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    roots.forEach((root) => {
      const parentGroup = { department: root, users: getDeptUsers(root) };

      const children = departments
        .filter(
          (d) =>
            (d.parentDepartmentId?._id || d.parentDepartmentId) === root._id
        )
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      const childrenGroups = children
        .map((child) => ({
          department: child,
          users: getDeptUsers(child)
        }))
        .filter((c) => c.users.length > 0 || c.department); // Keep empty child departments so we can drag into them

      if (parentGroup.users.length > 0 || childrenGroups.length > 0) {
        hierarchies.push({ parentGroup, childrenGroups });
      }
    });

    const unassignedUsers = users.filter(
      (u) => !u.departmentId || u.departmentId.length === 0
    );
    if (unassignedUsers.length > 0) {
      hierarchies.push({
        parentGroup: {
          department: {
            _id: 'unassigned',
            departmentName: 'Unassigned',
            index: 9999
          } as any,
          users: unassignedUsers
        },
        childrenGroups: []
      });
    }

    return hierarchies;
  }, [departments, users]);

  const [orderedGroups, setOrderedGroups] = useState<HierarchicalGroup[]>([]);

  useEffect(() => {
    setOrderedGroups(groupedByDepartment);
  }, [groupedByDepartment]);

  // ── DND Logic ────────────────────────────────────────────────────────────────
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moveRow = useCallback(
    (departmentId: string, dragIndex: number, hoverIndex: number) => {
      setUsers((prev) => {
        const deptUsers = prev
          .filter((u) =>
            u.departmentId?.some(
              (d: any) => (typeof d === 'object' ? d._id : d) === departmentId
            )
          )
          .sort(
            (a, b) =>
              getDeptIndex(a, departmentId) - getDeptIndex(b, departmentId)
          );

        const reordered = [...deptUsers];
        const [removed] = reordered.splice(dragIndex, 1);
        reordered.splice(hoverIndex, 0, removed);

        const newIndexMap: Record<string, number> = {};
        reordered.forEach((u, i) => {
          newIndexMap[u._id] = i;
        });

        const updated = prev.map((u) => {
          if (newIndexMap[u._id] === undefined) return u;
          const newDWI = [...(u.departmentWiseIndex || [])];
          const ei = newDWI.findIndex((d) => d.departmentId === departmentId);
          if (ei >= 0)
            newDWI[ei] = { ...newDWI[ei], index: newIndexMap[u._id] };
          else newDWI.push({ departmentId, index: newIndexMap[u._id] });
          return { ...u, departmentWiseIndex: newDWI };
        });

        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(async () => {
          try {
            await Promise.all(
              Object.entries(newIndexMap).map(([userId]) => {
                const userObj = updated.find((u) => u._id === userId);
                return axiosInstance.patch(`/users/${userId}`, {
                  departmentWiseIndex: userObj?.departmentWiseIndex
                });
              })
            );
          } catch (e) {
            console.error('Failed to persist order', e);
          }
        }, 600);

        return updated;
      });
    },
    []
  );

  const deptPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moveDepartment = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setOrderedGroups((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(hoverIndex, 0, removed);

        if (deptPersistTimer.current) clearTimeout(deptPersistTimer.current);
        deptPersistTimer.current = setTimeout(async () => {
          try {
            await Promise.all(
              updated
                .filter((g) => g.parentGroup.department._id !== 'unassigned')
                .map((g, i) =>
                  axiosInstance.patch(
                    `/hr/department/${g.parentGroup.department._id}`,
                    {
                      index: i
                    }
                  )
                )
            );
          } catch (e) {
            console.error('Failed to persist department order', e);
          }
        }, 600);

        return updated;
      });
    },
    []
  );

  const childDeptPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const moveChildGroup = useCallback(
    (parentId: string, dragIndex: number, hoverIndex: number) => {
      setOrderedGroups((prev) => {
        const updated = [...prev];
        const parentIndex = updated.findIndex(
          (g) => g.parentGroup.department._id === parentId
        );

        if (parentIndex === -1) return prev;

        const newChildren = [...updated[parentIndex].childrenGroups];
        const [removed] = newChildren.splice(dragIndex, 1);
        newChildren.splice(hoverIndex, 0, removed);

        updated[parentIndex] = {
          ...updated[parentIndex],
          childrenGroups: newChildren
        };

        if (childDeptPersistTimer.current)
          clearTimeout(childDeptPersistTimer.current);
        childDeptPersistTimer.current = setTimeout(async () => {
          try {
            await Promise.all(
              newChildren.map((g, i) =>
                axiosInstance.patch(`/hr/department/${g.department._id}`, {
                  index: i
                })
              )
            );
          } catch (e) {
            toast({
              title: 'Failed to save child department order',
              variant: 'destructive'
            });
          }
        }, 600);

        return updated;
      });
    },
    [toast]
  );

  // ── Derived Mappings and Calculations ───────────────────────────────────────
  const { rotaMap, employeeTotalDuration, departmentTotalDuration } =
    useMemo(() => {
      const map: Record<string, Record<string, any[]>> = {};
      const empTotals: Record<string, Record<string, number>> = {};
      const deptTotals: Record<string, number> = {};

      rotas.forEach((rota) => {
        const empId =
          typeof rota.employeeId === 'object'
            ? rota.employeeId._id
            : rota.employeeId;
        const deptId =
          typeof rota.departmentId === 'object'
            ? rota.departmentId._id
            : rota.departmentId;
        const dateKey = moment(rota.startDate).format('YYYY-MM-DD');

        // Populate array map per day
        if (!map[empId]) map[empId] = {};
        if (!map[empId][dateKey]) map[empId][dateKey] = [];
        map[empId][dateKey].push(rota);

        // Populate Duration
        const mins = calculateDurationMinutes(
          rota.startTime,
          rota.endTime,
          rota.leaveType
        );

        if (!empTotals[deptId]) empTotals[deptId] = {};
        empTotals[deptId][empId] = (empTotals[deptId][empId] || 0) + mins;

        deptTotals[deptId] = (deptTotals[deptId] || 0) + mins;
      });

      return {
        rotaMap: map,
        employeeTotalDuration: empTotals,
        departmentTotalDuration: deptTotals
      };
    }, [rotas]);

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const prevMonth = () => setCurrentDate((d) => d.clone().subtract(1, 'month'));
  const nextMonth = () => setCurrentDate((d) => d.clone().add(1, 'month'));

  const handlePickerChange = (date: Date | null) => {
    if (date) setCurrentDate(moment(date));
    setPickerOpen(false);
  };

  const handleRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
  };

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
        <div className="mb-4 flex flex-none flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Rota Report</h1>
          </div>

          {/* Center: Unified Date Control */}
          <div className="flex items-center gap-2">
            {isCustomRange && !isCustomMode ? (
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

              {orderedGroups.map((hierarchy, deptIndex) => (
                <DraggableHierarchyBlock
                  key={hierarchy.parentGroup.department._id}
                  hierarchy={hierarchy}
                  deptIndex={deptIndex}
                  moveDepartment={moveDepartment}
                  moveChildGroup={moveChildGroup}
                  daysArray={daysArray}
                  rotaMap={rotaMap}
                  employeeTotalDuration={employeeTotalDuration}
                  departmentTotalDuration={departmentTotalDuration}
                  moveRow={moveRow}
                />
              ))}
            </table>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
