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
  Camera,
  X,
  RefreshCw,
  Check,
  Download
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import moment from '@/lib/moment-setup';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';

interface TDocument {
  _id: string;
  serviceUserId: string;
  documentTitle: string;
  documentUrl: string[];
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ServiceUserDocumentTab() {
  const { sid } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [documents, setDocuments] = useState<TDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TDocument | null>(null);

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Shadcn Delete Alert States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [documentTitle, setDocumentTitle] = useState('');
  const [note, setNote] = useState('');

  // Drag overlay state
  const [isDragging, setIsDragging] = useState(false);

  // filesToUpload maps 1:1 with the dynamic changes made during this upload session
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<
    string | null
  >(null);
 const {toast} = useToast();
  const fetchData = async () => {
    if (!sid) return;
    try {
      setIsLoading(true);
      const docsRes = await axiosInstance.get(
        `/serviceuser-documents?limit=all`,
        {
          params: { serviceUserId: sid }
        }
      );
      setDocuments(docsRes.data?.data?.result || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sid]);

  useEffect(() => {
    if (!isDialogOpen) {
      stopCamera();
      clearCaptureState();
    }
    return () => {
      stopCamera();
      if (capturedImagePreview) URL.revokeObjectURL(capturedImagePreview);
    };
  }, [isDialogOpen]);

  const clearCaptureState = () => {
    setCapturedImageFile(null);
    if (capturedImagePreview) URL.revokeObjectURL(capturedImagePreview);
    setCapturedImagePreview(null);
  };

  const startCamera = async () => {
    clearCaptureState();
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      setUploadError(
        'Camera access denied. Please check your browser permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });
            setCapturedImageFile(file);
            setCapturedImagePreview(URL.createObjectURL(blob));
            stopCamera();
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  const retakePhoto = () => {
    clearCaptureState();
    startCamera();
  };

  const acceptPhoto = () => {
    if (capturedImageFile) {
      uploadMultipleFiles([capturedImageFile]);
      clearCaptureState();
    }
  };

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setDocumentTitle('');
    setNote('');
    setUploadedDocUrls([]);
    setFilesToUpload([]);
    setUploadError(null);
    setUploadProgress(0);
    stopCamera();
    clearCaptureState();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (doc: TDocument) => {
    setEditingDoc(doc);
    setDocumentTitle(doc.documentTitle || '');
    setNote(doc.note || '');
    setUploadedDocUrls(doc.documentUrl || []);
    setFilesToUpload([]);
    setUploadError(null);
    setUploadProgress(0);
    stopCamera();
    clearCaptureState();
    setIsDialogOpen(true);
  };

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewDialogOpen(true);
  };

  const handleForceDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      let fileName = url.split('/').pop() || 'document_download';
      fileName = fileName.split('?')[0];

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        'Blob fetch failed, falling back to direct anchor download',
        error
      );
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.setAttribute('download', '');
      fallbackLink.setAttribute('target', '_blank');
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    const lowerUrl = previewUrl.toLowerCase();
    const isImage = lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/) != null;
    const isPdf = lowerUrl.match(/\.(pdf)(\?.*)?$/) != null;
    const isWord = lowerUrl.match(/\.(docx|doc)(\?.*)?$/) != null;
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
    if (isWord) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
      return (
        <iframe
          src={officeViewerUrl}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="Word Document Preview"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileText className="mb-4 h-16 w-16 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Preview not available
        </h3>
        <p className="mb-6 mt-2 text-sm ">
          This file format cannot be safely previewed in the browser.
        </p>
        <Button
          onClick={() => handleForceDownload(previewUrl)}
          className="bg-theme hover:bg-theme/90"
          type="button"
        >
          <Download className="mr-2 h-4 w-4" /> Download to View
        </Button>
      </div>
    );
  };

