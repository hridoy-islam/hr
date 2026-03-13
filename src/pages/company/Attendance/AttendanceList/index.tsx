import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
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

// --- Helpers ---

/**
 * Dynamically calculates duration from attendanceLogs array in HH:mm
 */
const calculateDynamicDuration = (logs: any[]) => {
  if (!logs || logs.length === 0) return '00:00';

  let totalMinutes = 0;

  logs.forEach((log) => {
    if (log.clockIn && log.clockOut) {
      const start = moment(log.clockIn, 'HH:mm');
      const end = moment(log.clockOut, 'HH:mm');

      // Handle shifts that cross midnight
      if (end.isBefore(start)) {
        end.add(1, 'day');
      }

      totalMinutes += end.diff(start, 'minutes');
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const AttendancePage = () => {
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

  // Options State
  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [departmentsOptions, setDepartmentsOptions] = useState<any[]>([]);
  const [usersOptions, setUsersOptions] = useState<any[]>([]);

  // Filters State
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch Meta Data
  useEffect(() => {
    if (!id) return;
    const fetchMetaData = async () => {
      try {
        const companyId = id;

        const [desRes, deptRes, usersRes] = await Promise.all([
          axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
          axiosInstance.get(`/users?company=${companyId}&limit=all&role=employee`)
        ]);

        setDesignationsOptions(
          (desRes.data?.data?.result || []).map((d: any) => ({
            value: d._id,
            label: d.title
          }))
        );
        setDepartmentsOptions(
          (deptRes.data?.data?.result || []).map((d: any) => ({
            value: d._id,
            label: d.departmentName
          }))
        );
        setUsersOptions(
          (usersRes.data?.data?.result || []).map((u: any) => ({
            value: u._id,
            label: `${u.firstName} ${u.lastName}`
          }))
        );
      } catch (error) {
        console.error('Failed to fetch meta data', error);
      }
    };
    fetchMetaData();
  }, [id]);

  // Fetch Attendance Data
  const fetchAttendance = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const params = {
        companyId: id,
        limit: 'all',
        fromDate: startDate
          ? moment(startDate).format('YYYY-MM-DD')
          : undefined,
        toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
        designationId: selectedDesignation?.value,
        departmentId: selectedDepartment?.value,
        userId: selectedUser?.value,
      };

      const res = await axiosInstance.get(`/hr/attendance`, { params });
      const apiResponse = res.data;

      if (apiResponse.success && apiResponse.data) {
        setAttendanceData(apiResponse.data.result || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  // Reset Filters
  const handleReset = () => {
    setSelectedUser(null);
    setSelectedDesignation(null);
    setSelectedDepartment(null);
    setDateRange([moment().startOf('month').toDate(), moment().endOf('month').toDate()]);
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
            {/* Employee Filter */}
            <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Employee
              </label>
              <Select
                options={usersOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div>

            {/* Department Filter */}
            <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Department
              </label>
              <Select
                options={departmentsOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div>

            {/* Designation Filter */}
            {/* <div className="">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Designation
              </label>
              <Select
                options={designationsOptions}
                value={selectedDesignation}
                onChange={setSelectedDesignation}
                placeholder="Select..."
                isClearable
                className="text-sm"
              />
            </div> */}

            {/* Date Range */}
            <div className="w-full">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider ">
                Date Range
              </label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="flex w-full h-10 rounded-md border border-gray-300 px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select range"
                  wrapperClassName="w-full"
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Search & Reset Buttons */}
            <div className=" flex gap-2">
              <Button onClick={fetchAttendance} disabled={isLoading} className="h-10">
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
          <div className="mt-2 text-lg font-semibold text-gray-600">
              Attendance: <span className="">{startDate ? moment(startDate).format("MMM DD, YYYY") : '...'}</span> 
              {endDate && <span > - {moment(endDate).format("MMM DD, YYYY")}</span>}
          </div>

          <div className="rounded-md">
            <TableSection
              data={attendanceData}
              loading={isLoading}
              onViewClick={handleView}
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
  onViewClick
}: {
  data: any[];
  loading: boolean;
  onViewClick: (recordId: string) => void;
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
            <TableHead>Date</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Shift Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const firstName = record.userId?.firstName || '';
            const lastName = record.userId?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const email = record.userId?.email || '--';
            
            // Extract values from Rota
            const departmentName = record.rotaId?.departmentId?.departmentName || '--';
            const shiftName = record.rotaId?.shiftName || '--';
            
            // Format Date
            const displayDate = record.date ? moment(record.date).format('DD-MM-YYYY') : '--';

            // Calculate Dynamic Duration from Logs
            const durationFormatted = calculateDynamicDuration(record.attendanceLogs);

            return (
              <TableRow key={record._id}>
                <TableCell className="font-medium text-sm">
                  {displayDate}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm font-medium">{fullName}</span>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">{email}</span>
                </TableCell>

                <TableCell className="text-sm">
                  {departmentName}
                </TableCell>

                <TableCell className="text-sm">
                  {shiftName}
                </TableCell>

                <TableCell className="text-sm font-mono font-medium">
                  {durationFormatted}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => onViewClick(record._id)}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendancePage;