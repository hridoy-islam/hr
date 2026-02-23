import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Users, Clock, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { CirclePicker } from 'react-color'; // Added import

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (firstName?: string, lastName?: string, name?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2)
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return 'U';
};

const leaveOptions = [
  { id: 'DO', label: 'Day Off (DO)' },
  { id: 'AL', label: 'Annual Leave (AL)' },
  { id: 'S', label: 'Sick (S)' },
  { id: 'ML', label: 'Maternity (ML)' },
  { id: 'NT', label: 'No Task (NT)' }
];

const themeColors = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", 
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", 
  "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", 
  "#ff5722", "#795548", "#607d8b"
];

export default function BulkAssignDialog({
  isOpen,
  onClose,
  users = [],
  companyId,
  onSuccess,
  setGlobalSkippedRecords,
  companyColor
}: any) {
  const { toast } = useToast();

  // Selections
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);

  // Dates & Times
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Shift Details
  const [leaveType, setLeaveType] = useState<string>('');
  const [shiftName, setShiftName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [color, setColor] = useState<string>("#2196f3");

  const isStandardShift = !leaveType;


  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedEmployees([]);
    setStartDate(null);
    setEndDate(null);
    setLeaveType('');
    setShiftName('');
    setStartTime('');
    setEndTime('');
    setColor("#2196f3");
  };

  const handleTimeBlur = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) cleanValue = m.format('HH:mm');
    }
    setter(cleanValue);
  };

  // ─── Selection Handlers ───────────────────────────────────────────────────
  const unselectedUsers = users.filter(
    (u: any) => !selectedEmployees.some((s) => s._id === u._id)
  );

  const toggleEmployee = (user: any) => {
    if (selectedEmployees.some((e) => e._id === user._id)) {
      setSelectedEmployees(selectedEmployees.filter((e) => e._id !== user._id));
    } else {
      setSelectedEmployees([...selectedEmployees, user]);
    }
  };

  const selectAll = () => setSelectedEmployees(users);
  const clearAll = () => setSelectedEmployees([]);

  const handleSubmit = async () => {
    try {
      const payload = {
        companyId,
        employeeIds: selectedEmployees,
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        shiftName: leaveType ? undefined : shiftName,
        leaveType: leaveType || undefined,
        startTime,
        endTime,
        ...(!leaveType && { color }) // Only attach color for standard shifts
      };

      const res = await axiosInstance.post('/rota/bulk-assign', payload);
      const {meta} = res.data.data;

      if (onSuccess) onSuccess(res.data.data.result);
      console.log(res.data.data.result)
      onClose();

      if (meta?.hasSkippedRecords) {
        setGlobalSkippedRecords(meta.skippedRecords);
        toast({
          title: 'Bulk Assign Result',
          description: `Assigned ${meta.createdShiftsCount} shifts. Some were skipped.`
        });
      } else {
        setGlobalSkippedRecords([]);
        toast({
          title: 'Success',
          description: 'Bulk assignment completed successfully.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign shifts',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Assign Shifts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL: Staff Selection */}
          <div className="flex w-1/2 flex-col border-r border-gray-100 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-theme" />
              <h3 className="text-sm font-bold ">Select Staff</h3>
            </div>

            {/* Dual List Container */}
            <div className="flex flex-1 gap-4 overflow-hidden">
              {/* Available Staff */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-3">
                  <span className="text-xs font-bold text-gray-600">
                    Available ({unselectedUsers.length})
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-xs font-bold text-theme hover:text-theme"
                  >
                    Select All
                  </button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto p-2">
                  {unselectedUsers.map((user: any) => (
                    <div
                      key={user._id}
                      onClick={() => toggleEmployee(user)}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 transition-colors hover:bg-gray-50"
                    >
                      <div className="h-4 w-4 flex-shrink-0 rounded border border-gray-300" />
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={user?.image || '/placeholder.png'}
                          alt={user?.name || 'User'}
                        />
                        <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-theme">
                          {getInitials(
                            user?.firstName,
                            user?.lastName,
                            user?.name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-gray-700">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  ))}
                  {unselectedUsers.length === 0 && (
                    <p className="mt-10 text-center text-xs text-gray-400">
                      No users available
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Staff */}
              <div className="bg-theme/10/20 flex flex-1 flex-col overflow-hidden rounded-lg border border-blue-200 shadow-sm">
                <div className="bg-theme/10/50 flex items-center justify-between border-b border-blue-100 p-3">
                  <span className="text-xs font-bold text-theme">
                    Selected ({selectedEmployees.length})
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs font-bold  hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto p-2">
                  {selectedEmployees.map((user: any) => (
                    <div
                      key={user._id}
                      onClick={() => toggleEmployee(user)}
                      className="group flex cursor-pointer items-center gap-3 rounded-md border border-blue-100 bg-white p-2 shadow-sm transition-colors hover:border-red-200"
                    >
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-theme bg-theme group-hover:border-red-500 group-hover:bg-red-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={user?.image || '/placeholder.png'}
                          alt={user?.name || 'User'}
                        />
                        <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-theme">
                          {getInitials(
                            user?.firstName,
                            user?.lastName,
                            user?.name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  ))}
                  {selectedEmployees.length === 0 && (
                    <p className="mt-10 text-center text-xs text-gray-400">
                      None selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Form Details */}
          <div className="flex w-1/2 flex-col space-y-5 overflow-y-auto p-6">
            {/* 1. Select Date Range */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-theme" />
                <h3 className="text-sm font-bold ">Select Date Range</h3>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold ">
                    From
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      dateFormat="dd-MM-yyyy"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-theme"
                      placeholderText="Select start date"
                      wrapperClassName="w-full"
                    />
                    <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-semibold ">
                    To
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={endDate}
                      onChange={setEndDate}
                      dateFormat="dd-MM-yyyy"
                      minDate={startDate || undefined}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-theme"
                      placeholderText="Select end date"
                      wrapperClassName="w-full"
                    />
                    <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Shift Details */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-theme" />
                <h3 className="text-sm font-bold ">Shift Details</h3>
              </div>

              <div className="space-y-6">
                {/* Standard Shift Fields */}
                {isStandardShift ? (
                  <div className="space-y-4 border-t border-gray-100 pt-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase ">
                        Shift Name
                      </label>
                      <Input
                        value={shiftName}
                        onChange={(e) => setShiftName(e.target.value)}
                        maxLength={10}
                        placeholder="e.g. Morning"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-bold uppercase ">
                          Start Time
                        </label>
                        <Input
                          value={startTime}
                          placeholder="09:00"
                          maxLength={5}
                          className="font-mono"
                          onChange={(e) => {
                            let val = e.target.value
                              .replace(/[^0-9:]/g, '')
                              .slice(0, 5);
                            if (
                              val.length === 2 &&
                              startTime.length === 1 &&
                              !val.includes(':')
                            )
                              val += ':';
                            setStartTime(val);
                          }}
                          onBlur={(e) =>
                            handleTimeBlur(e.target.value, setStartTime)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-bold uppercase ">
                          End Time
                        </label>
                        <Input
                          value={endTime}
                          placeholder="17:00"
                          maxLength={5}
                          className="font-mono"
                          onChange={(e) => {
                            let val = e.target.value
                              .replace(/[^0-9:]/g, '')
                              .slice(0, 5);
                            if (
                              val.length === 2 &&
                              endTime.length === 1 &&
                              !val.includes(':')
                            )
                              val += ':';
                            setEndTime(val);
                          }}
                          onBlur={(e) =>
                            handleTimeBlur(e.target.value, setEndTime)
                          }
                        />
                      </div>
                    </div>

                    {/* Updated Color Picker Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase ">
                        Shift Color
                      </label>
                      <div className="pt-2">
                        <CirclePicker
                          color={color || companyColor || "#2196f3"}
                          width="252px"
                          colors={themeColors}
                          circleSize={28}
                          circleSpacing={14}
                          onChangeComplete={(color) => setColor(color.hex)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 animate-in fade-in">
                    A leave type is currently selected.
                    <br />
                    Standard shift time fields are disabled.
                  </div>
                )}

                {/* Leave Type Selector */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="text-xs font-bold uppercase ">
                    Leave Type
                  </label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-gray-100 bg-gray-50/50 p-4">
                    {leaveOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`leave-${option.id}`}
                          checked={leaveType === option.id}
                          onCheckedChange={(checked) =>
                            setLeaveType(checked ? option.id : '')
                          }
                        />
                        <label
                          htmlFor={`leave-${option.id}`}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white p-5">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEmployees.length || !startDate || !endDate}
          >
            Bulk Assign
          </Button>
        </div>
      </div>
    </div>
  );
}