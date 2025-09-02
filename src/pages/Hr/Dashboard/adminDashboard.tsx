import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Monitor,
  Search,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  BadgeIcon as IdCard
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import { useNavigate } from 'react-router-dom';

// Mock dashboard stats
const dashboardStats = {
  totalUsers: 35,
  accessToday: 11,
  presentToday: 11,
  absentToday: 24,
  shiftPresent: 4,
  shiftAbsent: 6
};

// Mock device data
const deviceData = [
  {
    id: 'FCAYS11010107',
    deviceName: 'Elizabeth Court Rest Home',
    client: 'elizabeth',
    connectedDateTime: '2024-12-22 13:30:58',
    numberOfUsers: 35,
    presentToday: 11,
    accessToday: 11
  },
  {
    id: 'FCAYS11010108',
    deviceName: 'Main Office Building',
    client: 'mainoffice',
    connectedDateTime: '2024-12-22 14:15:22',
    numberOfUsers: 28,
    presentToday: 15,
    accessToday: 18
  },
  {
    id: 'FCAYS11010109',
    deviceName: 'Branch Office North',
    client: 'northbranch',
    connectedDateTime: '2024-12-22 09:45:33',
    numberOfUsers: 42,
    presentToday: 22,
    accessToday: 25
  }
];

// Define types
interface Employee {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  departmentId: { departmentName: string };
  passportExpiry: {
    hasExpiry: boolean;
    expiryDate: string;
  };
  trainingId?: Array<{
    _id: string;
    name: string;
    expiryDate?: string;
  }>;
}

interface RightToWorkRecord {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  expiryDate: string; // ISO date string
  status: 'active' | 'closed' | 'expire';
  hasExpiry: boolean; // if not in schema, we can derive from expiryDate
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(deviceData);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rightToWorkRecords, setRightToWorkRecords] = useState<
    RightToWorkRecord[]
  >([]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get('/users', {
          params: { role: 'employee', limit: 'all' }
        });
        const fetchedEmployees: Employee[] =
          response.data.data.result || response.data.data;
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setEmployees([]);
      }
    };

    // Fetch right-to-work records
  const fetchRightToWork = async () => {
  try {
    const response = await axiosInstance.get('/hr/right-to-work?limit=all');
    const records: RightToWorkRecord[] = Array.isArray(response.data.data.result)
      ? response.data.data.result
      : [];

    // Filter out any records with null/invalid employeeId
    const validRecords = records.filter((record) => record.employeeId != null);

    setRightToWorkRecords(validRecords);
  } catch (error) {
    console.error('Failed to fetch right-to-work data:', error);
    setRightToWorkRecords([]);
  }
};
    setLoading(true);
    Promise.all([fetchEmployees(), fetchRightToWork()])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter device data based on search
  useEffect(() => {
    const filtered = deviceData.filter(
      (device) =>
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper: Is expiring within 30 days
  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
  };

  // Helper: Is already expired
  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  // Training helpers
  const isTrainingExpiringSoon = (endDate: string, reminderDays: number) => {
    const expiryDate = new Date(endDate);
    const today = new Date();
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(expiryDate.getDate() - reminderDays);
    return today >= reminderDate && today <= expiryDate;
  };

  const isTrainingExpired = (endDate: string) => {
    const today = new Date();
    const expiryDate = new Date(endDate);
    return today > expiryDate;
  };

  // Calculate expiry statistics
  const getExpiryStats = () => {
    // Passport expiry
    const passportExpiring = employees.filter((emp) => {
      const expiry = emp.passportExpiry?.expiryDate;
      return (
        emp.passportExpiry?.hasExpiry &&
        expiry &&
        (isExpiringSoon(expiry) || isExpired(expiry))
      );
    });

    // Right to Work expiry — from /hr/right-to-work API
const rightToWorkExpiring = Array.from(
  new Map(
    rightToWorkRecords
      .filter((record) => {
        // Skip if employeeId is null or missing
        if (!record.employeeId) {
          console.warn('Invalid record: employeeId is missing', record);
          return false;
        }

        const expiry = record.expiryDate;
        return !expiry || isExpiringSoon(expiry) || isExpired(expiry);
      })
      .map((record) => [record.employeeId._id, record]) // Now safe to access _id
  ).values()
);

    const rightToWorkStatusExpired = rightToWorkRecords.filter((record) => {
      // if (record.status !== 'active') return false;
      const nextDate = record.nextCheckDate;
      return nextDate && isExpired(nextDate);
    });

    // Training expiry
    let expiredTrainingCount = 0;
    let expiringSoonTrainingCount = 0;

    employees.forEach((emp) => {
      emp.trainingId?.forEach((training) => {
        if (training.expiryDate) {
          const expiryDate = training.expiryDate;
          const reminderDays = 7; // default, or fetch from trainingId if available
          if (isTrainingExpired(expiryDate)) {
            expiredTrainingCount++;
          } else if (isTrainingExpiringSoon(expiryDate, reminderDays)) {
            expiringSoonTrainingCount++;
          }
        }
      });
    });

    return {
      passport: passportExpiring.length,
      trainingExpired: expiredTrainingCount,
      trainingExpiringSoon: expiringSoonTrainingCount,
      rightToWork: rightToWorkExpiring.length,
      rightToWorkStatus: rightToWorkStatusExpired.length
    };
  };

  const handleExpiryCardClick = (type: string) => {
    navigate(`/admin/hr/expiry/${type}`);
  };

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  const expiryStats = getExpiryStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        {/* Dashboard Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {/* Users Card */}
          <div className="transform rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">USERS</h3>
                <p className="text-lg font-bold">
                  Total: {dashboardStats.totalUsers}
                </p>
                <p className="text-sm">Today: {dashboardStats.accessToday}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>

          {/* Present/Absent Card */}
          <div className="transform rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">
                  PRESENT/ABSENT
                </h3>
                <p className="text-lg font-bold">
                  Present: {dashboardStats.presentToday}
                </p>
                <p className="text-sm">Absent: {dashboardStats.absentToday}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>

          {/* Shift Report Card */}
          {/* <div className="transform rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">
                  SHIFT REPORT
                </h3>
                <p className="text-lg font-bold">
                  Present: {dashboardStats.shiftPresent}
                </p>
                <p className="text-sm">Absent: {dashboardStats.shiftAbsent}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div> */}

          {/* Passport Expiry Card */}
          <div
            className="transform cursor-pointer rounded-lg bg-gradient-to-br from-red-600 to-red-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => handleExpiryCardClick('passport')}
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <IdCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">PASSPORT</h3>
                <p className="text-lg font-bold">
                  Expiring: {expiryStats.passport}
                </p>
                <p className="text-sm">Check details</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>

          {/* Training Expiry Card */}
          <div
            className="transform cursor-pointer rounded-lg bg-gradient-to-br from-orange-600 to-orange-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => handleExpiryCardClick('training')}
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">TRAINING</h3>
                <p className="text-lg font-bold">
                  Expiring: {expiryStats.trainingExpired}
                </p>
                <p className="text-sm">Update records</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>

          {/* Right to Work Expiry Card */}
          <div
            className="transform cursor-pointer rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => handleExpiryCardClick('rightToWork')}
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">
                  RIGHT TO WORK
                </h3>
                <p className="text-lg font-bold">
                  Expiring: {expiryStats.rightToWork}
                </p>
                <p className="text-sm">Verify soon</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>
          {/* Right to Work Status check */}
          <div
            className="transform cursor-pointer rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => handleExpiryCardClick('rightToWorkStatus')}
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-white/20 p-2">
                <IdCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold opacity-90">
                  STATUS CHECK
                </h3>
                <p className="text-lg font-bold">
                  Due: {expiryStats.rightToWorkStatus}
                </p>
                <p className="text-sm">Verifications needed</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs opacity-80">view details</span>
              <ChevronRight className="h-3 w-3 opacity-80" />
            </div>
          </div>
        </div>

        {/* Device Status Section */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center space-x-3">
            <Monitor className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">DEVICE STATUS</h2>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Search:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search devices..."
                  className="w-64 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">
                        Device ID
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Device Name
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Client
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Connected Date & Time
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Number of User
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Present Today
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Access Today
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-gray-500"
                        >
                          No devices found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((device) => (
                        <TableRow
                          key={device.id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <TableCell>
                            <span className="rounded-md bg-supperagent px-3 py-1 text-sm font-medium text-white">
                              {device.id}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {device.deviceName}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {device.client}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {device.connectedDateTime}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {device.numberOfUsers}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-red-600">
                              {device.presentToday}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-red-600">
                              {device.accessToday}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
