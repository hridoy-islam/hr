import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import axiosInstance from '@/lib/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MoveLeft, FileDown, FileText } from 'lucide-react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf
} from '@react-pdf/renderer';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Type Definitions ---
interface UserInfo {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface HolidayRecord {
  _id: string;
  userId: UserInfo;
  year: string;
  carryForward: number;
  holidayEntitlement: number;
  holidayAllowance: number;
  holidayAccured: number;
  usedHours: number;
  bookedHours: number;
  requestedHours: number;
  remainingHours: number;
  unpaidLeaveTaken: number;
  unpaidBookedHours: number;
  unpaidLeaveRequest: number;
  hoursPerDay: number;
}

interface DateRangeSummary {
  period: { startDate: string; endDate: string };
  year: string;
  usedHours: number;
  bookedHours: number;
  requestedHours: number;
  totalLeaveCount: number;
  leaveBreakdown: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

interface ReportResult {
  holidayRecord: HolidayRecord;
  dateRangeSummary: DateRangeSummary;
}

// Added Totals Type
interface Totals {
  carryForward: number;
  holidayAccured: number;
  usedHours: number;
  bookedHours: number;
  requestedHours: number;
  remainingHours: number;
}

// --- PDF Styles ---
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  subHeader: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000000'
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f9fafb',
    justifyContent: 'center'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableCell: { margin: 5, fontSize: 9, textAlign: 'center' },
  colName: { width: '22%' },
  colStandard: { width: '13%' }
});

// --- PDF Document Component ---
const ReportPDF = ({
  data,
  companyName,
  holidayYear,
  startDate,
  endDate,
  totals // Added totals prop
}: any) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>{companyName}</Text>
      <Text style={pdfStyles.subHeader}>
        Holiday Year: {holidayYear} | Period:{' '}
        {new Date(startDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}{' '}
        -{' '}
        {new Date(endDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </Text>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colName]}>
            <Text style={{ ...pdfStyles.tableCellHeader, textAlign: 'left' }}>
              Employee Name
            </Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>
              Opening{'\n'}this year
            </Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Holiday{'\n'}Accrued</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Taken</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Booked</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Requested</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>
              Balance{'\n'}Remaining
            </Text>
          </View>
        </View>

        {data.map((item: ReportResult, index: number) => {
          const user = item.holidayRecord.userId;
          const empName = `${user.firstName} ${user.lastName}`;
          return (
            <View
              style={pdfStyles.tableRow}
              key={item.holidayRecord._id || index}
            >
              <View style={[pdfStyles.tableCol, pdfStyles.colName]}>
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'left' }}>
                  {empName}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.carryForward}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.holidayAccured}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.usedHours}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.bookedHours}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.requestedHours}
                </Text>
              </View>
              <View style={[pdfStyles.tableCol, pdfStyles.colStandard]}>
                <Text style={pdfStyles.tableCell}>
                  {item.holidayRecord.remainingHours}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Totals Row in PDF */}
        {data.length > 0 && (
          <View style={[pdfStyles.tableRow, { backgroundColor: '#f9fafb' }]}>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colName]}>
              <Text style={{ ...pdfStyles.tableCellHeader, textAlign: 'left' }}>
                Total
              </Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>
                {totals.carryForward}
              </Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>
                {totals.holidayAccured}
              </Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>{totals.usedHours}</Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>
                {totals.bookedHours}
              </Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>
                {totals.requestedHours}
              </Text>
            </View>
            <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
              <Text style={pdfStyles.tableCellHeader}>
                {totals.remainingHours}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Page>
  </Document>
);

// --- Helper Functions ---
const generateHolidayYears = (backward = 20, forward = 50) => {
  const currentYear = moment().year();
  const years: string[] = [];
  for (let i = backward; i > 0; i--) {
    years.push(`${currentYear - i}-${currentYear - i + 1}`);
  }
  years.push(`${currentYear}-${currentYear + 1}`);
  for (let i = 1; i <= forward; i++) {
    years.push(`${currentYear + i}-${currentYear + i + 1}`);
  }
  return years;
};

