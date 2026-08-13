import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
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
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';
import moment from '@/lib/moment-setup';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Pen,
  FileText,
  Upload,
  X,
  Eye,
  ShieldCheck,
  History
} from 'lucide-react';

interface UploadedFile {
  name: string;
  url: string;
}

interface LogEntry {
  _id?: string;
  title: string;
  date: string;
  document?: string[] | string;
  note?: string;
  auditDate?: string;
  extendDeadline?: string;
  updatedBy: string | { firstName: string; lastName: string; name?: string };
}

export default function ViewAuditPage() {
  const { id: companyId, auditId } = useParams<{
    id: string;
    auditId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);

  const [audit, setAudit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extend modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [inputNote, setInputNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Complete confirm
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Edit note/documents modal
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editRemovedDocs, setEditRemovedDocs] = useState<string[]>([]);
  const [editNewDocs, setEditNewDocs] = useState<UploadedFile[]>([]);
  const editDocsInputRef = useRef<HTMLInputElement>(null);

  // Edit log
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editLogAuditDate, setEditLogAuditDate] = useState<Date | null>(null);
  const [editLogExtendDate, setEditLogExtendDate] = useState<Date | null>(null);
  const [editLogNote, setEditLogNote] = useState('');
  const [editLogFiles, setEditLogFiles] = useState<UploadedFile[]>([]);
  const [isEditLogSubmitting, setIsEditLogSubmitting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchAudit = async () => {
    if (!auditId) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/audit/${auditId}`);
      setAudit(res.data.data);
    } catch (err) {
      console.error('Error fetching audit:', err);
      toast({
        title: 'Failed to load audit',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [auditId]);

  const getAuditStatus = () => {
    if (!audit) return { label: '-', className: '' };
    if (audit.status === 'completed') {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    if (
      audit.auditDate &&
      moment(audit.auditDate).startOf('day').isBefore(moment().startOf('day'))
    ) {
      return {
        label: 'Due',
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }
    return {
      label: 'Active',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  };

  const employeeName = () => {
    const emp = audit?.employeeId;
    if (!emp) return '-';
    if (typeof emp === 'object') {
      return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.name;
    }
    return '-';
  };

  const isCompleted = audit?.status === 'completed';

  const uploadFiles = async (files: File[]) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast({
          title: `Invalid file type: ${file.name}`,
          variant: 'destructive'
        });
        return [];
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: `File too large: ${file.name}. Must be less than 20MB.`,
          variant: 'destructive'
        });
        return [];
      }
    }

    setIsUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('entityId', user._id);
          formData.append('file_type', 'auditDoc');
          formData.append('file', file);
          const res = await axiosInstance.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return { name: file.name, url: res.data?.data?.fileUrl };
        })
      );
      return results;
    } catch {
      toast({
        title: 'Failed to upload one or more documents.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const results = await uploadFiles(files);
    setFiles((prev) => [...prev, ...results]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openExtend = () => {
    setInputDate(audit?.auditDate ? new Date(audit.auditDate) : null);
    setInputNote('');
    setUploadedFiles([]);
    setShowExtendModal(true);
  };

  const submitExtend = async () => {
    if (!inputDate) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/audit/${auditId}`, {
        action: 'extendDate',
        auditDate: new Date(
          Date.UTC(
            inputDate.getFullYear(),
            inputDate.getMonth(),
            inputDate.getDate()
          )
        ).toISOString(),
        note: inputNote,
        document:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.url)
            : undefined,
        updatedBy: user._id
      });
      toast({
        title: 'Audit date extended successfully',
        className: 'bg-theme text-white'
      });
      setShowExtendModal(false);
      await fetchAudit();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to extend audit date',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitComplete = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/audit/${auditId}`, {
        action: 'complete',
        updatedBy: user._id
      });
      toast({
        title: 'Audit completed successfully',
        className: 'bg-theme text-white'
      });
      setShowCompleteConfirm(false);
      await fetchAudit();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to complete audit',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDetails = () => {
    setEditNote(audit?.note || '');
    setEditRemovedDocs([]);
    setEditNewDocs([]);
    setShowEditDetailsModal(true);
  };

  const handleEditDocsFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const results = await uploadFiles(files);
    setEditNewDocs((prev) => [...prev, ...results]);
    if (editDocsInputRef.current) editDocsInputRef.current.value = '';
  };

  const submitEditDetails = async () => {
    const existingDocs = Array.isArray(audit?.document)
      ? audit.document.filter((doc: string) => doc?.trim())
      : [];
    const finalDocuments = [
      ...existingDocs.filter((doc: string) => !editRemovedDocs.includes(doc)),
      ...editNewDocs.map((f) => f.url)
    ];

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/audit/${auditId}`, {
        action: 'editDetails',
        note: editNote,
        document: finalDocuments,
        updatedBy: user._id
      });
      toast({
        title: 'Audit details updated successfully',
        className: 'bg-theme text-white'
      });
      setShowEditDetailsModal(false);
      await fetchAudit();
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to update audit details',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditLog = (entry: LogEntry) => {
    setEditingLog(entry);
    setEditLogFiles([]);
    setEditLogAuditDate(entry.auditDate ? new Date(entry.auditDate) : null);
    setEditLogExtendDate(
      entry.extendDeadline ? new Date(entry.extendDeadline) : null
    );
    setEditLogNote(entry.note || '');
    setShowEditLogModal(true);
  };

  const submitEditLog = async () => {
    if (!editingLog || !editingLog._id) return;

    const existingDocs = Array.isArray(editingLog.document)
      ? editingLog.document
      : editingLog.document
        ? [editingLog.document]
        : [];
    const finalDocuments = [
      ...existingDocs,
      ...editLogFiles.map((f) => f.url)
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};

    if (editLogAuditDate) {
      payload.auditDate = new Date(
        Date.UTC(
          editLogAuditDate.getFullYear(),
          editLogAuditDate.getMonth(),
          editLogAuditDate.getDate()
        )
      ).toISOString();
    }
    if (editLogExtendDate) {
      payload.extendDeadline = new Date(
        Date.UTC(
          editLogExtendDate.getFullYear(),
          editLogExtendDate.getMonth(),
          editLogExtendDate.getDate()
        )
      ).toISOString();
    }
    if (editLogNote) {
      payload.note = editLogNote;
    }
    if (finalDocuments.length > 0) {
      payload.document = finalDocuments;
    }

    setIsEditLogSubmitting(true);
    try {
      await axiosInstance.patch(
        `/audit/${auditId}/logs/${editingLog._id}`,
        payload
      );
      toast({
        title: 'Log updated successfully!',
        className: 'bg-theme text-white'
      });
      setShowEditLogModal(false);
      await fetchAudit();
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || 'Update failed.',
        variant: 'destructive'
      });
    } finally {
      setIsEditLogSubmitting(false);
    }
  };

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;
    const lowerUrl = previewUrl.toLowerCase();
    const isImage =
      lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/) != null;
    const isPdf = lowerUrl.match(/\.(pdf)(\?.*)?$/) != null;

    if (isImage) {
      return (
        <img
          src={previewUrl}
          alt="Document Preview"
          className="max-h-full max-w-full rounded-md object-contain shadow-sm"
        />
      );
    }
    if (isPdf) {
      return (
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="PDF Preview"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="mb-4 h-16 w-16 text-black" />
        <p className="text-sm text-gray-500">
          Preview not available for this file format.
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Audit not found.</p>
        <Button
          onClick={() => navigate(`/company/${companyId}/audit`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audits
        </Button>
      </div>
    );
  }

  const status = getAuditStatus();

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <ShieldCheck className="h-6 w-6" />
          Audit Details
        </h2>
        <Button
          size="sm"
          onClick={() => navigate(`/company/${companyId}/audit`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audits
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Status & Actions */}
        <div className="lg:col-span-1">
          <div className="h-auto rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <ShieldCheck className="h-5 w-5 text-theme" />
              Audit Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Status
                </Label>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Audit Type
                </Label>
                <div className="text-sm font-semibold text-gray-900">
                  {audit.auditTypeId?.title || '-'}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Employee
                </Label>
                <div className="text-sm font-semibold text-gray-900">
                  {employeeName()}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Service User
                </Label>
                <div className="text-sm font-semibold text-gray-900">
                  {audit.serviceUserId?.name || '-'}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Audit Date
                </Label>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    status.label === 'Due'
                      ? 'text-red-600'
                      : 'text-gray-900'
                  )}
                >
                  {audit.auditDate
                    ? moment(audit.auditDate).format('DD MMMM YYYY')
                    : '-'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Note
                  </Label>
                  <Button
                    size="icon"
                    className="h-7 w-7"
                    onClick={openEditDetails}
                  >
                    <Pen className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700">
                  {audit.note?.trim() ? audit.note : '-'}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Documents
                </Label>
                {Array.isArray(audit.document) &&
                audit.document.filter((doc: string) => doc?.trim()).length >
                  0 ? (
                  <div className="flex flex-col items-start gap-1">
                    {audit.document
                      .filter((doc: string) => doc?.trim())
                      .map((docUrl: string, idx: number) => (
                        <Button
                          key={idx}
                          size="sm"
                          className="h-8"
                          onClick={() => handleViewDocument(docUrl)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Document {idx + 1}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-6">
                <Button
                  onClick={openExtend}
                  disabled={isCompleted}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Extend Audit Date
                </Button>
                <Button
                  onClick={() => setShowCompleteConfirm(true)}
                  disabled={isCompleted}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Audit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Log */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <History className="h-5 w-5 text-theme" />
              History Log
            </h2>

            <div className="overflow-hidden rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Document(s)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!audit.logs || audit.logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center italic text-gray-500"
                      >
                        No history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    audit.logs
                      .slice()
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((entry: LogEntry) => (
                        <TableRow
                          key={entry._id || Math.random()}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="font-medium text-gray-900">
                            {entry.title || 'Update'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs font-medium">
                              <span className="font-medium">
                                {entry.updatedBy &&
                                typeof entry.updatedBy === 'object'
                                  ? entry.updatedBy.name ||
                                    `${entry.updatedBy.firstName ?? ''} ${
                                      entry.updatedBy.lastName ?? ''
                                    }`.trim()
                                  : 'System'}
                              </span>
                              {moment(entry.date).format('DD MMM YYYY')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p
                              className="max-w-[150px] truncate text-sm text-gray-600"
                              title={entry.note}
                            >
                              {entry.note || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              {Array.isArray(entry.document) &&
                              entry.document.filter((doc) => doc?.trim())
                                .length > 0 ? (
                                entry.document
                                  .filter((doc) => doc?.trim())
                                  .map((docUrl, idx) => (
                                    <Button
                                      key={idx}
                                      size="sm"
                                      className="h-8"
                                      onClick={() =>
                                        handleViewDocument(docUrl)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Document {idx + 1}
                                    </Button>
                                  ))
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size={'icon'}
                              variant={'outline'}
                              onClick={() => openEditLog(entry)}
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
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

      {/* Edit Note/Documents Modal */}
      <Dialog open={showEditDetailsModal} onOpenChange={setShowEditDetailsModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note & Documents</DialogTitle>
            <DialogDescription>
              Update the note and supporting documents for this audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Note
              </Label>
              <Textarea
                placeholder="Enter note..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Document(s)
              </Label>

              {Array.isArray(audit?.document) &&
                audit.document
                  .filter((doc: string) => doc?.trim())
                  .filter((doc: string) => !editRemovedDocs.includes(doc))
                  .length > 0 && (
                  <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                    {audit.document
                      .filter((doc: string) => doc?.trim())
                      .filter((doc: string) => !editRemovedDocs.includes(doc))
                      .map((docUrl: string, index: number) => (
                        <div
                          key={index}
                          className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-5 w-5 flex-shrink-0 text-gray-600" />
                            <p className="truncate text-xs font-medium text-gray-700">
                              Document {index + 1}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setEditRemovedDocs((prev) => [
                                ...prev,
                                docUrl
                              ])
                            }
                            className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}

              {editNewDocs.length > 0 && (
                <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                  {editNewDocs.map((file, index) => (
                    <div
                      key={index}
                      className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p
                          className="truncate text-xs font-medium text-green-700"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditNewDocs((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                  isUploading
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                )}
              >
                <input
                  ref={editDocsInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf,image/*"
                  onChange={handleEditDocsFileSelect}
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
                      Upload Document(s)
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF/Images (Max 20MB each)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDetailsModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white"
              onClick={submitEditDetails}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Audit Date Modal */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Extend Audit Date</DialogTitle>
            <DialogDescription>
              Extend the audit date for the current audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                New Audit Date (DD-MM-YYYY)
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={inputDate}
                onChange={(date) => setInputDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select new date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                preventOpenOnFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Reason for Extension{' '}
                <span className="font-normal text-black">(Optional)</span>
              </Label>
              <Textarea
                placeholder="Why is the audit date being extended?"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Supporting Document(s){' '}
                <span className="font-normal text-black">(Optional)</span>
              </Label>
              {uploadedFiles.length > 0 && (
                <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p
                          className="truncate text-xs font-medium text-green-700"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                  onChange={(e) => handleFileSelect(e, setUploadedFiles)}
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
                    <Upload className="h-6 w-6 text-black" />
                    <span className="text-sm font-medium text-gray-600">
                      Upload Letter/Evidence
                    </span>
                    <span className="text-xs text-black">
                      PDF/Images (Max 20MB each)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white"
              onClick={submitExtend}
              disabled={isSubmitting || !inputDate || isUploading}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Extension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirm Dialog */}
      <AlertDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this audit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The audit will be marked as
              completed and can no longer be extended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitComplete}
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? 'Completing...' : 'Complete Audit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Log Dialog */}
      <Dialog open={showEditLogModal} onOpenChange={setShowEditLogModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Log</DialogTitle>
            <DialogDescription>{editingLog?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {editingLog && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Audit Date
                  </Label>
                  <DatePicker
                    selected={editLogAuditDate}
                    onChange={(date) => setEditLogAuditDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date..."
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Extended Date
                  </Label>
                  <DatePicker
                    selected={editLogExtendDate}
                    onChange={(date) => setEditLogExtendDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
                    placeholderText="Select date..."
                    showYearDropdown
                    dropdownMode="select"
                    preventOpenOnFocus
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Note</Label>
              <Textarea
                value={editLogNote}
                onChange={(e) => setEditLogNote(e.target.value)}
                rows={3}
                placeholder="Update the log note..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Document(s)
              </Label>
              {editLogFiles.length > 0 && (
                <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                  {editLogFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <p
                          className="truncate text-xs font-medium text-green-700"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditLogFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:bg-gray-100">
                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf,image/*"
                  onChange={(e) => handleFileSelect(e, setEditLogFiles)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-1 text-center">
                  <Upload className="h-6 w-6 text-black" />
                  <span className="text-sm font-medium text-gray-600">
                    Add Document(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditLogModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-theme text-white"
              onClick={submitEditLog}
              disabled={isEditLogSubmitting || isUploading}
            >
              {isEditLogSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="flex h-full items-center justify-center overflow-hidden">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