  const uploadMultipleFiles = async (files: File[]) => {
    if (!sid) return;

    const oversizedFiles = files.filter((file) => file.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError(
        `File(s) exceed 20MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const newUrls: string[] = [...uploadedDocUrls];
    const newFiles: File[] = [...filesToUpload];

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('entityId', sid);
        formData.append('file_type', 'serviceUserDoc');
        formData.append('file', files[i]);

        setUploadProgress(((i + 1) / files.length) * 100);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const url = res.data?.data?.fileUrl;
        if (!url) throw new Error(`No file URL returned for ${files[i].name}`);
        newUrls.push(url);
        newFiles.push(files[i]);
      }

      setUploadedDocUrls(newUrls);
      setFilesToUpload(newFiles);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload one or more files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadMultipleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadMultipleFiles(files);
    }
  };

  const removeUploadedFile = (urlIndexToRemove: number) => {
    setUploadedDocUrls((prevUrls) =>
      prevUrls.filter((_, i) => i !== urlIndexToRemove)
    );
    setFilesToUpload([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sid || uploadedDocUrls.length === 0 || !documentTitle.trim()) {
      setUploadError(
        'Please complete all fields and upload at least one file.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceUserId: sid,
        documentTitle: documentTitle.trim(),
        documentUrl: uploadedDocUrls,
        note: note.trim() || undefined
      };

      if (editingDoc) {
        await axiosInstance.patch(
          `/serviceuser-documents/${editingDoc._id}`,
          payload
        );
      } else {
        await axiosInstance.post('/serviceuser-documents', payload);
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save document:', error);
      setUploadError('Failed to save document details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = (docId: string) => {
    setDocToDelete(docId);
    setIsDeleteOpen(true);
  };

const confirmDelete = async () => {
  if (!docToDelete) return;
  try {
    setIsDeleting(true);
    await axiosInstance.delete(`/serviceuser-documents/${docToDelete}`);
    setDocuments((prev) => prev.filter((d) => d._id !== docToDelete));
    setIsDeleteOpen(false);

    // Success Toast
    toast({
      title: "Document deleted",
      description: "The document has been successfully removed.",
    });

  } catch (error) {
    console.error('Delete failed', error);
    
    // Error Toast
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: "There was a problem deleting your document. Please try again.",
    });
    
  } finally {
    setIsDeleting(false);
    setDocToDelete(null);
  }
};
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Documents
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

          <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </DialogTitle>
              <DialogDescription>
                Provide a title and attach the corresponding file(s).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">
                  Document Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="doc-title"
                  placeholder="e.g. Care Plan, Medical Record..."
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="bg-gray-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-note">
                  Note{' '}
                  <span className="text-xs font-normal text-gray-400">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="doc-note"
                  placeholder="Add any relevant notes about this document..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none bg-gray-50 text-sm"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    File Attachment <span className="text-red-500">*</span>
                  </Label>
                  {!isCameraOpen && !capturedImagePreview && !isUploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="text-xs font-medium"
                    >
                      <Camera className="mr-2 h-3.5 w-3.5" /> Take Photo
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  disabled={
                    isUploading || isCameraOpen || !!capturedImagePreview
                  }
                />

                {isCameraOpen ? (
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-black text-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="h-auto max-h-[350px] w-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-4 flex gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={stopCamera}
                      >
                        <X className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        className="bg-white font-semibold text-black hover:bg-gray-200"
                        size="sm"
                        onClick={capturePhoto}
                      >
                        <Camera className="mr-2 h-4 w-4" /> Capture
                      </Button>
                    </div>
                  </div>
                ) : capturedImagePreview ? (
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-900 p-2 text-center shadow-inner">
                    <img
                      src={capturedImagePreview}
                      alt="Captured Preview"
                      className="h-auto max-h-[350px] w-full rounded-md object-contain"
                    />
                    <div className="absolute bottom-4 flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={retakePhoto}
                        className="bg-white/90 text-gray-900 backdrop-blur-sm hover:bg-white"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake
                      </Button>
                      <Button
                        type="button"
                        className="bg-theme text-white shadow-md hover:bg-theme/90"
                        size="sm"
                        onClick={acceptPhoto}
                      >
                        <Check className="mr-2 h-4 w-4" /> Accept & Upload
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() =>
                        !isUploading && fileInputRef.current?.click()
                      }
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-2 text-center transition-colors
                        ${isUploading ? 'cursor-wait border-blue-300 bg-blue-50' : ''}
                        ${!isUploading && isDragging ? 'scale-[1.01] border-theme bg-theme/5' : ''}
                        ${!isUploading && !isDragging && uploadedDocUrls.length > 0 ? 'border-emerald-300 bg-emerald-50' : ''}
                        ${!isUploading && !isDragging && uploadedDocUrls.length === 0 ? 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100' : ''}
                      `}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          <p className="text-sm font-medium text-blue-700">
                            Uploading... {Math.round(uploadProgress)}%
                          </p>
                        </div>
                      ) : uploadedDocUrls.length > 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="h-8 w-8 text-emerald-500" />
                          <p className="text-sm font-medium text-emerald-700">
                            {uploadedDocUrls.length} file(s) loaded
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedDocUrls([]);
                              setFilesToUpload([]);
                            }}
                            className="mt-1 text-xs font-semibold text-emerald-800 hover:underline"
                          >
                            Remove all files
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-white p-2 shadow-sm">
                            <Upload className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-theme">
                              Click to upload
                            </span>{' '}
                            or drag and drop
                          </div>
                          <p className="text-xs text-gray-400">
                            PDF, DOCX, JPG (Max 20MB each)
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadedDocUrls.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Uploaded Files ({uploadedDocUrls.length})
                        </Label>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {uploadedDocUrls.map((url, index) => {
                            const fileName =
                              url.split('/').pop()?.split('?')[0] ||
                              `Document-Attachment-${index + 1}`;
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs shadow-sm"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                                  <span
                                    className="truncate font-medium text-gray-700"
                                    title={fileName}
                                  >
                                    {fileName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedFile(index)}
                                  className="ml-2 flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full text-xs"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add More Files
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> {uploadError}
                  </p>
                )}
              </div>

              <DialogFooter className="flex gap-2">
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
                  disabled={
                    isSubmitting ||
                    uploadedDocUrls.length === 0 ||
                    !documentTitle.trim()
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Save Document'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-50 p-4">
              <FileText className="h-8 w-8 text-gray-800" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No documents
            </h3>
            <p className="mt-1 text-sm ">
              Upload documents related to this service user.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[25%] font-semibold text-gray-900">
                  Document Title
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  Note
                </TableHead>
                <TableHead className="w-[15%] font-semibold text-gray-900">
                  Uploaded At
                </TableHead>
                <TableHead className="w-[35%]  font-semibold text-gray-900 text-right">
                  Documents
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                return (
                  <TableRow key={doc._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {doc.documentTitle}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm ">
                      {doc.note ? (
                        <span className="line-clamp-2">{doc.note}</span>
                      ) : (
                        <span className="">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm ">
                      {doc.createdAt
                        ? moment(doc.createdAt).format('DD MMM, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-row items-center justify-end gap-2">
                        <div className="flex flex-col items-end gap-2 ">
                          {doc.documentUrl &&
                            doc.documentUrl.length > 0 &&
                            doc.documentUrl.map((url, idx) => {
                              let fileName =
                                url.split('/').pop()?.split('?')[0] ||
                                `Document ${idx + 1}`;
                              fileName = fileName.replace(/^\d+-/, '');
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleViewDocument(url)}
                                  title={`View ${fileName}`}
                                  className=" text-xs text-theme  hover:underline"
                                >
                                  <span className="truncate">{fileName}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(doc)}
                          title="Edit"
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          onClick={() => initiateDelete(doc._id)}
                          title="Delete"
                          variant="destructive"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Preview Document Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <div className="z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Document Preview
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-sm truncate text-xs ">
                {previewUrl?.split('/').pop()?.split('?')[0] ||
                  'Unknown Document'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => previewUrl && handleForceDownload(previewUrl)}
                className="bg-theme text-white shadow-sm hover:bg-theme/90"
                size="sm"
                type="button"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button
                size="sm"
                variant={'outline'}
                onClick={() => setIsPreviewDialogOpen(false)}
                type="button"
              >
                Close
              </Button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-auto bg-gray-100 p-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shadcn UI Confirmation AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document record from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Stop standard dismiss to await async deletion cleanly
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}