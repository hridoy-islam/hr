import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  User,
  X
} from 'lucide-react';
import { employees } from '@/data/plannerData';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';

// Mock Service User
export const serviceUser = {
  id: '1',
  name: 'Avis, Louise',
  initials: 'LA',
  type: 'Individual',
  care: 'Everycare Romford, Care',
  address: '123 Care Lane, Romford, RM1 4AB',
  contact: '01234 567890',
  carePlan: 'Standard care package with daily visits'
};

// Mock Tasks for the past and coming 7 days
export const tasks = [
  {
    id: '1',
    title: 'Morning Care',
    startTime: '08:00',
    endTime: '09:00',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Personal Care',
    status: 'allocated',
    color: 'bg-blue-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Assist with morning routine and medication'
  },
  {
    id: '2',
    title: 'Care-Lunch',
    startTime: '12:00',
    endTime: '13:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Meal Assistance',
    status: 'allocated',
    color: 'bg-green-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Prepare lunch and ensure hydration'
  },
  {
    id: '3',
    title: 'Evening Care',
    startTime: '18:00',
    endTime: '19:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Personal Care',
    status: 'unallocated',
    color: 'bg-red-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Assist with evening routine and bedtime preparation'
  },
  {
    id: '4',
    title: 'Medication Check',
    startTime: '10:00',
    endTime: '10:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Medication',
    status: 'allocated',
    color: 'bg-purple-400',
    date: moment().subtract(1, 'day').format('YYYY-MM-DD'),
    notes: 'Morning medication administration'
  },
  {
    id: '5',
    title: 'Shopping Assistance',
    startTime: '14:00',
    endTime: '16:00',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Shopping',
    status: 'allocated',
    color: 'bg-yellow-400',
    date: moment().subtract(2, 'days').format('YYYY-MM-DD'),
    notes: 'Weekly grocery shopping'
  },
  {
    id: '6',
    title: 'Doctor Appointment',
    startTime: '09:30',
    endTime: '11:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Transport',
    status: 'allocated',
    color: 'bg-indigo-400',
    date: moment().subtract(3, 'days').format('YYYY-MM-DD'),
    notes: 'Transport to GP clinic'
  },
  {
    id: '7',
    title: 'Social Visit',
    startTime: '15:00',
    endTime: '17:00',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Companionship',
    status: 'unallocated',
    color: 'bg-pink-400',
    date: moment().subtract(4, 'days').format('YYYY-MM-DD'),
    notes: 'Social interaction and activities'
  },
  {
    id: '8',
    title: 'Weekend Check-in',
    startTime: '10:00',
    endTime: '11:00',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Wellbeing Check',
    status: 'allocated',
    color: 'bg-teal-400',
    date: moment().subtract(5, 'days').format('YYYY-MM-DD'),
    notes: 'Weekend wellbeing assessment'
  }
];

// Day Stats - summarize task counts over the last 7 days
export const dayStats = Array.from({ length: 7 }, (_, i) => {
  const date = moment().subtract(i, 'days');
  const formattedDate = date.format('YYYY-MM-DD');
  const dayTasks = tasks.filter((task) => task.date === formattedDate);

  return {
    date: date.format('DD/MM'),
    day: date.format('ddd'),
    allocated: dayTasks.filter((t) => t.status === 'allocated').length,
    unallocated: dayTasks.filter((t) => t.status === 'unallocated').length,
    total: dayTasks.length
  };
}).reverse(); // optional: keep order from oldest to newest

