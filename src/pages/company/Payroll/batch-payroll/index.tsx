import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Eye, Loader2, RefreshCw } from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveUser = (p: any) => p.userId ?? p.user ?? null;

const getMonthLabelForReport = (fromDate: string | Date, toDate: string | Date): string => {
  if (!fromDate && !toDate) return 'UNKNOWN PERIOD';
  if (!fromDate) return moment(toDate).format('D MMM, YYYY');
  if (!toDate) return moment(fromDate).format('D MMM, YYYY');

  const mFrom = moment(fromDate).format('D MMM, YYYY');
  const mTo = moment(toDate).format('D MMM, YYYY');

  return `${mFrom} - ${mTo}`;
};

const getDesignation = (emp: any): string => {
  if (!emp) return '—';
  if (Array.isArray(emp.designationId) && emp.designationId.length > 0) {
    return emp.designationId.map((d: any) => d.title).join(', ');
  }
  if (emp.designations?.length) {
    return emp.designations.map((d: any) => d.title).join(', ');
  }
  if (emp.designationId && !Array.isArray(emp.designationId)) {
    return emp.designationId.title || '—';
  }
  return emp.designation || '—';
};

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

const calculateRowTotal = (durationMinutes: number, payRate: number): number => {
  const hours = (durationMinutes ?? 0) / 60;
  return hours * (payRate ?? 0);
};

// ─── PDF Styles & Summary Component ───────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  companyName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  period: { fontSize: 12, color: '#4b5563' },
  table: { display: 'flex', flexDirection: 'column', width: '100%', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', minHeight: 35, alignItems: 'center' },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#f9fafb' },
  colRef: { width: '25%', padding: 4 },
  colEmp: { width: '25%', padding: 4 },
  colDesig: { width: '20%', padding: 4 },
  colHours: { width: '15%', padding: 4, textAlign: 'left' },
  colTotal: { width: '15%', padding: 4, textAlign: 'right' },
  footerRow: { flexDirection: 'row', backgroundColor: '#f9fafb', minHeight: 35, alignItems: 'center', fontWeight: 'bold' },
  colFooterLabel: { width: '70%', padding: 4, textAlign: 'right', paddingRight: 10 }
});

const BatchSummaryPayrollPDF = ({ 
  batches, 
  companyName, 
  periodStr, 
  overallHoursStr, 
  overallGrandTotal 
}: { 
  batches: any[], 
  companyName: string, 
  periodStr: string,
  overallHoursStr: string,
  overallGrandTotal: number
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerContainer}>
          <Text style={pdfStyles.companyName}>{companyName || "Company Name"}</Text>
          <Text style={pdfStyles.title}>Payroll Summary Report</Text>
          <Text style={pdfStyles.period}>Period: {periodStr}</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.colRef}>Payroll Number</Text>
            <Text style={pdfStyles.colEmp}>Employee Name</Text>
            <Text style={pdfStyles.colDesig}>Designation</Text>
            <Text style={pdfStyles.colHours}>Hours Worked</Text>
            <Text style={pdfStyles.colTotal}>Total Amount</Text>
          </View>

          {batches.map((row: any, i: number) => {
            const hoursStr = `${Math.floor(row.totalMinutesWorked / 60)}:${(row.totalMinutesWorked % 60).toString().padStart(2, '0')}`;
            return (
              <View key={i} style={pdfStyles.tableRow} wrap={false}>
                <Text style={pdfStyles.colRef}>{row.payrollNumber}</Text>
                <Text style={pdfStyles.colEmp}>{row.empName}</Text>
                <Text style={pdfStyles.colDesig}>{row.designations}</Text>
                <Text style={pdfStyles.colHours}>{hoursStr}</Text>
                <Text style={pdfStyles.colTotal}>{row.grandTotal.toFixed(2)}</Text>
              </View>
            )
          })}
          
          <View style={pdfStyles.footerRow} wrap={false}>
            <Text style={pdfStyles.colFooterLabel}>Total</Text>
            <Text style={pdfStyles.colHours}>{overallHoursStr}</Text>
            <Text style={pdfStyles.colTotal}>{overallGrandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const BatchPayrollDetails = () => {
  const { id: companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { payrollIds, fromDate, toDate, companyName = "Your Company Name" } = location.state || { 
    payrollIds: [], 
    fromDate: null, 
    toDate: null,
    companyName: ""
  };

  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollDetails = useCallback(async () => {
    if (!payrollIds || payrollIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const promises = payrollIds.map((id: string) => 
        axiosInstance.get(`/hr/payroll/${id}`)
      );
      
      const responses = await Promise.all(promises);
      const fetchedData = responses.map(res => res.data.data);
      
      setPayrolls(fetchedData);
      
      if (companyId) {
        const companyRes = await axiosInstance.get(`/users/${companyId}`);
        setCompanyData(companyRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load payroll details for this batch.');
    } finally {
      setLoading(false);
    }
  }, [payrollIds, companyId]);

  useEffect(() => {
    fetchPayrollDetails();
  }, [fetchPayrollDetails]);

  const handleRegeneratePayroll = async () => {
    if (!payrollIds || payrollIds.length === 0) return;

    setIsRegenerating(true);
    try {
      await axiosInstance.post('/hr/payroll/regenerate', {
        payrollIds: payrollIds,
      });

      toast({
        title: 'Success',
        description: 'Payrolls regenerated successfully.',
      });

      await fetchPayrollDetails();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Regeneration Failed',
        description: err.response?.data?.message || 'Something went wrong while regenerating.',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const formattedDateRange = fromDate && toDate 
    ? `${moment(fromDate).format('DD MMM YYYY')} - ${moment(toDate).format('DD MMM YYYY')}`
    : 'Unknown Date Range';
    
  const fromDateDate = fromDate ? moment(fromDate) : null;
  const toDateDate = toDate ? moment(toDate) : null;
  
  const formattedMonth = (() => {
    if (!fromDateDate || !toDateDate) return '';
    if (fromDateDate.isSame(toDateDate, 'month')) {
      return fromDateDate.format('MMMM YYYY').toUpperCase();
    }
    return `${fromDateDate.format('MMMM')} - ${toDateDate.format('MMMM YYYY')}`.toUpperCase();
  })();

  const processedBatches = useMemo(() => {
    return payrolls.map((payroll) => {
      const emp = resolveUser(payroll);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee';
      const designations = getDesignation(emp);
      const monthLabel = getMonthLabelForReport(payroll.fromDate, payroll.toDate);
      const payrollNumber = payroll.payrollNo ?? payroll.refId ?? payroll._id.slice(-8).toUpperCase();

      let totalMins = 0;
      let grandTot = 0;

      const records = (payroll.attendanceList || []).map((att: any) => {
        const clockIn = moment(att.attendanceId?.clockIn);
        const clockOut = moment(att.attendanceId?.clockOut);

        const workedMinutes =  att.duration;
        const isDifferentWorkedDate = clockIn.isValid() && clockOut.isValid() && clockIn.format('YYYY-MM-DD') !== clockOut.format('YYYY-MM-DD');

        const shiftName = att.attendanceId?.rotaId?.shiftName || '—';
        const rotaStartTime = att.attendanceId?.rotaId?.startTime;
        const rotaEndTime = att.attendanceId?.rotaId?.endTime;
        const rotaStartDate = att.attendanceId?.rotaId?.startDate;
        const rotaEndDate = att.attendanceId?.rotaId?.endDate;

        const rStart = moment(`${rotaStartDate} ${rotaStartTime}`);
        const rEnd = moment(`${rotaEndDate} ${rotaEndTime}`);
        const shiftScheduledMins = rStart.isValid() && rEnd.isValid() ? Math.max(0, rEnd.diff(rStart, 'minutes')) : 0;
        const shiftScheduledStr = formatShiftScheduledDuration(shiftScheduledMins);
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
          startWeekdayStr: clockIn.isValid() ? clockIn.format('dddd') : '—', // Added start weekday
          startTimeStr: clockIn.isValid() ? clockIn.format('HH:mm') : '—',
          endDateStr: clockOut.isValid() ? clockOut.format('DD-MM-YYYY') : '—',
          endWeekdayStr: clockOut.isValid() ? clockOut.format('dddd') : '—', // Added end weekday
          endTimeStr: clockOut.isValid() ? clockOut.format('HH:mm') : '—',
          workedMinutes,
          durationStr: formatDuration(workedMinutes),
          isDifferentWorkedDate,
          total,
        };
      });

      return {
        _id: payroll._id,
        payrollNumber,
        empName,
        designations,
        monthLabel,
        records,
        totalMinutesWorked: totalMins,
        grandTotal: grandTot
      };
    });
  }, [payrolls]);

  // Calculations for Grand Total
  const overallTotalMinutes = processedBatches.reduce((acc, batch) => acc + batch.totalMinutesWorked, 0);
  const overallGrandTotal = processedBatches.reduce((acc, batch) => acc + batch.grandTotal, 0);
  const overallHoursStr = `${Math.floor(overallTotalMinutes / 60)}:${(overallTotalMinutes % 60).toString().padStart(2, '0')}`;

  // ─── Export Handlers ──────────────────────────────────────────────────────────

  const handleGenerateExcel = () => {
    const wb = XLSX.utils.book_new();

    processedBatches.forEach((batch, index) => {
      const sheetData: any[][] = [];
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
      const periodStr = `${moment(fromDate).format('DD-MM-YYYY')} - ${moment(toDate).format('DD-MM-YYYY')}`;
      
      // 1. Employee Name
      sheetData.push([batch.empName, periodStr]); 
      // 2. Designation (directly underneath)
      sheetData.push([batch.designations, '']);
      // 3. Spacer
      sheetData.push([]); 
      // 4. Headers
      sheetData.push(headers);
      
      batch.records.forEach((r: any) => {
        let shiftCell = '';
        const hasShiftName = r.shiftName && r.shiftName.trim() !== '' && r.shiftName !== '—';
        
        if (hasShiftName) {
          shiftCell = `${r.shiftName} : ${r.rotaStartTime} - ${r.rotaEndTime}`;
        } else {
          shiftCell = `${r.rotaStartTime} - ${r.rotaEndTime}`;
        }

        if (r.isDifferentWorkedDate) {
          shiftCell += '\n(Cross-day Shift)';
        }
        
        sheetData.push([
          shiftCell,
          r.startDateStr,
          r.startWeekdayStr,
          r.startTimeStr,
          `${r.endDateStr}${r.isDifferentWorkedDate ? ' *' : ''}`,
          r.endWeekdayStr,
          r.endTimeStr,
          r.durationStr,
          r.payRate ?? 0,
          Number(r.total.toFixed(2)),
        ]);
      });

      const totalHoursStr = `${Math.floor(batch.totalMinutesWorked / 60)}:${(batch.totalMinutesWorked % 60).toString().padStart(2, '0')}`;
      sheetData.push([]);
      sheetData.push([
        '', '', '', '', '', '', 'Total Hours Worked:', totalHoursStr, '', Number(batch.grandTotal.toFixed(2))
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const safeEmpName = batch.empName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 25).trim();
      const sheetName = `${safeEmpName}`;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const fileName = `Detailed_Batch_Payroll_${formattedMonth.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleGeneratePDF = async () => {
    setIsExportingPDF(true);
    try {
      const blob = await pdf(
        <BatchSummaryPayrollPDF 
          batches={processedBatches} 
          companyName={companyData?.name} 
          periodStr={formattedDateRange}
          overallHoursStr={overallHoursStr}
          overallGrandTotal={overallGrandTotal}
        />
      ).toBlob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Summary_Batch_Payroll_${formattedMonth.replace(/\s+/g, '_')}.pdf`; 
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <div className="space-y-6 rounded-xl bg-white p-5 shadow-sm min-h-[80vh]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
          <div className='flex flex-row items-center gap-2'>
            <Button size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 mr-2" />Back
            </Button>
            <Button 
              variant="outline" 
              size={'sm'}
              className="border-none bg-cyan-600 text-white hover:bg-cyan-700"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isRegenerating || processedBatches.length === 0}
            >
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isRegenerating ? 'Regenerating...' : 'Regenerate Payroll'}
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="border-none bg-violet-600 text-white hover:bg-violet-600"
                onClick={handleGeneratePDF}
                disabled={isExportingPDF || processedBatches.length === 0}
              >
                {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Download PDF Summary'}
              </Button>
              <Button 
                variant="outline" 
                                size="sm"

                className="border-none bg-emerald-700 text-white hover:bg-emerald-600"
                onClick={handleGenerateExcel}
                disabled={processedBatches.length === 0}
              >
                Download Excel All Report
              </Button>
          </div>
        </div>

        {/* ── Main Summary Box ── */}
        <div>
          <div className="mb-8 flex items-start justify-between">
            <div className="space-y-4">
              <p className="font-medium text-gray-800">
                Payroll Period: <span className="font-bold">{formattedDateRange}</span>
              </p>
            </div>
            {/* <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-none bg-violet-600 text-white hover:bg-violet-600"
                onClick={handleGeneratePDF}
                disabled={isExportingPDF || processedBatches.length === 0}
              >
                {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Download PDF Summary'}
              </Button>
              <Button 
                variant="outline" 
                className="border-none bg-emerald-700 text-white hover:bg-emerald-600"
                onClick={handleGenerateExcel}
                disabled={processedBatches.length === 0}
              >
                Download Excel All Report
              </Button>
            </div> */}
          </div>

          {/* ── Summary Data Table ── */}
          {loading ? (
            <div className="flex justify-center py-12 font-medium text-gray-500 text-center">
              <BlinkingDots />
            </div>
          ) : error ? (
            <div className="py-12 font-medium text-red-500 text-center">
              {error}
            </div>
          ) : processedBatches.length === 0 ? (
            <div className="py-12 font-medium text-gray-500 text-center">
              No payroll data found for this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-black">Payroll Number</TableHead>
                    <TableHead className="font-bold text-black">Employee Name</TableHead>
                    <TableHead className="font-bold text-black">Designation</TableHead>
                    <TableHead className="font-bold text-black">Hours Worked</TableHead>
                    <TableHead className="font-bold text-right text-black">Total Amount</TableHead>
                    <TableHead className="font-bold text-center text-black">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedBatches.map((row) => (
                    <TableRow onClick={() => navigate(`/company/${companyId}/payroll/${row._id}`)} key={row._id} className="cursor-pointer border-b border-gray-200">
                      <TableCell className="font-medium">{row.payrollNumber}</TableCell>
                      <TableCell className='hover:underline'>{row.empName}</TableCell>
                      <TableCell className="text-gray-600">{row.designations}</TableCell>
                      <TableCell>
                        {Math.floor(row.totalMinutesWorked / 60)}:{(row.totalMinutesWorked % 60).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-semibold text-right">
                        {row.grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering the row click
                            navigate(`/company/${companyId}/payroll/${row._id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Detail Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* ── Grand Total Row ── */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-bold hover:bg-gray-50">
                    <TableCell colSpan={3} className="text-base text-right text-gray-900">Total</TableCell>
                    <TableCell className="text-base text-gray-900">{overallHoursStr}</TableCell>
                    <TableCell className="text-base text-right text-gray-900">
                      {overallGrandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Regeneration */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Regeneration</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the payrolls for this batch? This will pull the latest rotas and attendance records, overwriting any manual overrides currently saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-cyan-600 text-white hover:bg-cyan-700"
              onClick={() => {
                setIsConfirmDialogOpen(false);
                handleRegeneratePayroll();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchPayrollDetails;