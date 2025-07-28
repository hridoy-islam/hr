import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Monitor,
  Download,
  FileText,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Mock data for the dashboard
const dashboardStats = {
  totalUsers: 35,
  accessToday: 11,
  presentToday: 11,
  absentToday: 24,
  shiftPresent: 4,
  shiftAbsent: 6
};

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

const HrPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(deviceData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleExport = (type: string) => {
    console.log(`Exporting as ${type}`);
    // Implement export functionality here
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className=" space-y-4 ">
        {/* Dashboard Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Users Card */}
          <div className="transform rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-white/20 p-3">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold opacity-90">USERS</h3>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      Total: {dashboardStats.totalUsers}
                    </p>
                    <p className="text-lg">
                      Access Today: {dashboardStats.accessToday}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm opacity-80">view details</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </div>
          </div>

          {/* Present/Absent Card */}
          <div className="transform rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-white/20 p-3">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold opacity-90">
                    TOTAL PRESENT ABSENT TODAY
                  </h3>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      Present: {dashboardStats.presentToday}
                    </p>
                    <p className="text-lg">
                      Absent: {dashboardStats.absentToday}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm opacity-80">view details</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </div>
          </div>

          {/* Shift Report Card */}
          <div className="transform rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-white/20 p-3">
                  <UserX className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold opacity-90">
                    SHIFT REPORT
                  </h3>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      Present: {dashboardStats.shiftPresent}
                    </p>
                    <p className="text-lg">
                      Absent: {dashboardStats.shiftAbsent}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm opacity-80">view details</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
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
              <BlinkingDots size="large" color="bg-blue-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                            <span className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white">
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

export default HrPage;