const formatLocalDate = (date: Date) => {
    return moment(date).startOf('day').format('DD MMM YYYY');
  
};

const getDatesFromHolidayYear = (yearStr: string): [Date, Date] => {
  const [startYearStr, endYearStr] = yearStr.split('-');
  const startYear = parseInt(startYearStr, 10);
  const endYear = parseInt(endYearStr, 10);
  const startDate = new Date(startYear, 3, 1);
  const endDate = new Date(endYear, 2, 31);
  return [startDate, endDate];
};

const LeaveReportPage: React.FC = () => {
  const { id: companyId } = useParams();
  const navigate = useNavigate();

  // 1. Initial Data Setup
  const currentYearNum = moment().year();
  const currentYearStr = `${currentYearNum}-${currentYearNum + 1}`;

  const yearOptions = useMemo(
    () =>
      generateHolidayYears(20, 50).map((year) => ({
        value: year,
        label: year
      })),
    []
  );

  const [defaultStartDate, defaultEndDate] =
    getDatesFromHolidayYear(currentYearStr);

  // 2. State Management
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    defaultStartDate,
    defaultEndDate
  ]);
  const [startDate, endDate] = dateRange;

  const [reportData, setReportData] = useState<ReportResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate Totals dynamically
  const totals = useMemo<Totals>(() => {
    return reportData.reduce(
      (acc, curr) => {
        const rec = curr.holidayRecord;
        acc.carryForward += rec.carryForward || 0;
        acc.holidayAccured += rec.holidayAccured || 0;
        acc.usedHours += rec.usedHours || 0;
        acc.bookedHours += rec.bookedHours || 0;
        acc.requestedHours += rec.requestedHours || 0;
        acc.remainingHours += rec.remainingHours || 0;
        return acc;
      },
      {
        carryForward: 0,
        holidayAccured: 0,
        usedHours: 0,
        bookedHours: 0,
        requestedHours: 0,
        remainingHours: 0
      }
    );
  }, [reportData]);

  // Sync DatePicker with the selected Holiday Year
  useEffect(() => {
    if (selectedYear) {
      const [newStart, newEnd] = getDatesFromHolidayYear(selectedYear);
      setDateRange([newStart, newEnd]);
    }
  }, [selectedYear]);

  // 3. Handlers
  const fetchReportData = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('/hr/leave/report', {
        params: {
          holidayYear: selectedYear,
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
          companyId
        }
      });
      setReportData(response.data.data.result || []);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        backendMessage ||
          err.message ||
          'An error occurred while fetching the data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAsPDF = async () => {
    if (!startDate || !endDate) return;
    setPdfLoading(true);
    try {
      const companyRes = await axiosInstance.get(`/users/${companyId}`);
      const companyName = companyRes.data?.data?.name || 'Company Report';

      const blob = await pdf(
        <ReportPDF
          data={reportData}
          companyName={companyName}
          holidayYear={selectedYear}
          startDate={startDate}
          endDate={endDate}
          totals={totals} // Pass totals to PDF
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Leave_Report_${selectedYear}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError('Failed to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // CSV Export Handler
  const handleSaveAsCSV = () => {
    if (reportData.length === 0) return;

    const headers = [
      'Employee Name',
      'Opening this year',
      'Holiday Accrued',
      'Taken',
      'Booked',
      'Requested',
      'Balance Remaining'
    ];

    const rows = reportData.map((item) => {
      const user = item.holidayRecord.userId;
      const empName = `${user.firstName} ${user.lastName}`;
      return [
        `"${empName}"`, // Encapsulate in quotes in case of commas
        item.holidayRecord.carryForward,
        item.holidayRecord.holidayAccured,
        item.holidayRecord.usedHours,
        item.holidayRecord.bookedHours,
        item.holidayRecord.requestedHours,
        item.holidayRecord.remainingHours
      ].join(',');
    });

    const totalRow = [
      '"Total"',
      totals.carryForward,
      totals.holidayAccured,
      totals.usedHours,
      totals.bookedHours,
      totals.requestedHours,
      totals.remainingHours
    ].join(',');

    const csvContent = [headers.join(','), ...rows, totalRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Leave_Report_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Render
  return (
    <div className="min-h-screen w-full rounded-md bg-white p-5 shadow-sm">
      {/* Top Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* react-select Running Year Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Holiday Year
            </label>
            <div className="w-[180px]">
              <Select
                options={yearOptions}
                value={yearOptions.find((opt) => opt.value === selectedYear)}
                onChange={(option) =>
                  setSelectedYear(option?.value || currentYearStr)
                }
                className="text-sm"
              />
            </div>
          </div>

          {/* Date Picker (Range) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Holiday Duration
            </label>
            <div className="flex h-[38px] items-center rounded-md border border-[#cccccc] bg-white px-3">
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                dateFormat="dd MMMM yyyy"
                placeholderText="Select date range"
                isClearable
                className="w-[260px] bg-transparent text-sm text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex h-full items-end gap-2">
            <Button
              onClick={fetchReportData}
              disabled={loading || !startDate || !endDate}
              className="h-[38px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>

            <Button
              onClick={handleSaveAsCSV}
              disabled={reportData.length === 0}
              variant="outline"
              className="h-[38px] px-4"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button
              onClick={handleSaveAsPDF}
              variant="outline"
              disabled={pdfLoading || reportData.length === 0}
              className="h-[38px]  px-4 "
            >
              <FileDown className="mr-2 h-4 w-4" />
              {pdfLoading ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        </div>

        <Button onClick={() => navigate(-1)} variant="outline">
          <MoveLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="mb-4 font-medium text-red-600">{error}</div>}

      {/* Data Table */}
      <div className="w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="rounded-tl-md py-4 font-bold text-gray-900">
                Employee Name
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900 ">
                Opening this year
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900 ">
                Holiday Accrued
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900 ">
                Taken
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900 ">
                Booked
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900 ">
                Requested
              </TableHead>
              <TableHead className="rounded-tr-md py-4 text-right font-bold text-gray-900">
                Balance Remaining
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell colSpan={7}>
                  <div className="flex justify-center py-4">
                    <BlinkingDots size="large" color="bg-theme" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reportData.length > 0 ? (
              <>
                {reportData.map((item, index) => {
                  const user = item.holidayRecord.userId;
                  const empName = `${user.firstName} ${user.lastName}`;

                  return (
                    <TableRow
                      key={item.holidayRecord._id || index}
                      className="hover:bg-gray-50/50"
                    >
                      <TableCell className="py-4 font-medium">
                        {empName}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-800 text-center">
                        {item.holidayRecord.carryForward}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-800 text-center">
                        {item.holidayRecord.holidayAccured}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-800 text-center">
                        {item.holidayRecord.usedHours}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-800 text-center">
                        {item.holidayRecord.bookedHours}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-800 text-center">
                        {item.holidayRecord.requestedHours}
                      </TableCell>
                      <TableCell className="py-4 text-right font-semibold text-gray-800">
                        {item.holidayRecord.remainingHours}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* --- Totals Row --- */}
                <TableRow className="border-t-2 border-gray-300 bg-gray-100 hover:bg-gray-100">
                  <TableCell className="py-4 font-bold text-gray-900">
                    Total
                  </TableCell>
                  <TableCell className="py-4 font-bold text-gray-900 text-center">
                    {totals.carryForward}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-gray-900 text-center">
                    {totals.holidayAccured}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-gray-900 text-center">
                    {totals.usedHours}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-gray-900 text-center">
                    {totals.bookedHours}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-gray-900 text-center">
                    {totals.requestedHours}
                  </TableCell>
                  <TableCell className="py-4 text-right font-bold text-gray-900">
                    {totals.remainingHours}
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-gray-500"
                >
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaveReportPage;
