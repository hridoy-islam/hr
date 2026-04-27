import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import moment from '@/lib/moment-setup';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Loader2, CalendarRange, X, Search } from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface EmployeeOption {
  value: string;
  label: string;
  employeeData: User;
}

interface RotaData {
  _id: string;
  shiftName?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  departmentId?: { departmentName: string };
  employeeId: string | User;
}

interface EditFormState {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}


const formatDate = (dateObj: Date) => {
            const d = new Date(dateObj);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          
// ─── Main Component ───────────────────────────────────────────────────────────
export default function MissingAttendancePage() {
  const { id: companyId } = useParams();
  const { toast } = useToast();
const now = new Date();

const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  // Filter States
 const startOfMonth = formatDate(startOfMonthDate);
const endOfMonth = formatDate(endOfMonthDate);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [dateRange, setDateRange] = useState<[Date|string | null, Date |string| null]>([startOfMonth, endOfMonth]);
  const [startDateFilter, endDateFilter] = dateRange;

  
  // Data States
  const [rotas, setRotas] = useState<RotaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reconciliation States
  const [editingRotaId, setEditingRotaId] = useState<string | null>(null);
  const [submittingRotaId, setSubmittingRotaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  const datePickerClass = "w-full border border-gray-300 rounded-md px-3 h-8 text-sm outline-none focus:border-blue-500 transition-colors";

  // ─── Helper Functions ────────────────────────────────────────────────────────
  const calculateDuration = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return { minutes: 0, display: '--:--' };
    }
    const start = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const end = moment(`${endDate} ${endTime}`, 'YYYY-MM-DD HH:mm');
    const diffMins = end.diff(start, 'minutes');
    
    if (isNaN(diffMins)) return { minutes: 0, display: '--:--' };
    
    const hrs = Math.floor(Math.abs(diffMins) / 60);
    const mins = Math.abs(diffMins) % 60;
    const sign = diffMins < 0 ? '-' : '';
    
    return { 
      minutes: diffMins, 
      display: `${sign}${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}` 
    };
  };

  // ─── Fetch Employees for Dropdown ───────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return;
      try {
        const res = await axiosInstance.get(`/users?limit=all&role=employee&company=${companyId}`);
        const fetchedUsers: User[] = res.data?.data?.result || res.data?.data || [];
        const options = fetchedUsers.map(u => ({
          value: u._id,
          label: `${u.firstName || ''} ${u.lastName || u.name || ''}`.trim(),
          employeeData: u
        }));
        setEmployees(options);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    };
    fetchEmployees();
  }, [companyId]);

  // ─── Fetch Missing Attendance Data ──────────────────────────────────────────
  // Added isReset parameter to bypass state filters safely
  // ─── Fetch Missing Attendance Data ──────────────────────────────────────────
  const fetchRotas = async(isReset = false) => {
    if (!companyId) return;
    
    setIsLoading(true);
    setEditingRotaId(null);
    
    try {
      let url = `/rota/missed-attendance?companyId=${companyId}&limit=all`;
      
      if (!isReset) {
        if (selectedEmployee) {
          url += `&employeeId=${selectedEmployee.value}`;
        }
        
        // Handle single date or range from state
        if (startDateFilter) {
          const startStr = formatDate(startDateFilter);
          const endStr = endDateFilter ? formatDate(endDateFilter) : startStr;
          
          url += `&startDate=${startStr}&endDate=${endStr}`;
        }
      } else {
        // FIX: Explicitly apply the default month dates during a reset
        const defaultStart = formatDate(startOfMonthDate);
        const defaultEnd = formatDate(endOfMonthDate);
        url += `&startDate=${defaultStart}&endDate=${defaultEnd}`;
      }

      const res = await axiosInstance.get(url);
      setRotas(res.data?.data?.result || res.data?.data || []);
    } catch (err: any) {
      console.error('Error fetching rotas:', err);
      toast({
        variant: 'destructive',
        title: 'Fetch Error',
        description: err?.response?.data?.message || 'Failed to fetch missed shifts'
      });
      setRotas([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRotas(); 
  }, [companyId]);

  const handleSearch = () => {
    fetchRotas(false);
  };

  // ─── Handle Reset / Cancel Search ───────────────────────────────────────────
  const handleCancel = () => {
    const startOfMonth = formatDate(startOfMonthDate);
const endOfMonth = formatDate(endOfMonthDate);
    setSelectedEmployee(null);
    setDateRange([startOfMonth, endOfMonth]);
    setEditingRotaId(null);
    setEditForm({ startDate: '', endDate: '', startTime: '', endTime: '' });
    setEditError(null);
    
    // Fetch and explicitly tell it to bypass the current filter state
    fetchRotas(true);
  };

  // ─── Select Shift for Reconciliation ────────────────────────────────────────
  const handleReconcileClick = (rota: RotaData) => {
    setEditingRotaId(rota._id);
    setEditForm({
      startDate: rota.startDate,
      endDate: rota.endDate,
      startTime: rota.startTime,
      endTime: rota.endTime
    });
    setEditError(null);
  };

  // ─── Handlers for Reconciliation Form ───────────────────────────────────────
  const handleFormChange = (field: keyof EditFormState, value: string) => {
    let processedValue = value;

    if (field === 'startTime' || field === 'endTime') {
      processedValue = processedValue.replace(/[^0-9:]/g, '').slice(0, 5);
      if (
        processedValue.length === 2 &&
        editForm[field].length === 1 &&
        !processedValue.includes(':')
      ) {
        processedValue += ':';
      }
    }

    setEditForm({ ...editForm, [field]: processedValue });
    setEditError(null);
  };

  const handleTimeBlur = (field: keyof EditFormState, value: string) => {
    let cleanValue = value.trim();
    if (cleanValue) {
      const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
      if (m.isValid()) {
        cleanValue = m.format('HH:mm');
      }
    }
    setEditForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  // ─── Handle Final Submit ────────────────────────────────────────────────────
  const handleSubmit = async (rotaId: string, isReconciled: boolean) => {
    const selectedRota = rotas.find(r => r._id === rotaId);
    if (!selectedRota) return;

    setSubmittingRotaId(rotaId);
    setEditError(null);

    let finalStartDate = selectedRota.startDate;
    let finalEndDate = selectedRota.endDate || selectedRota.startDate;
    let finalStartTime = selectedRota.startTime;
    let finalEndTime = selectedRota.endTime;

    if (isReconciled) {
      if (!editForm.startDate || !editForm.endDate || !editForm.startTime || !editForm.endTime) {
        setEditError('All dates and times are required.');
        setSubmittingRotaId(null);
        toast({ variant: 'destructive', title: 'Validation Error', description: 'All dates and times are required.' });
        return;
      }
      finalStartDate = editForm.startDate;
      finalEndDate = editForm.endDate;
      finalStartTime = editForm.startTime;
      finalEndTime = editForm.endTime;
    }

    try {
      const payloadClockInDate = moment(finalStartDate).startOf('day').toISOString();
      const payloadClockOutDate = moment(finalEndDate).startOf('day').toISOString();
      const payloadClockIn = moment(`${finalStartDate} ${finalStartTime}`, 'YYYY-MM-DD HH:mm').toISOString();
      const payloadClockOut = moment(`${finalEndDate} ${finalEndTime}`, 'YYYY-MM-DD HH:mm').toISOString();

      // Ensure we have correct employee ID based on rota object mapping
      const employeeIdToSubmit = typeof selectedRota.employeeId === 'object' 
        ? (selectedRota.employeeId as User)._id 
        : selectedRota.employeeId;

      const payload = {
        userId: employeeIdToSubmit,
        companyId: companyId,
        userType: 'employee',
        status: 'clockout', 
        clockType: 'manual', 
        rotaId: rotaId,
        clockInDate: payloadClockInDate,
        clockOutDate: payloadClockOutDate,
        clockIn: payloadClockIn,
        clockOut: payloadClockOut,
        isApproved: true
      };

      await axiosInstance.post('/hr/attendance/clock-event', payload);

      toast({
        title: 'Success',
        description: 'Attendance created successfully.'
      });

      // Remove the successfully reconciled rota from list
      setRotas(prev => prev.filter(r => r._id !== rotaId));
      setEditingRotaId(null);

    } catch (error: any) {
      console.error('Submit Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit attendance.'
      });
    } finally {
      setSubmittingRotaId(null);
    }
  };

  return (
    <div className="flex min-h-[70vh] w-full flex-col gap-6 bg-white p-6 rounded-md shadow-sm">
      
      {/* ── Header & Filters ── */}
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Missed Attendance</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64 min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-gray-600">Employee</label>
            <Select
              options={employees}
              value={selectedEmployee}
              onChange={(option) => setSelectedEmployee(option as EmployeeOption)}
              placeholder="Select Employee..."
              className="text-sm"
              isClearable
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-semibold text-gray-600">Date Range</label>
            <div className="flex h-[38px] items-center gap-2 rounded-md border border-gray-300 bg-white px-3 shadow-sm">
              <CalendarRange className="h-4 w-4 text-gray-400" />
              <DatePicker
                selectsRange
                startDate={startDateFilter}
                endDate={endDateFilter}
                onChange={(update) => setDateRange(update)}
                dateFormat="dd-MM-yyyy"
                placeholderText="Start Date - End Date"
                className="w-56 border-none text-sm outline-none placeholder:text-gray-400"
              />
              {startDateFilter && (
                <button
                  onClick={() => setDateRange([null, null])}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2 self-end pb-[1px]">
            <Button onClick={handleSearch} className="h-[38px] gap-2 bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button onClick={handleCancel} variant="outline" className="h-[38px]">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* ── Data Display ── */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
          <BlinkingDots size='large' color='bg-theme' />
          </div>
        ) : rotas.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center border border-gray-300 rounded-lg bg-gray-50">
            <div className="mb-4 rounded-full bg-red-50 p-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No shift found</h3>
            <p className="max-w-[250px] text-sm text-gray-500">
              There are no missing attendance records matching your criteria.
            </p>
          </div>
        ) : (
          <div className=" bg-white">
            <Table>
              <TableHeader>
                <TableRow className="">
                  <TableHead>Shift Info</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-[12%]">Start Date</TableHead>
                  <TableHead className="w-[10%]">Start Time</TableHead>
                  <TableHead className="w-[12%]">End Date</TableHead>
                  <TableHead className="w-[10%]">End Time</TableHead>
                  <TableHead className="w-[10%]">Duration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotas.map((rota) => {
                  const isEditing = editingRotaId === rota._id;
                  const isSubmittingThis = submittingRotaId === rota._id;
                  
                  // Extract employee data dynamically whether populated or selected directly
                  const employeeObj = typeof rota.employeeId === 'object' ? rota.employeeId : selectedEmployee?.employeeData;
                  const shiftName = rota.shiftName || '';
                  const departmentName = rota.departmentId?.departmentName || '--';
                  const fullName = employeeObj ? `${employeeObj.firstName || ''} ${employeeObj.lastName || employeeObj.name || ''}`.trim() : 'Unknown';
                  const email = employeeObj?.email || '--';

                  const displayDate = (d: string) => d ? moment(d).format('DD-MM-YYYY') : '--';
                  const displayTime = (t: string) => {
                    if (!t || t === '--') return '--';
                    if (t.includes('T')) return moment(t).format('HH:mm');
                    if (t.length >= 5) return t.substring(0, 5);
                    return t;
                  };

                  let dCalc;
                  if (isEditing) {
                    dCalc = calculateDuration(
                      editForm.startDate,
                      editForm.startTime,
                      editForm.endDate,
                      editForm.endTime
                    );
                  } else {
                    dCalc = calculateDuration(
                      rota.startDate,
                      rota.startTime,
                      rota.endDate || rota.startDate,
                      rota.endTime
                    );
                  }

                  if (dCalc && dCalc.minutes < 1) dCalc.display = '00:00';
                  const isDurationValid = isEditing ? dCalc.minutes > 0 : true;

                  return (
                    <TableRow key={rota._id}>
                      {/* Shift Info */}
                      <TableCell className="text-sm font-medium">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {shiftName ? shiftName : '-'}
                          </span>
                          <span className="mt-0.5 text-xs font-semibold tracking-wide text-gray-800">
                            {displayTime(rota.startTime)} - {displayTime(rota.endTime)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Employee Info */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{fullName}</span>
                          <span className="text-xs text-gray-500">{email}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">{departmentName}</TableCell>

                      {/* Attendance Start Date */}
                      <TableCell className="text-sm">
                        {isEditing ? (
                          <div className="relative w-[115px]">
                            <DatePicker
                              selected={editForm.startDate ? moment(editForm.startDate).toDate() : null}
                              onChange={(date: Date | null) => {
                                const val = date ? moment(date).format('YYYY-MM-DD') : '';
                                handleFormChange('startDate', val);
                              }}
                              dateFormat="dd-MM-yyyy"
                              className={datePickerClass}
                              placeholderText="Start Date"
                              portalId="root"
                            />
                          </div>
                        ) : (
                          displayDate(rota.startDate)
                        )}
                      </TableCell>

                      {/* Attendance Start Time */}
                      <TableCell className="font-mono text-sm">
                        {isEditing ? (
                          <Input
                            value={editForm.startTime}
                            onChange={(e) => handleFormChange('startTime', e.target.value)}
                            onBlur={(e) => handleTimeBlur('startTime', e.target.value)}
                            placeholder="HH:mm"
                            className="h-8 w-20 font-mono text-sm"
                            maxLength={5}
                          />
                        ) : (
                          displayTime(rota.startTime)
                        )}
                      </TableCell>

                      {/* Attendance End Date */}
                      <TableCell className="text-sm">
                        {isEditing ? (
                          <div className="relative w-[115px]">
                            <DatePicker
                              selected={editForm.endDate ? moment(editForm.endDate).toDate() : null}
                              onChange={(date: Date | null) => {
                                const val = date ? moment(date).format('YYYY-MM-DD') : '';
                                handleFormChange('endDate', val);
                              }}
                              dateFormat="dd-MM-yyyy"
                              className={datePickerClass}
                              placeholderText="End Date"
                              portalId="root"
                              minDate={editForm.startDate ? moment(editForm.startDate).toDate() : null}
                            />
                          </div>
                        ) : (
                          displayDate(rota.endDate || rota.startDate)
                        )}
                      </TableCell>

                      {/* Attendance End Time */}
                      <TableCell className="font-mono text-sm">
                        {isEditing ? (
                          <Input
                            value={editForm.endTime}
                            onChange={(e) => handleFormChange('endTime', e.target.value)}
                            onBlur={(e) => handleTimeBlur('endTime', e.target.value)}
                            placeholder="HH:mm"
                            className="h-8 w-20 font-mono text-sm"
                            maxLength={5}
                          />
                        ) : (
                          displayTime(rota.endTime)
                        )}
                      </TableCell>

                      {/* Attendance Duration */}
                      <TableCell className="text-sm">
                        <div className={`flex items-center gap-1 font-mono text-sm ${
                          !isDurationValid && isEditing ? 'font-bold text-red-500' : 'text-gray-900'
                        }`}>
                          {dCalc.display}
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingRotaId(null);
                                  setEditError(null);
                                }}
                                disabled={isSubmittingThis}
                                className="h-8 px-3"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSubmit(rota._id, true)}
                                disabled={isSubmittingThis || !isDurationValid}
                                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isSubmittingThis && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                                Submit
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-black hover:bg-gray-800 text-white"
                                onClick={() => handleReconcileClick(rota)}
                                disabled={submittingRotaId !== null}
                              >
                                Reconcile
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleSubmit(rota._id, false)}
                                disabled={submittingRotaId !== null}
                              >
                                {isSubmittingThis && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                                Submit
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}