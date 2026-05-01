import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer';

import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (minutes: number): string => {
  if (!minutes || minutes < 0) return '00:00';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatShiftScheduledDuration = (minutes: number): string => {
  if (!minutes || minutes < 0) return '00h';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hrs.toString().padStart(2, '0')}h`;
  }
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`;
};

const calculateRowTotal = (
  durationMinutes: number,
  payRate: number
): number => {
  const hours = (durationMinutes ?? 0) / 60;
  return hours * (payRate ?? 0);
};

const getMonthLabel = (
  fromDate: string | Date,
  toDate: string | Date
): string => {
  if (!fromDate && !toDate) return 'UNKNOWN MONTH';
  if (!fromDate) return moment(toDate).format('MMMM YYYY').toUpperCase();
  if (!toDate) return moment(fromDate).format('MMMM YYYY').toUpperCase();

  const mFrom = moment(fromDate);
  const mTo = moment(toDate);

  if (mFrom.isSame(mTo, 'month') && mFrom.isSame(mTo, 'year')) {
    return mTo.format('MMMM YYYY').toUpperCase();
  } else if (mFrom.isSame(mTo, 'year')) {
    return `${mFrom.format('MMMM')} - ${mTo.format('MMMM YYYY')}`.toUpperCase();
  } else {
    return `${mFrom.format('MMMM YYYY')} - ${mTo.format('MMMM YYYY')}`.toUpperCase();
  }
};

// ─── PDF Styles & Component ────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#4b5563', marginBottom: 8 },
  month: { fontSize: 11, fontWeight: 'bold' },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 35,
    alignItems: 'center'
  },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#f9fafb', fontSize: 8 },
  
  // ─── Standard columns (Sums to 100%) ───
  // Reduced Shift from 16% -> 14% and Total from 10% -> 8%
  // Added extra space to Dates & Weekdays
  colShift: {
    width: '14%',
    padding: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  colDate: { width: '10%', padding: 2 },
  colWeekday: { width: '10%', padding: 2 },
  colTime: { width: '7%', padding: 2 },
  colActual: { width: '8%', padding: 2 },
  colDuration: { width: '8%', padding: 2 },
  colRate: { width: '8%', padding: 2 },
  colTotal: { width: '8%', padding: 2, textAlign: 'right' },

  // ─── Contract columns (Sums to 100%) ───
  // Reduced Shift Contract from 24% -> 20%
  // Distributed the saved width to Date and Weekday columns
  colShiftContract: { 
    width: '20%', 
    padding: 2, 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center' 
  },
  colDateContract: { width: '12%', padding: 2 },
  colWeekdayContract: { width: '12%', padding: 2 },
  colTimeContract: { width: '8%', padding: 2 },
  colActualContract: { width: '8%', padding: 2 },
  colDurationContract: { width: '8%', padding: 2 },
  
  shiftDetailText: { fontSize: 7, color: '#4b5563', marginTop: 2 },
  shiftCrossDayText: { fontSize: 7, color: '#f97316', marginTop: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000'
  },
  footerText: { fontSize: 12, fontWeight: 'bold' }
});

