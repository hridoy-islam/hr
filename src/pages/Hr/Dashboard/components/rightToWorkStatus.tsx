import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Search
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
import { Badge } from '@/components/ui/badge';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import { useNavigate } from 'react-router-dom';

// === Types ===
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: { departmentName: string } | null;
}

interface RightToWorkRecord {
  _id: string;
  employeeId: Employee;
  nextCheckDate: string; // ISO date string
  status: 'active' | 'closed' | 'expire';
}

// === Main Component ===
const RightToWorkStatusPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RightToWorkRecord[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchRightToWork = async () => {
      try {
        const { data } = await axiosInstance.get('/hr/right-to-work?fields=employeeId,status,expiryDate,nextCheckDate&limit=all');
        
        // Extract array safely
        const rawData = data?.data?.result || data?.data || data;
        const validRecords: RightToWorkRecord[] = Array.isArray(rawData)
          ? rawData
              .map(transformRecord)
              .filter((r): r is RightToWorkRecord => r !== null)
          : [];

        setRecords(validRecords);
      } catch (error) {
        console.error('Failed to fetch right-to-work data:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRightToWork();
  }, []);

  // Transform API record → RightToWorkRecord
  const transformRecord = (raw: any): RightToWorkRecord | null => {
    if (!raw.employeeId || !raw.nextCheckDate || raw.status !== 'needs-check') return null;

    const emp = raw.employeeId;
    return {
      _id: raw._id,
      employeeId: {
        _id: emp._id,
        firstName: emp.firstName || 'N/A',
        lastName: emp.lastName || 'N/A',
        email: emp.email || 'No email',
        position: emp.position || 'N/A',
        departmentId: {
          departmentName: emp.departmentId?.departmentName || 'Unassigned'
        }
      },
      nextCheckDate: raw.nextCheckDate,
      status: raw.status
    };
  };

  // Filter records based on search term and expired nextCheckDate
  const filteredRecords = records.filter((record) => {
    // Check if nextCheckDate has passed
    const isExpired = new Date(record.nextCheckDate) < new Date();
    
    // Only include expired records
    if (!isExpired) return false;
    
    // Apply search filter if needed
    return [
      record.employeeId.firstName,
      record.employeeId.lastName,
      record.employeeId.email,
      record.employeeId.departmentId?.departmentName
    ]
      .filter(Boolean)
      .some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // === Helpers ===
  const isExpired = (dateString: string): boolean => {
    return new Date(dateString) < new Date();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  const getStatus = (dateString: string) => {
    return isExpired(dateString)
      ? { label: 'Needs Check', color: 'bg-red-500 hover:bg-red-500' }
      : { label: 'Valid', color: 'bg-green-500 hover:bg-green-500' };
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}/rtw`);
  };

  // === Pagination ===
  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredRecords.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Right to Work Expiry Details
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredRecords.length} employee{filteredRecords.length !== 1 ? 's' : ''} with expired checks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {/* Search */}
          <div className="mb-6 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Search:</span>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="pl-10"
              />
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
                    <TableRow className="">
                      <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-700">Right to Work Check Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                          No employees found with expired right to work checks.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((record) => {
                        const status = getStatus(record.nextCheckDate);
                        const emp = record.employeeId;
                        return (
                          <TableRow
                            key={record._id}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {emp.firstName} {emp.lastName}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatDate(record.nextCheckDate)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${status.color} text-white`}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleEmployeeClick(emp._id)}
                                className="bg-supperagent hover:bg-supperagent/90 text-white"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default RightToWorkStatusPage;