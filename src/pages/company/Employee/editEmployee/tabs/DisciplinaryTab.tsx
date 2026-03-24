import React, { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle,
  History,
  FileText,
  Upload,
  X,
  Eye,
  Gavel,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from '@/lib/moment-setup';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Interfaces ---

interface UploadedFile {
  name: string;
  url: string;
}

interface LogEntry {
  _id?: string;
  title: string;
  date: string;
  document?: string[] | string; // Supports array of strings and legacy string fallback
  note?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

interface DisciplinaryData {
  _id: string;
  employeeId: string;
  issueDeadline?: string; // If present, an issue is active
  logs?: LogEntry[];
}

// --- Main Component ---

function DisciplinaryTab() {
  const { id ,eid} = useParams(); // employeeId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Data
  const [disciplinaryId, setDisciplinaryId] = useState<string | null>(null);
  const [activeIssue, setActiveIssue] = useState<DisciplinaryData | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Settings
  const [checkInterval, setCheckInterval] = useState<number>(30); // Default 30
  const [status, setStatus] = useState<string>('no-issue');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Form Inputs
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // --- Fetch Data ---

  const fetchSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/schedule-check?companyId=${id}`);
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        setCheckInterval(result[0].disciplinaryCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchDisciplinaryData = async () => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/disciplinary?employeeId=${eid}`);
      const result: DisciplinaryData[] = res.data?.data?.result || [];

      if (result.length > 0) {
        const data = result[0];
        setDisciplinaryId(data._id);
        
        if (data.issueDeadline) {
          setActiveIssue(data);
        } else {
          setActiveIssue(null);
        }
        setHistory(data.logs || []);
      } else {
        setDisciplinaryId(null);
        setActiveIssue(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching Disciplinary data:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchDisciplinaryData()]);
      setIsLoading(false);
    };
    loadData();
  }, [eid, id]);

  // --- Status Logic ---

  useEffect(() => {
    if (!activeIssue || !activeIssue.issueDeadline) {
      setStatus('no-issue');
      return;
    }

    const now = moment().startOf('day');
    const deadline = moment(activeIssue.issueDeadline).startOf('day');
    const diffDays = deadline.diff(now, 'days');

    if (now.isAfter(deadline)) {
      setStatus('overdue');
    } else if (diffDays <= checkInterval) {
      setStatus('due-soon');
    } else {
      setStatus('active');
    }
  }, [activeIssue, checkInterval]);

  const renderStatusBadge = () => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due Soon</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active Issue</Badge>;
      default:
        return <Badge variant="secondary" className="bg-green-50 text-green-700">No Active Issue</Badge>;
    }
  };

  // --- Handlers ---

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    // Validate all files first
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Only PDF, JPEG, or PNG allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user._id);
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
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Open Helpers
  const openCreate = () => {
    setInputDate(null);
    setInputNote('');
    setUploadedFiles([]);
    setUploadError(null);
    setShowCreateModal(true);
  };

  const openExtend = () => {
    setInputDate(null); 
    setInputNote('');
    setUploadedFiles([]);
    setUploadError(null);
    setShowExtendModal(true);
  };

  const openResolve = () => {
    setInputNote('');
    setUploadedFiles([]);
    setUploadError(null);
    setShowResolveModal(true);
  };

  // --- Submit: Create Issue ---
  const submitCreate = async () => {
    if (!inputDate || !id) return; // Note/Doc are optional now
    setIsSubmitting(true);

    try {
      const payload = {
        issueDeadline: moment(inputDate).toISOString(),
        note: inputNote, // Optional
        document: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined, // Optional
        updatedBy: user._id,
      };

      if (disciplinaryId) {
        await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
          ...payload,
          title: 'New Disciplinary Issue Created' 
        });
      } else {
        await axiosInstance.post('/disciplinary', {
          ...payload,
          employeeId: eid
        });
      }

      await fetchDisciplinaryData();
      toast({ title: 'Disciplinary issue created', className: 'bg-theme text-white' });
      setShowCreateModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to create issue', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Submit: Extend Deadline ---
  const submitExtend = async () => {
    if (!inputDate || !disciplinaryId || !id) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
        action: 'extendDate',
        extendDeadline: moment(inputDate).toISOString(),
        note: inputNote,
        document: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined,
        updatedBy: user._id
      });

      await fetchDisciplinaryData();
      toast({ title: 'Deadline extended successfully', className: 'bg-theme text-white' });
      setShowExtendModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to extend', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Submit: Resolve Issue ---
  const submitResolve = async () => {
    if (!disciplinaryId || !id) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/disciplinary/${disciplinaryId}`, {
        action: 'resolved',
        note: inputNote,
        document: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined,
        updatedBy: user._id
      });

      await fetchDisciplinaryData();
      toast({ title: 'Issue marked as resolved', className: 'bg-theme text-white' });
      setShowResolveModal(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'Failed to resolve', className: 'bg-destructive text-white' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Status & Actions */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-theme" />
              Issue Status
            </h2>

            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Status
                </Label>
                {renderStatusBadge()}
              </div>

              {activeIssue ? (
                <>
                  {/* Deadline */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Resolution Deadline
                    </Label>
                    <div className={cn("text-lg font-semibold", status === 'overdue' ? "text-red-600" : "text-gray-900")}>
                      {moment(activeIssue.issueDeadline).format('DD MMMM YYYY')}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 pt-6 space-y-3">
                    <Button onClick={openExtend} className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Extend Deadline
                    </Button>
                    <Button onClick={openResolve} className="w-full bg-green-600 text-white hover:bg-green-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Resolve Issue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                    <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p>There are no active disciplinary issues recorded for this employee.</p>
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <Button onClick={openCreate} className="w-full bg-theme text-white hover:bg-theme/90">
                      <Gavel className="mr-2 h-4 w-4" />
                      Create Issue
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: History Log */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <History className="h-5 w-5 text-theme" />
              History Log
            </h2>

            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead >Note</TableHead>
                    <TableHead className="text-right">Document(s)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center italic text-gray-500">
                        No history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry) => (
                        <TableRow key={entry._id || Math.random()} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            {entry.title || 'Update'}
                          </TableCell>
                          
                          <TableCell>
                            <div className='flex flex-col text-xs font-medium'>
                                <span className="font-medium ">
                                {entry.updatedBy && typeof entry.updatedBy === 'object'
                                    ? entry.updatedBy.name || `${entry.updatedBy.firstName ?? ''} ${entry.updatedBy.lastName ?? ''}`.trim()
                                    : 'System'}
                                </span>
                                {moment(entry.date).format('DD MMM YYYY')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="truncate text-sm text-gray-600 max-w-[150px]" title={entry.note}>
                              {entry.note || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              {/* Handle array format */}
                              {Array.isArray(entry.document) && entry.document.length > 0 ? (
                                entry.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => window.open(docUrl, '_blank')}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Document {entry.document!.length > 1 ? idx + 1 : ''}
                                  </Button>
                                ))
                              ) 
                              /* Handle legacy string format fallback */
                              : entry.document && typeof entry.document === 'string' ? (
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() => window.open(entry.document as string, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Modal: Create Issue */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Disciplinary Issue</DialogTitle>
            <DialogDescription>
               Initiate a new disciplinary record. This will become the active issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                    Resolution Deadline <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                    selected={inputDate}
                    onChange={(date) => setInputDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select deadline..."
                    minDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode='select'
                    preventOpenOnFocus
                />
                </div>

                <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                    Issue Description / Note <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Textarea 
                    placeholder="Describe the issue..." 
                    value={inputNote}
                    onChange={(e) => setInputNote(e.target.value)}
                    rows={4}
                />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Supporting Document(s) <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                            <p className="truncate text-xs font-medium text-green-700" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                            className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dropzone */}
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
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          Upload Letter/Evidence
                        </span>
                        <span className="text-xs text-gray-400">PDF/Images (Max 5MB each)</span>
                      </div>
                    )}
                  </div>
                  
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button 
              className="bg-theme text-white" 
              onClick={submitCreate} 
              disabled={isSubmitting || !inputDate || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Extend Deadline */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
            <DialogDescription>
                Extend the resolution deadline for the current issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                New Deadline <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select new date..."
                minDate={activeIssue?.issueDeadline ? new Date(activeIssue.issueDeadline) : new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode='select'
                preventOpenOnFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Reason for Extension <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Why is the deadline being extended?" 
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
              />
            </div>

            {/* Added File Upload for Extension */}
            <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Supporting Document(s) <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                            <p className="truncate text-xs font-medium text-green-700" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                            className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dropzone */}
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
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          Upload Letter/Evidence
                        </span>
                        <span className="text-xs text-gray-400">PDF/Images (Max 5MB each)</span>
                      </div>
                    )}
                  </div>
                  
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                </div>
            {/* End File Upload */}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>Cancel</Button>
            <Button 
              onClick={submitExtend} 
              disabled={isSubmitting || !inputDate || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Extension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Modal: Resolve Issue */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
                Mark this issue as resolved. 
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Resolution Note / Final Decision <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                placeholder="Enter details about how the issue was resolved..." 
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={4}
              />
            </div>

            {/* Resolution Document Upload */}
            <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Resolution Document(s) <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                            <p className="truncate text-xs font-medium text-green-700" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                            className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dropzone */}
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
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          Upload Resolution Proof
                        </span>
                        <span className="text-xs text-gray-400">PDF/Images (Max 5MB each)</span>
                      </div>
                    )}
                  </div>
                  
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700" 
              onClick={submitResolve} 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DisciplinaryTab;