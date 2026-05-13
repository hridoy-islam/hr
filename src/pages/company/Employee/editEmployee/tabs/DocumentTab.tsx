import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import ReactSelect from 'react-select';
import {
  Trash2,
  Plus,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pencil,
  Eye,
  Camera,
  X,
  RefreshCw,
  Check
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
import { Badge } from '@/components/ui/badge';
import moment from '@/lib/moment-setup';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- CONSTANTS ---
export const REQUIRED_DOCUMENTS_LIST = [
  'Immigration Status',
  'DBS Certificate',
  'Passport',
  'Right to Work',
  'Proof of Address',
  'Application Form',
  'Curriculum Vitae',
  'Contract of Employment',
  'Confidentiality Agreement',
  'Interview Invitation Letter',
  'Interview Notes / Literacy and Numeracy Assessment',
  'Appointment Letter',
  'Job Description',
  'Induction',
  'GDPR declaration form',
  'Health Declaration / Post employment Medical Questionnaire',
  'Identification Document',
  'DBS Reference',
  'Reference',
  'National Insurance',
  'Bank Account Details',
  'P46 / P45',
  'Ni number/Driving licence'
];

const OPTIONAL_DOCUMENTS_LIST = [
  'Medication Administration Policy – Statement of Understanding',
  'Other Certificates (Training)',
  'Performance Review',
  'Probationary / Investigation Meeting',
  'Work availability',
  'Holiday Leave Form',
  'Pictures',
  'Car Insurance',
  'Device Details',
  'Medical Report for Absent',
  'Incident Report'
];

export const MIN_REFERENCE_COUNT = 2;

// --- Interfaces ---
interface TEmployeeDocument {
  _id: string;
  employeeId: string;
  documentTitle: string;
  documentUrl: string[];
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TComplianceStatus {
  missingDocuments: string[];
  status: string;
}

interface SelectOption {
  label: string;
  value: string;
}

export default function EmployeeDocumentTab() {
  const { eid } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- State ---
  const [documents, setDocuments] = useState<TEmployeeDocument[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<TComplianceStatus | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TEmployeeDocument | null>(null);

  // Form State
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [note, setNote] = useState('');

  // File Upload State - Multiple files
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Image Preview State (Captured but not yet accepted)
  const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!eid) return;
    try {
      setIsLoading(true);
      const [docsRes, statusRes, userRes] = await Promise.all([
        axiosInstance.get(`/employee-documents?limit=all`, {
          params: { employeeId: eid }
        }),
        axiosInstance.get(`/employee-documents/status/${eid}`),
        axiosInstance.get(`/users/${eid}`)
      ]);

      setDocuments(docsRes.data?.data?.result || []);
      setComplianceStatus(statusRes.data?.data || null);
      setUserData(userRes.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eid]);

  // Clean up camera on unmount or dialog close
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

  // --- Computed Options for React Select ---
  const selectOptions = useMemo(() => {
    const uploadedTitles = documents.map((d) => d.documentTitle.trim());

    const referenceCount = uploadedTitles.filter((t) => t === 'Reference').length;

    let dynamicRequiredList = [...REQUIRED_DOCUMENTS_LIST];

    if (userData?.noRtwCheck) {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => !["Immigration Status", "Right to Work", "Passport", "Ni number/Driving licence"].includes(req)
      );
    } else if (userData?.isBritish) {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
      );
    } else {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => req !== "Ni number/Driving licence"
      );
    }

    const filterUploaded = (list: string[]) => {
      return list
        .filter((title) => {
          if (title === 'Reference') {
            return referenceCount < MIN_REFERENCE_COUNT;
          }
          return !uploadedTitles.includes(title);
        })
        .map((title) => ({ label: title, value: title }));
    };

    const requiredOpts = filterUploaded(dynamicRequiredList);
    const optionalOpts = filterUploaded(OPTIONAL_DOCUMENTS_LIST);

    return [
      {
        label: 'Required Documents (Missing)',
        options: requiredOpts
      },
      {
        label: 'Optional Documents',
        options: optionalOpts
      },
      {
        label: 'Custom',
        options: [{ label: '+ Other (Type Manually)', value: 'Other' }]
      }
    ];
  }, [documents, userData]);

  // --- Helpers ---
  const clearCaptureState = () => {
    setCapturedImageFile(null);
    if (capturedImagePreview) URL.revokeObjectURL(capturedImagePreview);
    setCapturedImagePreview(null);
  };

  // --- Camera Handlers ---
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
      console.error("Camera access denied:", err);
      setUploadError("Camera access denied. Please check your browser permissions.");
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

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedImageFile(file);
          setCapturedImagePreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
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

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingDoc(null);
    setSelectedOption(null);
    setCustomDocTitle('');
    setNote('');
    setUploadedDocUrls([]);
    setFilesToUpload([]);
    setUploadError(null);
    setUploadProgress(0);
    stopCamera();
    clearCaptureState();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (doc: TEmployeeDocument) => {
    setEditingDoc(doc);
    const isStandard = [...REQUIRED_DOCUMENTS_LIST, ...OPTIONAL_DOCUMENTS_LIST].includes(doc.documentTitle);

    if (isStandard) {
      setSelectedOption({ label: doc.documentTitle, value: doc.documentTitle });
      setCustomDocTitle('');
    } else {
      setSelectedOption({ label: '+ Other (Type Manually)', value: 'Other' });
      setCustomDocTitle(doc.documentTitle);
    }

    setNote(doc.note || '');
    setUploadedDocUrls(doc.documentUrl || []);
    setFilesToUpload([]);
    setUploadError(null);
    setUploadProgress(0);
    stopCamera();
    clearCaptureState();
    setIsDialogOpen(true);
  };

  const uploadMultipleFiles = async (files: File[]) => {
    if (!eid) return;

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError(`File(s) exceed 20MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const newUrls: string[] = [...uploadedDocUrls];
    const newFiles: File[] = [...filesToUpload];

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('entityId', eid);
        formData.append('file_type', 'employeeDoc');
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

  const removeUploadedFile = (index: number) => {
    setUploadedDocUrls(prev => prev.filter((_, i) => i !== index));
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = selectedOption?.value;
    if (finalTitle === 'Other') {
      finalTitle = customDocTitle;
    }

    if (!eid || uploadedDocUrls.length === 0 || !finalTitle) {
      setUploadError('Please complete all fields and upload at least one file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: eid,
        documentTitle: finalTitle,
        documentUrl: uploadedDocUrls,
        note: note.trim() || undefined
      };

      if (editingDoc) {
        await axiosInstance.patch(`/employee-documents/${editingDoc._id}`, payload);
      } else {
        await axiosInstance.post('/employee-documents', payload);
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

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axiosInstance.delete(`/employee-documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      fetchData();
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#e5e7eb',
      boxShadow: 'none',
      '&:hover': { borderColor: '#a1a1aa' },
      padding: '2px',
      fontSize: '0.875rem',
      borderRadius: '0.375rem'
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#1f2937'
    }),
    groupHeading: (base: any) => ({
      ...base,
      fontSize: '0.75rem',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    })
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Actions */}
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

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </DialogTitle>
              <DialogDescription>
                Select the document type and attach the corresponding file(s).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label>
                  Document Title <span className="text-red-500">*</span>
                </Label>
                <ReactSelect
                  options={selectOptions}
                  value={selectedOption}
                  onChange={setSelectedOption}
                  placeholder="Search or Select Document..."
                  styles={customSelectStyles}
                />
                {selectedOption?.value === 'Other' && (
                  <div className="mt-2 duration-200 animate-in fade-in zoom-in-95">
                    <Input
                      placeholder="Type custom document name..."
                      value={customDocTitle}
                      onChange={(e) => setCustomDocTitle(e.target.value)}
                      className="bg-gray-50"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Note Field */}
              <div className="space-y-2">
                <Label htmlFor="doc-note">
                  Note{' '}
                  <span className="text-xs font-normal text-gray-400">(Optional)</span>
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
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={isUploading || isCameraOpen || !!capturedImagePreview}
                />

                {/* --- CAMERA / PREVIEW / DRAG & DROP AREA --- */}
                {isCameraOpen ? (
                  // State 1: Camera is ON
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-black text-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-auto max-h-[350px] object-cover"
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
                        className="bg-white text-black hover:bg-gray-200 font-semibold"
                        size="sm"
                        onClick={capturePhoto}
                      >
                        <Camera className="mr-2 h-4 w-4" /> Capture
                      </Button>
                    </div>
                  </div>
                ) : capturedImagePreview ? (
                  // State 2: Photo captured, awaiting approval
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-900 p-2 text-center shadow-inner">
                    <img
                      src={capturedImagePreview}
                      alt="Captured Preview"
                      className="w-full h-auto max-h-[350px] rounded-md object-contain"
                    />
                    <div className="absolute bottom-4 flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={retakePhoto}
                        className="bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake
                      </Button>
                      <Button
                        type="button"
                        className="bg-theme text-white hover:bg-theme/90 shadow-md"
                        size="sm"
                        onClick={acceptPhoto}
                      >
                        <Check className="mr-2 h-4 w-4" /> Accept & Upload
                      </Button>
                    </div>
                  </div>
                ) : (
                  // State 3: Default Upload View
                  <div className="space-y-3">
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors
                        ${
                          isUploading
                            ? 'cursor-wait border-blue-300 bg-blue-50'
                            : uploadedDocUrls.length > 0
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                        }`}
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
                            {uploadedDocUrls.length} file(s) ready
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

                    {/* Show list of uploaded files */}
                    {uploadedDocUrls.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Uploaded Files ({uploadedDocUrls.length})
                        </Label>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {filesToUpload.map((file, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                <span className="truncate">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeUploadedFile(index)}
                                className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {/* Show existing URLs with actual file names */}
                          {editingDoc && uploadedDocUrls.slice(filesToUpload.length).map((url, index) => {
                            const fileName = url.split('/').pop() || `Existing file ${index + 1}`;
                            
                            return (
                              <div key={`existing-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                  <span className="truncate" title={fileName}>{fileName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedFile(filesToUpload.length + index)}
                                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
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

              <DialogFooter className='flex gap-2'>
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
                  disabled={isSubmitting || uploadedDocUrls.length === 0 || !selectedOption}
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

      {/* 2. Status Section */}
      {!isLoading && complianceStatus && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4">
            {complianceStatus.missingDocuments.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-md bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <h5 className="text-sm font-medium text-red-900">
                      Action Required
                    </h5>
                    <p className="text-sm text-red-700">
                      This employee is missing{' '}
                      <span className="font-bold">
                        {complianceStatus.missingDocuments.length}
                      </span>{' '}
                      mandatory document(s).
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {complianceStatus.missingDocuments.map((doc, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-red-200 bg-white font-normal text-red-700"
                    >
                      Missing: {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h5 className="text-sm font-medium text-green-900">
                    Fully Compliant
                  </h5>
                  <p className="text-sm text-green-700">
                    All mandatory documents have been uploaded successfully.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Documents Table */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-50 p-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No documents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload documents to ensure compliance.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[35%] font-semibold text-gray-900">
                  Document Title
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  Note
                </TableHead>
                <TableHead className="w-[15%] font-semibold text-gray-900">
                  Uploaded At
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
                    <TableCell className="text-sm text-gray-500">
                      {doc.note ? (
                        <span className="line-clamp-2">{doc.note}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {doc.createdAt
                        ? moment(doc.createdAt).format('DD MMM, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View button - shows Document or Document 1, Document 2, etc. */}
                        {doc.documentUrl && doc.documentUrl.length > 0 && (
                          doc.documentUrl.length === 1 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.documentUrl[0], '_blank')}
                              title="View Document"
                              className="text-xs"
                            >
                              Document
                            </Button>
                          ) : (
                            doc.documentUrl.map((url, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                                title={`View Document ${idx + 1}`}
                                className="text-xs"
                              >
                                Document {idx + 1}
                              </Button>
                            ))
                          )
                        )}
                        <Button
                          size="icon"
                          onClick={() => handleOpenEdit(doc)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => handleDelete(doc._id)}
                          title="Delete"
                          variant={'destructive'}
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
    </div>
  );
}