import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
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
import moment from 'moment';

// Types
interface Department {
  departmentName: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  departmentId?: Department;
  passportExpiry?: string | null;
  training?: Array<{
    _id: string;
    name: string;
    expireDate?: string | null;
    trainingId: any;
    status:string
  }>;
}

interface RightToWorkRecord {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    departmentId?: Department;
  };
  expiryDate?: string | null;
  nextCheckDate?: string | null;
  status?: 'active' | 'closed' | 'expired';
}

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

// Helper Functions
const isExpired = (date: string) => moment(date).isBefore(moment(), 'day');
const isExpiringSoon = (date: string, days = 90) => {
  const expiry = moment(date);
  const threshold = moment().add(days, 'days');
  return expiry.isSameOrAfter(moment(), 'day') && expiry.isSameOrBefore(threshold, 'day');
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rightToWorkRecords, setRightToWorkRecords] = useState<RightToWorkRecord[]>([]);

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, rtwRes] = await Promise.all([
          axiosInstance.get('/users', {
            params: {
              role: 'employee',
              limit: 'all',
              fields: 'firstName lastName email passportExpiry departmentId training'
            }
          }),
          axiosInstance.get('/hr/right-to-work', {
            params: {
              limit: 'all',
              fields: 'employeeId expiryDate nextCheckDate status'
            }
          })
        ]);

        // Parse employees
        const fetchedEmployees: Employee[] =
          empRes.data.data?.result || empRes.data.data || [];
        setEmployees(fetchedEmployees);

        // Parse right-to-work records
        const records: RightToWorkRecord[] =
          rtwRes.data.data?.result || rtwRes.data.data || [];

        // Filter valid records (with employeeId)
        const validRecords = records.filter((r) => r.employeeId);
        setRightToWorkRecords(validRecords);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setEmployees([]);
        setRightToWorkRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate Expiry Stats
  const getExpiryStats = () => {
    let passportExpiring = 0;
    let trainingExpired = 0;
    let trainingExpiringSoon = 0;
    const rtwExpiringSet = new Set<string>(); // Deduplicate by employee ID
    const rtwStatusExpiredSet = new Set<string>();

    // Passport Expiry
    employees.forEach((emp) => {
      if (emp.passportExpiry && (isExpired(emp.passportExpiry) || isExpiringSoon(emp.passportExpiry))) {
        passportExpiring++;
      }

      // Training Expiry
        emp.training?.forEach((t) => {
      if (!t.expireDate) return;

      // skip completed trainings unless recurring
      if (t.status === "completed" && !(t.trainingId as any).isRecurring) return;

      if (isExpired(t.expireDate)) {
        trainingExpired++;
      } else if (isExpiringSoon(t.expireDate)) {
        trainingExpiringSoon++;
      }
    });
  });

    // Right to Work - expiryDate (expiring or no expiry)
    rightToWorkRecords.forEach((record) => {
      const empId = record.employeeId._id;
      const { expiryDate, nextCheckDate } = record;

      // Count if no expiry date OR expiry is soon/expired
      if (!expiryDate || isExpired(expiryDate) || isExpiringSoon(expiryDate)) {
        rtwExpiringSet.add(empId);
      }

      // Count nextCheckDate expired
      if (nextCheckDate && isExpired(nextCheckDate)) {
        rtwStatusExpiredSet.add(empId);
      }
    });

    return {
      passport: passportExpiring,
      trainingExpired,
      trainingExpiringSoon,
      rightToWork: rtwExpiringSet.size,
      rightToWorkStatus: rtwStatusExpiredSet.size
    };
  };

  const expiryStats = getExpiryStats();

  // Filter device data
  const filteredDevices = deviceData.filter(
    (device) =>
      device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDevices.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentDevices = filteredDevices.slice(startIndex, startIndex + entriesPerPage);

  // Handle card click navigation
  const handleCardClick = (type: string) => {
    navigate(`/admin/hr/expiry/${type}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        {/* Dashboard Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
            {
              title: 'USERS',
              main: `Total: ${employees.length}`,
              sub: `Devices: ${deviceData.length}`,
              icon: <Users className="h-6 w-6" />,
              gradient: 'from-amber-500 to-amber-700'
            },
            // {
            //   title: 'ATTENDANCE',
            //   main: `Present: ${deviceData.reduce((a, b) => a + b.presentToday, 0)}`,
            //   sub: `Access: ${deviceData.reduce((a, b) => a + b.accessToday, 0)}`,
            //   icon: <UserCheck className="h-6 w-6" />,
            //   gradient: 'from-blue-500 to-blue-700'
            // },
            {
              title: 'PASSPORT',
              main: `Expiring: ${expiryStats.passport}`,
              sub: 'Check details',
              icon: <IdCard className="h-6 w-6" />,
              gradient: 'from-red-600 to-red-800',
              onClick: () => handleCardClick('passport')
            },
            {
              title: 'TRAINING',
              main: `Issues: ${expiryStats.trainingExpired + expiryStats.trainingExpiringSoon}`,
              sub: `${expiryStats.trainingExpired} expired`,
              icon: <BookOpen className="h-6 w-6" />,
              gradient: 'from-orange-600 to-orange-800',
              onClick: () => handleCardClick('training')
            },
            {
              title: 'RIGHT TO WORK',
              main: `Expiring: ${expiryStats.rightToWork}`,
              sub: 'Verify soon',
              icon: <AlertTriangle className="h-6 w-6" />,
              gradient: 'from-purple-600 to-purple-800',
              onClick: () => handleCardClick('rightToWork')
            },
            {
              title: 'STATUS CHECK',
              main: `Due: ${expiryStats.rightToWorkStatus}`,
              sub: 'Update required',
              icon: <IdCard className="h-6 w-6" />,
              gradient: 'from-indigo-500 to-indigo-800',
              onClick: () => handleCardClick('rightToWorkStatus')
            }
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={card.onClick}
              className={`transform rounded-xl bg-gradient-to-br ${card.gradient} p-2 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                card.onClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-white/20 p-5">{card.icon}</div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {card.title}
                  </h3>
                  <p className="text-sm font-bold">{card.main}</p>
                  {/* <p className="text-xs opacity-90">{card.sub}</p> */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center space-x-3">
            <Monitor className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">DEVICE STATUS</h2>
          </div>

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

          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Connected Date & Time</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Present Today</TableHead>
                      <TableHead>Access Today</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                          No devices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentDevices.map((device) => (
                        <TableRow key={device.id} className="hover:bg-gray-50">
                          <TableCell>
                            <span className="rounded-md bg-theme px-3 py-1 text-sm font-medium text-white">
                              {device.id}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{device.deviceName}</TableCell>
                          <TableCell>{device.client}</TableCell>
                          <TableCell>{device.connectedDateTime}</TableCell>
                          <TableCell className="text-center font-semibold">{device.numberOfUsers}</TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">{device.presentToday}</TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">{device.accessToday}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
        </div> */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;