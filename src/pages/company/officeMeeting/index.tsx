import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, X, Upload, FileText, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { z } from 'zod';
import moment from 'moment';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils'; // Make sure this path matches your project structure

// --- Zod Validation Schema ---
const createMeetingSchema = z.object({
  title: z
    .string({ required_error: 'Meeting title is required' })
    .min(3, { message: 'Meeting title must be at least 3 characters long' })
    .max(100, { message: 'Meeting title cannot exceed 100 characters' }),
  nextMeetingDate: z.date({
    required_error: 'Meeting date is required',
    invalid_type_error: 'Please select a valid date'
  }),
  employeeId: z
    .array(z.string())
    .min(1, { message: 'Please select at least one employee' }),
  companyId: z
    .string({ required_error: 'Company ID is missing' })
    .min(1, { message: 'Company ID cannot be empty' }),
  documents: z.array(z.string()).optional() // Added optional documents array
});

// Interfaces mapping to your Backend Schema
interface UserRecord {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string;
  designationId?: { title: string }[];
}

interface MeetingRecord {
  _id: string;
  title: string;
  employeeId: UserRecord[];
  nextMeetingDate: string;
}

export default function OfficeMeetingPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mocking user for the document upload entityId (Replace with your actual auth context)
  const user = { _id: id }; 

  // Data States
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [employees, setEmployees] = useState<UserRecord[]>([]);

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
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // File Upload States & Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch Meetings List
  const fetchMeetings = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);

      const response = await axiosInstance.get(`/company-meeting`, {
        params: {
          page,
          limit,
          companyId: id,
          ...(search ? { searchTerm: search } : {})
        }
      });

      setMeetings(response.data.data.result || response.data.data);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch Company Employees for the Dialog
  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get(`/users`, {
        params: { company: id, role: 'employee', fields: "firstName lastName email designationId", limit: 'all', status: 'active' }
      });
      setEmployees(response.data.data.result || response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchMeetings(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    if (dialogOpen) {
      fetchEmployees();
      // Reset all form fields, errors, and files when dialog opens
      setMeetingTitle('');
      setMeetingDate(null);
      setEmployeeSearch('');
      setSelectedEmployeeIds([]);
      setFormErrors({});
      setUploadedFiles([]);
      setUploadError(null);
      setIsUploading(false);
    }
  }, [dialogOpen]);

  const handleSearch = () => {
    fetchMeetings(currentPage, entriesPerPage, searchTerm);
  };

  // --- File Upload Handlers ---
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
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
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- Submit Handler ---
  const handleCreateMeeting = async () => {
    setFormErrors({});

    const rawPayload = {
      title: meetingTitle,
      nextMeetingDate: meetingDate,
      employeeId: selectedEmployeeIds,
      companyId: id || '',
      documents: uploadedFiles.map(file => file.url) // Injecting uploaded document URLs
    };

    const validation = createMeetingSchema.safeParse(rawPayload);

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
      const response = await axiosInstance.post('/company-meeting', validation.data);

      if (response.data?.success) {
        toast({
          title: 'Meeting created successfully',
          className: 'bg-theme border-none text-white'
        });
        setDialogOpen(false);
        fetchMeetings(currentPage, entriesPerPage);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to create meeting',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const response = await axiosInstance.delete(`/company-meeting/${meetingId}`);
      if (response.data?.success) {
        toast({
          title: 'Meeting deleted successfully',
          className: 'bg-theme border-none text-white'
        });
        fetchMeetings(currentPage, entriesPerPage);
      }
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete meeting',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  // --- Dialog Selection Logic ---
  const filteredEmployees = employees.filter((emp) => {
    const fullName = emp.name || `${emp.firstName} ${emp.lastName}`;
    return fullName.toLowerCase().includes(employeeSearch.toLowerCase());
  });

  const selectedEmployeesData = employees.filter((emp) =>
    selectedEmployeeIds.includes(emp._id)
  );

  const isAllSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployeeIds.includes(emp._id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = Array.from(
        new Set([...selectedEmployeeIds, ...filteredEmployees.map((e) => e._id)])
      );
      setSelectedEmployeeIds(newIds);
    } else {
      const filteredIds = filteredEmployees.map((e) => e._id);
      setSelectedEmployeeIds(selectedEmployeeIds.filter((empId) => !filteredIds.includes(empId)));
    }
    if (formErrors.employeeId) setFormErrors((prev) => ({ ...prev, employeeId: '' }));
  };

  const toggleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
    if (formErrors.employeeId) setFormErrors((prev) => ({ ...prev, employeeId: '' }));
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-5 shadow-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6" />
            Office Meetings
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search meeting title..."
              className="h-8 min-w-[250px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="min-w-[100px] border-none bg-theme text-white hover:bg-theme/90"
            >
              Search
            </Button>
          </div>
        </div>
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </div>

      {/* Table Section */}
      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No meetings found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting Title</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Next Meeting Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting._id}>
                  <TableCell className="font-medium text-gray-900">
                    {meeting.title}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {meeting.employeeId
                      ?.map((emp) => emp.name || `${emp.firstName}`)
                      .join(', ') || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {meeting.nextMeetingDate
                      ? moment(meeting.nextMeetingDate).format('DD MMM, YYYY')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className='flex flex-row items-center gap-2 justify-end'>
                      <Button
                        size="sm"
                        onClick={() => navigate(`${meeting._id}`)}
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
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this meeting and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => handleDeleteMeeting(meeting._id)}
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

      {/* Create Meeting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-y-auto p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">
              Create New Meeting
            </DialogTitle>
          </DialogHeader>

          <div className="grid h-[90vh] grid-cols-1 gap-5 md:grid-cols-3">
            
            {/* Column 1: Inputs & File Upload */}
            <div className="mt-2 flex flex-col space-y-6">
              
              {/* Meeting Title */}
              <div className="space-y-1">
                <label className="text-sm font-semibold">Meeting Title</label>
                <Input
                  className={`h-12 rounded-lg border transition-colors ${
                    formErrors.title ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'
                  }`}
                  value={meetingTitle}
                  onChange={(e) => {
                    setMeetingTitle(e.target.value);
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g., Monthly Team Sync Meeting"
                />
                {formErrors.title && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* Meeting Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold">Meeting Date</label>
                <div className="relative">
                  <DatePicker
                    selected={meetingDate}
                    onChange={(date: Date | null) => {
                      setMeetingDate(date);
                      if (formErrors.nextMeetingDate)
                        setFormErrors((prev) => ({ ...prev, nextMeetingDate: '' }));
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`flex h-12 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none ${
                      formErrors.nextMeetingDate ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'
                    }`}
                    wrapperClassName="w-full"
                    placeholderText="Select date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                {formErrors.nextMeetingDate && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {formErrors.nextMeetingDate}
                  </p>
                )}
              </div>

              {/* Attachments Section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Attachments <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all',
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
                      <p className="text-sm font-medium text-theme">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
                      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <Upload
                          className={cn(
                            'h-5 w-5',
                            formErrors.uploadedFiles ? 'text-red-500' : 'text-gray-500'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          formErrors.uploadedFiles ? 'text-red-600' : 'text-gray-700'
                        )}
                      >
                        Click or drag to upload
                      </span>
                      <span className="text-xs text-gray-500"> (Max 5MB)</span>
                    </div>
                  )}
                </div>

                {formErrors.uploadedFiles && !isUploading && (
                  <p className="text-xs font-medium text-red-500">{formErrors.uploadedFiles}</p>
                )}

                {uploadError && (
                  <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-500"></span> {uploadError}
                  </p>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
                    <ul className="max-h-[140px] space-y-2 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                            <span className="truncate font-medium text-gray-700">{file.name}</span>
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

            {/* Column 2: Recipients Selection */}
            <div
              className={`flex h-[520px] flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-colors ${
                formErrors.employeeId ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <div className="border-b border-gray-100 bg-gray-50/50 p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employee..."
                    className="h-9 bg-white pl-9"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
              </div>

              {formErrors.employeeId && (
                <div className="border-b border-red-100 bg-red-50 px-3 py-2">
                  <p className="text-xs font-medium text-red-600">{formErrors.employeeId}</p>
                </div>
              )}

              <div className="flex items-center space-x-3 border-b border-gray-100 p-3">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="cursor-pointer text-sm font-semibold">
                  Select All Employees
                </label>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredEmployees.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-gray-500">No employees found.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        className={`flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-50 ${
                          selectedEmployeeIds.includes(emp._id) ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => toggleEmployeeSelect(emp._id)}
                      >
                        <Checkbox
                          checked={selectedEmployeeIds.includes(emp._id)}
                          onCheckedChange={() => toggleEmployeeSelect(emp._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {emp.name || `${emp.firstName} ${emp.lastName}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {emp.designationId?.map((d) => d.title).join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Selected Recipients */}
            <div className="flex h-[520px] flex-col overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
              <div className="border-b border-blue-100 bg-blue-50 p-3">
                <h3 className="text-sm font-semibold text-blue-600">
                  Selected ({selectedEmployeeIds.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4">
                {selectedEmployeesData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm italic text-gray-400">No recipients selected.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEmployeesData.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-white p-2 shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">
                            {emp.name || `${emp.firstName} ${emp.lastName}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {emp.designationId?.map((d) => d.title).join(', ')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={() => toggleEmployeeSelect(emp._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>

          <DialogFooter className=''>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="min-w-[120px] bg-theme text-white hover:bg-theme/90"
              onClick={handleCreateMeeting}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? <BlinkingDots size="small" /> : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}