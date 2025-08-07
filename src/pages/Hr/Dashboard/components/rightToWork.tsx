import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  Download
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

// Define types
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: {
    departmentName: string;
  };
}

interface RightToWorkRecord {
  _id: string;
  employeeId: Employee;
  expiryDate: string; // ISO date string
  status: 'active' | 'closed' | 'expire';
}

const RightToWorkExpiryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RightToWorkRecord[]>([]); // Store right-to-work records
  const [filteredRecords, setFilteredRecords] = useState<RightToWorkRecord[]>([]);

  // Fetch right-to-work records with populated employee data
  useEffect(() => {
    const fetchRightToWork = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/hr/right-to-work');

        // Handle response structure (adjust if needed)
        let data = response.data.data.result;
        

        // Filter only active records with expiryDate
        const validRecords = data
          .map((record: any): RightToWorkRecord | null => {
            if (!record.employeeId || !record.expiryDate) return null;
            return {
              _id: record._id,
              employeeId: {
                _id: record.employeeId._id,
                firstName: record.employeeId.firstName || 'N/A',
                lastName: record.employeeId.lastName || 'N/A',
                email: record.employeeId.email || 'No email',
                position: record.employeeId.position || 'N/A',
                departmentId: {
                  departmentName: record.employeeId.departmentId?.departmentName || 'Unassigned'
                }
              },
              expiryDate: record.expiryDate,
              status: record.status
            };
          })
          .filter((record: RightToWorkRecord | null): record is RightToWorkRecord => {
            return record !== null && record.status === 'active';
          });

        setRecords(validRecords);
        setFilteredRecords(validRecords);
      } catch (error) {
        console.error('Failed to fetch right-to-work data:', error);
        setRecords([]);
        setFilteredRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRightToWork();
  }, []);

  // Filter records when search term changes
  useEffect(() => {
    const filtered = records.filter(
      (record) =>
        record.employeeId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.departmentId.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [searchTerm, records]);

  // Helper: Is expiring within 30 days
  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
  };

  // Helper: Is already expired
  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB'); // e.g. 01/03/2025
  };

  // Get status badge
  const getExpiryStatus = (dateString: string) => {
    if (isExpired(dateString)) {
      return { status: 'Expired', color: 'bg-red-500' };
    } else if (isExpiringSoon(dateString)) {
      return { status: 'Expiring Soon', color: 'bg-yellow-500' };
    }
    return { status: 'Valid', color: 'bg-green-500' };
  };

  // Navigate to employee detail page
  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`);
  };

  // Placeholder for export
  const handleExport = () => {
    console.log('Exporting right to work expiry data...');
    // Implement CSV/PDF export logic here
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = filteredRecords.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full space-x-4">
            
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Right to Work Expiry Details
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredRecords.length} employees with expiring right to work documents
                </p>
              </div>
            </div>
             <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-2 bg-supperagent hover:bg-supperagent/90 border-none">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>

          {/* Export Button (Optional) */}
          {/* <Button onClick={handleExport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button> */}
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
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
                  placeholder="Search employees..."
                  className="w-64 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-purple-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-700">Right to Work Expiry</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No employees found with expiring right to work documents.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((record) => {
                        const status = getExpiryStatus(record.expiryDate);
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
                              {formatDate(record.expiryDate)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${status.color} text-white`}>
                                {status.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleEmployeeClick(emp._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default RightToWorkExpiryPage;