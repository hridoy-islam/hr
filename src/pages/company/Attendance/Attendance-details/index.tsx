import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from '@/lib/moment-setup';
import {
  ArrowLeft,
  User,
  Briefcase,
  Clock,
  Calendar,
  Edit,
  Plus,
  Trash2,
  Save,
  Loader2,
  Building,
  AlertCircle
} from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Imports
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';

const datePickerClass =
  "flex h-8 w-[110px] rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const AttendanceDetails = () => {
  const { aid } = useParams<{ aid: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Editing State
  const [editedLogs, setEditedLogs] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string>('');
  
  // Dialog state for deletion
  const [logToDelete, setLogToDelete] = useState<number | null>(null);

  // Fetch Attendance Details
  const fetchAttendanceDetails = async () => {
    if (!aid) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/hr/attendance/${aid}`);
      const data = res.data?.data;
      if (data) {
        setRecord(data);
        setEditedLogs(JSON.parse(JSON.stringify(data.attendanceLogs || [])));
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceDetails();
  }, [aid]);

  // Display Helpers
  const displayTime = (t: string) => {
    if (!t || t === '--') return '--';
    if (t.includes('T')) return moment(t).format('HH:mm');
    if (t.length >= 5) return t.substring(0, 5);
    return t;
  };

  const displayDate = (d: string) => {
    return d ? moment(d).format('DD-MM-YYYY') : '--';
  };

  // Handle Log Input Changes
  const handleLogChange = (index: number, field: string, value: string) => {
    const updatedLogs = [...editedLogs];
    updatedLogs[index][field] = value;
    setEditedLogs(updatedLogs);
    setEditError(''); // Clear errors when user types
  };

  // Format Time on Blur (e.g., converting "0900" to "09:00")
  const handleTimeBlur = (index: number, field: string, value: string) => {
    if (!value) return;
    let formatted = value.replace(/[^\d:]/g, ''); // keep only digits and colon
    if (!formatted.includes(':') && formatted.length >= 3) {
      if (formatted.length === 3) formatted = `0${formatted.charAt(0)}:${formatted.slice(1)}`; 
      else formatted = `${formatted.slice(0, 2)}:${formatted.slice(2, 4)}`;
    }
    handleLogChange(index, field, formatted);
  };

  // Enable Edit Mode for a row
  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditError('');
  };

  // Cancel Edit Mode and revert changes
  const handleCancelEdit = () => {
    setEditedLogs(JSON.parse(JSON.stringify(record?.attendanceLogs || [])));
    setEditingIndex(null);
    setEditError('');
  };

  // Add New Log Entry directly to table
  const handleAddLog = () => {
    const newLogs = [
      ...editedLogs,
      { 
        clockIn: '', 
        clockInDate: record?.rotaId?.startDate || record?.date || '', 
        clockOut: '', 
        clockOutDate: record?.rotaId?.startDate || record?.date || '' 
      }
    ];
    setEditedLogs(newLogs);
    setEditingIndex(newLogs.length - 1); 
    setEditError('');
  };

  // Execute the removal after confirmation
  const confirmRemoveLog = async () => {
    if (logToDelete === null) return;
    
    const index = logToDelete;
    const updatedLogs = editedLogs.filter((_, i) => i !== index);
    setEditedLogs(updatedLogs);
    
    if (!aid) {
      setLogToDelete(null);
      return;
    }
    
    setIsSaving(true);
    try {
      const cleanedLogs = updatedLogs.filter(log => log.clockIn || log.clockOut);
      await axiosInstance.patch(`/hr/attendance/${aid}`, { attendanceLogs: cleanedLogs });
      setEditingIndex(null);
      setEditError('');
      fetchAttendanceDetails();
    } catch (error) {
      console.error('Error removing attendance log:', error);
      setEditError("Failed to delete the record. Please try again.");
    } finally {
      setIsSaving(false);
      setLogToDelete(null);
    }
  };

  // Submit Reconciled Logs (With Validation)
// Submit Reconciled Logs (With Validation)
  const handleSaveRow = async () => {
    if (editingIndex === null || !aid) return;
    const currentLog = editedLogs[editingIndex];
    
    // Extract Shift details
    const rotaStartDateStr = record?.rotaId?.startDate;
    const rotaEndDateStr = record?.rotaId?.endDate;
    const shiftStartTime = record?.rotaId?.startTime;
    const shiftEndTime = record?.rotaId?.endTime;

    // Validation Logic against Schedule Dates and Times
    if (rotaStartDateStr && rotaEndDateStr) {
      const rotaStart = moment(rotaStartDateStr, 'YYYY-MM-DD');
      const rotaEnd = moment(rotaEndDateStr, 'YYYY-MM-DD');

      // 1. Basic Date-Only validation
      if (currentLog.clockInDate) {
        const inDate = moment(currentLog.clockInDate, 'YYYY-MM-DD');
        if (inDate.isBefore(rotaStart) || inDate.isAfter(rotaEnd)) {
          setEditError(`Start Date must be between ${rotaStart.format('DD-MM-YYYY')} and ${rotaEnd.format('DD-MM-YYYY')}.`);
          return;
        }
      }

      if (currentLog.clockOutDate) {
        const outDate = moment(currentLog.clockOutDate, 'YYYY-MM-DD');
        if (outDate.isBefore(rotaStart) || outDate.isAfter(rotaEnd)) {
          setEditError(`End Date must be between ${rotaStart.format('DD-MM-YYYY')} and ${rotaEnd.format('DD-MM-YYYY')}.`);
          return;
        }
      }

      // 2. Strict DateTime validation (Ensuring punches fall between Shift Start and End Times)
      if (shiftStartTime && shiftEndTime) {
        const shiftStartBoundary = moment(`${rotaStartDateStr} ${shiftStartTime}`, 'YYYY-MM-DD HH:mm');
        const shiftEndBoundary = moment(`${rotaEndDateStr} ${shiftEndTime}`, 'YYYY-MM-DD HH:mm');

        // Check Clock In
        if (currentLog.clockInDate && currentLog.clockIn) {
          const inMoment = moment(`${currentLog.clockInDate} ${currentLog.clockIn}`, 'YYYY-MM-DD HH:mm');
          if (inMoment.isBefore(shiftStartBoundary) || inMoment.isAfter(shiftEndBoundary)) {
            setEditError(`Clock In time must be between ${shiftStartBoundary.format('HH:mm')} and ${shiftEndBoundary.format('HH:mm')}.`);
            return;
          }
        }

        // Check Clock Out
        if (currentLog.clockOutDate && currentLog.clockOut) {
          const outMoment = moment(`${currentLog.clockOutDate} ${currentLog.clockOut}`, 'YYYY-MM-DD HH:mm');
          if (outMoment.isBefore(shiftStartBoundary) || outMoment.isAfter(shiftEndBoundary)) {
            setEditError(`Clock Out time must be between ${shiftStartBoundary.format('HH:mm')} and ${shiftEndBoundary.format('HH:mm')}.`);
            return;
          }
        }
      }
    }

    // 3. Start vs End Logic (Ensuring End Time > Start Time)
    if (currentLog.clockInDate && currentLog.clockOutDate) {
      const startD = moment(currentLog.clockInDate, 'YYYY-MM-DD');
      const endD = moment(currentLog.clockOutDate, 'YYYY-MM-DD');

      if (endD.isBefore(startD)) {
        setEditError("End Date cannot be earlier than Start Date.");
        return;
      }

      if (endD.isSame(startD) && currentLog.clockIn && currentLog.clockOut) {
        const startT = moment(currentLog.clockIn, 'HH:mm');
        const endT = moment(currentLog.clockOut, 'HH:mm');
        
        if (endT.isBefore(startT)) {
          setEditError("End Time cannot be earlier than Start Time on the same day.");
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const cleanedLogs = editedLogs.filter(log => log.clockIn || log.clockOut);
      await axiosInstance.patch(`/hr/attendance/${aid}`, { attendanceLogs: cleanedLogs });
      setEditingIndex(null);
      setEditError('');
      fetchAttendanceDetails(); 
    } catch (error) {
      console.error('Error updating attendance logs:', error);
      setEditError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate duration using Date + Time for accurate cross-day calculation
const calculateLogDuration = (log: any) => {
    if (!log.clockIn || !log.clockOut) return '--';
    
    let start, end;
    if (log.clockInDate && log.clockOutDate) {
      start = moment(`${log.clockInDate} ${log.clockIn}`, 'YYYY-MM-DD HH:mm');
      end = moment(`${log.clockOutDate} ${log.clockOut}`, 'YYYY-MM-DD HH:mm');
    } else {
      start = moment(log.clockIn, 'HH:mm');
      end = moment(log.clockOut, 'HH:mm');
      if (end.isBefore(start)) end.add(1, 'day'); 
    }
    
    const totalMinutes = end.diff(start, 'minutes');
    if (isNaN(totalMinutes) || totalMinutes < 0) return '--';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Format with leading zeros (e.g., 8 becomes "08")
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  };
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center py-12">
        <h3 className="text-lg font-semibold text-gray-900">Record not found</h3>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const user = record.userId || {};
  const rota = record.rotaId || {};
  const departmentName = rota.departmentId?.departmentName || '--';
  const shiftName = rota.shiftName || '--';
  const shiftStartTime = rota.startTime || '--';
  const shiftEndTime = rota.endTime || '--';

  return (
    <div className="space-y-3">
      {/* SHADCN CONFIRMATION DIALOG FOR DELETE */}
      <AlertDialog open={logToDelete !== null} onOpenChange={(isOpen) => !isOpen && setLogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this punch record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                confirmRemoveLog();
              }} 
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SINGLE MAIN CARD WRAPPER */}
      <Card className="w-full shadow-md bg-white">
        
        {/* Header Section */}
        <CardHeader className="flex flex-row items-center justify-between pb-4 w-full">
          <div className="flex justify-between items-center gap-3 w-full">
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
              Attendance Details
            </CardTitle>
            <Button size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-3">
          
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* 1. Employee Info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-theme" /> Employee Details
              </div>
              <div className="text-lg font-bold text-gray-900">{`${user.firstName || ''} ${user.lastName || ''}`}</div>
              <div className="text-sm text-gray-800">{user.email || '--'}</div>
            </div>

            {/* 2. Department Info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-orange-500" /> Department
              </div>
              <div className="text-lg font-bold text-gray-900">{departmentName}</div>
            </div>

            {/* 3. Shift Info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-purple-500" /> Shift Information
              </div>
              <div className="text-lg font-bold text-gray-900">{shiftName}</div>
              <div className="text-sm text-gray-800 flex items-center gap-1 mt-1 font-semibold">
                <Clock className="h-3.5 w-3.5" /> {shiftStartTime} - {shiftEndTime}
              </div>
            </div>

            {/* 4. Date Info (Explicit Start and End) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-500" /> Scheduled Date
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-sm text-gray-900 flex items-center gap-8">
                  <span className="text-gray-800 w-12 font-medium whitespace-nowrap">Start Date:</span>
                  <span className="font-semibold">{rota.startDate ? moment(rota.startDate).format('DD-MM-YYYY') : '--'}</span>
                </div>
                <div className="text-sm text-gray-900 flex items-center gap-8">
                  <span className="text-gray-800 w-12 font-medium whitespace-nowrap">End Date:</span>
                  <span className="font-semibold">{rota.endDate ? moment(rota.endDate).format(' DD-MM-YYYY') : '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table Section */}
          <div className="rounded-md border border-gray-200 mt-6 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">Start Date</TableHead>
                  <TableHead className="w-[15%]">Start Time</TableHead>
                  <TableHead className="w-[15%]">End Date</TableHead>
                  <TableHead className="w-[15%]">End Time</TableHead>
                  <TableHead className="w-[15%]">Duration</TableHead>
                  <TableHead className="w-[25%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedLogs.length > 0 ? (
                  editedLogs.map((log: any, index: number) => {
                    const isEditing = editingIndex === index;
                    const hasError = isEditing && editError;
                    
                    return (
                      <React.Fragment key={log._id || index}>
                        <TableRow className={hasError ? "bg-red-50/40 hover:bg-red-50/60 transition-colors" : ""}>
                          {/* Start Date */}
                          <TableCell className="text-sm">
                            {isEditing ? (
                              <div className="relative">
                                <DatePicker
                                  selected={log.clockInDate ? moment(log.clockInDate).toDate() : null}
                                  onChange={(date: Date) => {
                                    const val = date ? moment(date).format('YYYY-MM-DD') : '';
                                    handleLogChange(index, 'clockInDate', val);
                                  }}
                                  dateFormat="dd-MM-yyyy"
                                  className={datePickerClass}
                                  placeholderText="Start Date"
                                  portalId="root"
                                />
                              </div>
                            ) : (
                              <span className="font-medium text-sm">
                                {displayDate(log.clockInDate)}
                              </span>
                            )}
                          </TableCell>

                          {/* Start Time */}
                          <TableCell className="font-mono text-sm">
                            {isEditing ? (
                              <Input
                                value={log.clockIn || ''}
                                onChange={(e) => handleLogChange(index, 'clockIn', e.target.value)}
                                onBlur={(e) => handleTimeBlur(index, 'clockIn', e.target.value)}
                                placeholder="HH:mm"
                                className="h-8 w-20 font-mono text-xs"
                                maxLength={5}
                              />
                            ) : (
                              <span>{displayTime(log.clockIn)}</span>
                            )}
                          </TableCell>

                          {/* End Date */}
                          <TableCell className="text-sm">
                            {isEditing ? (
                              <div className="relative">
                                <DatePicker
                                  selected={log.clockOutDate ? moment(log.clockOutDate).toDate() : null}
                                  onChange={(date: Date) => {
                                    const val = date ? moment(date).format('YYYY-MM-DD') : '';
                                    handleLogChange(index, 'clockOutDate', val);
                                  }}
                                  dateFormat="dd-MM-yyyy"
                                  className={datePickerClass}
                                  placeholderText="End Date"
                                  portalId="root"
                                />
                              </div>
                            ) : (
                              <span className="font-medium text-sm">
                                {displayDate(log.clockOutDate)}
                              </span>
                            )}
                          </TableCell>

                          {/* End Time */}
                          <TableCell className="font-mono text-sm">
                            {isEditing ? (
                              <Input
                                value={log.clockOut || ''}
                                onChange={(e) => handleLogChange(index, 'clockOut', e.target.value)}
                                onBlur={(e) => handleTimeBlur(index, 'clockOut', e.target.value)}
                                placeholder="HH:mm"
                                className="h-8 w-20 font-mono text-xs"
                                maxLength={5}
                              />
                            ) : (
                              <span>{displayTime(log.clockOut)}</span>
                            )}
                          </TableCell>

                          {/* Duration */}
                          <TableCell className="font-medium">
                            {calculateLogDuration(log)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex justify-end items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                                  Cancel
                                </Button>
                                {/* Triggers the Shadcn Dialog */}
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => setLogToDelete(index)} 
                                  disabled={isSaving} 
                                >
Delete                                </Button>
                                <Button size="sm" onClick={handleSaveRow} disabled={isSaving} className="h-8 bg-blue-600 hover:bg-blue-700">
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(index)} disabled={editingIndex !== null} className="h-8">
                                <Edit className="mr-2 h-3.5 w-3.5" /> Reconcile
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Inline Row Error Highlighting */}
                        {hasError && (
                          <TableRow className="bg-red-50 border-t-0 hover:bg-red-50">
                            <TableCell colSpan={6} className="py-2 px-4 border-t-0">
                              <div className="flex items-center text-sm font-medium text-red-600">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {editError}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-800">
                      No punch records found for this shift.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Add Punch Button */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/30 flex justify-center">
              <Button 
                size="sm" 
                onClick={handleAddLog}
                disabled={editingIndex !== null}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Punch Time
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceDetails;