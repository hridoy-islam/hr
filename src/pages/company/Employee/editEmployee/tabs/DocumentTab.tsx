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
  FileWarning
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
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
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
  'DBS Reference', // Included
  'Reference', // Included (Requires 2 uploads)
  'National Insurance',
  'Bank Account Details',
  'P46 / P45'
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
  documentUrl: string;
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

  // --- State ---
  const [documents, setDocuments] = useState<TEmployeeDocument[]>([]);
  const [complianceStatus, setComplianceStatus] =
    useState<TComplianceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TEmployeeDocument | null>(null);

  // Form State
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    null
  );
  const [customDocTitle, setCustomDocTitle] = useState('');

  // File Upload State
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!eid) return;
    try {
      setIsLoading(true);
      const [docsRes, statusRes] = await Promise.all([
        axiosInstance.get(`/employee-documents?limit=all`, {
          params: { employeeId: eid }
        }),
        axiosInstance.get(`/employee-documents/status/${eid}`)
      ]);

      setDocuments(docsRes.data?.data?.result || []);
      setComplianceStatus(statusRes.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eid]);

  // --- Computed Options for React Select ---
  const selectOptions = useMemo(() => {
    const uploadedTitles = documents.map((d) => d.documentTitle.trim());

    // Count specifically for "Reference" (Employment Reference)
    const referenceCount = uploadedTitles.filter(
      (t) => t === 'Reference'
    ).length;

    const filterUploaded = (list: string[]) => {
      return list
        .filter((title) => {
          // Special Case: "Reference" allows up to MIN_REFERENCE_COUNT (2)
          if (title === 'Reference') {
            return referenceCount < MIN_REFERENCE_COUNT;
          }

          // Standard Case: "DBS Reference" and others hide if uploaded once
          return !uploadedTitles.includes(title);
        })
        .map((title) => ({ label: title, value: title }));
    };

    const requiredOpts = filterUploaded(REQUIRED_DOCUMENTS_LIST);
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
  }, [documents]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingDoc(null);
    setSelectedOption(null);
    setCustomDocTitle('');
    setUploadedDocUrl(null);
    setFileToUpload(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (doc: TEmployeeDocument) => {
    setEditingDoc(doc);

    // Check if doc title is in our known lists
    const isStandard = [
      ...REQUIRED_DOCUMENTS_LIST,
      ...OPTIONAL_DOCUMENTS_LIST
    ].includes(doc.documentTitle);

    if (isStandard) {
      setSelectedOption({ label: doc.documentTitle, value: doc.documentTitle });
      setCustomDocTitle('');
    } else {
      setSelectedOption({ label: '+ Other (Type Manually)', value: 'Other' });
      setCustomDocTitle(doc.documentTitle);
    }

    setUploadedDocUrl(doc.documentUrl);
    setFileToUpload(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eid) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    setFileToUpload(file);
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('entityId', eid);
    formData.append('file_type', 'employeeDoc');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.fileUrl;
      if (!url) throw new Error('No file URL returned');
      setUploadedDocUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
      setFileToUpload(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = selectedOption?.value;
    if (finalTitle === 'Other') {
      finalTitle = customDocTitle;
    }

    if (!eid || !uploadedDocUrl || !finalTitle) {
      setUploadError('Please complete all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: eid,
        documentTitle: finalTitle,
        documentUrl: uploadedDocUrl
      };

      if (editingDoc) {
        await axiosInstance.patch(
          `/employee-documents/${editingDoc._id}`,
          payload
        );
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

  // React Select Styles
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#e5e7eb',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a1a1aa'
      },
      padding: '2px',
      fontSize: '0.875rem',
      borderRadius: '0.375rem'
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected
        ? '#0f172a'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
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

          <DialogContent className="max-h-[90vh] overflow-visible sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </DialogTitle>
              <DialogDescription>
                Select the document type and attach the corresponding file.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {/* React Select */}
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

                {/* Custom Input for 'Other' */}
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

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>
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
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors
                    ${
                      isUploading
                        ? 'cursor-wait border-blue-300 bg-blue-50'
                        : uploadedDocUrl
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">
                        Uploading...
                      </p>
                    </div>
                  ) : uploadedDocUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <p className="text-sm font-medium text-emerald-700">
                        File Ready
                      </p>
                      <p className="max-w-[200px] truncate text-xs text-emerald-600">
                        {fileToUpload?.name || 'Existing File'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedDocUrl(null);
                          setFileToUpload(null);
                        }}
                        className="mt-1 text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        Remove & Replace
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
                        PDF, DOCX, JPG (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> {uploadError}
                  </p>
                )}
              </div>

              <DialogFooter>
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
                  disabled={isSubmitting || !uploadedDocUrl || !selectedOption}
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
      <div className="overflow-hidden ">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
           <BlinkingDots  size="large" color="bg-theme" />
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
                <TableHead className="w-[40%] font-semibold text-gray-900">
                  Document Title
                </TableHead>
                {/* <TableHead className="w-[20%] font-semibold text-gray-900">
                  Type
                </TableHead> */}
                <TableHead className="w-[20%] font-semibold text-gray-900">
                  Uploaded At
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const isRequired = REQUIRED_DOCUMENTS_LIST.includes(
                  doc.documentTitle
                );
                return (
                  <TableRow key={doc._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {doc.documentTitle}
                        </span>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      {isRequired ? (
                        <Badge className="bg-gray-900 text-white hover:bg-gray-800">
                          Required
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-gray-300 text-gray-500"
                        >
                          Optional
                        </Badge>
                      )}
                    </TableCell> */}
                    <TableCell className="text-sm text-gray-500">
                      {doc.createdAt
                        ? moment(doc.createdAt).format('DD MMM, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          onClick={() => window.open(doc.documentUrl, '_blank')}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