export function Timeline({
  selectedUser,
  tasks,
  zoomLevel,
  contentRef,
  selectedDate
}) {
  const SLOT_WIDTH = zoomLevel * 2;
  const userListRef = useRef<HTMLDivElement>(null);
  const isUserScroll = useRef(false);
  const isContentScroll = useRef(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate time slots (always 24 hours)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });
  }, []);

  // Generate past 7 days for selected user view
  const past7Days = useMemo(() => {
    const days = [];
    // Use selectedDate instead of today
    const baseDate = selectedDate ? moment(selectedDate) : moment();

    for (let i = 6; i >= 0; i--) {
      const date = baseDate.clone().subtract(i, 'days');
      days.push({
        date: date.format('YYYY-MM-DD'),
        displayDate: date.format('ddd DD/MM'),
        fullDate: date.format('dddd DD/MM/YYYY'),
        isToday: date.isSame(moment(), 'day') // Check if this day is actually today
      });
    }
    return days;
  }, [selectedDate]);

  // Get task position for daily view (hours)
  const getTaskPosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const startPosition = (startTotalMinutes / 60) * SLOT_WIDTH;
    const duration = ((endTotalMinutes - startTotalMinutes) / 60) * SLOT_WIDTH;

    return { left: `${startPosition}rem`, width: `${duration}rem` };
  };

  // Get filtered tasks for selected user in the past 7 days
  const filteredTasks = useMemo(() => {
    const sevenDaysAgo = moment().subtract(7, 'days').startOf('day');
    return tasks.filter((task) => {
      const taskDate = moment(
        task.date || moment().format('YYYY-MM-DD'),
        'YYYY-MM-DD'
      );
      return (
        task.assigneeId === selectedUser?.id &&
        taskDate.isSameOrAfter(sevenDaysAgo)
      );
    });
  }, [tasks, selectedUser]);

  // Helper to calculate duration in minutes from startTime and endTime strings like '08:00'
  function getDurationMinutes(startTime: string, endTime: string) {
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    if (end.isBefore(start)) {
      end.add(1, 'day');
    }
    return moment.duration(end.diff(start)).asMinutes();
  }

  const totalMinutes = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      return acc + getDurationMinutes(task.startTime, task.endTime);
    }, 0);
  }, [filteredTasks]);

  const allocatedMinutes = useMemo(() => {
    return filteredTasks
      .filter((task) => task.status === 'allocated')
      .reduce((acc, task) => {
        return acc + getDurationMinutes(task.startTime, task.endTime);
      }, 0);
  }, [filteredTasks]);

  const unallocatedMinutes = totalMinutes - allocatedMinutes;

  // Format minutes to 'HHhrs MMmin'
  function formatDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs.toString().padStart(2, '0')}hrs ${mins
      .toString()
      .padStart(2, '0')}min`;
  }

  return (
    <div className="flex w-full flex-col overflow-hidden">
      {/* Header Info */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <Calendar className="h-3 w-3" />
              {selectedUser?.name} - Past 7 Days
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Total: {formatDuration(totalMinutes)} | Unallocated:{' '}
            {formatDuration(unallocatedMinutes)} | Allocated:{' '}
            {formatDuration(allocatedMinutes)}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Date Column */}
        <div className="flex w-20 flex-shrink-0 flex-col border-r border-gray-200 bg-white sm:w-48">
          <div className="flex h-8 flex-shrink-0 items-center justify-center border-b border-gray-200 bg-gray-50">
            <span className="text-xs font-medium text-gray-600">Days</span>
          </div>

          <div ref={userListRef} className="overflow-y-auto">
            {past7Days.map((day, index) => {
              const dayTasks = filteredTasks.filter(
                (task) =>
                  (task.date || moment().format('YYYY-MM-DD')) === day.date
              );

              return (
                <div
                  key={day.date}
                  className={`flex h-10 items-center gap-2 p-1 sm:h-12 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } ${day.isToday ? 'bg-blue-50 ring-1 ring-blue-200' : ''} rounded-md`}
                >
                  {/* Date indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        day.isToday
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {moment(day.date).format('DD')}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        day.isToday ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {day.displayDate}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">
                        {day.isToday ? 'Today' : moment(day.date).fromNow()}
                      </p>
                      {dayTasks.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Timeline Content */}
        <div
          className="flex-1 overflow-auto"
          ref={contentRef}
          style={{ overflowY: 'auto' }}
        >
          {/* Time Header */}
          <div
            className="sticky top-0 z-50 border-b border-gray-200 bg-white"
            style={{ width: `${timeSlots.length * SLOT_WIDTH}rem` }}
          >
            <div
              className="flex"
              style={{ width: `${timeSlots.length * SLOT_WIDTH}rem` }}
            >
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 border-l border-gray-200 py-2 text-center text-xs text-gray-500"
                  style={{ width: `${SLOT_WIDTH}rem` }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Rows with Tasks */}
          <div
            className="divide-y divide-gray-200"
            style={{ width: `${timeSlots.length * SLOT_WIDTH}rem` }}
          >
            {past7Days.map((day, index) => (
              <div
                key={day.date}
                className={`relative h-10 sm:h-12 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } ${day.isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Grid Lines */}
                <div className="pointer-events-none absolute inset-0 flex">
                  {timeSlots.map((time, timeIndex) => (
                    <div
                      key={timeIndex}
                      className={`h-full border-l ${
                        day.isToday ? 'border-blue-200' : 'border-gray-200'
                      }`}
                      style={{ width: `${SLOT_WIDTH}rem` }}
                    />
                  ))}
                </div>

                {/* Tasks for this day */}
                {filteredTasks
                  .filter(
                    (task) =>
                      (task.date || moment().format('YYYY-MM-DD')) === day.date
                  )
                  .map((task) => {
                    const position = getTaskPosition(
                      task.startTime,
                      task.endTime
                    );

                    return (
                      <ContextMenu key={task.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            onContextMenu={(e) => e.stopPropagation()} // optional safeguard
                            className={`absolute top-1 h-6 shadow-lg sm:h-10 ${task.color} z-20 cursor-pointer truncate rounded p-1 text-xs text-white transition-all hover:opacity-80 hover:shadow-xl`}
                            style={position}
                            onClick={() => {
                              setSelectedTask(task);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <div className="truncate text-xs font-medium">
                                    {task.startTime}-{task.endTime}
                                  </div>
                                  <div className="truncate text-xs">
                                    {task.title}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="z-50 shadow-lg">
                                <div className="space-y-1 p-1">
                                  <p className="text-xs font-medium">
                                    {task.title}
                                  </p>
                                  <p className="text-xs">
                                    {task.startTime} - {task.endTime}
                                  </p>
                                  <p className="text-xs">{task.serviceType}</p>
                                  <p className="text-xs">
                                    Status:{' '}
                                    {task.status === 'allocated'
                                      ? 'Allocated'
                                      : 'Unallocated'}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </ContextMenuTrigger>

                        <ContextMenuContent className="z-[9999] w-36 border-none bg-white text-black shadow-lg">
                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="text-xs">
                              Allocate
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 border-none bg-white text-black shadow-lg">
                              {employees.map((employee) => (
                                <ContextMenuSub key={employee.id}>
                                  <ContextMenuSubTrigger className="text-xs">
                                    {employee.name}
                                  </ContextMenuSubTrigger>
                                  <ContextMenuSubContent className="w-48 space-y-1 border-none bg-white text-black shadow-lg">
                                    <ContextMenuItem className="text-xs">
                                      Maintenance
                                    </ContextMenuItem>

                                    <ContextMenuSub>
                                      <ContextMenuSubTrigger className="text-xs">
                                        Show Routes
                                      </ContextMenuSubTrigger>
                                      <ContextMenuSubContent className="w-48 border-none bg-white text-black shadow-lg">
                                        <ContextMenuItem className="text-xs">
                                          Send Email
                                        </ContextMenuItem>
                                        <ContextMenuItem className="text-xs">
                                          Send Message
                                        </ContextMenuItem>
                                      </ContextMenuSubContent>
                                    </ContextMenuSub>

                                    <ContextMenuSub>
                                      <ContextMenuSubTrigger className="text-xs">
                                        Allocate
                                      </ContextMenuSubTrigger>
                                      <ContextMenuSubContent className="w-48 border-none bg-white text-black shadow-lg">
                                        <ContextMenuItem className="text-xs">
                                          Single
                                        </ContextMenuItem>
                                        <ContextMenuItem className="text-xs">
                                          Batch
                                        </ContextMenuItem>
                                      </ContextMenuSubContent>
                                    </ContextMenuSub>
                                  </ContextMenuSubContent>
                                </ContextMenuSub>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>

                          <ContextMenuItem className="text-xs">
                            Copy
                          </ContextMenuItem>
                          <ContextMenuItem className="text-xs">
                            Cancel
                          </ContextMenuItem>
                          <ContextMenuItem className="text-xs">
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        <TaskDetailDialog
          task={selectedTask}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </div>
  );
}

function TaskDetailDialog({
  task,
  isOpen,
  onClose
}: {
  task: {
    title: string;
    startTime: string;
    endTime: string;
    type: 'service-user' | 'employee';
    serviceType: string;
    status: 'allocated' | string;
    assigneeId: string;
    date?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !task) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start">
            <Clock className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="text-sm font-medium">
                {task.startTime} - {task.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <User className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm font-medium">
                {task.type === 'service-user' ? 'Service User' : 'Employee'}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <ClipboardList className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="text-sm font-medium">{task.serviceType}</p>
            </div>
          </div>

          <div className="flex items-start">
            {task.status === 'allocated' ? (
              <CheckCircle2 className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                variant={
                  task.status === 'allocated' ? 'default' : 'destructive'
                }
                className="mt-1"
              >
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="flex items-start">
            <User className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Assignee ID</p>
              <p className="text-sm font-medium">{task.assigneeId}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-sm font-medium">
                {task.date || moment().format('YYYY-MM-DD')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            Close
          </Button>
          <Button
            variant="default"
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            Edit Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
