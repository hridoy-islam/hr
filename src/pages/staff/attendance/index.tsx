import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from '@/lib/moment-setup';
import { Search, Loader2, Calendar, FileDown } from 'lucide-react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink
} from '@react-pdf/renderer';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';

// Custom Imports
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

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

const calculateApprovedDuration = (
  rStartDate: string,
  rStartTime: string,
  rEndDate: string,
  rEndTime: string,
  rotaStartTime: string,
  rotaEndTime: string
) => {
  if (!rStartTime || rStartTime === '--' || !rEndTime || rEndTime === '--') {
    return { display: '00:00', minutes: 0 };
  }

  // 1. Determine actual start and end times
  const actualStart = rStartTime.includes('T')
    ? moment(rStartTime)
    : moment(`${rStartDate} ${rStartTime}`, 'YYYY-MM-DD HH:mm');

  const actualEnd = rEndTime.includes('T')
    ? moment(rEndTime)
    : moment(`${rEndDate} ${rEndTime}`, 'YYYY-MM-DD HH:mm');

  if (!actualStart.isValid() || !actualEnd.isValid()) {
    return { display: '00:00', minutes: 0 };
  }

  // 2. Calculate actual attendance duration
  let diffMins = actualEnd.diff(actualStart, 'minutes');
  
  // Safety check: if actual duration is negative, assume an overnight shift 
  // where date data was missing or identical.
  if (diffMins < 0) {
    actualEnd.add(1, 'day');
    diffMins = actualEnd.diff(actualStart, 'minutes');
  }

  if (diffMins < 0) diffMins = 0;

  // 3. NO ROTA FALLBACK: Return the exact actual duration immediately
  if (!rotaStartTime || rotaStartTime === '--' || !rotaEndTime || rotaEndTime === '--') {
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return {
      display: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      minutes: diffMins
    };
  }

  // 4. Calculate total Rota duration (using dummy dates since we only need the time difference)
  const shiftStart = moment(`1970-01-01 ${rotaStartTime}`, 'YYYY-MM-DD HH:mm');
  const shiftEnd = moment(`1970-01-01 ${rotaEndTime}`, 'YYYY-MM-DD HH:mm');

  // Handle overnight rota shifts natively
  if (shiftEnd.isBefore(shiftStart)) {
    shiftEnd.add(1, 'day');
  }

  const maxRotaMins = shiftEnd.diff(shiftStart, 'minutes');

  // 5. Cap actual attendance duration to not exceed the Rota duration
  if (diffMins > maxRotaMins) {
    diffMins = maxRotaMins;
  }

  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return {
    display: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
    minutes: diffMins
  };
};

// --- PDF Components & Styles ---
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#000' },
  metaDataContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 5 },
  metaCol: { flexDirection: 'column' },
  // Added metaRow to keep the label and value inline
  metaRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  // Added a slight margin to the right of the label so it doesn't touch the value
  metaLabel: { fontSize: 11, fontWeight: 'bold', color: '#000', marginRight: 4 },
  metaValue: { fontSize: 11, fontWeight: 'medium', color: '#000' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, borderColor: '#000' },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColShift: { width: '22%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000', padding: 6 },
  tableCol: { width: '13%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000', padding: 6 },
  tableCellHeader: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  tableCell: { fontSize: 9, color: '#000' },
  tableCellBold: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  tableCellSub: { fontSize: 8, color: '#000', marginTop: 3 },
  totalContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  totalBox: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 11, marginRight: 10, fontWeight: 'bold', color: '#000' },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#000' }
});

const formatDisplayDate = (date: any) => {
  if (!date) return '...';
  const d = new Date(date);
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    .replace(',', '');
};

