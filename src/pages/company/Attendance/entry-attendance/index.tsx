import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from '@/lib/moment-setup';
import { CalendarFold, Clock, User, AlertCircle, Search, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// --- Types ---
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface SelectOption {
  value: string;
  label: string;
  employeeData?: Employee;
}

interface RotaData {
  _id: string;
  shiftName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  leaveType?: string;
  departmentId?: any;
}

interface EditFormState {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

// --- Helpers ---
const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
) => {
  if (!startTime || !endTime) {
    return { display: '00:00', minutes: 0 };
  }

  const start = startTime.includes('T')
    ? moment(startTime)
    : moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');

  const end = endTime.includes('T')
    ? moment(endTime)
    : moment(`${endDate} ${endTime}`, 'YYYY-MM-DD HH:mm');

  if (!start.isValid() || !end.isValid()) {
    return { display: '00:00', minutes: 0 };
  }

  const diffMinutes = end.diff(start, 'minutes');
  if (diffMinutes <= 0) {
    return { display: '00:00', minutes: 0 };
  }

  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return {
    display: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
    minutes: diffMinutes
  };
};

export default function EntryAttendance() {
  const { toast } = useToast();
  const { id: companyId } = useParams();

  // --- Search State ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<SelectOption | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<Date | null>(null);

  // --- Rota State ---
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rotas, setRotas] = useState<RotaData[]>([]);

  // --- Reconciliation State ---
  const [editingRotaId, setEditingRotaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  // --- Submission State ---
  const [submittingRotaId, setSubmittingRotaId] = useState<string | null>(null);

  // --- Fetch Employees on Mount ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empRes = await axiosInstance.get(
          `/users?company=${companyId}&status=active&role=employee&limit=all`
        );
        setEmployees(empRes.data.data.result || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employees.',
          variant: 'destructive'
        });
      }
    };
    if (companyId) {
      fetchEmployees();
    }
  }, [companyId, toast]);

  // --- Handle Search Rota ---
  const handleSearchRotas = async () => {
    if (!selectedEmployee) {
      toast({ title: 'Validation', description: 'Please select an employee.', variant: 'destructive' });
      return;
    }
    if (!attendanceDate) {
      toast({ title: 'Validation', description: 'Please select an attendance date.', variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setEditingRotaId(null);
    setEditError(null);

    try {
      // Local time formatting for the query payload
      const offset = attendanceDate.getTimezoneOffset();
      const formattedDate = new Date(attendanceDate.getTime() - (offset * 60 * 1000))
        .toISOString()
        .split('T')[0];
      
      const res = await axiosInstance.get(
        `/rota?companyId=${companyId}&attendanceDate=${formattedDate}&employeeId=${selectedEmployee.value}&status=publish&limit=all`
      );

      const fetchedRotas: RotaData[] = res.data?.data?.result || [];
      
      // Filter out rotas that have a leaveType
      const availableShifts = fetchedRotas.filter(rota => !rota.leaveType);

      setRotas(availableShifts);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching rotas:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to find rotas.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // --- Select Shift for Reconciliation ---
  const handleReconcileClick = (rota: RotaData) => {
    setEditingRotaId(rota._id);
    setEditForm({
      startDate: rota.startDate,
      endDate: rota.endDate || rota.startDate,
      startTime: rota.startTime,
      endTime: rota.endTime
    });
    setEditError(null);
  };

  // --- Handlers for Reconciliation Form ---
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

  // --- Handle Reset / Cancel Search ---
  const handleCancel = () => {
    setSelectedEmployee(null);
    setAttendanceDate(null);
    setRotas([]);
    setEditingRotaId(null);
    setHasSearched(false);
    setEditForm({ startDate: '', endDate: '', startTime: '', endTime: '' });
    setEditError(null);
  };

  // --- Handle Final Submit ---
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
        return;
      }
      finalStartDate = editForm.startDate;
      finalEndDate = editForm.endDate;
      finalStartTime = editForm.startTime;
      finalEndTime = editForm.endTime;
    }

    try {
      // Create fully ISO formatted dates from the reconciled state for the ATTENDANCE model
      const payloadClockInDate = moment(finalStartDate).startOf('day').toISOString();
      const payloadClockOutDate = moment(finalEndDate).startOf('day').toISOString();
      
      const payloadClockIn = moment(`${finalStartDate} ${finalStartTime}`, 'YYYY-MM-DD HH:mm').toISOString();
      const payloadClockOut = moment(`${finalEndDate} ${finalEndTime}`, 'YYYY-MM-DD HH:mm').toISOString();

      const payload = {
        userId: selectedEmployee?.value,
        companyId: companyId,
        userType: 'employee',
        status: 'clockout', 
        clockType: 'manual', 
        rotaId: rotaId,
        clockInDate: payloadClockInDate,
        clockOutDate: payloadClockOutDate,
        clockIn: payloadClockIn,
        clockOut: payloadClockOut,
        isApproved:true
      };

      await axiosInstance.post('/hr/attendance/clock-event', payload);

      toast({
        title: 'Thank You',
        description: 'Attendance Created successfully.'
      });

      handleCancel();
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

  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label: `${emp.firstName} ${emp.lastName}`,
    employeeData: emp
  }));

  const datePickerClass = 'flex h-8 w-24 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme';

  return (
    <div className="mx-auto">
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl ">
            <Clock className="h-5 w-5" />
            Attendance Entry
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 min-h-[80vh]">
          <div className="space-y-6">
            
            {/* --- STEP 1: Search --- */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-theme" /> Employee{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  options={employeeOptions}
                  value={selectedEmployee}
                  onChange={(val) => {
                    setSelectedEmployee(val);
                    setHasSearched(false);
                  }}
                  classNamePrefix="select"
                  placeholder="Select Employee..."
                  isClearable
                  isDisabled={isSearching || submittingRotaId !== null}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <CalendarFold className="h-4 w-4 text-theme" /> Attendance Date{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    selected={attendanceDate}
                    onChange={(date) => {
                      setAttendanceDate(date);
                      setHasSearched(false); 
                    }}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-theme focus:ring-1 focus:ring-theme disabled:opacity-50"
                    wrapperClassName="w-full"
                    placeholderText="DD-MM-YYYY"
                    disabled={isSearching || submittingRotaId !== null}
                  />
                  <CalendarFold className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 gap-3">
              {hasSearched && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={submittingRotaId !== null}
                >
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSearchRotas} 
                disabled={isSearching || !selectedEmployee || !attendanceDate}
                className="bg-theme px-8 text-white hover:bg-theme/90"
              >
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* --- STEP 2: Shift List (Table Format) --- */}
            {hasSearched && (
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-gray-700">Available Shifts</h3>
                
                {editError && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-500">
                    {editError}
                  </div>
                )}

                {rotas.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center border border-gray-300 rounded-lg bg-gray-50">
                    <div className="mb-4 rounded-full bg-red-50 p-4">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      No shift found
                    </h3>
                    <p className="max-w-[250px] text-sm text-gray-500">
                      Please check the rota for this date.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-300">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shift Info</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="w-[10%]">Start Date</TableHead>
                          <TableHead className="w-[10%]">Start Time</TableHead>
                          <TableHead className="w-[10%]">End Date</TableHead>
                          <TableHead className="w-[10%]">End Time</TableHead>
                          <TableHead className="w-[10%]">Duration</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rotas.map((rota) => {
                          const isEditing = editingRotaId === rota._id;
                          const isSubmittingThis = submittingRotaId === rota._id;
                          const employeeData = selectedEmployee?.employeeData;
                          
                          const shiftName = rota.shiftName || '';
                          const departmentName = rota.departmentId?.departmentName || '--';
                          const fullName = employeeData ? `${employeeData.firstName} ${employeeData.lastName}` : 'Unknown';
                          const email = employeeData?.email || '--';

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
                                    {rota.startTime} - {rota.endTime}
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
                                  <div className="relative max-w-[110px]">
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
                                    className="h-8 w-20 font-mono text-xs"
                                    maxLength={5}
                                  />
                                ) : (
                                  displayTime(rota.startTime)
                                )}
                              </TableCell>

                              {/* Attendance End Date */}
                              <TableCell className="text-sm">
                                {isEditing ? (
                                  <div className="relative max-w-[110px]">
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
                                    className="h-8 w-20 font-mono text-xs"
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
                                        onClick={() => setEditingRotaId(null)}
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
                                        {isSubmittingThis && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
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
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}