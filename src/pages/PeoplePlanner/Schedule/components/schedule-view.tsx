import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CalendarIcon,
  X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import { Calendar, Send, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Current logged-in user data
const currentUser = {
  name: 'Sarah Johnson',
  role: 'Care Worker',
  initials: 'SJ',
  employeeId: 'CW001'
};

// User's personal shifts (now with multiple shifts per day)
const myShifts = [
  {
    id: 1,
    date: '2025-07-11',
    startTime: '08:00',
    endTime: '10:00',
    serviceUser: 'John Doe',
    location: '123 Oak Street',
    type: 'Personal Care',
    status: 'scheduled',
    notes: 'Morning routine and medication'
  },
  {
    id: 2,
    date: '2025-07-11',
    startTime: '12:00',
    endTime: '14:00',
    serviceUser: 'Jane Smith',
    location: '456 Pine Avenue',
    type: 'Lunch Support',
    status: 'scheduled',
    notes: 'Assist with meal preparation'
  },
  {
    id: 3,
    date: '2025-07-11',
    startTime: '16:00',
    endTime: '18:00',
    serviceUser: 'Bob Wilson',
    location: '789 Elm Drive',
    type: 'Evening Check-in',
    status: 'scheduled',
    notes: 'Medication reminder'
  },
  {
    id: 4,
    date: '2025-07-12',
    startTime: '14:00',
    endTime: '22:00',
    serviceUser: 'Jane Smith',
    location: '456 Pine Avenue',
    type: 'Evening Care',
    status: 'scheduled',
    notes: 'High anxiety - remain calm, dinner preparation needed'
  },
  {
    id: 5,
    date: '2025-07-13',
    startTime: '09:00',
    endTime: '17:00',
    serviceUser: 'Bob Wilson',
    location: '789 Elm Drive',
    type: 'Day Support',
    status: 'scheduled',
    notes: 'Physiotherapy appointment at 2 PM'
  },
  {
    id: 6,
    date: '2025-07-14',
    startTime: '07:00',
    endTime: '15:00',
    serviceUser: 'Mary Brown',
    location: '321 Maple Court',
    type: 'Morning Care',
    status: 'scheduled',
    notes: 'Medication review with GP at 11 AM'
  },
  {
    id: 7,
    date: '2025-07-15',
    startTime: '16:00',
    endTime: '20:00',
    serviceUser: 'Tom Davis',
    location: '654 Cedar Lane',
    type: 'Evening Support',
    status: 'pending',
    notes: 'New service user - first visit'
  }
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ScheduleView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 6, 11)); // July 11, 2025
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [selectedRequestDate, setSelectedRequestDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [suggestedStaff, setSuggestedStaff] = useState('');

  const pendingRequests = [
    {
      id: 1,
      type: 'Shift Change',
      date: '2025-07-15',
      time: '09:00-17:00',
      requestedBy: 'Sarah Johnson',
      reason: 'Medical appointment',
      status: 'pending',
      suggestedReplacement: 'Mike Wilson'
    },
    {
      id: 2,
      type: 'Time Off',
      date: '2025-07-20',
      time: 'All Day',
      requestedBy: 'John Smith',
      reason: 'Family emergency',
      status: 'pending',
      suggestedReplacement: 'Emma Davis'
    },
    {
      id: 3,
      type: 'Shift Swap',
      date: '2025-07-18',
      time: '14:00-22:00',
      requestedBy: 'Lisa Brown',
      reason: 'Personal commitment',
      status: 'approved',
      suggestedReplacement: 'Tom Anderson'
    }
  ];

  const staffMembers = [
    'Mike Wilson',
    'Emma Davis',
    'Tom Anderson',
    'Sarah Johnson',
    'John Smith',
    'Lisa Brown',
    'David Lee',
    'Anna Taylor'
  ];

  const handleSubmitRequest = () => {
    // Handle request submission
    console.log('Request submitted:', {
      type: requestType,
      date: selectedDate,
      time: selectedTime,
      reason,
      suggestedStaff
    });

    // Reset form
    setRequestType('');
    setSelectedRequestDate('');
    setSelectedTime('');
    setReason('');
    setSuggestedStaff('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return myShifts.filter((shift) => shift.date === dateStr);
  };

  const getFilteredShifts = () => {
    switch (viewType) {
      case 'day':
        return myShifts.filter(
          (shift) => shift.date === currentDate.toISOString().split('T')[0]
        );
      case 'week':
        const weekStart = getWeekDates()[0];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return myShifts.filter((shift) => {
          const shiftDate = new Date(shift.date);
          return shiftDate >= weekStart && shiftDate <= weekEnd;
        });
      case 'month':
        return myShifts.filter((shift) => {
          const shiftDate = new Date(shift.date);
          return (
            shiftDate.getMonth() === currentDate.getMonth() &&
            shiftDate.getFullYear() === currentDate.getFullYear()
          );
        });
      default:
        return myShifts;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    }
    setCurrentDate(newDate);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setViewType('day');
  };

  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setIsDialogOpen(true);
  };

  const weekDates = getWeekDates();
  const filteredShifts = getFilteredShifts();
  const totalHoursThisWeek = filteredShifts.reduce((total, shift) => {
    const start = Number.parseInt(shift.startTime.split(':')[0]);
    const end = Number.parseInt(shift.endTime.split(':')[0]);
    return total + (end - start);
  }, 0);

  // Show all shifts for a given date in the dialog
  const handleShowAllShifts = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-supperagent text-white text-lg font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{currentUser.name}</h2>
                <p className="text-gray-600">
                  {currentUser.role} • ID: {currentUser.employeeId}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {totalHoursThisWeek}h
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </CardHeader>
      </Card> */}

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{filteredShifts.length}</div>
                <div className="text-sm text-gray-600">Total Shifts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalHoursThisWeek}</div>
                <div className="text-sm text-gray-600">Hours This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(filteredShifts.map((s) => s.serviceUser)).size}
                </div>
                <div className="text-sm text-gray-600">Service Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(filteredShifts.map((s) => s.location)).size}
                </div>
                <div className="text-sm text-gray-600">Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}



 {/* Upcoming Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredShifts.slice(0, 5).map((shift) => (
              <div
                key={shift.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                onClick={() => handleShiftClick(shift)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">
                      {new Date(shift.date).toLocaleDateString('en-US', {
                        weekday: 'short'
                      })}
                    </div>
                    <div className="text-lg font-semibold">
                      {new Date(shift.date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <h4 className="font-medium">{shift.serviceUser}</h4>
                      <Badge
                        variant={
                          shift.status === 'scheduled' ? 'default' : 'secondary'
                        }
                      >
                        {shift.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{shift.location}</span>
                      </div>
                    </div>
                    {shift.notes && (
                      <div className="mt-1 line-clamp-1 text-sm text-gray-600">
                        <strong>Notes:</strong> {shift.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{shift.type}</div>
                  <div className="text-xs text-gray-500">
                    {Number.parseInt(shift.endTime.split(':')[0]) -
                      Number.parseInt(shift.startTime.split(':')[0])}{' '}
                    hours
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {viewType === 'day' && (
                <DatePicker
                  selected={currentDate}
                  onChange={handleDateChange}
                  dateFormat="MMMM d, yyyy"
                  className="border-none p-0 text-lg font-semibold"
                  customInput={
                    <Button variant="ghost" className="text-lg font-semibold">
                      {formatDate(currentDate)}
                    </Button>
                  }
                />
              )}

              {viewType === 'week' && (
                <div className="text-lg font-semibold">
                  Week of {formatDate(weekDates[0])}
                </div>
              )}

              {viewType === 'month' && (
                <div className="text-lg font-semibold">
                  {currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={viewType === 'day' ? 'outline' : 'default'}
                size="sm"
                onClick={() => setViewType('day')}
              >
                Day
              </Button>
              <Button
                variant={viewType === 'week' ? 'outline' : 'default'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                Week
              </Button>
              <Button
                variant={viewType === 'month' ? 'outline' : 'default'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>My Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewType === 'day' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              {getShiftsForDate(currentDate).length > 0 ? (
                <div className="space-y-3">
                  {getShiftsForDate(currentDate).map((shift) => (
                    <div
                      key={shift.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md ${
                        shift.status === 'scheduled'
                          ? 'border-green-200 bg-green-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                      onClick={() => handleShiftClick(shift)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{shift.serviceUser}</div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <Clock className="mr-1 h-4 w-4" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <MapPin className="mr-1 h-4 w-4" />
                            {shift.location}
                          </div>
                        </div>
                        <Badge variant="secondary">{shift.type}</Badge>
                      </div>
                      {shift.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="font-medium">Notes:</div>
                          <p>{shift.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No shifts scheduled for this day
                </div>
              )}
            </div>
          )}

          {viewType === 'week' && (
            <div className="grid grid-cols-7 gap-4">
              {weekDates.map((date, index) => {
                const shifts = getShiftsForDate(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${
                      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="mb-3 text-center">
                      <div className="text-sm font-medium text-gray-600">
                        {weekDays[index]}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>

                    {shifts.length > 0 ? (
                      <div className="space-y-2">
                        {shifts.slice(0, 2).map((shift) => (
                          <div
                            key={shift.id}
                            className={`cursor-pointer rounded-lg p-2 text-xs ${
                              shift.status === 'scheduled'
                                ? 'border border-green-200 bg-green-100'
                                : 'border border-yellow-200 bg-yellow-100'
                            }`}
                            onClick={() => handleShiftClick(shift)}
                          >
                            <div className="truncate font-medium">
                              {shift.serviceUser}
                            </div>
                            <div>
                              {shift.startTime}-{shift.endTime}
                            </div>
                          </div>
                        ))}
                        {shifts.length > 2 && (
                          <div
                            className="cursor-pointer text-center text-xs text-blue-600 hover:underline"
                            onClick={() => handleShowAllShifts(date)}
                          >
                            +{shifts.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <div className="text-xs text-gray-400">No shifts</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewType === 'month' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600">
                {weekDays.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({
                  length: new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    0
                  ).getDate()
                }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day
                  );
                  const shifts = getShiftsForDate(date);
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={day}
                      className={`min-h-24 rounded border p-1 ${
                        isToday
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => {
                        setCurrentDate(date);
                        setViewType('day');
                      }}
                    >
                      <div
                        className={`text-right text-sm ${
                          isToday ? 'font-bold text-blue-600' : ''
                        }`}
                      >
                        {day}
                      </div>
                      {shifts.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {shifts.slice(0, 1).map((shift) => (
                            <div
                              key={shift.id}
                              className={`cursor-pointer truncate rounded p-1 text-xs ${
                                shift.status === 'scheduled'
                                  ? 'bg-green-100'
                                  : 'bg-yellow-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShiftClick(shift);
                              }}
                            >
                              {shift.serviceUser}
                            </div>
                          ))}
                          {shifts.length > 1 && (
                            <div className="text-center text-xs text-blue-600">
                              +{shifts.length - 1} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

     

      <div className=" space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Request Shift Change</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Request Type</label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift-change">Shift Change</SelectItem>
                    <SelectItem value="time-off">Time Off</SelectItem>
                    <SelectItem value="shift-swap">Shift Swap</SelectItem>
                    <SelectItem value="overtime">Overtime Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={selectedRequestDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00-15:00">
                      07:00 - 15:00 (Day Shift)
                    </SelectItem>
                    <SelectItem value="15:00-23:00">
                      15:00 - 23:00 (Evening Shift)
                    </SelectItem>
                    <SelectItem value="23:00-07:00">
                      23:00 - 07:00 (Night Shift)
                    </SelectItem>
                    <SelectItem value="09:00-17:00">
                      09:00 - 17:00 (Standard)
                    </SelectItem>
                    <SelectItem value="all-day">All Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Suggested Replacement
                </label>
                <Select
                  value={suggestedStaff}
                  onValueChange={setSuggestedStaff}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Suggest a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff} value={staff}>
                        {staff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Request</label>
              <Textarea
                placeholder="Please provide a reason for your shift change request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="border-gray-300"
              />
            </div>

            <Button
              onClick={handleSubmitRequest}
              className="w-full md:w-auto"
              disabled={!requestType || !selectedDate || !reason}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </CardContent>

          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-gray-300 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">{request.type}</Badge>
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'default'
                                : request.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{request.requestedBy}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{request.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{request.time}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <strong>Reason:</strong> {request.reason}
                          </div>

                          {request.suggestedReplacement && (
                            <div className="text-sm text-gray-600">
                              <strong>Suggested Replacement:</strong>{' '}
                              {request.suggestedReplacement}
                            </div>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="border-green-600 bg-transparent text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="border-red-600 bg-transparent text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Card>
      </div>

      {/* Shift Details Dialog */}
      {/* Shift Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDate && !selectedShift
                  ? `All Shifts for ${selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}`
                  : 'Shift Details'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedDate && !selectedShift ? (
            <div className="space-y-4">
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                {getShiftsForDate(selectedDate).length > 0 ? (
                  getShiftsForDate(selectedDate).map((shift) => (
                    <div
                      key={shift.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        shift.status === 'scheduled'
                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                          : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                      }`}
                      onClick={() => setSelectedShift(shift)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{shift.serviceUser}</div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <Clock className="mr-1 h-4 w-4" />
                            {shift.startTime} - {shift.endTime} (
                            {Number.parseInt(shift.endTime.split(':')[0]) -
                              Number.parseInt(shift.startTime.split(':')[0])}
                            h)
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <MapPin className="mr-1 h-4 w-4" />
                            {shift.location}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="secondary">{shift.type}</Badge>
                          <Badge
                            variant={
                              shift.status === 'scheduled'
                                ? 'default'
                                : 'secondary'
                            }
                            className="capitalize"
                          >
                            {shift.status}
                          </Badge>
                        </div>
                      </div>
                      {shift.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="font-medium">Notes:</div>
                          <p className="line-clamp-2">{shift.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No shifts scheduled for this day
                  </div>
                )}
              </div>
            </div>
          ) : selectedShift ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  {selectedShift.serviceUser}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedShift.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedShift.startTime} - {selectedShift.endTime} (
                    {Number.parseInt(selectedShift.endTime.split(':')[0]) -
                      Number.parseInt(selectedShift.startTime.split(':')[0])}
                    h)
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {selectedShift.location}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge variant="secondary">{selectedShift.type}</Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={
                      selectedShift.status === 'scheduled'
                        ? 'default'
                        : 'secondary'
                    }
                    className="capitalize"
                  >
                    {selectedShift.status}
                  </Badge>
                </div>
              </div>

              {selectedShift.notes && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Notes</p>
                  <div className="rounded border bg-gray-50 p-3 text-sm">
                    {selectedShift.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDate(new Date(selectedShift.date));
                    setSelectedShift(null);
                  }}
                >
                  View All Shifts
                </Button>
                <Button variant="outline">Edit</Button>
                <Button>Complete Shift</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