const AttendanceReportPDF = ({ data, user, startDate, endDate, totalDisplay }: any) => {
  const companyName = user?.company?.name || user?.company?.companyName || user?.companyId?.name || 'Company Name';
  
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={pdfStyles.page}>
        
       <View style={pdfStyles.metaDataContainer}>
          <View style={pdfStyles.metaCol}>
            {/* Inline Employee Name */}
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Employee:</Text>
              <Text style={pdfStyles.metaValue}>{user?.firstName} {user?.lastName}</Text>
            </View>
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Email:</Text>
              <Text style={pdfStyles.metaValue}>{user?.email}</Text>
            </View>
            
            {/* Inline Company Name */}
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Company:</Text>
              <Text style={pdfStyles.metaValue}>{companyName}</Text>
            </View>
          </View>
          
          <View style={pdfStyles.metaCol}>
            {/* Inline Period */}
            <View style={pdfStyles.metaRow}>
              <Text style={pdfStyles.metaLabel}>Period:</Text>
              <Text style={pdfStyles.metaValue}>
                {startDate ? formatDisplayDate(startDate) : '...'} - {endDate ? formatDisplayDate(endDate) : '...'}
              </Text>
            </View>
          </View>
        </View>
        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableColShift}><Text style={pdfStyles.tableCellHeader}>Shift Name</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>Department</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>Start Date</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>Start Time</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>End Date</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>End Time</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCellHeader}>Duration</Text></View>
          </View>

          {/* Table Rows */}
          {data.map((record: any, index: number) => {
            const dept = record.rotaId?.departmentId?.departmentName || '--';
            const shiftName = record.rotaId?.shiftName || '';
            const rotaStartTime = record.rotaId?.startTime || '';
            const rotaEndTime = record.rotaId?.endTime || '';

            const rStartDate = record.clockInDate || record.date || '';
            const rEndDate = record.clockOutDate || record.date || '';
            const firstLog = record.attendanceLogs?.[0];
            const rStartTime = firstLog?.clockIn || record.clockIn || '--';
            const rEndTime = firstLog?.clockOut || record.clockOut || '--';

            const displayTime = (t: string) => {
              if (!t || t === '--') return '--';
              if (t.includes('T')) return moment(t).format('HH:mm');
              if (t.length >= 5) return t.substring(0, 5);
              return t;
            };

            const displayDate = (d: string) => d ? moment(d).format('DD-MM-YYYY') : '--';

            const appCalc = calculateApprovedDuration(rStartDate, rStartTime, rEndDate, rEndTime, rotaStartTime, rotaEndTime);

            let shiftDurationDisplay = '';
            if (rotaStartTime && rotaEndTime) {
              const rStart = moment(rotaStartTime, 'HH:mm');
              const rEnd = moment(rotaEndTime, 'HH:mm');
              if (rEnd.isBefore(rStart)) rEnd.add(1, 'day');

              const diffMins = rEnd.diff(rStart, 'minutes');
              if (diffMins > 0) {
                const hrs = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                shiftDurationDisplay = mins === 0
                  ? `(${hrs.toString().padStart(2, '0')}h)`
                  : `(${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m)`;
              }
            }

            return (
              <View style={pdfStyles.tableRow} key={index}>
                <View style={pdfStyles.tableColShift}>
                  <Text style={pdfStyles.tableCellBold}>
                    {shiftName ? shiftName : (rotaStartTime && rotaEndTime ? `${rotaStartTime} - ${rotaEndTime} ${shiftDurationDisplay}` : '--')}
                  </Text>
                  {shiftName && rotaStartTime && rotaEndTime && (
                    <Text style={pdfStyles.tableCellSub}>
                      {rotaStartTime} - {rotaEndTime} {shiftDurationDisplay}
                    </Text>
                  )}
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCell}>{dept}</Text>
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCell}>{displayDate(rStartDate)}</Text>
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCell}>{displayTime(rStartTime)}</Text>
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCell}>{displayDate(rEndDate)}</Text>
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCell}>{displayTime(rEndTime)}</Text>
                </View>
                <View style={pdfStyles.tableCol}>
                  <Text style={pdfStyles.tableCellBold}>{appCalc.display}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={pdfStyles.totalContainer}>
          <View style={pdfStyles.totalBox}>
            <Text style={pdfStyles.totalLabel}>Total Hours:</Text>
            <Text style={pdfStyles.totalValue}>{totalDisplay}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
