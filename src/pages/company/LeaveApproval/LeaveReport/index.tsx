import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import axiosInstance from '@/lib/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
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
    backgroundColor: '#f9fafb'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCellHeader: { margin: 5, fontSize: 9, fontWeight: 'bold' },
  tableCell: { margin: 5, fontSize: 9 },
  // Column Widths
  colName: { width: '22%' },
  colStandard: { width: '13%' }
});

// --- PDF Document Component ---
const ReportPDF = ({
  data,
  companyName,
  holidayYear,
  startDate,
  endDate
}: any) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>{companyName}</Text>
      <Text style={pdfStyles.subHeader}>
        Holiday Year: {holidayYear} | Period:{' '}
        {moment(startDate).format('DD MMM YYYY')} -{' '}
        {moment(endDate).format('DD MMM YYYY')}
      </Text>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colName]}>
            <Text style={pdfStyles.tableCellHeader}>Employee Name</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Opening this year</Text>
          </View>
          <View style={[pdfStyles.tableColHeader, pdfStyles.colStandard]}>
            <Text style={pdfStyles.tableCellHeader}>Holiday Accrued</Text>
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
            <Text style={pdfStyles.tableCellHeader}>Balance Remaining</Text>
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
                <Text style={pdfStyles.tableCell}>{empName}</Text>
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
      </View>
    </Page>
  </Document>
);

// --- Helper Function ---
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

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default dates: March 1st to April 30th (last date of April)
  const defaultStartDate = new Date(currentYearNum, 2, 1); // Month index 2 is March
  const defaultEndDate = new Date(currentYearNum, 3, 30); // Month index 3 is April

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

  // Initial fetch on component mount ONLY.
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAsPDF = async () => {
    if (!startDate || !endDate) return;
    setPdfLoading(true);
    try {
      // Fetch company name specifically for the PDF
      const companyRes = await axiosInstance.get(`/users/${companyId}`);
      const companyName = companyRes.data?.data?.name || 'Company Report';

      // Generate PDF Blob
      const blob = await pdf(
        <ReportPDF
          data={reportData}
          companyName={companyName}
          holidayYear={selectedYear}
          startDate={startDate}
          endDate={endDate}
        />
      ).toBlob();

      // Download Trigger
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
              onClick={handleSaveAsPDF}
              disabled={pdfLoading || reportData.length === 0}
              className="h-[38px] bg-green-600 px-6 text-white hover:bg-green-800"
            >
              {pdfLoading ? 'Generating...' : 'Save As PDF'}
            </Button>
          </div>
        </div>

        <Button onClick={() => navigate(-1)}>
          <MoveLeft className="w-4 h-4 mr-2" />
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
              <TableHead className="py-4 font-bold text-gray-900">
                Opening this year
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900">
                Holiday Accrued
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900">
                Taken
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900">
                Booked
              </TableHead>
              <TableHead className="py-4 font-bold text-gray-900">
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
              reportData.map((item, index) => {
                const user = item.holidayRecord.userId;
                const empName = `${user.firstName} ${user.lastName}`;

                return (
                  <TableRow
                    key={item.holidayRecord._id || index}
                    className="hover:bg-gray-50/50"
                  >
                    <TableCell className="py-4 font-medium">{empName}</TableCell>
                    <TableCell className="py-4 font-medium text-gray-800">
                      {item.holidayRecord.carryForward} 
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-800">
                      {item.holidayRecord.holidayAccured} 
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-800">
                      {item.holidayRecord.usedHours} 
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-800">
                      {item.holidayRecord.bookedHours} 
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-800">
                      {item.holidayRecord.requestedHours} 
                    </TableCell>
                    <TableCell className="py-4 text-right font-semibold text-gray-800">
                      {item.holidayRecord.remainingHours} 
                    </TableCell>
                  </TableRow>
                );
              })
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