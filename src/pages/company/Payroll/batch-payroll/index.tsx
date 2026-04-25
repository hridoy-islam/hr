import React, { useEffect, useState, useMemo } from 'react';
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
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
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
        
        {/* Top Middle Header */}
        <View style={pdfStyles.headerContainer}>
          <Text style={pdfStyles.companyName}>{companyName || "Company Name"}</Text>
          <Text style={pdfStyles.title}>Payroll Summary Report</Text>
          <Text style={pdfStyles.period}>Period: {periodStr}</Text>
        </View>

        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={pdfStyles.colRef}>Payroll Number</Text>
            <Text style={pdfStyles.colEmp}>Employee Name</Text>
            <Text style={pdfStyles.colDesig}>Designation</Text>
            <Text style={pdfStyles.colHours}>Hours Worked</Text>
            <Text style={pdfStyles.colTotal}>Total Amount</Text>
          </View>

          {/* Table Body */}
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
          
          {/* Table Footer / Grand Total */}
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
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayrollDetails = async () => {
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
        const companyData = await axiosInstance.get(`/users/${companyId}`)
        setCompanyData (companyData.data.data)
      } catch (err: any) {
        console.error(err);
        setError('Failed to load payroll details for this batch.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollDetails();
  }, [payrollIds]);

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
      const payrollNumber = payroll.refId ?? payroll._id.slice(-8).toUpperCase();

      let totalMins = 0;
      let grandTot = 0;

      const records = (payroll.attendanceList || []).map((att: any) => {
        const clockIn = moment(att.attendanceId?.clockIn);
        const clockOut = moment(att.attendanceId?.clockOut);

        const workedMinutes =  att.duration ;
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
          startTimeStr: clockIn.isValid() ? clockIn.format('HH:mm') : '—',
          endDateStr: clockOut.isValid() ? clockOut.format('DD-MM-YYYY') : '—',
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
      const headers = ['Shift Details', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Duration', 'Pay Rate', 'Total'];
      const periodStr = `${moment(fromDate).format('DD-MM-YYYY')} - ${moment(toDate).format('DD-MM-YYYY')}`;
      
      sheetData.push([
        `${batch.empName}`, 
        // `Designation: ${batch.designations}`, 
        `${periodStr}`
      ]);      
      sheetData.push([]); 
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
          r.startTimeStr,
          r.endDateStr,
          r.endTimeStr,
          r.durationStr,
          r.payRate ?? 0,
          Number(r.total.toFixed(2)),
        ]);
      });

      const totalHoursStr = `${Math.floor(batch.totalMinutesWorked / 60)}:${(batch.totalMinutesWorked % 60).toString().padStart(2, '0')}`;
      sheetData.push([]);
      sheetData.push(['', '', '', '',  'Total Hours Worked:', totalHoursStr,'', Number(batch.grandTotal.toFixed(2))]);

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
    <div className="space-y-6 bg-white p-5 rounded-xl shadow-sm min-h-[80vh]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900"> Summary</h2>
        <Button size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 mr-2" />Back
        </Button>
      </div>

      {/* ── Main Summary Box ── */}
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-4">
            <p className="font-medium text-gray-800">
              Payroll Period:  <span className="font-bold">{formattedDateRange}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="bg-violet-600 border-none hover:bg-violet-600 text-white"
              onClick={handleGeneratePDF}
              disabled={isExportingPDF || processedBatches.length === 0}
            >
              {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Download PDF Summary'}
            </Button>
            <Button 
              variant="outline" 
              className="bg-emerald-700 border-none hover:bg-emerald-600 text-white"
              onClick={handleGenerateExcel}
              disabled={processedBatches.length === 0}
            >
              Download Excel All Report
            </Button>
          </div>
        </div>

        {/* ── Summary Data Table ── */}
        {loading ? (
          <div className="py-12 text-center text-gray-500 font-medium flex justify-center">
            <BlinkingDots />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 font-medium">
            {error}
          </div>
        ) : processedBatches.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-medium">
            No payroll data found for this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-black ">Payroll Number</TableHead>
                  <TableHead className="font-bold text-black ">Employee Name</TableHead>
                  <TableHead className="font-bold text-black ">Designation</TableHead>
                  <TableHead className="font-bold text-black ">Hours Worked</TableHead>
                  <TableHead className="font-bold text-black  text-right">Total Amount</TableHead>
                  <TableHead className="font-bold text-black  text-center">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedBatches.map((row) => (
                  <TableRow  onClick={() => navigate(`/company/${companyId}/payroll/${row._id}`)} key={row._id} className="border-b border-gray-200 cursor-pointer">
                    <TableCell className="font-medium">{row.payrollNumber}</TableCell>
                    <TableCell className='hover:underline'>{row.empName}</TableCell>
                    <TableCell className="text-gray-600">{row.designations}</TableCell>
                    <TableCell>
                      {Math.floor(row.totalMinutesWorked / 60)}:{(row.totalMinutesWorked % 60).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
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
                        <Eye className="h-4 w-4 mr-2" /> Detail Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* ── Grand Total Row ── */}
                <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300 hover:bg-gray-50">
                  <TableCell colSpan={3} className="text-right text-gray-900 text-base">Total</TableCell>
                  <TableCell className="text-gray-900 text-base">{overallHoursStr}</TableCell>
                  <TableCell className="text-right text-gray-900 text-base">
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
  );
};

export default BatchPayrollDetails;