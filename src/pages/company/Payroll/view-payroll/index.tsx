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
  colShift: {
    width: '18%',
    padding: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  colDate: { width: '11%', padding: 2 },
  colWeekday: { width: '10%', padding: 2 },
  colTime: { width: '8%', padding: 2 },
  colDuration: { width: '8%', padding: 2 },
  colRate: { width: '7%', padding: 2 },
  colTotal: { width: '9%', padding: 2, textAlign: 'right' },
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
  grandTotal
}: any) => (
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
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={pdfStyles.colShift}>Shift Details</Text>
          <Text style={pdfStyles.colDate}>Start Date</Text>
          <Text style={pdfStyles.colWeekday}>Weekdays</Text>
          <Text style={pdfStyles.colTime}>Start Time</Text>
          <Text style={pdfStyles.colDate}>End Date</Text>
          <Text style={pdfStyles.colWeekday}>Weekdays</Text>
          <Text style={pdfStyles.colTime}>End Time</Text>
          <Text style={pdfStyles.colDuration}>Duration</Text>
          <Text style={pdfStyles.colRate}>Rate</Text>
          <Text style={pdfStyles.colTotal}>Total</Text>
        </View>

        {records.map((row: any, i: number) => (
          <View key={i} style={pdfStyles.tableRow}>
            <View style={pdfStyles.colShift}>
              <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{row.shiftName}</Text>
              <Text style={pdfStyles.shiftDetailText}>
                {row.rotaStartTime} - {row.rotaEndTime} ({row.shiftScheduledStr})
              </Text>
              {row.isDifferentShiftDate && (
                <Text style={pdfStyles.shiftCrossDayText}>
                  (Cross-day Shift)
                </Text>
              )}
            </View>

            <Text style={pdfStyles.colDate}>{row.startDateStr}</Text>
            <Text style={pdfStyles.colWeekday}>{row.startWeekdayStr}</Text>
            <Text style={pdfStyles.colTime}>{row.startTimeStr}</Text>
            <Text style={pdfStyles.colDate}>
              {row.endDateStr}
              {/* {row.isDifferentWorkedDate ? '*' : ''} */}
            </Text>
            <Text style={pdfStyles.colWeekday}>{row.endWeekdayStr}</Text>
            <Text style={pdfStyles.colTime}>{row.endTimeStr}</Text>
            <Text style={pdfStyles.colDuration}>{row.durationStr}</Text>
            <Text style={pdfStyles.colRate}>{row.payRate}</Text>
            <Text style={pdfStyles.colTotal}>{row.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>
          Total Hours Worked: {Math.floor(totalMinutesWorked / 60)}:
          {(totalMinutesWorked % 60).toString().padStart(2, '0')}
        </Text>
        <Text style={pdfStyles.footerText}>Total: {grandTotal.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ViewPayroll = () => {
  const { id, pid } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [applyAllOption, setApplyAllOption] = useState<{
    rate: number | string;
    recordId: string;
  } | null>(null);

  useEffect(() => {
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

    const records = attendanceRecords.map((att) => {
      const clockIn = moment(att.attendanceId?.clockIn);
      const clockOut = moment(att.attendanceId?.clockOut);

      const workedMinutes = att.duration;
      const isDifferentWorkedDate =
        clockIn.isValid() &&
        clockOut.isValid() &&
        clockIn.format('YYYY-MM-DD') !== clockOut.format('YYYY-MM-DD');

      const shiftName = att.attendanceId?.rotaId?.shiftName || '—';
      const rotaStartTime = att.attendanceId?.rotaId?.startTime;
      const rotaEndTime = att.attendanceId?.rotaId?.endTime;
      const rotaStartDate = att.attendanceId?.rotaId?.startDate;
      const rotaEndDate = att.attendanceId?.rotaId?.endDate;

      const rStart = moment(`${rotaStartDate} ${rotaStartTime}`);
      const rEnd = moment(`${rotaEndDate} ${rotaEndTime}`);
      const shiftScheduledMins =
        rStart.isValid() && rEnd.isValid()
          ? Math.max(0, rEnd.diff(rStart, 'minutes'))
          : 0;
      const shiftScheduledStr =
        formatShiftScheduledDuration(shiftScheduledMins);
      const isDifferentShiftDate = rotaStartDate !== rotaEndDate;

      const total = calculateRowTotal(workedMinutes, att.payRate);
      totalMins += workedMinutes;
      grandTot += total;

      return {
        ...att,
        shiftName,
        rotaStartTime,
        rotaEndTime,
        shiftScheduledMins,
        shiftScheduledStr,
        isDifferentShiftDate,
        startDateStr: clockIn.isValid() ? clockIn.format('DD-MM-YYYY') : '—',
        startWeekdayStr: clockIn.isValid() ? clockIn.format('dddd') : '—', 
        startTimeStr: clockIn.isValid() ? clockIn.format('HH:mm') : '—',
        endDateStr: clockOut.isValid() ? clockOut.format('DD-MM-YYYY') : '—',
        endWeekdayStr: clockOut.isValid() ? clockOut.format('dddd') : '—',
        endTimeStr: clockOut.isValid() ? clockOut.format('HH:mm') : '—',
        workedMinutes,
        durationStr: formatDuration(workedMinutes),
        isDifferentWorkedDate,
        total
      };
    });

    return { records, totalMinutesWorked: totalMins, grandTotal: grandTot };
  }, [attendanceRecords]);

  // ─── Export Handlers ──────────────────────────────────────────────────────────

  const handleGenerateCSV = () => {
    // 1. Employee Info Meta Rows - Designation is placed on its own row immediately below the name
    const nameRow = [`"${empName}"`, `"${monthLabel}"`];
    const designationRow = [`"${designations}"`, `""`];

    // 2. Table Headers (Added Weekdays)
    const headers = [
      'Shift Details',
      'Start Date',
      'Weekdays',
      'Start Time',
      'End Date',
      'Weekdays',
      'End Time',
      'Duration',
      'Pay Rate',
      'Total'
    ];

    // 3. Process Data Rows
    const rows = processedData.records.map((r) => {
      const hasShiftName =
        r.shiftName && r.shiftName.trim() !== '' && r.shiftName !== '—';
      let shiftCell = hasShiftName
        ? `${r.shiftName} : ${r.rotaStartTime} - ${r.rotaEndTime}`
        : `${r.rotaStartTime} - ${r.rotaEndTime}`;

      if (r.isDifferentWorkedDate) {
        shiftCell += '\n(Cross-day Shift)';
      }

      return [
        `"${shiftCell}"`, // quoted to preserve newlines
        r.startDateStr,
        r.startWeekdayStr,
        r.startTimeStr,
        `"${r.endDateStr}${r.isDifferentWorkedDate ? ' *' : ''}"`,
        r.endWeekdayStr,
        r.endTimeStr,
        r.durationStr,
        r.payRate ?? 0,
        r.total.toFixed(2)
      ];
    });

    // 4. Footer Totals (Adjusted spacing for 10 columns)
    const totalHoursStr = `${Math.floor(processedData.totalMinutesWorked / 60)}:${(processedData.totalMinutesWorked % 60).toString().padStart(2, '0')}`;
    rows.push(['', '', '', '', '', '', '', '', '', '']); // spacing
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '"Total Hours Worked:"',
      `"${totalHoursStr}"`,
      '',
      processedData.grandTotal.toFixed(2)
    ]);

    // 5. Combine and download - Using nameRow followed by designationRow
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
              <h2 className="text-xl font-bold tracking-tight">{empName}</h2>
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
                className="border-none bg-violet-600 hover:bg-violet-600"
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
                className="border-none bg-emerald-700 hover:bg-emerald-600"
                onClick={handleGenerateCSV}
              >
                Download Excel
              </Button>
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
                    Duration
                  </TableHead>
                  <TableHead className="w-28 font-extrabold  text-black">
                    Pay Rate
                  </TableHead>
                  <TableHead className="text-right font-extrabold  text-black">
                    Total
                  </TableHead>
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
                          {att.rotaStartTime} - {att.rotaEndTime} (
                          {att.shiftScheduledStr})
                        </div>
                        {att.isDifferentShiftDate && (
                          <span className="text-[10px] font-semibold text-orange-500">
                            (Cross-day Shift)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {att.startDateStr}
                      </TableCell>
                      
                      <TableCell className="font-medium text-gray-600">
                        {att.startWeekdayStr}
                      </TableCell>

                      <TableCell className="font-medium">
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

                      <TableCell className="font-medium text-gray-600">
                        {att.endWeekdayStr}
                      </TableCell>

                      <TableCell className="font-medium">
                        {att.endTimeStr}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {att.durationStr}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2 pt-1">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={att.payRate === '' ? '' : att.payRate ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
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
          <div className="font-extrabold tracking-wide">
            Total:{' '}
            <span className="text-black">
              {processedData.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayroll;