import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from '@/lib/moment-setup';
import { Search, Loader2, Calendar } from 'lucide-react';

// Shadcn UI Imports
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

  // If the times are already ISO strings, parse them directly
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

const StaffAttendancePage = () => {
  const { id, eid: staffId } = useParams();

  // State: Default range is Full Current Month
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [userData, setUserData] = useState<any>(null);

  // Fetch Attendance Data
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
        isApproved: true // Only fetch approved attendance
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

  // Reset Filters
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

  return (
    <div className="space-y-4 rounded-md bg-white shadow-sm">
      {/* --- NEW HEADER DESIGN --- */}
      <div className="shadow-none">
        <div className="flex flex-col items-start justify-between gap-4 rounded-t-md border-b border-slate-100 bg-gradient-to-r from-theme/5 to-transparent p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme ">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black">
              {userData ? `${userData.firstName} ${userData.lastName}'s Attendance` : 'Attendance Record'}
            </h1>
          </div>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="shadow-none p-4">
          
          {/* Filters Summary Row */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end -mt-5">
            
            {/* Left Side: Displayed Date Range */}
            <div className="text-lg font-semibold text-gray-800">
              <span className="text-sm text-gray-500 block mb-1">Showing period:</span>
              <span>{startDate ? formatDisplayDate(startDate) : '...'}</span>
              {endDate && <span> - {formatDisplayDate(endDate)}</span>}
            </div>

            {/* Right Side: Filters (Date picker + Buttons) */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Date Range */}
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

              {/* Search & Reset Buttons */}
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
              </div>
            </div>
          </div>

          <div className=" mt-4 ">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              entriesPerPage={entriesPerPage}
              setEntriesPerPage={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Reusable Table Section (Read-Only)
const TableSection = ({
  data,
  loading,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  data: any[];
  loading: boolean;
  entriesPerPage: number;
  setEntriesPerPage: (val: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (val: number) => void;
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
            {/* <TableHead>Employee</TableHead> */}
            <TableHead>Department</TableHead>
            <TableHead className="w-[12%]">Start Date</TableHead>
            <TableHead className="w-[12%]">Start Time</TableHead>
            <TableHead className="w-[12%]">End Date</TableHead>
            <TableHead className="w-[12%]">End Time</TableHead>
            <TableHead className="w-[12%]">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const firstName = record.userId?.firstName || '';
            const lastName = record.userId?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const email = record.userId?.email || '--';

            const departmentName =
              record.rotaId?.departmentId?.departmentName || '--';
            const shiftName = record.rotaId?.shiftName || '';
            const rotaStartTime = record.rotaId?.startTime || '';
            const rotaEndTime = record.rotaId?.endTime || '';

            // Dates & times
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

            const dCalc = calculateDuration(
              rStartDate,
              rStartTime,
              rEndDate,
              rEndTime
            );

            return (
              <TableRow key={record._id}>
                {/* Shift */}
                <TableCell className="text-sm font-medium">
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {shiftName
                        ? shiftName
                        : `${rotaStartTime} - ${rotaEndTime}`}
                    </span>
                    {shiftName && (
                      <span className="mt-0.5 text-xs font-semibold tracking-wide text-gray-800">
                        {rotaStartTime} - {rotaEndTime}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Employee */}
                {/* <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{fullName}</span>
                    <span className="text-xs text-gray-800">{email}</span>
                  </div>
                </TableCell> */}

                {/* Department */}
                <TableCell className="text-sm">{departmentName}</TableCell>

                {/* Start Date */}
                <TableCell className="text-sm">{displayDate(rStartDate)}</TableCell>

                {/* Start Time */}
                <TableCell className="font-mono text-sm">
                  {displayTime(rStartTime)}
                </TableCell>

                {/* End Date */}
                <TableCell className="text-sm">{displayDate(rEndDate)}</TableCell>

                {/* End Time */}
                <TableCell className="font-mono text-sm">
                  {displayTime(rEndTime)}
                </TableCell>

                {/* Duration */}
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1 font-mono text-sm text-black">
                    {dCalc.display}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex flex-col gap-2 mt-4">
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