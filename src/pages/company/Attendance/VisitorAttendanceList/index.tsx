import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import {
  Search,
  Calendar as CalendarIcon,
  Loader2,
  RotateCcw,
  Eye
} from 'lucide-react';

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
import { useNavigate, useParams } from 'react-router-dom';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

// --- Types ---
interface RootState {
  auth: {
    user: {
      _id: string;
      companyId: string;
      role: string;
    } | null;
  };
}

const VisitorAttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  const { id } = useParams();

  // State: Default range is Full Current Month
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    moment().startOf('month').toDate(),
    moment().endOf('month').toDate()
  ]);
  const [startDate, endDate] = dateRange;
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch Attendance Data
  const fetchAttendance = async (page: number, limit: number) => {
    if (!id) return;

    setIsLoading(true);
    try {
      const params = {
        companyId: id,
        page,
        limit,
        userType: 'visitor', // Crucial: Only fetch visitors
        fromDate: startDate
          ? moment(startDate).format('YYYY-MM-DD')
          : undefined,
        toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined
      };

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;

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
  }, [id, currentPage, entriesPerPage]);

  // Reset Filters
  const handleReset = () => {
    setDateRange([
      moment().startOf('month').toDate(),
      moment().endOf('month').toDate()
    ]);
  };

  const handleView = (recordId: string) => {
    navigate(`${recordId}`);
  };

  return (
    <div className="space-y-3">
      <Card className="w-full bg-white shadow-md">
        <CardContent className="space-y-3 pt-4">
          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-5 ">
            {/* Date Range */}
            <div className="w-full ">
              <label className="mb-2 block text-lg font-semibold uppercase tracking-wider ">
                Date Range
              </label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="flex h-10 w-full rounded-md border-2 border-gray-600 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                  dateFormat='dd-MM-YYYY'
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div className=" flex gap-2">
              <Button
                onClick={() => fetchAttendance(currentPage, entriesPerPage)}
                disabled={isLoading}
                className="h-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                title="Reset Filters"
                className="h-10"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>

          {/* Table Header Summary */}
          <div className="mt-2 text-lg font-semibold ">
            Attendance:{' '}
            <span className="">
              {startDate ? moment(startDate).format('MMM DD, YYYY') : '...'}
            </span>
            {endDate && (
              <span> - {moment(endDate).format('MMM DD, YYYY')}</span>
            )}
          </div>

          <div className="rounded-md">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              onViewClick={handleView}
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

// Reusable Table Section
const TableSection = ({
  data,
  loading,
  onViewClick,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  totalPages,
  setCurrentPage
}: {
  data: any[];
  loading: boolean;
  onViewClick: (recordId: string) => void;
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
        <p className="max-w-3xl text-sm text-gray-700">
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
            <TableHead>Visitor Name</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead className="w-[30%]">Reason For Visit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            // Extract Values directly from the schema root
            const visitorName = record.visitorName || 'Unknown';
            const visitReason = record.visitReason || '--';

            // Format Dates
            const startDate = record.clockInDate
              ? moment(record.clockInDate).format('DD-MM-YYYY')
              : '--';
            const endDate = record.clockOutDate
              ? moment(record.clockOutDate).format('DD-MM-YYYY')
              : '--';

            // Times
            const startTime = record.clockIn || '--';
            const endTime = record.clockOut || '--';

            return (
              <TableRow key={record._id}>
                <TableCell>
                  <span className="text-sm font-medium">{visitorName}</span>
                </TableCell>

                <TableCell className="text-sm font-medium">
                  {startDate}
                </TableCell>

                <TableCell className="text-sm font-medium">
                  {startTime}
                </TableCell>

                <TableCell className="text-sm font-medium">{endDate}</TableCell>

                <TableCell className="text-sm  font-medium">
                  {endTime}
                </TableCell>

                <TableCell className="truncate  text-xs">
                  {visitReason}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {data.length > 60 && (
        <DynamicPagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default VisitorAttendancePage;
