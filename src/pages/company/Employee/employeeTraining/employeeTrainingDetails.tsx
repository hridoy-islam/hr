import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Edit
} from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Types ---
type TCompletionRecord = {
  _id: string;
  assignedDate?: string;
  expireDate?: string;
  completedAt?: string;
  certificate?: string[] | string;
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
  assignedDate?: string;
  expireDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  certificate?: string[] | string;
  completionHistory: TCompletionRecord[];
};

// ─────────────────────────────────────────────────────────────────────────────
// KEY FIX: Convert a JS Date (local) to a UTC ISO string that preserves the
// calendar date the user actually picked, regardless of browser timezone.
// e.g. user picks "20 Mar" → "2026-03-20T00:00:00.000Z"  (never 19 Mar)
// ─────────────────────────────────────────────────────────────────────────────
const toDateOnlyISO = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  return moment
    .utc([date.getFullYear(), date.getMonth(), date.getDate()])
    .toISOString();
};

// Helper: Extract filename from URL
const getFileNameFromUrl = (url: string) => {
  if (!url) return 'Document';
  try {
    const cleanUrl = url.split('?')[0];
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    return decodeURIComponent(fileName).replace(/^\d+-/, '');
  } catch (e) {
    return 'Document';
  }
};

const TrainingDetailsPage: React.FC = () => {
  const { id, eid, tid } = useParams<{
    tid: string;
    id: string;
    eid: string;
  }>();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data State ---
  const [trainingRecord, setTrainingRecord] = useState<TEmployeeTraining | null>(null);
  const [loading, setLoading] = useState(true);

  // Reassign State
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignDate, setReassignDate] = useState<Date | null>(null);

  // --- Unified Edit & Complete State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'complete' | 'edit_active' | 'edit_log'>('complete');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assignedDate: null as Date | null,
    expireDate: null as Date | null,
    completedAt: null as Date | null,
    certificates: [] as string[]
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !trainingRecord?.employeeId._id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const newFilesArray = Array.from(files);

    for (const file of newFilesArray) {
      if (!validTypes.includes(file.type)) {
        setUploadError('Only PDF, JPEG, or PNG files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Each file must be less than 5MB.');
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    const newUploadedUrls: string[] = [];

    try {
      await Promise.all(
        newFilesArray.map(async (file) => {
          const formPayload = new FormData();
          formPayload.append('entityId', trainingRecord.employeeId._id);
          formPayload.append('file_type', 'document');
          formPayload.append('file', file);

          const res = await axiosInstance.post('/documents', formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const url = res.data?.data?.fileUrl || res.data?.url;
          if (url) newUploadedUrls.push(url);
        })
      );

      setFormData((prev) => ({
        ...prev,
        certificates: [...prev.certificates, ...newUploadedUrls]
      }));
      toast.success('Document(s) uploaded successfully');
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload some documents.');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFormData((prev) => {
      const newCerts = prev.certificates.filter((_, index) => index !== indexToRemove);
      if (newCerts.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return { ...prev, certificates: newCerts };
    });
  };

  const resetDialogState = () => {
    setFormData({
      assignedDate: null,
      expireDate: null,
      completedAt: null,
      certificates: []
    });
    setUploadError(null);
    setIsUploading(false);
    setEditingLogId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Action Handlers ---

  const handleReassign = async () => {
    if (!reassignDate) {
      toast.error('Please select a start date.');
      return;
    }

    try {
      // FIX: use toDateOnlyISO to preserve the calendar date
      const assignedISO = toDateOnlyISO(reassignDate)!;

      let newExpireDate: string | null = null;
      if (trainingRecord?.trainingId?.validityDays) {
        // FIX: add days in UTC so the result date is also timezone-safe
        newExpireDate = moment
          .utc([reassignDate.getFullYear(), reassignDate.getMonth(), reassignDate.getDate()])
          .add(trainingRecord.trainingId.validityDays, 'days')
          .toISOString();
      }

      const payload = {
        assignedDate: assignedISO,
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

  const openCompleteDialog = () => {
    setDialogMode('complete');
    setFormData({
      // FIX: parse ISO dates back to local Date using moment.utc so the
      // calendar date shown in the picker matches what was stored.
      assignedDate: trainingRecord?.assignedDate
        ? moment.utc(trainingRecord.assignedDate).toDate()
        : null,
      expireDate: trainingRecord?.expireDate
        ? moment.utc(trainingRecord.expireDate).toDate()
        : null,
      completedAt: null,
      certificates: Array.isArray(trainingRecord?.certificate)
        ? trainingRecord.certificate
        : trainingRecord?.certificate
        ? [trainingRecord.certificate]
        : []
    });
    setIsDialogOpen(true);
  };

  const openActiveEditDialog = () => {
    setDialogMode('edit_active');
    setFormData({
      assignedDate: trainingRecord?.assignedDate
        ? moment.utc(trainingRecord.assignedDate).toDate()
        : null,
      expireDate: trainingRecord?.expireDate
        ? moment.utc(trainingRecord.expireDate).toDate()
        : null,
      completedAt: null,
      certificates: Array.isArray(trainingRecord?.certificate)
        ? trainingRecord.certificate
        : trainingRecord?.certificate
        ? [trainingRecord.certificate]
        : []
    });
    setIsDialogOpen(true);
  };

  const openEditLogDialog = (log: TCompletionRecord) => {
    setDialogMode('edit_log');
    setEditingLogId(log._id);
    setFormData({
      assignedDate: log.assignedDate
        ? moment.utc(log.assignedDate).toDate()
        : null,
      expireDate: log.expireDate
        ? moment.utc(log.expireDate).toDate()
        : null,
      completedAt: log.completedAt
        ? moment.utc(log.completedAt).toDate()
        : null,
      certificates: Array.isArray(log.certificate)
        ? log.certificate
        : log.certificate
        ? [log.certificate]
        : []
    });
    setIsDialogOpen(true);
  };

  // Universal Save
  const handleSaveDialog = async () => {
    if (dialogMode === 'complete') {
      if (!formData.completedAt) return toast.error('Please select a completion date.');
      if (formData.certificates.length === 0)
        return toast.error('Please upload at least one completion certificate.');
    }

    if (dialogMode === 'edit_log') {
      if (!formData.assignedDate) return toast.error('Assigned date is required.');
      if (!formData.expireDate) return toast.error('Expiry date is required.');
      if (!formData.completedAt) return toast.error('Completion date is required.');
      if (formData.certificates.length === 0)
        return toast.error('Please upload at least one certificate.');
    }

    try {
      // FIX: all dates go through toDateOnlyISO — preserves calendar date in UTC
      const payload: any = {
        assignedDate: toDateOnlyISO(formData.assignedDate),
        expireDate: toDateOnlyISO(formData.expireDate),
        certificate: formData.certificates
      };

      if (formData.completedAt) {
        payload.completedAt = toDateOnlyISO(formData.completedAt);
      }

      if (dialogMode === 'complete') {
        payload.status = 'completed';
      }

      if (dialogMode === 'edit_log' && editingLogId) {
        await axiosInstance.patch(`/employee-training/${tid}/logs/${editingLogId}`, payload);
        toast.success('History log updated successfully!');
      } else {
        await axiosInstance.patch(`/employee-training/${tid}`, payload);
        toast.success(
          dialogMode === 'complete' ? 'Training marked as completed!' : 'Training record updated!'
        );
      }

      setIsDialogOpen(false);
      resetDialogState();
      fetchTrainingData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process request.');
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'training' }
    });
  };

  const renderCertificateLinks = (certData?: string[] | string) => {
    if (!certData || (Array.isArray(certData) && certData.length === 0)) {
      return <span className="text-sm text-black">-</span>;
    }

    const certArray = Array.isArray(certData) ? certData : [certData];

    return (
      <div className="flex flex-col gap-1 mt-1">
        {certArray.map((certLink, index) => {
          const fileName = getFileNameFromUrl(certLink);
          return (
            <a
              key={index}
              href={certLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              title={fileName}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{fileName}</span>
            </a>
          );
        })}
      </div>
    );
  };

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

    // FIX: compare dates in UTC so "today" isn't shifted by the London default
    const today = moment.utc().startOf('day');
    const expiry = moment.utc(expireDate).startOf('day');
    const reminderDays = trainingId.reminderBeforeDays || 30;
    const reminderDate = moment.utc(expireDate).subtract(reminderDays, 'days').startOf('day');

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
        <Clock className="h-3 w-3" /> In Progress
      </Badge>
    );
  };

  const renderUploadUI = () => (
    <>
      <div className="space-y-2 pt-2">
        <Label className="text-sm font-medium text-gray-700">
          Certificate(s){' '}
          {dialogMode === 'complete' && <span className="text-red-500">*</span>}
        </Label>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isUploading
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 z-0 cursor-pointer opacity-0"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
              <p className="text-xs text-theme">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Upload Copy</span>
              <span className="text-xs text-gray-400">PDF/Image (Max 5MB)</span>
            </div>
          )}
        </div>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      {formData.certificates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Attached Documents:</p>
          {formData.certificates.map((url, index) => (
            <div
              key={index}
              className="flex w-full items-center justify-between rounded border border-green-200 bg-white p-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                <p
                  className="max-w-[150px] truncate text-xs text-gray-600 sm:max-w-[250px]"
                  title={getFileNameFromUrl(url)}
                >
                  {getFileNameFromUrl(url)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                className="z-20 h-7 w-7 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderTrainingRow = (
    data: any,
    isLog: boolean,
    statusElement: React.ReactNode,
    onEdit: () => void,
    onComplete?: () => void
  ) => (
    <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 md:flex-row md:items-center">
      <div className="grid w-full grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <span className="text-xs font-semibold uppercase text-black">Assigned Date</span>
          <p className="font-medium text-gray-800">
            {/* FIX: format using moment.utc so the date isn't shifted by London tz */}
            {data.assignedDate ? moment.utc(data.assignedDate).format('DD MMM, YYYY') : '-'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-black">Expiry Date</span>
          <p className="font-medium text-gray-800">
            {data.expireDate ? moment.utc(data.expireDate).format('DD MMM, YYYY') : '-'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-black">Completed On</span>
          <p className={isLog ? 'font-medium text-green-600' : 'font-medium text-gray-800'}>
            {data.completedAt ? moment.utc(data.completedAt).format('DD MMM, YYYY') : '-'}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-black">Status</span>
          <div className="mt-1 font-medium">{statusElement}</div>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase text-black">Certificate</span>
          {renderCertificateLinks(data.certificate)}
        </div>
        <div className="flex flex-row items-center gap-2 justify-end">
          {!isLog && onComplete && (
            <Button
              onClick={onComplete}
              size={'sm'}
              className="w-full bg-green-600 text-white shadow-sm hover:bg-green-700 md:w-auto"
            >
              Complete
            </Button>
          )}
          <Button variant="outline" size={'sm'} onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="p-10 text-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );

  if (!trainingRecord)
    return <div className="p-10 text-center text-red-500">Record not found</div>;

  const isCompleted = trainingRecord.status === 'completed';

  // FIX: parse minReassignDate in UTC
  const minReassignDate = trainingRecord?.expireDate
    ? moment.utc(trainingRecord.expireDate).toDate()
    : moment.utc().toDate();

  const predictedExpiry =
    reassignDate && trainingRecord.trainingId.validityDays
      ? moment
          .utc([reassignDate.getFullYear(), reassignDate.getMonth(), reassignDate.getDate()])
          .add(trainingRecord.trainingId.validityDays, 'days')
          .format('DD-MM-YYYY')
      : '';

  const dialogTitleMap = {
    complete: 'Complete Training',
    edit_active: 'Edit Active Training',
    edit_log: 'Edit Training'
  };

  const sortedCompletionHistory =
    trainingRecord.completionHistory && trainingRecord.completionHistory.length > 0
      ? [...trainingRecord.completionHistory].reverse()
      : [];

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-row items-center gap-2 font-semibold text-black">
              <h1>
                {trainingRecord.employeeId.firstName} {trainingRecord.employeeId.lastName}
              </h1>
              - <h1>{trainingRecord.trainingId.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleEmployeeClick(trainingRecord?.employeeId?._id)}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
              </Button>
              {isCompleted ? (
                <Button onClick={() => setIsReassignOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Re-assign Course
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            Training History
          </h3>

          <div className="space-y-4">
            {!isCompleted &&
              trainingRecord.assignedDate &&
              renderTrainingRow(
                trainingRecord,
                false,
                getStatusBadge(),
                openActiveEditDialog,
                openCompleteDialog
              )}

            {sortedCompletionHistory.length > 0 ? (
              sortedCompletionHistory.map((log) =>
                renderTrainingRow(
                  log,
                  true,
                  <Badge className="gap-1 border-green-200 bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200">
                    <CheckCircle className="h-3 w-3" /> Completed
                  </Badge>,
                  () => openEditLogDialog(log)
                )
              )
            ) : isCompleted || !trainingRecord.assignedDate ? (
              <div className="rounded-lg border bg-gray-50 p-8 text-center italic text-black">
                No previous history logs available.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* --- UNIFIED DIALOG (COMPLETE / EDIT ACTIVE / EDIT LOG) --- */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetDialogState();
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitleMap[dialogMode]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label>Assigned Date</Label>
                <DatePicker
                  selected={formData.assignedDate}
                  onChange={(date) => setFormData({ ...formData, assignedDate: date })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  dateFormat="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  preventOpenOnFocus
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Expiry Date</Label>
                <DatePicker
                  selected={formData.expireDate}
                  onChange={(date) => setFormData({ ...formData, expireDate: date })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  dateFormat="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  preventOpenOnFocus
                />
              </div>
            </div>

            {dialogMode !== 'edit_active' && (
              <div className="flex flex-col space-y-2 pt-2">
                <Label className="mb-1">
                  Completion Date{' '}
                  {(dialogMode === 'complete' || dialogMode === 'edit_log') && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <DatePicker
                  selected={formData.completedAt}
                  onChange={(date) => setFormData({ ...formData, completedAt: date })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select completion date"
                  showMonthDropdown
                  showYearDropdown
                  preventOpenOnFocus
                />
              </div>
            )}

            {dialogMode === 'edit_log' ? (
              <>
                <div className="space-y-2 pt-2">
                  <Label>
                    Certificate(s) <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                      isUploading
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 z-0 cursor-pointer opacity-0"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
                        <p className="text-xs text-theme">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Upload Copy</span>
                        <span className="text-xs text-gray-400">PDF/Image (Max 5MB)</span>
                      </div>
                    )}
                  </div>
                  {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                </div>

                {formData.certificates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Attached Documents:</p>
                    {formData.certificates.map((url, index) => (
                      <div
                        key={index}
                        className="flex w-full items-center justify-between rounded border border-green-200 bg-white p-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                          <p
                            className="max-w-[150px] truncate text-xs text-gray-600 sm:max-w-[250px]"
                            title={getFileNameFromUrl(url)}
                          >
                            {getFileNameFromUrl(url)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              renderUploadUI()
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDialog}
              className={
                dialogMode === 'complete' ? 'bg-green-600 text-white hover:bg-green-700' : ''
              }
              disabled={
                isUploading ||
                (dialogMode === 'complete' &&
                  (formData.certificates.length === 0 || !formData.completedAt)) ||
                (dialogMode === 'edit_log' &&
                  (!formData.assignedDate ||
                    !formData.expireDate ||
                    !formData.completedAt ||
                    formData.certificates.length === 0))
              }
            >
              {dialogMode === 'complete' ? 'Confirm Completion' : 'Save Changes'}
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
              <span className="font-semibold">{trainingRecord.employeeId.firstName}</span>.
            </p>

            <div className="flex flex-col space-y-2">
              <Label className="mb-1">
                New Assigned Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={reassignDate}
                onChange={(date) => setReassignDate(date)}
                minDate={minReassignDate}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                dateFormat="dd-MM-yyyy"
                placeholderText="Select start date"
                showMonthDropdown
                showYearDropdown
                preventOpenOnFocus
              />
            </div>

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