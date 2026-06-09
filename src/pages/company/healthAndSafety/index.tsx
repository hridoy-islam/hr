import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Plus, Search, Upload, FileText, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { z } from 'zod';
import moment from '@/lib/moment-setup';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { Badge } from '@/components/ui/badge';

// --- Zod Validation Schema ---
const createHealthSafetySchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, { message: 'Title must be at least 3 characters long' })
      .max(100, { message: 'Title cannot exceed 100 characters' }),
    startDate: z.date().nullable().optional(),
    expiryDate: z.date().nullable().optional(),
    updatedBy: z
      .string({ required_error: 'Updated by is required' })
      .min(1, { message: 'Updated by cannot be empty' }),
    companyId: z
      .string({ required_error: 'Company ID is missing' })
      .min(1, { message: 'Company ID cannot be empty' }),
    document: z.array(z.string()).optional()
  })
  .refine(
    (data) => {
      // Only validate expiry > start if both dates are provided
      if (data.startDate && data.expiryDate) {
        return data.expiryDate > data.startDate;
      }
      return true;
    },
    {
      message: 'Expiry date must be after the start date',
      path: ['expiryDate']
    }
  );

// Interface mapping to Backend Schema
interface HealthSafetyRecord {
  _id: string;
  title: string;
  startDate?: string;
  expiryDate?: string;
  document: string[];
  updatedBy: string;
}