// --- Main Page Component ---
const StaffAttendancePage = () => {
  const { id, eid: staffId } = useParams();

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [userData, setUserData] = useState<any>(null);

  const fetchAttendance = async (page: number, limit: number) => {
    if (!id || !staffId) return;

    setIsLoading(true);
    try {
      const params: any = {
        companyId: id,
        page,
        limit,
        fromDate: startDate
          ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
          : undefined,
        toDate: endDate
          ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
          : undefined,
        userId: staffId,
        userType: 'employee',
        isApproved: true 
      };

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;
      
      const userRes = await axiosInstance.get(`/users/${staffId}`);
      setUserData(userRes.data.data);
      
      if (apiResponse.success && apiResponse.data) {
        setAttendanceData(apiResponse.data.result || []);
        setTotalPages(apiResponse.data.meta?.totalPage || 1);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(currentPage, entriesPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, staffId, currentPage, entriesPerPage]);

  const handleReset = () => {
    setDateRange([
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    ]);
  };

  const formatDisplayDate = (date: Date) =>
    date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      .replace(',', '');

  // Parent Level Calculation for sharing Total across Web Table & PDF 
  const totalApprovedMinutes = attendanceData.reduce((acc, record) => {
    const rStartDate = record.clockInDate || record.date || '';
    const rEndDate = record.clockOutDate || record.date || '';
    const firstLog = record.attendanceLogs?.[0];
    const rStartTime = firstLog?.clockIn || record.clockIn || '--';
    const rEndTime = firstLog?.clockOut || record.clockOut || '--';
    const rotaStartTime = record.rotaId?.startTime || '';
    const rotaEndTime = record.rotaId?.endTime || '';

    const appCalc = calculateApprovedDuration(
      rStartDate,
      rStartTime,
      rEndDate,
      rEndTime,
      rotaStartTime,
      rotaEndTime
    );
    return acc + appCalc.minutes;
  }, 0);

  const totalHours = Math.floor(totalApprovedMinutes / 60);
  const totalMins = totalApprovedMinutes % 60;
  const totalApprovedDisplay = `${totalHours.toString().padStart(2, '0')}:${totalMins.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4 rounded-md bg-white shadow-sm">
      <div className="shadow-none">
        <div className="flex flex-col items-start justify-between gap-4 rounded-t-md border-b border-slate-100 bg-gradient-to-r from-theme/5 to-transparent p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme ">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black">
              {userData
                ? `${userData.firstName} ${userData.lastName}'s Attendance`
                : 'Attendance Record'}
            </h1>
          </div>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-4 shadow-none">
          <div className="-mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="text-lg font-semibold text-gray-800">
              <span className="mb-1 block text-sm text-gray-500">
                Showing period:
              </span>
              <span>{startDate ? formatDisplayDate(startDate) : '...'}</span>
              {endDate && <span> - {formatDisplayDate(endDate)}</span>}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-auto">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">
                  Date Range (DD-MM-YYYY)
                </label>
                <div className="relative w-full sm:w-64">
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    isClearable={true}
                    dateFormat="dd-MM-yyyy"
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select range"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    portalId="root"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fetchAttendance(currentPage, entriesPerPage)}
                  disabled={isLoading}
                  className="h-10"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  title="Reset Filters"
                  className="h-10 px-3"
                >
                  Reset
                </Button>

                {/* --- GENERATE PDF BUTTON --- */}
                {attendanceData.length > 0 && userData && (
                  <Button variant="default" className="h-10 px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm" asChild>
                    <PDFDownloadLink
                      document={
                        <AttendanceReportPDF 
                          data={attendanceData} 
                          user={userData} 
                          startDate={startDate} 
                          endDate={endDate} 
                          totalDisplay={totalApprovedDisplay} 
                        />
                      }
                      fileName={`${userData.firstName}_Attendance_Report.pdf`}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                    >
                      {({ loading }) => (
                        <>
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                          {loading ? 'Preparing...' : 'Generate Report'}
                        </>
                      )}
                    </PDFDownloadLink>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              entriesPerPage={entriesPerPage}
              setEntriesPerPage={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              totalApprovedDisplay={totalApprovedDisplay}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Reusable Table Section
const TableSection = ({
  data,
  loading,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  totalPages,
  setCurrentPage,
  totalApprovedDisplay
}: {
  data: any[];
  loading: boolean;
  entriesPerPage: number;
  setEntriesPerPage: (val: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (val: number) => void;
  totalApprovedDisplay: string;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-50 p-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          No records found
        </h3>
        <p className="max-w-[250px] text-sm text-gray-500">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="w-[12%]">Start Date</TableHead>
            <TableHead className="w-[12%]">Start Time</TableHead>
            <TableHead className="w-[12%]">End Date</TableHead>
            <TableHead className="w-[12%]">End Time</TableHead>
            {/* <TableHead className="w-[10%]">Duration</TableHead> */}
            <TableHead className="w-[12%]">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const departmentName =
              record.rotaId?.departmentId?.departmentName || '--';
            const shiftName = record.rotaId?.shiftName || '';
            const rotaStartTime = record.rotaId?.startTime || '';
            const rotaEndTime = record.rotaId?.endTime || '';

            const rStartDate = record.clockInDate || record.date || '';
            const rEndDate = record.clockOutDate || record.date || '';

            const firstLog = record.attendanceLogs?.[0];
            const rStartTime = firstLog?.clockIn || record.clockIn || '--';
            const rEndTime = firstLog?.clockOut || record.clockOut || '--';

            const displayTime = (t: string) => {
              if (!t || t === '--') return '--';
              if (t.includes('T')) return moment(t).format('HH:mm');
              if (t.length >= 5) return t.substring(0, 5);
              return t;
            };

            const displayDate = (d: string) =>
              d ? moment(d).format('DD-MM-YYYY') : '--';

            const dCalc = calculateDuration(rStartDate, rStartTime, rEndDate, rEndTime);
            const appCalc = calculateApprovedDuration(rStartDate, rStartTime, rEndDate, rEndTime, rotaStartTime, rotaEndTime);

            let shiftDurationDisplay = '';
            if (rotaStartTime && rotaEndTime) {
              const rStart = moment(rotaStartTime, 'HH:mm');
              const rEnd = moment(rotaEndTime, 'HH:mm');
              if (rEnd.isBefore(rStart)) rEnd.add(1, 'day');

              const diffMins = rEnd.diff(rStart, 'minutes');
              if (diffMins > 0) {
                const hrs = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                shiftDurationDisplay =
                  mins === 0
                    ? `(${hrs.toString().padStart(2, '0')}h)`
                    : `(${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m)`;
              }
            }

            return (
              <TableRow key={record._id}>
                <TableCell className="text-sm font-medium">
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {shiftName
                        ? shiftName
                        : rotaStartTime && rotaEndTime
                          ? `${rotaStartTime} - ${rotaEndTime} ${shiftDurationDisplay}`
                          : '--'}
                    </span>
                    {shiftName && rotaStartTime && rotaEndTime && (
                      <span className="mt-0.5 text-xs font-semibold tracking-wide text-gray-800">
                        {rotaStartTime} - {rotaEndTime}{' '}
                        <span className="font-medium text-gray-500">
                          {shiftDurationDisplay}
                        </span>
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{departmentName}</TableCell>
                <TableCell className="text-sm">{displayDate(rStartDate)}</TableCell>
                <TableCell className="font-mono text-sm">{displayTime(rStartTime)}</TableCell>
                <TableCell className="text-sm">{displayDate(rEndDate)}</TableCell>
                <TableCell className="font-mono text-sm">{displayTime(rEndTime)}</TableCell>
                {/* <TableCell className="text-sm">
                  <div className="flex items-center gap-1 font-mono text-sm ">
                    {dCalc.display}
                  </div>
                </TableCell> */}
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1 font-mono text-sm font-semibold text-black">
                    {appCalc.display}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        
        <TableFooter className="bg-transparent hover:bg-transparent border-none">
          <TableRow className="hover:bg-transparent border-0">
            <TableCell colSpan={5} className="border-0"></TableCell>
            <TableCell colSpan={2} className="p-0 pt-4">
              <div className="flex items-center text-lg font-bold justify-start gap-4 bg-white px-4 py-3">
                <span className="text-sm font-semibold">Total Hours:</span>
                <span className="text-base font-bold">{totalApprovedDisplay}</span>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="mt-4 flex flex-col gap-2">
        {data.length > 50 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default StaffAttendancePage;