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
  Copy,
  Users,
  MoveLeft,
  AlertTriangle,
  X,
  File,
  GripVertical,
  CalendarRange,
  Send,
  Clock,
  CheckCircle2
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
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types
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
  designationId?: { _id: string; title: string }[] | { title: string };
  index?: number;
  departmentId?: UserDepartment[];
  departmentWiseIndex?: DepartmentWiseIndex[];
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

const getDesignationTitle = (d: User['designationId']): string => {
  if (!d) return '';
  if (Array.isArray(d)) {
    return d
      .map((item) => item?.title)
      .filter(Boolean)
      .join(', ');
  }
  return (d as { title: string }).title || '';
};

const getDeptIndex = (user: User, deptId: string): number => {
  const e = user.departmentWiseIndex?.find((d) => d.departmentId === deptId);
  return e?.index ?? 9999;
};

// ShiftBlock
interface TimeSlot {
  startTime?: string;
  endTime?: string;
}

const ShiftBlock = ({
  leaveType,
  shiftName,
  startTime,
  endTime,
  colors,
  extraSlots,
  isPending
}: {
  leaveType?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  colors: 'theme' | { bg: string; border: string; text: string };
  extraSlots?: TimeSlot[];
  isPending?: boolean;
}) => {
  const title = leaveType || shiftName || '';
  const isTheme = colors === 'theme';
  const allSlots: TimeSlot[] = [];
  if (!leaveType) {
    allSlots.push({ startTime, endTime });
    if (extraSlots) allSlots.push(...extraSlots);
  }

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
      className={`group/shift relative mx-auto flex min-h-[44px] w-full min-w-[50px] cursor-pointer flex-col items-center justify-center rounded-md border p-1 shadow-sm transition-all duration-200 hover:scale-105 hover:brightness-105 ${isTheme ? 'border-theme bg-theme text-white' : ''} ${isPending ? 'opacity-80' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-md bg-white/40 opacity-0 transition-opacity group-hover/shift:opacity-100" />
      {/* Pending indicator */}
      {isPending && (
        <div
          className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow"
          title="Pending – not yet published"
        >
          <Clock className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      <span className="text-md w-full truncate text-center font-bold uppercase leading-tight tracking-widest">
        {title}
      </span>
      {allSlots.map(
        (slot, i) =>
          slot.startTime &&
          slot.endTime && (
            <span
              key={i}
              className="mt-0.5 w-full truncate text-center text-xs font-semibold leading-tight tracking-wide opacity-90"
            >
              {slot.startTime}–{slot.endTime}
            </span>
          )
      )}
    </div>
  );
};

// PublishRotaModal
interface PublishRotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysArray: moment.Moment[];
  rotas: any[];
  companyId: string | undefined;
  onPublishSuccess: (publishedIds: string[]) => void;
}

const PublishRotaModal: React.FC<PublishRotaModalProps> = ({
  isOpen,
  onClose,
  daysArray,
  rotas,
  companyId,
  onPublishSuccess
}) => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const pendingByDate = useMemo(() => {
    const map: Record<string, number> = {};
    rotas.forEach((r) => {
      if (r.status === 'pending') {
        const key = moment(r.startDate).format('YYYY-MM-DD');
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [rotas]);

  const datesWithPending = useMemo(
    () => daysArray.filter((d) => pendingByDate[d.format('YYYY-MM-DD')] > 0),
    [daysArray, pendingByDate]
  );

  const toggleDate = (dateKey: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateKey)
        ? prev.filter((d) => d !== dateKey)
        : [...prev, dateKey]
    );
  };

  const selectAll = () =>
    setSelectedDates(datesWithPending.map((d) => d.format('YYYY-MM-DD')));
  const clearAll = () => setSelectedDates([]);

  const totalToPublish = useMemo(
    () => selectedDates.reduce((sum, d) => sum + (pendingByDate[d] || 0), 0),
    [selectedDates, pendingByDate]
  );

  const handlePublish = async () => {
    if (!selectedDates.length) return;
    setIsPublishing(true);
    try {
      const rotasToPublish = rotas.filter(
        (r) =>
          r.status === 'pending' &&
          selectedDates.includes(moment(r.startDate).format('YYYY-MM-DD'))
      );
      await Promise.all(
        rotasToPublish.map((r) =>
          axiosInstance.patch(`/rota/${r._id}`, { status: 'publish' })
        )
      );
      onPublishSuccess(rotasToPublish.map((r) => r._id));
      toast({
        title: `${selectedDates.length} day${selectedDates.length !== 1 ? 's' : ''} rota published successfully`
      });
      setSelectedDates([]);
      onClose();
    } catch (e) {
      toast({ title: 'Failed to publish rotas', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) setSelectedDates([]);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-7xl rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Send className="h-4 w-4 text-theme" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                Publish Rota
              </h2>
              <p className="text-xs text-gray-500">
                Select dates to make rotas visible to staff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {datesWithPending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-400" />
            <p className="text-sm font-semibold text-gray-600">
              All rotas are already published!
            </p>
            <p className="mt-1 text-xs text-gray-400">
              There are no pending rotas in the current view.
            </p>
          </div>
        ) : (
          <>
            {/* Select all / clear */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Dates with pending rotas
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-semibold text-theme hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Date list */}
            <div className="custom-scrollbar max-h-[80vh] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
                {datesWithPending.map((day) => {
                  const key = day.format('YYYY-MM-DD');
                  const count = pendingByDate[key] || 0;
                  const isSelected = selectedDates.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleDate(key)}
                      className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-gray-800">
                        {day.format('ddd, DD MMM')}
                      </span>
                      <span
                        className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${
                          isSelected ? 'text-theme' : 'text-amber-500'
                        }`}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        pending
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {selectedDates.length > 0 ? (
                  <>
                    <span className="font-bold text-gray-800">
                      {selectedDates.length}
                    </span>{' '}
                    days rota
                    {totalToPublish !== 1 ? 's' : ''} will be published
                  </>
                ) : (
                  'No dates selected'
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="h-9">
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!selectedDates.length || isPublishing}
                  className="h-9 gap-2 bg-theme text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <BlinkingDots size="small" color="bg-white" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// DraggableRow
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
  leaveTypeColors: Record<string, { bg: string; border: string; text: string }>;
  handleCellClick: (
    user: User,
    day: moment.Moment,
    departmentId: string
  ) => void;
  pendingDates: Set<string>;
}

const DraggableRow: React.FC<DraggableRowProps> = ({
  user,
  deptRowIndex,
  departmentId,
  moveRow,
  daysArray,
  rotaMap,
  leaveTypeColors,
  handleCellClick,
  pendingDates
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

  return (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/60 ${isDragging ? 'bg-blue-50 opacity-40' : ''} ${isOver ? 'bg-slate-100' : ''}`}
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
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">
              {user.firstName
                ? `${user.firstName} ${user.lastName}`
                : user.name}
            </p>
            <p className="text-[10px] font-medium text-gray-500">
              {getDesignationTitle(user.designationId)}
            </p>
          </div>
        </div>
      </td>
      {daysArray.map((day, idx) => {
        const dateKey = day.format('YYYY-MM-DD');
        const rotaList = (rotaMap[user._id]?.[dateKey] || []).filter(
          (r: any) =>
            (typeof r.departmentId === 'object'
              ? r.departmentId._id
              : r.departmentId) === departmentId
        );

        const hasPendingCol = pendingDates.has(dateKey);

        return (
          <td
            key={idx}
            onClick={() => handleCellClick(user, day, departmentId)}
            className={`group min-w-[65px] cursor-pointer border-b border-r border-gray-200 p-1 text-center hover:bg-amber-100/60 ${hasPendingCol ? 'bg-amber-50' : 'hover:bg-slate-100/80'}`}
          >
            {rotaList.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {(() => {
                  const firstRota = rotaList[0];
                  const extraSlots = rotaList.slice(1).map((r: any) => ({
                    startTime: r.startTime,
                    endTime: r.endTime
                  }));
                  let shiftColors: any = 'theme';
                  if (
                    firstRota.leaveType &&
                    leaveTypeColors[firstRota.leaveType]
                  )
                    shiftColors = leaveTypeColors[firstRota.leaveType];
                  else if (firstRota.color)
                    shiftColors =
                      typeof firstRota.color === 'string'
                        ? {
                            bg: firstRota.color,
                            border: firstRota.color,
                            text: '#FFFFFF'
                          }
                        : firstRota.color;
                  return (
                    <ShiftBlock
                      key={firstRota._id}
                      leaveType={firstRota.leaveType}
                      shiftName={firstRota.shiftName}
                      startTime={firstRota.startTime}
                      endTime={firstRota.endTime}
                      colors={shiftColors}
                      extraSlots={extraSlots}
                      isPending={firstRota.status === 'pending'}
                    />
                  );
                })()}
              </div>
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

// DraggableChildGroup
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
  leaveTypeColors: Record<string, { bg: string; border: string; text: string }>;
  moveRow: (
    departmentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  handleCellClick: (
    user: User,
    day: moment.Moment,
    departmentId: string
  ) => void;
  pendingDates: Set<string>;
}

const DraggableChildGroup: React.FC<DraggableChildGroupProps> = ({
  childGroup,
  childIndex,
  parentId,
  moveChildGroup,
  daysArray,
  rotaMap,
  leaveTypeColors,
  moveRow,
  handleCellClick,
  pendingDates
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
      if (item.parentId !== parentId) return;
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

  return (
    <>
      <tr
        ref={ref}
        className={`border-b border-t border-gray-200 transition-colors ${isOver ? 'bg-[#d3eae4]' : 'bg-[#d3eae4]'} ${isDragging ? 'opacity-40' : ''}`}
      >
        <td className="sticky left-0 z-20 border-r border-gray-200 bg-inherit px-2 py-2 shadow-[2px_0_0_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 pl-4">
            <div
              ref={drag as any}
              className="flex-shrink-0 cursor-grab text-slate-400 transition-colors hover:text-slate-600 active:cursor-grabbing"
              title="Drag to reorder child department"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="text-bold text-theme">└─</span>
            <span className="text-xs font-bold uppercase tracking-widest">
              {childGroup.department.departmentName}
            </span>
          </div>
        </td>
        {daysArray.map((_, i) => (
          <td key={i} className="border-r border-gray-200 bg-inherit" />
        ))}
      </tr>
      {childGroup.users.map((user, rowIdx) => (
        <DraggableRow
          key={`${childGroup.department._id}-${user._id}`}
          user={user}
          deptRowIndex={rowIdx}
          departmentId={childGroup.department._id}
          moveRow={moveRow}
          daysArray={daysArray}
          rotaMap={rotaMap}
          leaveTypeColors={leaveTypeColors}
          handleCellClick={handleCellClick}
          pendingDates={pendingDates}
        />
      ))}
    </>
  );
};

// DraggableHierarchyBlock
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
  leaveTypeColors: Record<string, { bg: string; border: string; text: string }>;
  moveRow: (
    departmentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  handleCellClick: (
    user: User,
    day: moment.Moment,
    departmentId: string
  ) => void;
  pendingDates: Set<string>;
}

const DraggableHierarchyBlock: React.FC<DraggableHierarchyBlockProps> = ({
  hierarchy,
  deptIndex,
  moveDepartment,
  moveChildGroup,
  daysArray,
  rotaMap,
  leaveTypeColors,
  moveRow,
  handleCellClick,
  pendingDates
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

  return (
    <tbody
      ref={ref}
      className={`transition-all ${isDragging ? 'opacity-40' : ''}`}
    >
      <tr
        className={`border-b border-t border-gray-300 transition-colors ${isOver && !isUnassigned ? 'bg-theme' : 'bg-slate-200'}`}
      >
        <td className="sticky left-0 z-20 border-r border-gray-200 bg-inherit px-4 py-2 shadow-[2px_0_0_0_rgba(0,0,0,0.04)]">
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
            <span className="text-xs font-extrabold uppercase tracking-widest">
              {hierarchy.parentGroup.department.departmentName}
            </span>
          </div>
        </td>
        {daysArray.map((_, i) => (
          <td key={i} className="border-r border-gray-200 bg-inherit" />
        ))}
      </tr>

      {hierarchy.parentGroup.users.map((user, rowIdx) => (
        <DraggableRow
          key={`${hierarchy.parentGroup.department._id}-${user._id}`}
          user={user}
          deptRowIndex={rowIdx}
          departmentId={hierarchy.parentGroup.department._id}
          moveRow={moveRow}
          daysArray={daysArray}
          rotaMap={rotaMap}
          leaveTypeColors={leaveTypeColors}
          handleCellClick={handleCellClick}
          pendingDates={pendingDates}
        />
      ))}

      {hierarchy.childrenGroups.map((childGroup, childIndex) => (
        <DraggableChildGroup
          key={childGroup.department._id}
          childGroup={childGroup}
          childIndex={childIndex}
          parentId={hierarchy.parentGroup.department._id}
          moveChildGroup={moveChildGroup}
          daysArray={daysArray}
          rotaMap={rotaMap}
          leaveTypeColors={leaveTypeColors}
          moveRow={moveRow}
          handleCellClick={handleCellClick}
          pendingDates={pendingDates}
        />
      ))}
    </tbody>
  );
};

// Main Component
export default function CompanyRota() {
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    employee: User | null;
    date: any;
    departmentId: string | null;
  }>({ employee: null, date: null, departmentId: null });
  const [selectedRota, setSelectedRota] = useState<any>(null);
  const [skippedRecords, setSkippedRecords] = useState<any[]>([]);
  const [isAddRotaOpen, setIsAddRotaOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isCopyRotaOpen, setIsCopyRotaOpen] = useState(false);
  const [companyColor, setCompanyColor] = useState(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

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

  const fetchUsersAndRotas = useCallback(
    async (isInitial = false) => {
      if (!companyId) return;
      if (isInitial) setIsLoading(true);
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
        setRotas(rotaRes.data?.data?.result || rotaRes.data?.data || []);

        const companyRes = await axiosInstance.get(`/users/${companyId}`);
        setCompanyColor(companyRes.data?.data?.themeColor);
      } catch (err: any) {
        console.error('Error:', err);
        toast({ title: 'Failed to fetch data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, currentDate, toast]
  );

  useEffect(() => {
    fetchUsersAndRotas(true);
  }, [companyId, currentDate]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moveRow = useCallback(
    (departmentId: string, dragIndex: number, hoverIndex: number) => {
      setUsers((prev) => {
        const deptUsers = prev
          .filter((u) => u.departmentId?.some((d) => d._id === departmentId))
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
            toast({ title: 'Failed to save order', variant: 'destructive' });
          }
        }, 600);

        return updated;
      });
    },
    [toast]
  );
  const publishedDates = useMemo(() => {
    const s = new Set<string>();
    rotas.forEach((r) => {
      if (r.status === 'publish') {
        s.add(moment(r.startDate).format('YYYY-MM-DD'));
      }
    });
    return s;
  }, [rotas]);

  const rotaMap = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    rotas.forEach((rota) => {
      const empId =
        typeof rota.employeeId === 'object'
          ? rota.employeeId._id
          : rota.employeeId;
      const dateKey = moment(rota.startDate).format('YYYY-MM-DD');
      if (!map[empId]) map[empId] = {};
      if (!map[empId][dateKey]) map[empId][dateKey] = [];
      map[empId][dateKey].push(rota);
    });
    return map;
  }, [rotas]);

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

  // Count pending rotas in the current view
  const pendingRotasCount = useMemo(
    () => rotas.filter((r) => r.status === 'pending').length,
    [rotas]
  );

  // Set of date keys (YYYY-MM-DD) that have at least one pending rota
  const pendingDates = useMemo(() => {
    const s = new Set<string>();
    rotas.forEach((r) => {
      if (r.status === 'pending')
        s.add(moment(r.startDate).format('YYYY-MM-DD'));
    });
    return s;
  }, [rotas]);

  const groupedByDepartment = useMemo(() => {
    const hierarchies: HierarchicalGroup[] = [];
    const getDeptUsers = (dept: Department) =>
      users
        .filter((u) => u.departmentId?.some((d) => d._id === dept._id))
        .sort((a, b) => getDeptIndex(a, dept._id) - getDeptIndex(b, dept._id));

    const allDeptIds = new Set(departments.map((d) => d._id));

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
        .filter((c) => c.users.length > 0);

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

  const deptPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const childDeptPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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
                    { index: i }
                  )
                )
            );
          } catch (e) {
            toast({
              title: 'Failed to save department order',
              variant: 'destructive'
            });
          }
        }, 600);

        return updated;
      });
    },
    [toast]
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

  const handleAddRotaSuccess = (newRota: any) => {
    if (Array.isArray(newRota)) setRotas((p) => [...p, ...newRota]);
    else setRotas((p) => [...p, newRota]);
  };

  const handleUpdateRotaSuccess = (updatedRota: any) => {
    setRotas((prev) => {
      const updatedArray = Array.isArray(updatedRota)
        ? updatedRota
        : [updatedRota];
      let newRotas = [...prev];
      updatedArray.forEach((updatedItem) => {
        const index = newRotas.findIndex((r) => r._id === updatedItem._id);
        if (index !== -1) newRotas[index] = updatedItem;
        else newRotas.push(updatedItem);
      });
      return newRotas;
    });
  };

  const handleDeleteRotaSuccess = (deletedRotaId: string) =>
    setRotas((p) => p.filter((r) => r._id !== deletedRotaId));

  const handleCellClick = (
    user: User,
    day: moment.Moment,
    departmentId: string
  ) => {
    const dateKey = day.format('YYYY-MM-DD');
    const existingRotas = (rotaMap[user._id]?.[dateKey] || []).filter(
      (r: any) =>
        (typeof r.departmentId === 'object'
          ? r.departmentId._id
          : r.departmentId) === departmentId
    );
    setSelectedContext({ employee: user, date: day, departmentId });
    if (existingRotas && existingRotas.length > 0) {
      setSelectedRota(existingRotas);
      setIsEditOpen(true);
    } else setIsCreateOpen(true);
  };

  // Handle successful publish: update local rota statuses
  const handlePublishSuccess = (publishedIds: string[]) => {
    setRotas((prev) =>
      prev.map((r) =>
        publishedIds.includes(r._id) ? { ...r, status: 'publish' } : r
      )
    );
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

        {/* Header */}
        <div className="flex flex-none items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Staff Rota</h1>
          </div>
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
                  className="flex h-7 items-center gap-1 rounded-full bg-theme px-3 text-[11px] font-bold text-white transition-all hover:bg-theme/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="ml-1 flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-500 shadow-sm transition-all hover:border-theme hover:bg-theme/5 hover:text-theme"
                >
                  <CalendarRange className="h-3 w-3" />
                  Custom
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="h-9 gap-2"
            >
              <MoveLeft className="h-4 w-4" /> Back
            </Button>
            {/* Pending helper text + publish button */}

            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-amber-700">
                Pending Rota
              </span>
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
            </div>

            {/* {pendingRotasCount > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">
                  {pendingRotasCount} rota{pendingRotasCount !== 1 ? 's' : ''} pending
                </span>
              </div>
            )} */}
            <Button
              onClick={() => setIsPublishOpen(true)}
              variant="outline"
              className="h-9 gap-2 border-none bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" /> Publish Rota
            </Button>

            <Button
              onClick={() => setIsCopyRotaOpen(true)}
              variant="outline"
              className="h-9 gap-2 border-none bg-emerald-800 text-white hover:bg-emerald-700"
            >
              <Copy className="h-4 w-4" /> Copy Rota
            </Button>
            <Button
              onClick={() => navigate('report')}
              variant="outline"
              className="h-9 gap-2 border-none bg-purple-800 text-white hover:bg-purple-700"
            >
              <File className="h-4 w-4" /> Report
            </Button>
            <Button
              onClick={() => setIsBulkAssignOpen(true)}
              variant="outline"
              className="h-9 gap-2 border-none bg-orange-800 text-white hover:bg-orange-700"
            >
              <Users className="h-4 w-4" /> Bulk Assign
            </Button>
            <Button
              onClick={() => setIsAddRotaOpen(true)}
              className="h-9 gap-2"
            >
              <Plus className="h-4 w-4" /> Add Rota
            </Button>
          </div>
        </div>

        {/* Skipped Records Banner */}
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
                  Action Completed with Warnings ({skippedRecords.length} shifts
                  skipped)
                </h3>
                <p className="mb-3 mt-1 text-xs font-medium text-amber-700">
                  The following shifts were not created because the staff
                  already had an assignment on those dates:
                </p>
                <div className="custom-scrollbar grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {skippedRecords.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-center rounded-md border border-amber-100 bg-white p-2 shadow-sm"
                    >
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

        {/* Table */}
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
                    <span className="text-xs font-bold uppercase text-black">
                      Staff Member
                    </span>
                  </th>
                  {daysArray.map((day) => {
                    const isToday = day.isSame(moment(), 'day');
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    const isPendingCol = pendingDates.has(
                      day.format('YYYY-MM-DD')
                    );
                    return (
                      <th
                        key={day.format('D')}
                        className={`min-w-[52px] border-b border-r border-gray-200 py-2 text-center ${isToday ? 'bg-theme/50 text-white' : isPendingCol ? 'bg-amber-100' : isWeekend ? 'bg-theme/5' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="text-xs font-bold uppercase text-black">
                            {day.format('ddd')}
                          </div>
                          <div
                            className={`text-sm font-black ${isToday ? 'mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-theme text-white' : 'text-black'}`}
                          >
                            {day.format('D')}
                          </div>
                          {isPendingCol && !isToday && (
                            <Clock className="h-2.5 w-2.5 text-amber-500" />
                          )}
                        </div>
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
                  leaveTypeColors={leaveTypeColors}
                  moveRow={moveRow}
                  handleCellClick={handleCellClick}
                  pendingDates={pendingDates}
                />
              ))}
            </table>
          </div>
        )}

        {/* Dialogs */}
        <CreateRotaDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          employee={selectedContext.employee}
          date={selectedContext.date}
          companyId={companyId}
          onSuccess={handleAddRotaSuccess}
          companyColor={companyColor}
          departments={departments}
          preselectedDepartmentId={selectedContext.departmentId}
          publishedDates={publishedDates}
        />
        <EditRotaSidebar
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          rota={selectedRota}
          employee={selectedContext.employee}
          onSuccess={handleUpdateRotaSuccess}
          onDeleteSuccess={handleDeleteRotaSuccess}
          companyColor={companyColor}
          publishedDates={publishedDates}
        />
        <AddRotaDialog
          isOpen={isAddRotaOpen}
          onClose={() => setIsAddRotaOpen(false)}
          users={users}
          companyId={companyId}
          onSuccess={handleAddRotaSuccess}
          companyColor={companyColor}
          departments={departments}
          publishedDates={publishedDates}
        />
        <BulkAssignDialog
          isOpen={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          users={users}
          companyId={companyId}
          onSuccess={fetchUsersAndRotas}
          setGlobalSkippedRecords={setSkippedRecords}
          companyColor={companyColor}
          departments={departments}
        />
        <CopyRotaDialog
          isOpen={isCopyRotaOpen}
          onClose={() => setIsCopyRotaOpen(false)}
          companyId={companyId}
          onSuccess={fetchUsersAndRotas}
          setGlobalSkippedRecords={setSkippedRecords}
          companyColor={companyColor}
        />
        <PublishRotaModal
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          daysArray={daysArray}
          rotas={rotas}
          companyId={companyId}
          onPublishSuccess={handlePublishSuccess}
        />
      </div>
    </DndProvider>
  );
}