export default function HealthAndSafetyPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mocking user for the document upload entityId
  const user = useSelector((state: any) => state.auth.user);
  
  // Data States
  const [records, setRecords] = useState<HealthSafetyRecord[]>([]);
  const [healthSafetyCheckInterval, setHealthSafetyCheckInterval] = useState(30);

  // Loading & Pagination States
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [recordTitle, setRecordTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // File Upload States & Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setHealthSafetyCheckInterval(result[0].healthAndSafetyCheckDate || 30);
      } else {
        setHealthSafetyCheckInterval(30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
      setHealthSafetyCheckInterval(30); // Fallback on error
    }
  };

  useEffect(() => {
    fetchScheduleSettings();
  }, [id]);

  // Dynamic status calculation per record
  const getStatusBadge = (expiryDateString?: string) => {
    // If no expiry date is set, the record is considered Active
    if (!expiryDateString) {
      return (
        <Badge className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    }

    const now = moment().startOf('day');
    const expiry = moment(expiryDateString).startOf('day');
    const diffDays = expiry.diff(now, 'days');

    if (now.isAfter(expiry)) {
      return (
        <Badge className="bg-red-100 px-3 py-1 text-red-800 hover:bg-red-100">
          Expired
        </Badge>
      );
    } else if (diffDays <= healthSafetyCheckInterval) {
      return (
        <Badge className="bg-yellow-100 px-3 py-1 text-yellow-800 hover:bg-yellow-100">
          Expiring Soon
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    }
  };

  // Fetch Health & Safety Records List
  const fetchRecords = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);

      const response = await axiosInstance.get(`/health-and-safety`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });

      setRecords(response.data.data.result || response.data.data);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    if (dialogOpen) {
      // Reset all form fields, errors, and files when dialog opens
      setRecordTitle('');
      setStartDate(null);
      setExpiryDate(null);
      setFormErrors({});
      setUploadedFiles([]);
      setUploadError(null);
      setIsUploading(false);
    }
  }, [dialogOpen]);

  const handleSearch = () => {
    fetchRecords(currentPage, entriesPerPage, searchTerm);
  };

  // --- File Upload Handlers ---
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 20MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setFormErrors((prev) => ({ ...prev, uploadedFiles: undefined }));

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user?._id || id || '');
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedResults]);
    } catch (err) {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // --- Submit Handler ---
  const handleCreateRecord = async () => {
    setFormErrors({});
    const normalizeDate = (date: Date | null) => {
      if (!date) return null; // Pass null if date is not selected
      return new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          12,
          0,
          0,
          0
        )
      );
    };
    
    const rawPayload = {
      title: recordTitle,
      startDate: normalizeDate(startDate),
      expiryDate: normalizeDate(expiryDate),
      updatedBy: user?._id || 'unknown',
      companyId: id || '',
      document: uploadedFiles.map((file) => file.url) // Matches the Mongoose 'document' field
    };

    const validation = createHealthSafetySchema.safeParse(rawPayload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0] && !fieldErrors[issue.path[0]]) {
          fieldErrors[issue.path[0]] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post(
        '/health-and-safety',
        validation.data
      );

      if (response.data?.success) {
        toast({
          title: 'Record created successfully',
          className: 'bg-theme border-none text-white'
        });
        setDialogOpen(false);
        fetchRecords(currentPage, entriesPerPage);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to create record',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/health-and-safety/${recordId}`
      );
      if (response.data?.success) {
        toast({
          title: 'Record deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        fetchRecords(currentPage, entriesPerPage);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete record',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-5 shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Shield className="h-6 w-6" />
            Health & Safety
          </h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search record title..."
              className="h-9 w-full min-w-0 sm:min-w-[250px]"
            />

            <Button
              onClick={handleSearch}
              size="sm"
              className="h-9 w-full min-w-[100px] border-none bg-theme text-white hover:bg-theme/90 sm:w-auto"
            >
              Search
            </Button>
          </div>
        </div>

        <Button
          className="w-full bg-theme text-white hover:bg-theme/90 md:w-auto"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Record
        </Button>
      </div>

      {/* Table Section */}
      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record Title</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium text-gray-900">
                    {record.title}
                  </TableCell>
                  <TableCell>
                    {record.startDate
                      ? moment(record.startDate).format('DD MMM, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.expiryDate
                      ? moment(record.expiryDate).format('DD MMM, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.expiryDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-row items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`${record._id}`)}
                      >
                        View Details
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete this record and remove its data
                              from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => handleDeleteRecord(record._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[95vh] max-w-2xl flex-col overflow-y-auto p-4 sm:p-6 md:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold sm:text-2xl">
              Create New Record
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex-1 space-y-6 overflow-y-auto">
            {/* Record Title */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Title</label>
              <Input
                className={`h-11 rounded-lg border transition-colors sm:h-12 ${
                  formErrors.title
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-gray-200'
                }`}
                value={recordTitle}
                onChange={(e) => {
                  setRecordTitle(e.target.value);
                  if (formErrors.title)
                    setFormErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g., Annual Safety Inspection"
              />
              {formErrors.title && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Start Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold">Start Date </label>
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => {
                      setStartDate(date);
                      if (formErrors.startDate)
                        setFormErrors((prev) => ({ ...prev, startDate: '' }));
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`flex h-11 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none sm:h-12 ${
                      formErrors.startDate
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    wrapperClassName="w-full"
                    placeholderText="Select start date"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                    dropdownMode="select"
                    popperProps={{ strategy: 'fixed' }}
                    popperClassName="z-[9999]"
                  />
                </div>
                {formErrors.startDate && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {formErrors.startDate}
                  </p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold">Expiry Date </label>
                <div className="relative">
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date: Date | null) => {
                      setExpiryDate(date);
                      if (formErrors.expiryDate)
                        setFormErrors((prev) => ({ ...prev, expiryDate: '' }));
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`flex h-11 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none sm:h-12 ${
                      formErrors.expiryDate
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    wrapperClassName="w-full"
                    placeholderText="Select expiry date"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                    dropdownMode="select"
                    // minDate={startDate || undefined}
                    popperProps={{ strategy: 'fixed' }}
                    popperClassName="z-[9999]"
                  />
                </div>
                {formErrors.expiryDate && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {formErrors.expiryDate}
                  </p>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Supporting Documents{' '}
                <span className="font-normal text-gray-400">(Optional)</span>
              </Label>
              <div
                className={cn(
                  'relative flex  h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all sm:p-6',
                  isUploading
                    ? 'border-theme bg-theme/5'
                    : formErrors.uploadedFiles
                      ? 'border-red-500 bg-red-50 hover:bg-red-100/50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/80'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
                    <p className="text-sm font-medium text-theme">
                      Uploading files...
                    </p>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center gap-1 text-center">
                    <div className=" flex h-5 w-10 items-center justify-center ">
                      <Upload
                        className={cn(
                          'h-5 w-5',
                          formErrors.uploadedFiles
                            ? 'text-red-500'
                            : 'text-gray-500'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        formErrors.uploadedFiles
                          ? 'text-red-600'
                          : 'text-gray-700'
                      )}
                    >
                      Click or drag to upload
                    </span>
                    <span className="text-xs text-gray-500"> (Max 20MB)</span>
                  </div>
                )}
              </div>

              {formErrors.uploadedFiles && !isUploading && (
                <p className="text-xs font-medium text-red-500">
                  {formErrors.uploadedFiles}
                </p>
              )}

              {uploadError && (
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>{' '}
                  {uploadError}
                </p>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
                  <ul className="max-h-[140px] space-y-2 overflow-y-auto pr-1">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-2 text-sm shadow-sm sm:px-3"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                          <span className="max-w-[200px] truncate font-medium text-gray-700 sm:max-w-[400px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="order-2 w-full sm:order-1 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              className="order-1 w-full min-w-[120px] bg-theme text-white hover:bg-theme/90 sm:order-2 sm:w-auto"
              onClick={handleCreateRecord}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? <BlinkingDots size="small" /> : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}