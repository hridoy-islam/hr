import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  FileText,
  X,
  AlertCircle
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
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import moment from 'moment';
import { useScheduleStatus } from '@/context/scheduleStatusContext';

// --- Interfaces ---

interface ComplianceRow {
  _id: string; // User ID
  dbsRecordId?: string; // Document ID (optional if missing)
  email: string;
  firstName: string;
  lastName: string;
  dbsExpiry: string | null;
  dateOfIssue: string | null;
  disclosureNumber?: string;
  // Status calculated on-the-fly
  status?: 'missing' | 'expired' | 'expiring-soon' | 'active';
}

const DbsExpiryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refetchStatus } = useScheduleStatus();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<ComplianceRow[]>([]);

  // Schedule Settings - Default to 0
  const [dbsCheckInterval, setDbsCheckInterval] = useState<number>(0);

  // Modal & Form State
  const [selectedEmployee, setSelectedEmployee] =
    useState<ComplianceRow | null>(null);

  const [newDisclosureNumber, setNewDisclosureNumber] = useState('');
  const [newDateOfIssue, setNewDateOfIssue] = useState<Date | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // File Upload State
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { id } = useParams();
  // --- 1. Fetch Schedule Settings ---
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setDbsCheckInterval(result[0].dbsCheckDate || 0);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // --- 2. Helper: Calculate Status ---
  const getComplianceStatus = (dateString: string | null) => {
    if (!dateString) return 'missing';

    const now = moment().startOf('day');
    const expiry = moment(dateString);
    const diffDays = expiry.diff(now, 'days');

    if (now.isAfter(expiry, 'day')) {
      return 'expired';
    } else if (dbsCheckInterval > 0 && diffDays <= dbsCheckInterval) {
      return 'expiring-soon';
    } else {
      return 'active';
    }
  };

  // --- 3. Fetch Employees ---
  const fetchEmployees = async () => {
    const companyId = user?.company || id;
    if (!companyId) return;

    setLoading(true);
    try {
      // Assuming endpoint follows pattern: /schedule-status/{companyId}/dbs
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/dbs`
      );

      const rawData = response.data.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData: ComplianceRow[] = rawData.map((item: any) => {
        const userObj = item.userId || item;

        return {
          _id: userObj._id,
          dbsRecordId: item._id !== userObj._id ? item._id : undefined,
          firstName: userObj.firstName || 'Unknown',
          lastName: userObj.lastName || '',
          email: userObj.email || '',
          dbsExpiry: item.expiryDate || null, // Map from API 'expiryDate'
          dateOfIssue: item.dateOfIssue || null,
          disclosureNumber: item.disclosureNumber || ''
        };
      });

      setEmployees(mappedData);
    } catch (error) {
      console.error('Failed to fetch DBS list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleSettings();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 4. Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'missing':
        return (
          <Badge className="bg-red-600 text-white hover:bg-red-700">
            Missing
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-500 text-white hover:bg-red-600">
            Expired
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            Expiring Soon
          </Badge>
        );
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD/MM/YYYY');
  };

  // --- 5. Handlers ---

  const handleUpdateClick = (
    e: React.MouseEvent,
    employee: ComplianceRow,
    currentStatus: string
  ) => {
    e.stopPropagation();

    // If missing, redirect to profile
    if (!employee.dbsRecordId || currentStatus === 'missing') {
      navigate(`/company/${id}/employee/${employee._id}`, {
        state: { activeTab: 'dbs' }
      });
      return;
    }

    // Otherwise open modal
    setSelectedEmployee(employee);
    setNewDisclosureNumber(employee.disclosureNumber || '');
    setNewDateOfIssue(
      employee.dateOfIssue ? new Date(employee.dateOfIssue) : null
    );
    setNewExpiryDate(employee.dbsExpiry ? new Date(employee.dbsExpiry) : null);

    // Reset file state
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'dbs' }
    });
  };

  // Helper: Auto-calculate expiry when issue date changes (Optional UX improvement)
  const handleIssueDateChange = (date: Date | null) => {
    setNewDateOfIssue(date);
  };

  // --- File Upload Logic ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PDF, JPEG, or PNG files are allowed.');
      return;
    }
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFileUrl(res.data?.data?.fileUrl);
    } catch (err) {
      setUploadError('Failed to upload document.');
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

  // --- Submit Update ---
  const handleSubmitUpdate = async () => {
    if (
      !selectedEmployee ||
      !newExpiryDate ||
      !newDateOfIssue ||
      !newDisclosureNumber ||
      !uploadedFileUrl
    )
      return;

    setIsSubmitting(true);
    try {
      const url = `/dbs/${selectedEmployee.dbsRecordId}`;

      const payload = {
        updatedBy: user._id,
        title: 'DBS Renewed/Updated',
        dbsDocumentUrl: uploadedFileUrl, // DBS specific field
        disclosureNumber: newDisclosureNumber,
        dateOfIssue: moment(newDateOfIssue).toISOString(),
        expiryDate: moment(newExpiryDate).toISOString(),
        userId: selectedEmployee._id,
        date: new Date().toISOString()
      };

      await axiosInstance.patch(url, payload);
      refetchStatus();
      toast({
        title: 'Success',
        description: 'DBS details updated successfully',
        className: 'bg-theme text-white'
      });

      setSelectedEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update DBS',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DBS Status</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 border-none bg-theme text-white hover:bg-theme/90"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Disclosure Number</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        No non-compliant employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => {
                      const status = getComplianceStatus(emp.dbsExpiry);

                      return (
                        <TableRow
                          key={emp._id}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => handleEmployeeClick(emp._id)}
                        >
                          <TableCell>
                            <p className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{emp.email}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600">
                            {emp.disclosureNumber || '-'}
                          </TableCell>
                          <TableCell className="font-medium text-gray-600">
                            {formatDate(emp.dateOfIssue)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDate(emp.dbsExpiry)}
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={(e) => handleUpdateClick(e, emp, status)}
                              className="bg-theme text-white hover:bg-theme/90"
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog
        open={!!selectedEmployee}
        onOpenChange={() => setSelectedEmployee(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Renew DBS for{' '}
              <span className="text-theme">
                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Context Alert */}
            {selectedEmployee?.dbsExpiry && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  Current DBS expires on{' '}
                  <span className="font-semibold">
                    {moment(selectedEmployee.dbsExpiry).format('DD MMM YYYY')}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Disclosure Number Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                New Disclosure Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter disclosure number"
                value={newDisclosureNumber}
                onChange={(e) => setNewDisclosureNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Issue Date Picker */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date of Issue <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={newDateOfIssue}
                  onChange={handleIssueDateChange}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select issue date"
                  wrapperClassName="w-full"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  // LOGIC APPLIED: Min date = Previous Expiry Date
                  minDate={
                    selectedEmployee?.dbsExpiry
                      ? new Date(selectedEmployee.dbsExpiry)
                      : undefined
                  }
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-theme"
                  preventOpenOnFocus
                />
                {/* LOGIC APPLIED: Helper Text */}
                {selectedEmployee?.dbsExpiry && (
                  <p className="text-xs text-gray-500">
                    Must be on or after{' '}
                    {moment(selectedEmployee.dbsExpiry).format('DD MMM YYYY')}
                  </p>
                )}
              </div>

              {/* Expiry Date Picker */}
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  New Expiry Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={newExpiryDate}
                  onChange={(date) => setNewExpiryDate(date)}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select new expiry date"
                  wrapperClassName="w-full"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  minDate={newDateOfIssue || undefined}
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-theme"
                  preventOpenOnFocus
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-gray-700">
                New Scan Copy <span className="text-red-500">*</span>
              </Label>
              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                  uploadedFileUrl
                    ? 'border-green-500 bg-green-50'
                    : isUploading
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                ) : uploadedFileUrl ? (
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-green-700">
                          File attached
                        </p>
                        <p className="max-w-[150px] truncate text-xs text-gray-500">
                          {selectedFileName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Upload Copy
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF/Image (Max 5MB)
                    </span>
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedEmployee(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={
                isSubmitting ||
                !newExpiryDate ||
                !newDateOfIssue ||
                !newDisclosureNumber ||
                !uploadedFileUrl
              }
              className="bg-theme text-white hover:bg-theme/90"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DbsExpiryPage;