const PayrollPDF = ({
  companyName,
  empName,
  designations,
  monthLabel,
  records,
  totalMinutesWorked,
  grandTotal,
  isContract,       
  contractAmount    
}: any) => {

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.companyName}>{companyName}</Text>

        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.title}>{empName}</Text>
            <Text style={pdfStyles.subtitle}>{designations}</Text>
          </View>
          <View>
            <Text style={pdfStyles.month}>Period: {monthLabel}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          {/* PDF Table Header */}
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={isContract ? pdfStyles.colShiftContract : pdfStyles.colShift}>Shift Details</Text>
            <Text style={isContract ? pdfStyles.colDateContract : pdfStyles.colDate}>Start Date</Text>
            <Text style={isContract ? pdfStyles.colWeekdayContract : pdfStyles.colWeekday}>Weekdays</Text>
            <Text style={isContract ? pdfStyles.colTimeContract : pdfStyles.colTime}>Start Time</Text>
            <Text style={isContract ? pdfStyles.colDateContract : pdfStyles.colDate}>End Date</Text>
            <Text style={isContract ? pdfStyles.colWeekdayContract : pdfStyles.colWeekday}>Weekdays</Text>
            <Text style={isContract ? pdfStyles.colTimeContract : pdfStyles.colTime}>End Time</Text>
            <Text style={isContract ? pdfStyles.colActualContract : pdfStyles.colActual}>Actual Hour</Text>
            <Text style={isContract ? pdfStyles.colDurationContract : pdfStyles.colDuration}>Duration</Text>
            
            {!isContract && <Text style={pdfStyles.colRate}>Rate</Text>}
            {!isContract && <Text style={pdfStyles.colTotal}>Total</Text>}
          </View>

          {/* PDF Table Data Rows */}
          {records.map((row: any, i: number) => (
            <View key={i} style={pdfStyles.tableRow}>
              <View style={isContract ? pdfStyles.colShiftContract : pdfStyles.colShift}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{row.shiftName}</Text>
                <Text style={pdfStyles.shiftDetailText}>
                  {row.isAL ? '--:-- - --:--' : `${row.rotaStartTime} - ${row.rotaEndTime} (${row.shiftScheduledStr})`}
                </Text>
                {row.isDifferentShiftDate && !row.isAL && (
                  <Text style={pdfStyles.shiftCrossDayText}>
                    (Cross-day Shift)
                  </Text>
                )}
              </View>

              <Text style={isContract ? pdfStyles.colDateContract : pdfStyles.colDate}>{row.startDateStr}</Text>
              <Text style={isContract ? pdfStyles.colWeekdayContract : pdfStyles.colWeekday}>{row.startWeekdayStr}</Text>
              <Text style={isContract ? pdfStyles.colTimeContract : pdfStyles.colTime}>{row.startTimeStr}</Text>
              <Text style={isContract ? pdfStyles.colDateContract : pdfStyles.colDate}>
                {row.endDateStr}
              </Text>
              <Text style={isContract ? pdfStyles.colWeekdayContract : pdfStyles.colWeekday}>{row.endWeekdayStr}</Text>
              <Text style={isContract ? pdfStyles.colTimeContract : pdfStyles.colTime}>{row.endTimeStr}</Text>
              <Text style={isContract ? pdfStyles.colActualContract : pdfStyles.colActual}>{row.actualHourStr}</Text>
              <Text style={isContract ? pdfStyles.colDurationContract : pdfStyles.colDuration}>{row.durationStr}</Text>
              
              {/* Force Pay Rate strictly to 2 decimal places */}
              {!isContract && <Text style={pdfStyles.colRate}>{Number(row.payRate || 0).toFixed(2)}</Text>}
              {!isContract && <Text style={pdfStyles.colTotal}>{row.total.toFixed(2)}</Text>}
            </View>
          ))}
        </View>

        {/* PDF Footer */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>
            Total Hours Worked: {Math.floor(totalMinutesWorked / 60)}:
            {(totalMinutesWorked % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={pdfStyles.footerText}>
            Total: {isContract ? (contractAmount || 0).toFixed(2) : grandTotal.toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ViewPayroll = () => {
  const { id, pid } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [applyAllOption, setApplyAllOption] = useState<{
    rate: number | string;
    recordId: string;
  } | null>(null);

  const fetchPayroll = async () => {
    if (!pid) return setLoading(false);
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/hr/payroll/${pid}`);
      setPayroll(res.data.data);
      setAttendanceRecords(res.data.data.attendanceList || []);
    } catch (err: any) {
      setError('Failed to load payroll details.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPayroll();
  }, [pid]);

  const handlePayRateChange = (recordId: string, newRate: number | string) => {
    setAttendanceRecords((prev) =>
      prev.map((att) =>
        att._id === recordId ? { ...att, payRate: newRate } : att
      )
    );
    setApplyAllOption({ rate: newRate, recordId });
  };

  const handleApplyToAll = () => {
    if (!applyAllOption) return;
    setAttendanceRecords((prev) =>
      prev.map((att) => ({ ...att, payRate: applyAllOption.rate }))
    );
    setApplyAllOption(null);
    toast({ title: 'Pay rate applied to all rows' });
  };

  const handleUpdate = async () => {
    if (!pid) return;
    setIsUpdating(true);
    try {
      const payload = {
        attendanceList: attendanceRecords.map((att) => ({
          _id: att._id,
          attendanceId: att.attendanceId?._id,
          payRate: att.payRate,
          duration: att.duration
        }))
      };
      await axiosInstance.patch(`/hr/payroll/${pid}`, payload);
      toast({ title: 'Payroll updated successfully!' });
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Failed to update payroll',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContract = async () => {
    if (!pid) return;
    setIsUpdating(true);
    try {
      const payload = {
        isContract: true
      };
      await axiosInstance.patch(`/hr/payroll/${pid}`, payload);
      toast({ title: 'Payroll updated successfully!' });
      fetchPayroll();
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Failed to update payroll',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getMonthLabelForReport = (
    fromDate: string | Date,
    toDate: string | Date
  ): string => {
    if (!fromDate && !toDate) return 'UNKNOWN PERIOD';
    if (!fromDate) return moment(toDate).format('D MMM, YYYY');
    if (!toDate) return moment(fromDate).format('D MMM, YYYY');

    const mFrom = moment(fromDate).format('DD MMM, YYYY');
    const mTo = moment(toDate).format('DD MMM, YYYY');

    return `${mFrom} - ${mTo}`;
  };

  // ─── Data Extraction & Calculations ───────────────────────────────────────────
  const empName = payroll?.userId
    ? `${payroll.userId?.firstName} ${payroll.userId?.lastName}`
    : 'Unknown Employee';
  const designations = Array.isArray(payroll?.userId?.designationId)
    ? payroll.userId.designationId.map((d: any) => d.title).join(', ')
    : 'No Designation';
  const monthLabel = payroll
    ? getMonthLabelForReport(payroll.fromDate, payroll.toDate)
    : '';

  const companyName = payroll?.companyId?.name || 'Unknown Company';

  // Process data once for UI, PDF, and CSV
  const processedData = useMemo(() => {
    let totalMins = 0;
    let grandTot = 0;

    const sortedAttendance = [...attendanceRecords].sort((a, b) => {
      const dateA = a.attendanceId?.clockIn || a.rotaId?.startDate;
      const dateB = b.attendanceId?.clockIn || b.rotaId?.startDate;
      
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      
      return timeA - timeB;
    });

    const records = sortedAttendance.map((att) => {
      const isAL = !att.attendanceId && !!att.rotaId;

      let shiftName = '—';
      let rotaStartTime = '--:--';
      let rotaEndTime = '--:--';
      let shiftScheduledStr = '--';
      let isDifferentShiftDate = false;

      let startDateStr = '—';
      let startWeekdayStr = '—';
      let startTimeStr = '--:--';
      
      let endDateStr = '—';
      let endWeekdayStr = '—';
      let endTimeStr = '--:--';
      
      let actualHourStr = '--';
      let isDifferentWorkedDate = false;

      // ─── Extract Data based on Record Type ───
      if (isAL) {
        shiftName = att.rotaId?.shiftName || 'AL';
        
        const mStart = moment(att.rotaId?.startDate);
        const mEnd = moment(att.rotaId?.endDate);
        
        startDateStr = mStart.isValid() ? mStart.format('DD-MM-YYYY') : '—';
        startWeekdayStr = mStart.isValid() ? mStart.format('dddd') : '—';
        
        endDateStr = mEnd.isValid() ? mEnd.format('DD-MM-YYYY') : '—';
        endWeekdayStr = mEnd.isValid() ? mEnd.format('dddd') : '—';
        
        isDifferentShiftDate = att.rotaId?.startDate !== att.rotaId?.endDate;
      } else {
        const cIn = moment(att.attendanceId?.clockIn);
        const cOut = moment(att.attendanceId?.clockOut);
        const rId = att.attendanceId?.rotaId;

        shiftName = rId?.shiftName || '—';
        rotaStartTime = rId?.startTime || '--:--';
        rotaEndTime = rId?.endTime || '--:--';

        const rStart = moment(`${rId?.startDate} ${rId?.startTime}`, 'YYYY-MM-DD HH:mm');
        const rEnd = moment(`${rId?.endDate} ${rId?.endTime}`, 'YYYY-MM-DD HH:mm');
        const shiftScheduledMins = rStart.isValid() && rEnd.isValid() ? Math.max(0, rEnd.diff(rStart, 'minutes')) : 0;
        shiftScheduledStr = formatShiftScheduledDuration(shiftScheduledMins);
        isDifferentShiftDate = rId?.startDate !== rId?.endDate;

        startDateStr = cIn.isValid() ? cIn.format('DD-MM-YYYY') : '—';
        startWeekdayStr = cIn.isValid() ? cIn.format('dddd') : '—';
        startTimeStr = cIn.isValid() ? cIn.format('HH:mm') : '--:--';
        
        endDateStr = cOut.isValid() ? cOut.format('DD-MM-YYYY') : '—';
        endWeekdayStr = cOut.isValid() ? cOut.format('dddd') : '—';
        endTimeStr = cOut.isValid() ? cOut.format('HH:mm') : '--:--';

        const actualWorkedMinutes = cIn.isValid() && cOut.isValid() ? Math.max(0, cOut.diff(cIn, 'minutes')) : 0;
        actualHourStr = formatDuration(actualWorkedMinutes);
        
        isDifferentWorkedDate = cIn.isValid() && cOut.isValid() && cIn.format('YYYY-MM-DD') !== cOut.format('YYYY-MM-DD');
      }

      // ─── Process Shared Values ───
      const workedMinutes = att.duration;
      const durationStr = formatDuration(workedMinutes);
      const total = calculateRowTotal(workedMinutes, att.payRate);
      
      totalMins += workedMinutes;
      grandTot += total;

      return {
        ...att,
        isAL,
        shiftName,
        rotaStartTime,
        rotaEndTime,
        shiftScheduledStr,
        isDifferentShiftDate,
        startDateStr,
        startWeekdayStr,
        startTimeStr,
        endDateStr,
        endWeekdayStr,
        endTimeStr,
        actualHourStr,
        workedMinutes,
        durationStr,
        isDifferentWorkedDate,
        total
      };
    });

    return { records, totalMinutesWorked: totalMins, grandTotal: grandTot };
  }, [attendanceRecords]);

  // ─── Export Handlers ──────────────────────────────────────────────────────────
  const handleGenerateCSV = () => {
    const isContract = payroll?.isContract;
    const nameRow = [`"${empName}"`, `"${monthLabel}"`];
    const designationRow = [`"${designations}"`, `""`];

    const headers = [
      'Shift Details',
      'Start Date',
      'Weekdays',
      'Start Time',
      'End Date',
      'Weekdays',
      'End Time',
      'Actual Hour',
      'Duration'
    ];
    if (!isContract) {
      headers.push('Pay Rate', 'Total');
    }

    const rows = processedData.records.map((r) => {
      const hasShiftName = r.shiftName && r.shiftName.trim() !== '' && r.shiftName !== '—';
      
      let shiftCell = hasShiftName ? `${r.shiftName}` : '';
      if (!r.isAL) {
        shiftCell += hasShiftName 
          ? ` : ${r.rotaStartTime} - ${r.rotaEndTime}`
          : `${r.rotaStartTime} - ${r.rotaEndTime}`;
      }

      if (r.isDifferentWorkedDate && !r.isAL) {
        shiftCell += '\n(Cross-day Shift)';
      }

      const baseRow = [
        `"${shiftCell}"`,
        r.startDateStr,
        r.startWeekdayStr,
        r.startTimeStr,
        `"${r.endDateStr}${r.isDifferentWorkedDate ? ' *' : ''}"`,
        r.endWeekdayStr,
        r.endTimeStr,
        r.actualHourStr,
        r.durationStr
      ];

      if (!isContract) {
        // Force Pay Rate strictly to 2 decimal places
        baseRow.push(Number(r.payRate ?? 0).toFixed(2), r.total.toFixed(2));
      }

      return baseRow;
    });

    const totalHoursStr = `${Math.floor(processedData.totalMinutesWorked / 60)}:${(processedData.totalMinutesWorked % 60).toString().padStart(2, '0')}`;
    
    const colCount = isContract ? 9 : 11;
    rows.push(Array(colCount).fill(''));
    
    if (isContract) {
      rows.push([
        '', '', '', '', '', '', '',
        '"Total Hours Worked:"', 
        `"${totalHoursStr}"`, '',
        `"Total: ${(payroll.contractAmount || 0).toFixed(2)}"`
      ]);
    } else {
      rows.push([
        '', '', '', '', '', '', '', 
        '"Total Hours Worked:"', 
        `"${totalHoursStr}"`, 
        '', 
        processedData.grandTotal.toFixed(2)
      ]);
    }

    const csvContent = [nameRow, designationRow, [], headers, ...rows]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Payroll_${empName.replace(/\s+/g, '_')}_${monthLabel}.csv`;
    link.click();
  };

  const handleGeneratePDF = async () => {
    setIsExporting(true);
    try {
      const blob = await pdf(
        <PayrollPDF
          companyName={companyName}
          empName={empName}
          designations={designations}
          monthLabel={monthLabel}
          records={processedData.records}
          totalMinutesWorked={processedData.totalMinutesWorked}
          grandTotal={processedData.grandTotal}
          isContract={payroll?.isContract}
          contractAmount={payroll?.contractAmount}
        />
      ).toBlob();

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Payroll_${empName.replace(/\s+/g, '_')}_${monthLabel}.pdf`;
      link.click();
    } catch (err) {
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };
  
  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-md bg-white p-5 shadow-sm">
        <BlinkingDots />
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-md bg-white p-5 font-medium text-red-500 shadow-sm">
        {error || 'Payroll not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className=" flex min-h-[70vh] flex-col justify-between bg-white p-5 shadow-sm">
        <div>
          {/* Header Section */}
          <div className="mb-8 grid grid-cols-2 items-start gap-4">
            <div className="col-span-1 space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                {empName} 
                {payroll.isContract && (
                  <span className='ml-4 text-xs font-semibold bg-orange-500 rounded-full py-2 px-3 text-white'> 
                    Contracted Salary Applied
                  </span>
                )}
              </h2>
              <p className="text-sm font-semibold text-gray-700">
                {designations}
              </p>
              <p className="mt-4 text-sm font-bold tracking-wide">
                Payroll Period: {monthLabel}
              </p>
            </div>

            <div className="col-span-1 flex justify-end gap-3">
              <Button onClick={() => navigate(-1)} className="-ml-3">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                variant="outline"
                className="border-none bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                onClick={handleGeneratePDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Download PDF'
                )}
              </Button>
              <Button
                variant="outline"
                className="border-none bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white"
                onClick={handleGenerateCSV}
              >
                Download Excel
              </Button>
               {payroll.isContract === false && (
                 <>
                   <Button
                     variant="outline"
                     className="border-none bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
                     onClick={() => setIsContractDialogOpen(true)}
                     disabled={isUpdating}
                   >
                     {isUpdating ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       'Apply Contracted Salary'
                     )}
                   </Button>
                 </>
               )}
              
              <Button
                variant="outline"
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-200">
                  <TableHead className="font-extrabold  text-black">
                    Shift Name
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Start Date
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Weekdays
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Start Time
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    End Date
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Weekdays
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    End Time
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Actual Hour
                  </TableHead>
                  <TableHead className="font-extrabold  text-black">
                    Duration
                  </TableHead>
                  {payroll.isContract === false && (
                    <>
                      <TableHead className="w-28 font-extrabold  text-black">
                        Pay Rate
                      </TableHead>
                      <TableHead className="text-right font-extrabold  text-black">
                        Total
                      </TableHead>
                    </>
                  )}
                 
                </TableRow>
              </TableHeader>
            <TableBody>
                {processedData.records.length > 0 ? (
                  processedData.records.map((att: any) => (
                    <TableRow
                      key={att._id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <div className="font-semibold text-gray-900">
                          {att.shiftName}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {att.isAL ? (
                            <span className="italic text-gray-800"></span>
                          ) : (
                            `${att.rotaStartTime} - ${att.rotaEndTime} (${att.shiftScheduledStr})`
                          )}
                        </div>
                        {att.isDifferentShiftDate && !att.isAL && (
                          <span className="text-[10px] font-semibold text-orange-500">
                            (Cross-day Shift)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {att.startDateStr}
                      </TableCell>
                      
                      <TableCell className="font-medium text-gray-800">
                        {att.startWeekdayStr}
                      </TableCell>

                      <TableCell className="font-medium text-gray-800">
                        {att.startTimeStr}
                      </TableCell>
                      <TableCell className="font-medium">
                        {att.endDateStr}
                        {att.isDifferentWorkedDate && (
                          <span className="ml-1 text-[10px] text-orange-500">
                            *
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="font-medium text-gray-800">
                        {att.endWeekdayStr}
                      </TableCell>

                      <TableCell className="font-medium text-gray-800">
                        {att.endTimeStr}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">
                        {att.actualHourStr}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {att.durationStr}
                      </TableCell>

                        {payroll.isContract === false && (
                          <>
                            <TableCell className="align-top">
                              <div className="flex flex-col gap-2 pt-1">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={att.payRate === '' ? '' : att.payRate ?? 0}
                                  onChange={(e) => {
                                    let val = e.target.value;

                                    // Block user from typing more than 2 decimal places
                                    if (val.includes('.')) {
                                      const parts = val.split('.');
                                      if (parts[1].length > 2) {
                                        val = `${parts[0]}.${parts[1].slice(0, 2)}`;
                                      }
                                    }

                                    handlePayRateChange(
                                      att._id,
                                      val === '' ? '' : Number(val)
                                    );
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === '') {
                                      handlePayRateChange(att._id, 0);
                                    }
                                  }}
                                  className="h-8 w-full font-semibold"
                                />
                                {applyAllOption?.recordId === att._id && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleApplyToAll}
                                    className="h-7 bg-theme px-2 text-[10px] text-white hover:bg-theme/90"
                                  >
                                    Apply to all
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900">
                              {att.total.toFixed(2)}
                            </TableCell>
                          </>
                        )}
                      
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10} 
                      className="h-24 text-center font-medium text-gray-500"
                    >
                      No attendance records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Totals Section */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 text-lg">
          <div className="font-bold tracking-wide">
            Total Hours Worked -{' '}
            <span className="text-black">
              {Math.floor(processedData.totalMinutesWorked / 60)}:
              {(processedData.totalMinutesWorked % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
          {payroll.isContract ? ( 
            <div className="font-extrabold tracking-wide">
              Total:{' '}
              <span className="text-black">
                {payroll.contractAmount.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="font-extrabold tracking-wide">
              Total:{' '}
              <span className="text-black">
                {processedData.grandTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Contracted Salary</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply the contracted salary? This will override individual hourly pay calculations and use the fixed contract amount for this payroll period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => {
                setIsContractDialogOpen(false);
                handleContract();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewPayroll;