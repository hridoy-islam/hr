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
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  User,
  X
} from 'lucide-react';
import type { ServiceUser, Employee, schedule } from '@/types/planner';
import { employees } from '@/data/plannerData';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';

interface TimelineProps {
  currentData: (ServiceUser | Employee)[];
  filterBy: string;
  schedules: schedule[];
  zoomLevel: number;
  selectedDate: string;
  contentRef: React.RefObject<HTMLDivElement>;
  onScheduleClick: (schedule: schedule) => void;
}

export function Timeline({
  currentData,
  filterBy,
  schedules,
  zoomLevel,
  contentRef,
  selectedDate,
  onScheduleClick
}: TimelineProps) {
  const [selectedUser, setSelectedUser] = useState<
    ServiceUser | Employee | null
  >(null);

  const SLOT_WIDTH = zoomLevel * 2;
  const userListRef = useRef<HTMLDivElement>(null);
  const isUserScroll = useRef(false);
  const isContentScroll = useRef(false);
  const [selectedSchedule, setSelectedSchedule] = useState<schedule | null>(
    null
  );
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

  // Synchronize scrolling between user list and timeline content
  useEffect(() => {
    const userList = userListRef.current;
    const content = contentRef.current;

    if (!userList || !content) return;

    const handleUserListScroll = () => {
      if (!isContentScroll.current) {
        isUserScroll.current = true;
        content.scrollTop = userList.scrollTop;
        setTimeout(() => (isUserScroll.current = false), 100);
      }
    };

    const handleContentScroll = () => {
      if (!isUserScroll.current) {
        isContentScroll.current = true;
        userList.scrollTop = content.scrollTop;
        setTimeout(() => (isContentScroll.current = false), 100);
      }
    };

    userList.addEventListener('scroll', handleUserListScroll);
    content.addEventListener('scroll', handleContentScroll);

    return () => {
      userList.removeEventListener('scroll', handleUserListScroll);
      content.removeEventListener('scroll', handleContentScroll);
    };
  }, [contentRef]);

  // Handle user selection
  const handleUserClick = (user: ServiceUser | Employee) => {
    setSelectedUser(user);
  };

  // Handle back to main view
  const handleBackToMain = () => {
    setSelectedUser(null);
  };

  // Get task position for daily view (hours)
  const getSchedulePosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const startPosition = (startTotalMinutes / 60) * SLOT_WIDTH;
    const duration = ((endTotalMinutes - startTotalMinutes) / 60) * SLOT_WIDTH;

    return { left: `${startPosition}rem`, width: `${duration}rem` };
  };

  // Get current display data (users or days)
  const displayData = useMemo(() => {
    if (selectedUser) {
      return past7Days;
    }
    return currentData;
  }, [selectedUser, currentData, past7Days]);
  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    let duration = endMinutes - startMinutes;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  // Get filtered Schedules for current view
  const filteredSchedules = useMemo(() => {
    let baseSchedules = schedules;

    if (selectedUser) {
      // Filter schedules for selected user in the past 7 days
      const sevenDaysAgo = moment(selectedDate)
        .subtract(7, 'days')
        .startOf('day');
      const today = moment(selectedDate).endOf('day');

      baseSchedules = schedules.filter((schedule) => {
        const scheduleDate = moment(schedule.date || selectedDate);
        return (
          schedule.assigneeId === selectedUser.id &&
          scheduleDate.isBetween(sevenDaysAgo, today, null, '[]') // inclusive of both dates
        );
      });
    } else {
      // Filter for selected date only
      baseSchedules = schedules.filter((schedule) => {
        return (schedule.date || selectedDate) === selectedDate;
      });
    }

    // Apply additional filters
    if (filterBy !== 'All') {
      baseSchedules = baseSchedules.filter(
        (schedule) =>
          schedule.type ===
          (filterBy === 'Service User' ? 'service-user' : 'employee')
      );
    }

    return baseSchedules;
  }, [schedules, selectedUser, filterBy, selectedDate]);
  const displayDate = useMemo(() => {
    return selectedDate
      ? moment(selectedDate).format('dddd DD/MM/YYYY')
      : moment().format('dddd DD/MM/YYYY');
  }, [selectedDate]);

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
    return filteredSchedules.reduce((acc, schedule) => {
      return acc + getDurationMinutes(schedule.startTime, schedule.endTime);
    }, 0);
  }, [filteredSchedules]);

  const allocatedMinutes = useMemo(() => {
    return filteredSchedules
      .filter((schedule) => schedule.status === 'allocated')
      .reduce((acc, schedule) => {
        return acc + getDurationMinutes(schedule.startTime, schedule.endTime);
      }, 0);
  }, [filteredSchedules]);

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
            {selectedUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMain}
                className="flex items-center gap-1 text-xs  hover:bg-supperagent/90 hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to All Users
              </Button>
            )}
            <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
              {!selectedUser ? (
                <>
                  <Clock className="h-3 w-3" />
                  {displayDate}
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3" />
                  {selectedUser.name} - Past 7 Days
                </>
              )}
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
        {/* Fixed User/Date Column */}
        <div className="flex w-20 flex-shrink-0 flex-col border-r border-gray-200 bg-white sm:w-48">
          <div className="flex h-8 flex-shrink-0 items-center justify-center border-b border-gray-200 bg-gray-50">
            <span className="text-xs font-medium text-gray-600">
              {!selectedUser ? 'Users' : 'Days'}
            </span>
          </div>

          <div ref={userListRef} className="overflow-y-auto">
            {!selectedUser
              ? // User list view
                currentData.map((item, index) => {
                  const isServiceUser = 'type' in item;
                  const scheduleCount = filteredSchedules.filter(
                    (schedule) => schedule.assigneeId === item.id
                  ).length;

                  return (
                    <div
                      key={item.id}
                      className={`flex h-10 items-center gap-2 p-1 sm:h-12 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } cursor-pointer rounded-md transition-colors hover:bg-gray-100`}
                      onClick={() => handleUserClick(item)}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            isServiceUser
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.initials}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {isServiceUser
                              ? item.type
                              : (item as Employee).role}
                          </p>
                          {/* {taskCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {taskCount}
                            </span>
                          )} */}
                        </div>
                      </div>
                    </div>
                  );
                })
              : // Days list view for selected user
                past7Days.map((day, index) => {
                  const daySchedules = filteredSchedules.filter(
                    (schedule) =>
                      (schedule.date || moment().format('YYYY-MM-DD')) ===
                      day.date
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
                          {daySchedules.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              {daySchedules.length}
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

          {/* Rows with Schedules */}
          <div
            className="divide-y divide-gray-200"
            style={{ width: `${timeSlots.length * SLOT_WIDTH}rem` }}
          >
            {!selectedUser
              ? // User rows view
                currentData.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative h-10 sm:h-12 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    {/* Grid Lines */}
                    <div className="pointer-events-none absolute inset-0 flex">
                      {timeSlots.map((time, timeIndex) => (
                        <div
                          key={timeIndex}
                          className="h-full border-l border-gray-200"
                          style={{ width: `${SLOT_WIDTH}rem` }}
                        />
                      ))}
                    </div>

                    {/* Schedules */}
                    {filteredSchedules
                      .filter((schedule) => schedule.assigneeId === item.id)
                      .map((schedule) => {
                        const position = getSchedulePosition(
                          schedule.startTime,
                          schedule.endTime
                        );

                        return (
                          <Tooltip>
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`absolute top-1 h-6 shadow-lg sm:h-10 ${schedule.color} z-20 cursor-pointer truncate rounded p-1 text-xs text-white transition-all hover:opacity-80 hover:shadow-xl`}
                                    style={position}
                                    onClick={() => onScheduleClick(schedule)}
                                  >
                                    <div className="truncate text-xs font-medium">
                                      {schedule.startTime}-{schedule.endTime}
                                    </div>
                                    <div className="truncate text-xs">
                                      {schedule.title}
                                    </div>
                                  </div>
                                </TooltipTrigger>
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
                            <TooltipContent className="z-50 w-auto rounded-md bg-white p-4 shadow-lg">
                              <div className="space-y-3 text-sm text-gray-700">
                                {/* Service User Info */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 font-semibold">
                                    <User size={16} />
                                    <span>{schedule?.serviceUser.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin
                                      size={16}
                                      className="text-muted-foreground"
                                    />
                                    <span>{schedule?.serviceUser.address}</span>
                                  </div>
                                </div>
                                <div className="flex flex-row items-center justify-between gap-4">
                                  {/* Service Requirement */}
                                  <div>
                                    <div className="flex items-center gap-2 font-medium text-gray-800">
                                      <ClipboardList
                                        size={16}
                                        className="text-blue-500"
                                      />
                                      <span>Service Requirement</span>
                                    </div>
                                    <div className="ml-6 mt-1 space-y-1 text-xs text-gray-600">
                                      <p>
                                        <CalendarClock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        {schedule.startTime} -{' '}
                                        {schedule.endTime}
                                      </p>
                                      <p>
                                        <Clock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        Duration:{' '}
                                        {calculateDuration(
                                          schedule.startTime,
                                          schedule.endTime
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Planned Section (Same as Service Requirement) */}
                                  <div>
                                    <div className="flex items-center gap-2 font-medium text-gray-800">
                                      <ClipboardList
                                        size={16}
                                        className="text-purple-500"
                                      />
                                      <span>Planned</span>
                                    </div>
                                    <div className="ml-6 mt-1 space-y-1 text-xs text-gray-600">
                                      <p>
                                        <CalendarClock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        {schedule.startTime} -{' '}
                                        {schedule.endTime}
                                      </p>
                                      <p>
                                        <Clock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        Duration:{' '}
                                        {calculateDuration(
                                          schedule.startTime,
                                          schedule.endTime
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Service Type and Status */}
                                <div className="space-y-1 border-t border-gray-200 pt-2">
                                  <p className="text-xs">
                                    <ClipboardList
                                      size={14}
                                      className="mr-1 inline-block text-gray-500"
                                    />
                                    {schedule.serviceType}
                                  </p>
                                  <p className="text-xs">
                                    <CheckCircle
                                      size={14}
                                      className="mr-1 inline-block text-green-500"
                                    />
                                    Status:{' '}
                                    {schedule.status === 'allocated'
                                      ? 'Allocated'
                                      : 'Unallocated'}
                                  </p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                ))
              : // Day rows view for selected user
                past7Days.map((day, index) => (
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

                    {/* schedules for this day */}
                    {filteredSchedules
                      .filter(
                        (schedule) =>
                          (schedule.date || moment().format('YYYY-MM-DD')) ===
                          day.date
                      )
                      .map((schedule) => {
                        const position = getSchedulePosition(
                          schedule.startTime,
                          schedule.endTime
                        );

                        return (
                          <ContextMenu key={schedule.id}>
                            <ContextMenuTrigger asChild>
                              <div
                                onContextMenu={(e) => e.stopPropagation()} // optional safeguard
                                className={`absolute top-1 h-6 shadow-lg sm:h-10 ${schedule.color} z-20 cursor-pointer truncate rounded p-1 text-xs text-white transition-all hover:opacity-80 hover:shadow-xl`}
                                style={position}
                                onClick={() => onScheduleClick(schedule)}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="truncate text-xs font-medium">
                                        {schedule.startTime}-{schedule.endTime}
                                      </div>
                                      <div className="truncate text-xs">
                                        {schedule.title}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
<TooltipContent className="z-50 w-auto rounded-md bg-white p-4 shadow-lg">
                              <div className="space-y-3 text-sm text-gray-700">
                                {/* Service User Info */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 font-semibold">
                                    <User size={16} />
                                    <span>{schedule?.serviceUser.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin
                                      size={16}
                                      className="text-muted-foreground"
                                    />
                                    <span>{schedule?.serviceUser.address}</span>
                                  </div>
                                </div>
                                <div className="flex flex-row items-center justify-between gap-4">
                                  {/* Service Requirement */}
                                  <div>
                                    <div className="flex items-center gap-2 font-medium text-gray-800">
                                      <ClipboardList
                                        size={16}
                                        className="text-blue-500"
                                      />
                                      <span>Service Requirement</span>
                                    </div>
                                    <div className="ml-6 mt-1 space-y-1 text-xs text-gray-600">
                                      <p>
                                        <CalendarClock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        {schedule.startTime} -{' '}
                                        {schedule.endTime}
                                      </p>
                                      <p>
                                        <Clock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        Duration:{' '}
                                        {calculateDuration(
                                          schedule.startTime,
                                          schedule.endTime
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Planned Section (Same as Service Requirement) */}
                                  <div>
                                    <div className="flex items-center gap-2 font-medium text-gray-800">
                                      <ClipboardList
                                        size={16}
                                        className="text-purple-500"
                                      />
                                      <span>Planned</span>
                                    </div>
                                    <div className="ml-6 mt-1 space-y-1 text-xs text-gray-600">
                                      <p>
                                        <CalendarClock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        {schedule.startTime} -{' '}
                                        {schedule.endTime}
                                      </p>
                                      <p>
                                        <Clock
                                          size={14}
                                          className="mr-1 inline-block"
                                        />
                                        Duration:{' '}
                                        {calculateDuration(
                                          schedule.startTime,
                                          schedule.endTime
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Service Type and Status */}
                                <div className="space-y-1 border-t border-gray-200 pt-2">
                                  <p className="text-xs">
                                    <ClipboardList
                                      size={14}
                                      className="mr-1 inline-block text-gray-500"
                                    />
                                    {schedule.serviceType}
                                  </p>
                                  <p className="text-xs">
                                    <CheckCircle
                                      size={14}
                                      className="mr-1 inline-block text-green-500"
                                    />
                                    Status:{' '}
                                    {schedule.status === 'allocated'
                                      ? 'Allocated'
                                      : 'Unallocated'}
                                  </p>
                                </div>
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
          <ScheduleDetailDialog
            schedule={selectedSchedule}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

function ScheduleDetailDialog({
  schedule,
  isOpen,
  onClose
}: {
  schedule: {
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
  if (!isOpen || !schedule) return null;

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
          <h3 className="text-xl font-semibold text-gray-900">
            {schedule.title}
          </h3>
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
                {schedule.startTime} - {schedule.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <User className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm font-medium">
                {schedule.type === 'service-user' ? 'Service User' : 'Employee'}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <ClipboardList className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="text-sm font-medium">{schedule.serviceType}</p>
            </div>
          </div>

          <div className="flex items-start">
            {schedule.status === 'allocated' ? (
              <CheckCircle2 className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                variant={
                  schedule.status === 'allocated' ? 'default' : 'destructive'
                }
                className="mt-1"
              >
                {schedule.status.charAt(0).toUpperCase() +
                  schedule.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="flex items-start">
            <User className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Assignee ID</p>
              <p className="text-sm font-medium">{schedule.assigneeId}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-sm font-medium">
                {schedule.date || moment().format('YYYY-MM-DD')}
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
