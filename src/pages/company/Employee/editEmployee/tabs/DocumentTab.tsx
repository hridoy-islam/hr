import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import {
  Trash2,
  Plus,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pencil,
  Eye // Imported Eye icon for View
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
import moment from 'moment';

// --- Types based on your Employee Document Schema ---
interface TEmployeeDocument {
  _id: string;
  employeeId: string;
  documentTitle: string;
  documentUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmployeeDocumentTab() {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [documents, setDocuments] = useState<TEmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States (Only for Create/Edit now)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Removed viewingDoc state

  // Edit State
  const [editingDoc, setEditingDoc] = useState<TEmployeeDocument | null>(null);

  // Form States
  const [documentTitle, setDocumentTitle] = useState('');

  // File Upload States
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetch Documents ---
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/employee-documents?limit=all`, {
          params: { employeeId: id }
        });
        setDocuments(res.data?.data?.result || []);
      } catch (error) {
        console.error('Failed to fetch documents', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [id]);

  // --- File Validation Helper ---
  const validateFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return false;
    }
    return true;
  };

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setDocumentTitle('');
    setUploadedDocUrl(null);
    setFileToUpload(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (doc: TEmployeeDocument) => {
    setEditingDoc(doc);
    setDocumentTitle(doc.documentTitle);
    setUploadedDocUrl(doc.documentUrl);
    setFileToUpload(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!validateFile(file)) return;

    setFileToUpload(file);
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('entityId', id);
    formData.append('file_type', 'employeeDoc');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const url = res.data?.data?.fileUrl;

      if (!url) throw new Error('No file URL returned from server');

      setUploadedDocUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
      setFileToUpload(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelectedFile = () => {
    setFileToUpload(null);
    setUploadedDocUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  // Handle Final Form Submission (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !uploadedDocUrl || !documentTitle) {
      setUploadError('Please complete all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: id,
        documentTitle: documentTitle,
        documentUrl: uploadedDocUrl
      };

      if (editingDoc) {
        // --- UPDATE ---
        const res = await axiosInstance.patch(
          `/employee-documents/${editingDoc._id}`,
          payload
        );
        const updatedDoc = res.data?.data;

        setDocuments((prev) =>
          prev.map((d) => (d._id === editingDoc._id ? updatedDoc : d))
        );
      } else {
        // --- CREATE ---
        const res = await axiosInstance.post('/employee-documents', payload);
        const newDoc = res.data?.data;
        if (newDoc) {
          setDocuments((prev) => [newDoc, ...prev]);
        }
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save document:', error);
      setUploadError('Failed to save document details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axiosInstance.delete(`/employee-documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  // New handler to open document in new tab
  const handleViewDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full space-y-6 bg-transparent px-0 shadow-none">
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Employee Documents
          </h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenCreate}
              className="bg-theme text-white shadow-sm hover:bg-theme/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          {/* Create/Edit Dialog */}
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </DialogTitle>
              <DialogDescription>
                {editingDoc
                  ? 'Update document details below.'
                  : 'Fill in details and upload a file.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Document Title Input */}
              <div className="space-y-2">
                <Label htmlFor="documentTitle">
                  Document Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="documentTitle"
                  placeholder="e.g. Contract, ID Proof"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  required
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium">
                  File Attachment <span className="text-red-500">*</span>
                </Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />

                <div
                  onClick={triggerFileInput}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all
                    ${
                      isUploading
                        ? 'cursor-wait border-blue-300 bg-blue-50'
                        : uploadedDocUrl
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mb-2 h-10 w-10 animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">
                        Uploading...
                      </p>
                    </>
                  ) : uploadedDocUrl ? (
                    <>
                      <CheckCircle className="mb-2 h-10 w-10 text-green-500" />
                      <p className="text-sm font-medium text-green-700">
                        File Attached
                      </p>
                      <p className="mt-1 max-w-[200px] truncate text-xs text-green-600">
                        {fileToUpload?.name || 'Existing File'}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelectedFile();
                        }}
                        className="mt-3 h-8 text-xs text-green-700 hover:bg-green-100 hover:text-green-800"
                      >
                        Change File
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Supported formats: PDF, DOCX, JPG, PNG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-theme hover:bg-theme/90"
                  disabled={isSubmitting || !uploadedDocUrl || !documentTitle}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingDoc ? (
                    'Update Document'
                  ) : (
                    'Save Document'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- Documents List --- */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50">
            <FileText className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md bg-white p-4 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Document Title</TableHead>
                  <TableHead className="w-[25%]">Uploaded At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc._id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-theme" />
                        {doc.documentTitle}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {doc.createdAt
                        ? moment(doc.createdAt).format('DD MMM, YYYY')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* View Button */}
                        <Button
                          size="icon"
                          onClick={() => handleViewDocument(doc.documentUrl)}
                          className="h-8 w-8"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          size="icon"
                          onClick={() => handleOpenEdit(doc)}
                          className="h-8 w-8"
                          title="Edit Document"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(doc._id)}
                          className="h-8 w-8"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {/* Removed the View Modal from here */}
    </div>
  );
}