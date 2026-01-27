import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import Select from 'react-select';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  CalendarCheck,
  ChevronDown,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Eye
} from 'lucide-react';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import {
  downloadPayrollPDF,
  getPayrollPDFBlob
} from '../components/PayrollPDF';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// --- Types ---
interface TShiftDetails {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  companyId: string;
}

interface TRateMap {
  [key: string]: { rate: number };
}

interface TEmployeeRateDoc {
  _id: string;
  employeeId: string;
  shiftId: TShiftDetails[];
  rates: TRateMap;
}

interface TAttendanceItem {
  _id?: string;
  employementRateId?: string;
  shiftId?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  payRate: number;
  note: string;
  bankHoliday: boolean;
  bankHolidayId?: string;
}

interface TBankHoliday {
  _id: string;
  title: string;
  date: string;
}

interface TPayrollData {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    departmentId?: { departmentName: string };
    designationId?: { title: string };
  };
  attendanceList: TAttendanceItem[];
  fromDate: string;
  toDate: string;
  totalAmount: number;
  totalHour: number;
  status: 'pending' | 'approved' | 'rejected';
}

const ViewPayroll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payroll, setPayroll] = useState<TPayrollData | null>(null);
  const [attendanceItems, setAttendanceItems] = useState<TAttendanceItem[]>([]);
  const [employeeRates, setEmployeeRates] = useState<TEmployeeRateDoc[]>([]);
  const [bankHolidays, setBankHolidays] = useState<TBankHoliday[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDetailed, setPreviewDetailed] = useState(false);
  // Check if payroll is approved (disable editing)
  const isApproved = payroll?.status === 'approved';

  // --- Helper: Robust Time Formatter ---
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '00:00';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return '00:00';
  };

  // --- Helper: Convert minutes to HH:mm format for display ---
  const formatDurationToHHmm = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const payrollRes = await axiosInstance.get(`/hr/payroll/${id}`);
        const data = payrollRes.data.data;
        setPayroll(data);

        const formattedList = (data.attendanceList || []).map((item: any) => ({
          ...item,
          startDate: moment(item.startDate).format('YYYY-MM-DD'),
          endDate: moment(item.endDate).format('YYYY-MM-DD'),
          startTime: formatTime(item.startTime),
          endTime: formatTime(item.endTime),
          bankHoliday: item.bankHoliday || false,
          note: item.note || '',
          payRate: item.payRate || 0,
          employementRateId: item.employementRateId || '',
          shiftId: item.shiftId || ''
        }));
        setAttendanceItems(formattedList);

        if (data.userId?._id) {
          const rateRes = await axiosInstance.get('/hr/employeerate', {
            params: { employeeId: data.userId._id, limit: 'all' }
          });
          setEmployeeRates(rateRes.data.data.result || []);
        }

        const payrollYear = moment(data.fromDate).year();
        const companyId = user?.companyId || user?._id;

        if (companyId) {
          const holidayRes = await axiosInstance.get('/hr/bank-holiday', {
            params: { companyId, year: payrollYear, limit: 'all' }
          });
          setBankHolidays(holidayRes.data.data.result || []);
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to load details.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, toast]);

  const getShiftSchedule = (shiftId: string) => {
    if (!employeeRates.length || !shiftId) return '';
    for (const doc of employeeRates) {
      const shift = doc.shiftId?.find((s) => s._id === shiftId);
      if (shift) {
        return `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;
      }
    }
    return '';
  };

  const getCalculatedRate = (rateDocId: string, dateStr: string) => {
    const rateDoc = employeeRates.find((d) => d._id === rateDocId);
    if (!rateDoc || !dateStr) return 0;
    const dayOfWeek = moment(dateStr).format('dddd');
    const dayRate = rateDoc.rates[dayOfWeek as keyof TRateMap];
    return dayRate ? dayRate.rate : 0;
  };

  // Calculate duration in minutes for accuracy
  const calculateDurationInMinutes = (item: TAttendanceItem) => {
    if (!item.startDate || !item.startTime || !item.endDate || !item.endTime)
      return 0;
    const attStart = moment(`${item.startTime}`, 'HH:mm:ss:SSS');
    const attEnd = moment(`${item.endTime}`, 'HH:mm:ss:SSS');
    return moment.duration(attEnd.diff(attStart)).asMinutes();
  };

  const updateRow = (
    index: number,
    field: keyof TAttendanceItem,
    value: any
  ) => {
    if (isApproved) return; // Prevent editing if approved
    const newItems = [...attendanceItems];
    const currentRow = { ...newItems[index], [field]: value };

    if (field === 'shiftId') {
      const targetRateDoc = employeeRates.find((doc) =>
        doc.shiftId?.some((s) => s._id === value)
      );
      if (targetRateDoc) {
        currentRow.employementRateId = targetRateDoc._id;
        currentRow.payRate = getCalculatedRate(
          targetRateDoc._id,
          currentRow.startDate
        );
      }
    }

    if (field === 'bankHoliday' && value === false) {
      currentRow.bankHolidayId = undefined;
      if (currentRow.employementRateId) {
        currentRow.payRate = getCalculatedRate(
          currentRow.employementRateId,
          currentRow.startDate
        );
      }
    }

    newItems[index] = currentRow;
    setAttendanceItems(newItems);
  };

  const handlePreview = async (detailed: boolean) => {
    if (!payroll) return;
    try {
      const blob = await getPayrollPDFBlob(payroll, detailed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewDetailed(detailed);
      setPreviewOpen(true);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not generate preview',
        variant: 'destructive'
      });
    }
  };
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  const handleSaveWithStatus = async (newStatus: 'pending' | 'approved') => {
    if (!id) return;
    setSaving(true);
    try {
      let totalMinutesAccum = 0;
      let totalAmountAccum = 0;

      const updatedList = attendanceItems.map((item) => {
        const mins = calculateDurationInMinutes(item);
        const hours = mins / 60;
        const lineTotal = hours * Number(item.payRate || 0);

        totalMinutesAccum += mins;
        totalAmountAccum += lineTotal;

        return item;
      });

      const payload = {
        attendanceList: updatedList,
        totalHour: parseFloat(totalMinutesAccum.toFixed(2)),
        totalAmount: parseFloat(totalAmountAccum.toFixed(2)),
        status: newStatus
      };

      await axiosInstance.patch(`/hr/payroll/${id}`, payload);

      toast({
        title: 'Success',
        description: `Payroll ${newStatus === 'approved' ? 'approved' : 'saved as pending'} successfully.`
      });

      navigate(-1);

      setPayroll((prev) => (prev ? { ...prev, ...payload } : null));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save changes.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '32px',
      height: '32px',
      fontSize: '12px',
      borderColor: '#e2e8f0'
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: '32px',
      padding: '0 6px'
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '32px'
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <BlinkingDots size="large" />
      </div>
    );
  }

  if (!payroll) return <div>Not Found</div>;

  const shiftOptions = employeeRates.flatMap((rateDoc) =>
    (rateDoc.shiftId || []).map((s) => ({
      value: s._id,
      label: s.name
    }))
  );

  // --- Calculate Totals for Display ---
  const totalMinutes = attendanceItems.reduce(
    (acc, item) => acc + calculateDurationInMinutes(item),
    0
  );
  const totalHoursForDisplay = totalMinutes / 60;
  const totalAmount = attendanceItems.reduce((acc, item) => {
    const mins = calculateDurationInMinutes(item);
    return acc + (mins / 60) * (item.payRate || 0);
  }, 0);

  return (
    <div className="space-y-3 rounded-md bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Details</h1>
        <div className="flex flex-row items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-300">
                <Eye className="mr-2 h-4 w-4" />
                Preview
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handlePreview(false)}
                className="cursor-pointer"
              >
                Normal Preview (Summary)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePreview(true)}
                className="cursor-pointer"
              >
                Detailed Preview (Full)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
              <DialogHeader className="border-b px-6 py-4">
                <DialogTitle>
                  Payroll Preview ({previewDetailed ? 'Detailed' : 'Summary'})
                </DialogTitle>
              </DialogHeader>

              <div className="relative w-full flex-1 bg-gray-100">
                {previewUrl ? (
                  <embed
                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading Preview...
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t bg-white p-4">
                <Button
                  variant="secondary"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadPayrollPDF(payroll!, previewDetailed)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => downloadPayrollPDF(payroll, false)}
                className="cursor-pointer"
              >
                Normal PDF (Summary)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadPayrollPDF(payroll, true)}
                className="cursor-pointer"
              >
                Detailed PDF (Full)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isApproved ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={saving} className="bg-theme text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? '⏳ Saving...' : 'Save Changes'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleSaveWithStatus('pending')}
                  className="cursor-pointer"
                >
                  Save and Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSaveWithStatus('approved')}
                  className="cursor-pointer"
                >
                  Save and Approved
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="rounded-full bg-green-100 px-4 py-2 font-medium text-green-800">
              Status: Approved
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex flex-row items-center gap-4">
            <p className="text-lg font-bold text-gray-900">
              {payroll.userId.firstName} {payroll.userId.lastName}
            </p>
            <div className="flex items-center space-x-4 text-lg">
              <span className="flex items-center">
                <Mail className="mr-1 h-5 w-5" /> {payroll.userId.email}
              </span>
              <span className="flex items-center">
                <CalendarCheck className="mr-1 h-5 w-5" />
                {moment(payroll.fromDate).format('DD MMM')} -{' '}
                {moment(payroll.toDate).format('DD MMM YYYY')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-lg font-medium ${
                  payroll.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : payroll.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {payroll.status.charAt(0).toUpperCase() +
                  payroll.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Shift</TableHead>
                <TableHead className="w-[120px]">Schedule</TableHead>
                <TableHead className="w-[110px]">Start Date</TableHead>
                <TableHead className="w-[90px]">Start Time</TableHead>
                <TableHead className="w-[110px]">End Date</TableHead>
                <TableHead className="w-[90px]">End Time</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[100px]">Pay Rate</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[200px]">Note</TableHead>
                <TableHead className="w-[220px]">Bank Holiday</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceItems.map((item, index) => {
                const durationMinutes = calculateDurationInMinutes(item);
                const durationHours = durationMinutes / 60;
                const lineTotal = durationHours * Number(item.payRate || 0);

                return (
                  <TableRow key={index} className="">
                    {/* Shift Dropdown */}
                    <TableCell>
                      {isApproved ? (
                        <span className="">
                          {shiftOptions.find(
                            (opt) => opt.value === item.shiftId
                          )?.label || '-'}
                        </span>
                      ) : (
                        <Select
                          options={shiftOptions}
                          value={shiftOptions.find(
                            (opt) => opt.value === item.shiftId
                          )}
                          onChange={(option) =>
                            updateRow(index, 'shiftId', option?.value)
                          }
                          styles={customSelectStyles}
                          menuPortalTarget={document.body}
                          placeholder="Select..."
                          isDisabled={isApproved}
                        />
                      )}
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="text-xs font-medium">
                      {getShiftSchedule(item.shiftId || '')}
                    </TableCell>

                    {/* Start Date */}
                    <TableCell>
                      {moment(item.startDate).format('DD-MM-YYYY')}
                    </TableCell>

                    {/* Start Time */}
                    <TableCell className="font-medium">
                      {item.startTime}
                    </TableCell>

                    {/* End Date */}
                    <TableCell>
                      {moment(item.endDate).format('DD-MM-YYYY')}
                    </TableCell>

                    {/* End Time */}
                    <TableCell className="font-medium">
                      {item.endTime}
                    </TableCell>

                    {/* DURATION - Display in HH:mm format */}
                    <TableCell className="font-bold text-theme">
                      {formatDurationToHHmm(durationMinutes)}
                    </TableCell>

                    {/* Pay Rate */}
                    <TableCell>
                      {item.bankHoliday ? (
                        <Input
                          type="number"
                          className="h-8 w-20 border-blue-300 bg-white"
                          value={item.payRate}
                          onChange={(e) =>
                            updateRow(
                              index,
                              'payRate',
                              parseFloat(e.target.value)
                            )
                          }
                          disabled={isApproved}
                        />
                      ) : (
                        <span className="block  text-center font-medium">
                          £{item.payRate?.toFixed(2)}
                        </span>
                      )}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-right font-bold ">
                      £{lineTotal.toFixed(2)}
                    </TableCell>

                    {/* Note */}
                    <TableCell>
                      {isApproved ? (
                        <span className="">{item.note || '-'}</span>
                      ) : (
                        <Textarea
                          value={item.note}
                          onChange={(e) =>
                            updateRow(index, 'note', e.target.value)
                          }
                          className="h-[35px] min-h-[35px] text-xs"
                          placeholder="Note"
                          disabled={isApproved}
                        />
                      )}
                    </TableCell>

                    {/* Bank Holiday */}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`bh-${index}`}
                          checked={item.bankHoliday}
                          onCheckedChange={(checked) =>
                            updateRow(index, 'bankHoliday', checked)
                          }
                          disabled={isApproved}
                        />
                        {item.bankHoliday && (
                          <div className="w-full">
                            <Select
                              options={bankHolidays
                                .filter(
                                  (h) =>
                                    moment(h.date).year() ===
                                    moment(item.startDate).year()
                                )
                                .map((h) => ({ value: h._id, label: h.title }))}
                              value={
                                bankHolidays.find(
                                  (h) => h._id === item.bankHolidayId
                                )
                                  ? {
                                      value: item.bankHolidayId,
                                      label: bankHolidays.find(
                                        (h) => h._id === item.bankHolidayId
                                      )?.title
                                    }
                                  : null
                              }
                              onChange={(opt) =>
                                updateRow(index, 'bankHolidayId', opt?.value)
                              }
                              styles={{
                                ...customSelectStyles,
                                control: (base) => ({
                                  ...base,
                                  minHeight: '30px',
                                  height: '30px',
                                  fontSize: '11px',
                                  borderColor: '#fecaca',
                                  backgroundColor: '#fef2f2'
                                })
                              }}
                              menuPortalTarget={document.body}
                              placeholder="Holiday..."
                              isDisabled={isApproved}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* TOTALS ROW */}
              <TableRow className="border-t-2 font-bold">
                <TableCell colSpan={6} className="text-right ">
                  TOTALS:
                </TableCell>
                <TableCell className="text-lg text-theme">
                  {formatDurationToHHmm(totalMinutes)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right text-lg text-gray-900">
                  £{totalAmount.toFixed(2)}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ViewPayroll;
