import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Search, Calendar, X } from 'lucide-react';
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
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';

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
  status: 'active' | 'closed' | 'expire' | 'needs-check';
}

// === Main Component ===
const RightToWorkStatusPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RightToWorkRecord[]>([]);
  const { user } = useSelector((state: any) => state.auth);
const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Modal state
  const [selectedRecord, setSelectedRecord] =
    useState<RightToWorkRecord | null>(null);
const [newNextCheckDate, setNewNextCheckDate] = useState<Date | null>(null);  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchRightToWork = async () => {
      try {
        const { data } = await axiosInstance.get(
          '/hr/right-to-work?fields=employeeId,status,nextCheckDate&limit=all'
        );

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
    if (!raw.employeeId || !raw.nextCheckDate) return null;

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
      status: raw.status || 'active'
    };
  };

  // Filter records: only those with expired nextCheckDate
  const filteredRecords = records.filter((record) => {
    const isExpired = new Date(record.nextCheckDate) < new Date();

    if (!isExpired) return false;

    return [
      record.employeeId.firstName,
      record.employeeId.lastName,
      record.employeeId.email,
      record.employeeId.departmentId?.departmentName
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // === Helpers ===
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

 // In handleUpdateClick:
const handleUpdateClick = (record: RightToWorkRecord) => {
  setSelectedRecord(record);
  const defaultNewDate = new Date();
  defaultNewDate.setDate(defaultNewDate.getDate() + 90); // 90 days from now
  setNewNextCheckDate(defaultNewDate);
  setIsModalOpen(true);
};
  const handleSubmitUpdate = async () => {
    if (!selectedRecord || !newNextCheckDate) return;

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/hr/right-to-work/${selectedRecord._id}`, {
        nextCheckDate: newNextCheckDate,
        updatedBy: user?._id
      });

      // Update local state
      setRecords((prev) =>
        prev.map((r) =>
          r._id === selectedRecord._id
            ? { ...r, nextCheckDate: newNextCheckDate }
            : r
        )
      );

      setIsModalOpen(false);
      setSelectedRecord(null);
        setUploadFile(null);
    } catch (error) {
      console.error('Failed to update nextCheckDate:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredRecords.slice(
    startIndex,
    startIndex + entriesPerPage
  );
 const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RTW Status Details
              </h1>
              
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 bg-supperagent border-none hover:bg-supperagent/90"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
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
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">
                        Employee
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        RTW Status Check Date
                      </TableHead>
                      
                      <TableHead className="text-right font-semibold text-gray-700">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-gray-500"
                        >
                          No employees with expired right-to-work checks.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((record) => (
                        <TableRow
                          key={record._id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <TableCell onClick={() => handleEmployeeClick(record.employeeId._id)} className="cursor-pointer">
                            <div>
                              <p className="font-medium text-gray-900">
                                {record.employeeId.firstName}{' '}
                                {record.employeeId.lastName}
                              </p>
                            
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-red-600 cursor-pointer" onClick={() => handleEmployeeClick(record.employeeId._id)} >
                            {formatDate(record.nextCheckDate)}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateClick(record)}
                              className="bg-supperagent text-white hover:bg-supperagent/90"
                            >
                              Update
                            </Button>
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

        {/* Update Modal */}
      {isModalOpen && selectedRecord && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Renew RTW Check
        </h3>
        <button onClick={() => setIsModalOpen(false)}>
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Employee Info */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Employee
          </label>
          <p className="font-medium text-gray-900">
            {selectedRecord.employeeId.firstName}{' '}
            {selectedRecord.employeeId.lastName}
          </p>
        </div>

        {/* Current Expiry Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Current Expiry Date
          </label>
          <p className="text-red-600">
            {formatDate(selectedRecord.nextCheckDate)} (Expired)
          </p>
        </div>

        {/* Next Check Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            New Check Date
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <DatePicker
              selected={newNextCheckDate}
              onChange={(date: Date) => setNewNextCheckDate(date)}
              minDate={new Date()} // Can't select dates in the past
              dateFormat="dd/MM/yyyy"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 shadow-sm focus:border-supperagent focus:ring-supperagent"
              wrapperClassName="w-full"
            />
          </div>
        </div>

        {/* Upload PDF (Optional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Upload Document (PDF - Optional)
          </label>
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setUploadFile(e.target.files[0]);
              }
            }}
          />
          {uploadFile && (
            <p className="mt-2 text-sm text-green-600 truncate">
              📄 {uploadFile.name}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-supperagent text-white hover:bg-supperagent/90"
            onClick={handleSubmitUpdate}
            disabled={submitting || !newNextCheckDate}
          >
            {submitting ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default RightToWorkStatusPage;
