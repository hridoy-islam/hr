import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Icons
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  RotateCcw,
  ArrowLeft,
  CheckSquare,
  Upload,
  X,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Types ---
type TCompletionRecord = {
  _id: string;
  assignedDate: string;
  expireDate?: string;
  completedAt?: string;
  certificate?: string;
};

type TEmployeeTraining = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  trainingId: {
    _id: string;
    name: string;
    description?: string;
    validityDays?: number;
    reminderBeforeDays?: number;
  };
  assignedDate: string;
  expireDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  certificate?: string;
  completionHistory: TCompletionRecord[];
};

const TrainingDetailsPage: React.FC = () => {
  const { id,eid,tid } = useParams<{ tid: string }>();
  const navigate = useNavigate();

  // Refs for file inputs
  const completeFileInputRef = useRef<HTMLInputElement>(null);

  // --- Data State ---
  const [trainingRecord, setTrainingRecord] =
    useState<TEmployeeTraining | null>(null);
  const [loading, setLoading] = useState(true);

  
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignDate, setReassignDate] = useState<Date | null>(null);

  
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const [completionDate, setCompletionDate] = useState<Date | null>(null);


  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);


  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const trainingRes = await axiosInstance.get(`/employee-training/${tid}`);
      setTrainingRecord(trainingRes.data.data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load training details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tid) fetchTrainingData();
  }, [tid]);

  // --- File Upload Handler ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !trainingRecord?.employeeId._id) return;

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
    formData.append('entityId', trainingRecord.employeeId._id);
    formData.append('file_type', 'document');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFileUrl(res.data?.data?.fileUrl || res.data?.url);
      toast.success('Document uploaded successfully');
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload document.');
      setUploadedFileUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (inputRef: React.RefObject<HTMLInputElement>) => {
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const resetUploadState = () => {
    setUploadedFileUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setIsUploading(false);
    if (completeFileInputRef.current) completeFileInputRef.current.value = '';
  };

  // --- Action Handlers ---

  const handleReassign = async () => {
    if (!reassignDate) {
      toast.error('Please select a start date.');
      return;
    }

    try {
      let newExpireDate = '';
      if (trainingRecord?.trainingId?.validityDays) {
        newExpireDate = moment(reassignDate)
          .add(trainingRecord.trainingId.validityDays, 'days')
          .format('YYYY-MM-DD');
      }

      const payload = {
        assignedDate: moment(reassignDate).format('YYYY-MM-DD'),
        expireDate: newExpireDate,
        status: 'pending'
      };

      await axiosInstance.patch(`/employee-training/${tid}`, payload);

      toast.success('Training re-assigned successfully!');
      setIsReassignOpen(false);
      fetchTrainingData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to re-assign.');
    }
  };

  const handleComplete = async () => {
    if (!completionDate) {
      toast.error('Please select a completion date.');
      return;
    }
    if (!uploadedFileUrl) {
      toast.error('Please upload the completion certificate.');
      return;
    }

    try {
      const payload = {
        status: 'completed',
        // CHANGED: Format the date object to string
        completedAt: moment(completionDate).format('YYYY-MM-DD'),
        certificate: uploadedFileUrl
      };

      await axiosInstance.patch(`/employee-training/${tid}`, payload);

      toast.success('Training marked as completed!');
      setIsCompleteOpen(false);
      resetUploadState();
      fetchTrainingData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to complete training.'
      );
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'training' }
    });
  };
  // --- Helper: Status Badge Logic ---
  const getStatusBadge = () => {
    if (!trainingRecord) return null;
    const { status, expireDate, trainingId } = trainingRecord;

    if (status === 'completed') {
      return (
        <Badge className="gap-1 border-green-200 bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>
      );
    }

    if (!expireDate) {
      return (
        <Badge className="gap-1 border-blue-200 bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    }

    const today = moment();
    const expiry = moment(expireDate);
    const reminderDays = trainingId.reminderBeforeDays || 30;
    const reminderDate = moment(expireDate).subtract(reminderDays, 'days');

    if (today.isAfter(expiry, 'day')) {
      return (
        <Badge className="gap-1 border-red-200 bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">
          <AlertCircle className="h-3 w-3" /> Expired
        </Badge>
      );
    }

    if (today.isSameOrAfter(reminderDate, 'day')) {
      return (
        <Badge className="gap-1 border-orange-200 bg-orange-100 px-3 py-1 text-orange-700 hover:bg-orange-200">
          <AlertTriangle className="h-3 w-3" /> Expiring Soon
        </Badge>
      );
    }

    return (
      <Badge className="gap-1 border-blue-200 bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200">
        <Clock className="h-3 w-3" /> Active
      </Badge>
    );
  };

  // --- Reusable UI: Upload Box ---
  const renderUploadUI = (inputRef: React.RefObject<HTMLInputElement>) => (
    <div className="space-y-2 pt-2">
      <Label className="text-sm font-medium text-gray-700">
        Certificate <span className="text-red-500">*</span>
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
          ref={inputRef}
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
                handleRemoveFile(inputRef);
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
            <span className="text-xs text-gray-400">PDF/Image (Max 5MB)</span>
          </div>
        )}
      </div>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );

  if (loading)
    return (
      <div className="p-10 text-center">
        {' '}
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  if (!trainingRecord)
    return (
      <div className="p-10 text-center text-red-500">Record not found</div>
    );

  const isCompleted = trainingRecord.status === 'completed';

  // Calculate Min Date for Reassign (Can't be before previous expiry)
  const minReassignDate = trainingRecord.expireDate
    ? new Date(trainingRecord.expireDate)
    : new Date();

  // Calculate Predicted Expiry for Reassign Dialog
  const predictedExpiry =
    reassignDate && trainingRecord.trainingId.validityDays
      ? moment(reassignDate)
          .add(trainingRecord.trainingId.validityDays, 'days')
          .format('YYYY-MM-DD')
      : '';

  return (
    <div className="space-y-4">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-row items-center gap-2 font-semibold text-black">
              Employee:
              <h1>
                {trainingRecord.employeeId.firstName}{' '}
                {trainingRecord.employeeId.lastName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  handleEmployeeClick(trainingRecord?.employeeId?._id)
                }
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
              </Button>
              {isCompleted ? (
                <Button onClick={() => setIsReassignOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Re-assign Course
                </Button>
              ) : (
                <Button
                  onClick={() => setIsCompleteOpen(true)}
                  className="gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckSquare className="h-4 w-4" /> Complete Course
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-xl font-bold">
            Training Name:
            <h1>{trainingRecord.trainingId.name}</h1>
            {getStatusBadge()}
          </div>

          {/* Detail Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Assigned On */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Assigned On
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {moment(trainingRecord.assignedDate).format('DD MMM, YYYY')}
                </p>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expires On
                </p>
                <p
                  className={`text-sm font-semibold ${
                    moment().isAfter(trainingRecord.expireDate) &&
                    trainingRecord.status !== 'completed'
                      ? 'text-red-600'
                      : 'text-gray-800'
                  }`}
                >
                  {trainingRecord.expireDate
                    ? moment(trainingRecord.expireDate).format('DD MMM, YYYY')
                    : 'No Expiry'}
                </p>
              </div>
            </div>
          </div>

          {/* HISTORY TABLE */}
          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              Training History
            </h3>
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Training Date</TableHead>
                    <TableHead>Completed On</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingRecord.completionHistory &&
                  trainingRecord.completionHistory.length > 0 ? (
                    trainingRecord.completionHistory.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">
                          {moment(log.assignedDate).format('DD MMM, YYYY')}
                        </TableCell>
                        <TableCell>
                          {log.completedAt ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                              {moment(log.completedAt).format('DD MMM, YYYY')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.expireDate
                            ? moment(log.expireDate).format('DD MMM, YYYY')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.certificate ? (
                            <Button size="sm" asChild className="gap-1">
                              <a
                                href={log.certificate}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center italic text-gray-500"
                      >
                        No previous history logs available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- COMPLETE COURSE DIALOG --- */}
      <Dialog
        open={isCompleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetUploadState();
            setCompletionDate(null); // Reset date on close
          }
          setIsCompleteOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="mb-1">
                Completion Date <span className="text-red-500">*</span>
              </Label>
              {/* CHANGED: Replaced standard input with DatePicker */}
              <DatePicker
                selected={completionDate}
                onChange={(date) => setCompletionDate(date)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                dateFormat="dd-MM-yyyy"
                placeholderText="Select completion date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
              />
            </div>
            {renderUploadUI(completeFileInputRef)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isUploading || !uploadedFileUrl || !completionDate}
            >
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- RE-ASSIGN DIALOG --- */}
      <Dialog
        open={isReassignOpen}
        onOpenChange={(open) => {
          if (!open) setReassignDate(null);
          setIsReassignOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Re-assign Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Start a new training cycle for{' '}
              <span className="font-semibold">
                {trainingRecord.employeeId.firstName}
              </span>
              .
            </p>

            {/* New Assigned Date */}
            <div className="flex flex-col space-y-2">
              <Label className="mb-1">
                New Assigned Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={reassignDate}
                onChange={(date) => setReassignDate(date)}
                minDate={minReassignDate}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                dateFormat="dd-MM-yyyy"
                placeholderText="Select start date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
              />
            </div>

            {/* Disabled Expiry Date Field */}
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                value={predictedExpiry}
                disabled
                className="cursor-not-allowed bg-gray-100 text-gray-600"
                placeholder="Select assigned date to see expiry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={!reassignDate}>
              Confirm Re-assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingDetailsPage;
