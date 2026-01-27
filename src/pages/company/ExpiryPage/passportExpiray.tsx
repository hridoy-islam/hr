import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BadgeIcon as IdCard,
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
  passportRecordId?: string; // Document ID (optional if missing)
  email: string;
  firstName: string;
  lastName: string;
  passportExpiry: string | null;
  passportNumber?: string;
  // Status is now calculated on-the-fly, but we keep the type for reference
  status?: 'missing' | 'expired' | 'expiring-soon' | 'active';
}

const PassportExpiryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
const { status, loading: loadingStats, refetchStatus } = useScheduleStatus();
  const{id}= useParams()

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<ComplianceRow[]>([]);

  const [passportCheckInterval, setPassportCheckInterval] = useState<number>(0);

  const [selectedEmployee, setSelectedEmployee] =
    useState<ComplianceRow | null>(null);
  const [newPassportNumber, setNewPassportNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setPassportCheckInterval(result[0].passportCheckDate || 0);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // --- 2. Helper: Calculate Status (User Logic) ---
  const getComplianceStatus = (dateString: string | null) => {
    if (!dateString) return 'missing';

    const now = moment().startOf('day');
    const expiry = moment(dateString);
    const diffDays = expiry.diff(now, 'days');

    if (now.isAfter(expiry, 'day')) {
      return 'expired';
    } else if (passportCheckInterval > 0 && diffDays <= passportCheckInterval) {
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
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/passport`
      );

      const rawData = response.data.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData: ComplianceRow[] = rawData.map((item: any) => {
        // Handle nested user object or direct user object
        const userObj = item.userId || item;

        return {
          _id: userObj._id,
          passportRecordId: item._id !== userObj._id ? item._id : undefined,
          firstName: userObj.firstName || 'Unknown',
          lastName: userObj.lastName || '',
          email: userObj.email || '',
          passportExpiry: item.passportExpiryDate || null,
          passportNumber: item.passportNumber || ''
        };
      });

      setEmployees(mappedData);
    } catch (error) {
      console.error('Failed to fetch passport list:', error);
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
    if (!employee.passportRecordId || currentStatus === 'missing') {
      navigate(`/company/${id}/employee/${employee._id}`, {
        state: { activeTab: 'passport' }
      });
      return;
    }

    // Otherwise open modal
    setSelectedEmployee(employee);
    setNewPassportNumber(employee.passportNumber || '');
    setNewExpiryDate(
      employee.passportExpiry ? new Date(employee.passportExpiry) : null
    );

    // Reset file state
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'passport' }
    });
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
    formData.append('entityId', id);
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
      !newPassportNumber ||
      !uploadedFileUrl
    )
      return;

    setIsSubmitting(true);
    try {
      const url = `/passport/${selectedEmployee.passportRecordId}`;

      const payload = {
        updatedBy: user._id,
        title: 'Passport Renewed/Updated',
        document: uploadedFileUrl,
        passportNumber: newPassportNumber,
        passportExpiryDate: moment(newExpiryDate).toISOString(),
        userId: selectedEmployee._id
      };

      await axiosInstance.patch(url, payload);
      refetchStatus();
      toast({
        title: 'Success',
        description: 'Passport details updated successfully',
        className: 'bg-theme text-white'
      });

      setSelectedEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update passport',
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
              <div className="rounded-lg bg-red-100 p-2">
                <IdCard className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Passport Status
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-theme hover:bg-theme/90 flex items-center space-x-2 border-none text-white"
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
                    <TableHead>Passport Number</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No non-compliant employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => {
                      // Calculate status dynamically based on current interval setting
                      const status = getComplianceStatus(emp.passportExpiry);

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
                            {emp.passportNumber || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDate(emp.passportExpiry)}
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={(e) => handleUpdateClick(e, emp, status)}
                              className="bg-theme hover:bg-theme/90 text-white"
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
              Renew Passport for{' '}
              <span className="text-theme">
                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Context Alert */}
            {selectedEmployee?.passportExpiry && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>
                  Current passport expires on{' '}
                  <span className="font-semibold">
                    {moment(selectedEmployee.passportExpiry).format(
                      'DD MMM YYYY'
                    )}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Passport Number Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                New Passport Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter passport number"
                value={newPassportNumber}
                onChange={(e) => setNewPassportNumber(e.target.value)}
              />
            </div>

            {/* Date Picker */}
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
                minDate={new Date()}
                className="focus:ring-theme w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-transparent focus:ring-2"
                preventOpenOnFocus
              />
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
                !newPassportNumber ||
                !uploadedFileUrl
              }
              className="bg-theme hover:bg-theme/90 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassportExpiryPage;
