import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Trash2,
  Plus,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
  Calendar,
  CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from '@/lib/moment-setup';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

// --- Interfaces ---
interface TSickNote {
  _id: string;
  note: string;
  startDate: string;
  endDate: string;
  employeeId: string;
  companyId: string;
  documents: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export default function SickNoteTab() {
  const { id,eid } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [sickNotes, setSickNotes] = useState<TSickNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TSickNote | null>(null);

  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // File Upload State (Multiple)
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  // --- Data Fetching ---
  const fetchSickNotes = async (page: number, entriesPerPage: number) => {
    if (!eid) return;
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/sick-note?employeeId=${eid}`, {
        params: {
          page,
          limit: entriesPerPage,
          companyId: id,
        }
      });
            setTotalPages(res.data.data.meta.totalPage);

      setSickNotes(res.data?.data?.result || []);
    } catch (error) {
      console.error('Failed to fetch sick notes', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSickNotes(currentPage, entriesPerPage);
  }, [eid, currentPage, entriesPerPage]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingNote(null);
    setNote('');
    setStartDate(null);
    setEndDate(null);
    setUploadedDocs([]);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (record: TSickNote) => {
    setEditingNote(record);
    setNote(record.note);
    setStartDate(record.startDate ? new Date(record.startDate) : null);
    setEndDate(record.endDate ? new Date(record.endDate) : null);
    setUploadedDocs(record.documents || []);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleMultipleFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!eid || files.length === 0) return;

    // Validate file sizes (5MB limit per file)
    const oversizedFiles = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError('One or more files exceed the 5MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', eid);
        formData.append('file_type', 'sickNoteDoc');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data?.data?.fileUrl;
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(Boolean) as string[];

      setUploadedDocs((prev) => [...prev, ...validUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload some documents. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input so the same files can be selected again if removed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDocument = (indexToRemove: number) => {
    setUploadedDocs((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eid || !note.trim() || !startDate || !endDate) {
      setUploadError('Please fill in all required fields.');
      return;
    }

    // Basic date validation
    if (moment(endDate).isBefore(moment(startDate))) {
      setUploadError('End date cannot be before start date.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const payload = {
        employeeId: eid,
        companyId: id,
        note: note.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        documents: uploadedDocs
      };

      if (editingNote) {
        await axiosInstance.patch(`/sick-note/${editingNote._id}`, payload);
      } else {
        await axiosInstance.post('/sick-note', payload);
      }

      setIsDialogOpen(false);
      fetchSickNotes(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Failed to save sick note:', error);
      setUploadError('Failed to save sick note details.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Sick Notes
          </h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenCreate}
              className="bg-theme text-white shadow-sm hover:bg-theme/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Sick Note
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'Edit Sick Note' : 'Record Sick Note'}
              </DialogTitle>
              <DialogDescription>
                Provide details and dates of the sickness absence, and attach
                any relevant medical documents.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {/* Note Field */}
              <div className="space-y-2">
                <Label htmlFor="sick-note">
                  Sickness Note <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="sick-note"
                  placeholder="Describe the reason for the sick leave..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none bg-gray-50 text-sm"
                  rows={4}
                  required
                />
              </div>
              {/* Dates Row with React DatePicker */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select start date"
                      className="flex h-10 w-full rounded-md border border-gray-400 bg-gray-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      preventOpenOnFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate || undefined}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select end date"
                      className="flex h-10 w-full rounded-md border border-gray-400 bg-gray-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      preventOpenOnFocus
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Document Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Supporting Documents</Label>
                  <span className="text-xs text-gray-400">
                    Optional (Max 5MB each)
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleMultipleFilesUpload}
                  className="hidden"
                  disabled={isUploading}
                />

                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors
                    ${isUploading ? 'cursor-wait border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">
                        Uploading files...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-white p-2 shadow-sm">
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-theme">
                          Click to select multiple files
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">
                      Attached Files ({uploadedDocs.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {uploadedDocs.map((docUrl, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm"
                        >
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-[120px] truncate text-xs font-medium text-gray-700 hover:underline"
                            title={docUrl}
                          >
                            Document {index + 1}
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDocument(index);
                            }}
                            className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> {uploadError}
                  </p>
                )}
              </div>

              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  type="button"
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-theme text-white hover:bg-theme/90"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Save Sick Note'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : sickNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-50 p-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No sick notes recorded
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a sick note when an employee is absent due to illness.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[30%] font-semibold text-gray-900">
                  Sickness Note
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  Start Date
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  End Date
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  Attachments
                </TableHead>

                <TableHead className="text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sickNotes.map((noteRecord) => (
                <TableRow key={noteRecord._id} className="hover:bg-gray-50">
                  <TableCell>
                    <span
                      className="line-clamp-2 font-medium text-gray-900"
                      title={noteRecord.note}
                    >
                      {noteRecord.note}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-gray-800">
                      {moment(noteRecord.startDate).format('DD MMM, YYYY')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-gray-800">
                      {moment(noteRecord.endDate).format('DD MMM, YYYY')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {noteRecord.documents && noteRecord.documents.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {noteRecord.documents.map((docUrl, index) => (
                          <a
                            key={index}
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            <FileText className="h-3 w-3" />
                            Document {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleOpenEdit(noteRecord)}
                        title="Edit Note"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className='p-2'>
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
