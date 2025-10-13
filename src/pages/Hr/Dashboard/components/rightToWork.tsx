
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  Calendar,
  X,
  Paperclip,
  Upload,
  FileText,
  Trash2
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
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  expiryDate: string | null;
  status: 'active' | 'closed' | 'expire';
}

const RightToWorkExpiryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RightToWorkRecord[]>([]);
  const { user } = useSelector((state: any) => state.auth);

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState<RightToWorkRecord | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchRightToWork = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(
          '/hr/right-to-work?limit=all&fields=employeeId,expiryDate,status'
        );

        const rawData = data?.data?.result || data?.data || data;
        const validRecords: RightToWorkRecord[] = Array.isArray(rawData)
          ? rawData
              .map((raw: any): RightToWorkRecord | null => {
                if (!raw.employeeId) return null;

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
                  expiryDate: raw.expiryDate || null,
                  status: raw.status || 'active'
                };
              })
              .filter((r): r is RightToWorkRecord => r !== null)
          : [];

        // Deduplication logic (unchanged)
        const deduplicated = validRecords.reduce(
          (acc: RightToWorkRecord[], record) => {
            const existingIndex = acc.findIndex(
              (r) => r.employeeId._id === record.employeeId._id
            );
            if (existingIndex === -1) {
              acc.push(record);
            } else {
              const existing = acc[existingIndex];
              if (!record.expiryDate && !existing.expiryDate) {
                acc[existingIndex] = record;
              } else if (!record.expiryDate && existing.expiryDate) {
                // Keep existing
              } else if (record.expiryDate && !existing.expiryDate) {
                // Keep existing
              } else if (record.expiryDate && existing.expiryDate) {
                if (new Date(record.expiryDate) > new Date(existing.expiryDate)) {
                  acc[existingIndex] = record;
                }
              }
            }
            return acc;
          },
          []
        );

        const filtered = deduplicated.filter((record) => {
          if (!record.expiryDate) return true;
          const expiry = new Date(record.expiryDate);
          const today = new Date();
          const ninetyDaysFromNow = new Date();
          ninetyDaysFromNow.setDate(today.getDate() + 90);
          return expiry < ninetyDaysFromNow;
        });

        setRecords(filtered);
      } catch (error) {
        console.error('Failed to fetch right-to-work data:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRightToWork();
  }, []);

  const filteredRecords = records.filter((record) => {
    const fullName = `${record.employeeId.firstName} ${record.employeeId.lastName}`.toLowerCase();
    const email = record.employeeId.email.toLowerCase();
    const department = record.employeeId.departmentId?.departmentName?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || email.includes(query) || department.includes(query);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No expiry date';
    return moment(dateString).format('DD/MM/YYYY');
  };

  const getExpiryStatus = (dateString: string | null) => {
    if (!dateString) {
      return { status: 'No Expiry', color: 'bg-gray-500' };
    }
    const expiry = moment(dateString);
    const today = moment();
    if (expiry.isBefore(today, 'day')) {
      return { status: 'Expired', color: 'bg-red-500' };
    } else if (expiry.diff(today, 'days') <= 90) {
      return { status: 'Expiring Soon', color: 'bg-yellow-500' };
    }
    return { status: 'Valid', color: 'bg-green-500' };
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`, {
      state: { activeTab: 'rightToWork' }
    });
  };

  const handleUpdateClick = (record: RightToWorkRecord) => {
    setSelectedRecord(record);
    setNewExpiryDate(null);
    // Reset upload state
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?._id) return;

  
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('entityId', user._id);
    formData.append('file_type', 'document');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = res.data?.data?.fileUrl;
      if (!fileUrl) throw new Error('No file URL returned');
      setUploadedFileUrl(fileUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload document. Please try again.');
      setUploadedFileUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitUpdate = async () => {
    if (!selectedRecord || !uploadedFileUrl) {
      if (!uploadedFileUrl) {
        setUploadError('Please upload a PDF document.');
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        updatedBy: user?._id,
        document: uploadedFileUrl
      };

      if (newExpiryDate) {
        payload.expiryDate = newExpiryDate.toISOString();
      } else {
        payload.expiryDate = null; // or omit, depending on backend
      }

      await axiosInstance.patch(`/hr/right-to-work/${selectedRecord._id}`, payload);

      setRecords((prev) =>
        prev.map((r) =>
          r._id === selectedRecord._id
            ? { ...r, expiryDate: newExpiryDate ? newExpiryDate.toISOString() : null }
            : r
        )
      );

      setIsModalOpen(false);
      setSelectedRecord(null);
      setUploadedFileUrl(null);
      setSelectedFileName(null);
      setNewExpiryDate(null);
    } catch (error) {
      console.error('Failed to update expiry date:', error);
      alert('Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredRecords.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Right to Work Expiry Details</h1>
              <p className="text-sm text-gray-600">
                {filteredRecords.length} employees with expiring, expired, or no expiry right to work documents
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 border-none bg-supperagent text-white hover:bg-supperagent/90"
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
                    <TableRow className="bg-gray-50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Right to Work Expiry (dd/mm/yyyy)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                          No employees with expiring, expired, or no expiry right to work documents.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((record) => {
                        const status = getExpiryStatus(record.expiryDate);
                        return (
                          <TableRow key={record._id} className="hover:bg-gray-50">
                            <TableCell
                              className="cursor-pointer font-medium"
                              onClick={() => handleEmployeeClick(record.employeeId._id)}
                            >
                              {record.employeeId.firstName} {record.employeeId.lastName}
                            </TableCell>
                            <TableCell
                              className={`cursor-pointer ${record.expiryDate ? 'text-red-600' : 'text-gray-500'}`}
                              onClick={() => handleEmployeeClick(record.employeeId._id)}
                            >
                              {formatDate(record.expiryDate)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${status.color} text-white`}>
                                {status.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!record.expiryDate ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleEmployeeClick(record.employeeId._id)}
                                  className="bg-supperagent text-white hover:bg-supperagent/90"
                                >
                                  View Details
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateClick(record)}
                                  className="bg-supperagent text-white hover:bg-supperagent/90"
                                >
                                  Update
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
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
        </div>

        {/* Update Modal */}
        {isModalOpen && selectedRecord && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update RTW Expiry</DialogTitle>
                <DialogDescription>
                  Update expiry date and upload a supporting document for{' '}
                  {selectedRecord.employeeId.firstName} {selectedRecord.employeeId.lastName}.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-5">
                {/* Current Expiry */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Current Expiry Date
                  </label>
                  <p className={selectedRecord.expiryDate ? 'text-red-600' : 'text-gray-500'}>
                    {formatDate(selectedRecord.expiryDate)}{' '}
                    {selectedRecord.expiryDate && '(Expired or Expiring)'}
                  </p>
                </div>

                {/* New Expiry Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    New Expiry Date (dd/mm/yyyy)
                  </label>
                  <DatePicker
                    selected={newExpiryDate}
                    onChange={(date: Date | null) => setNewExpiryDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    placeholderText="Select new expiry date"
                    preventOpenOnFocus
                    disabled={submitting}
                    isClearable
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to set "No Expiry" status
                  </p>
                </div>

                {/* === Styled Upload Area (REQUIRED) === */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Upload RTW Document (PDF - Required)
                  </label>
                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
                      uploadedFileUrl
                        ? 'border-green-500 bg-green-50'
                        : isUploading
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    )}
                    onClick={triggerFileInput}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      disabled={isUploading}
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-sm text-blue-600">Uploading...</p>
                      </div>
                    ) : uploadedFileUrl ? (
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-600">Uploaded</p>
                            {selectedFileName && <p className="text-xs text-gray-600">{selectedFileName}</p>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <div className="text-sm font-medium text-gray-700">Click to Upload PDF</div>
                        <div className="text-xs text-gray-500">PDF only (max. 5MB)</div>
                      </div>
                    )}

                    {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setUploadError(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-supperagent text-white hover:bg-supperagent/90"
                  onClick={handleSubmitUpdate}
                  disabled={submitting || isUploading || !uploadedFileUrl}
                >
                  {submitting ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default RightToWorkExpiryPage;