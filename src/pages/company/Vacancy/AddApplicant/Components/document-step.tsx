import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // ✅ Added Checkbox import
import {
  Trash2,
  FileText,
  Eye,
  Upload,
  AlertCircle,
  CheckCircle,
  Plus,
  Loader2,
  FileCheck
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { z } from 'zod';
import axiosInstance from '@/lib/axios';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import Select, { SingleValue } from 'react-select';

// ✅ 1. Schema Definition (Updated with niDoc and isBritish)
export const createDocumentSchema = () =>
  z.object({
    isBritish: z.boolean().optional(),
    passport: z.string().optional(),
    dbs: z.string().optional(),
    rightToWork: z.string().optional(),
    immigrationStatus: z.string().optional(),
    proofOfAddress: z.string().optional(),
    niDoc: z.string().optional() // Added niDoc / Driving License
  });

export type DocumentFile = z.infer<ReturnType<typeof createDocumentSchema>>;

// ✅ 2. Props Interface
interface DocumentsStepProps {
  defaultValues?: Partial<DocumentFile>;
  onSaveAndContinue: (data: DocumentFile) => void;
  setCurrentStep: (step: number) => void;
  onSave: (data: DocumentFile) => void;
  saveAndLogout: () => void;
}

// ✅ 3. Dynamic Document Types Configuration
const getDocumentTypes = (isBritish: boolean) => {
  if (isBritish) {
    return [
      { id: 'dbs', label: 'DBS Certificate', required: true },
      { id: 'proofOfAddress', label: 'Proof of Address', required: true },
      { id: 'niDoc', label: 'National Insurance / Driving License', required: true }
    ];
  }

  return [
    { id: 'passport', label: 'Passport', required: true },
    { id: 'dbs', label: 'DBS Certificate', required: true },
    { id: 'rightToWork', label: 'Right to Work', required: true },
    { id: 'immigrationStatus', label: 'Immigration Status', required: true },
    { id: 'proofOfAddress', label: 'Proof of Address', required: true }
  ];
};

interface DocOption {
  value: keyof DocumentFile;
  label: string;
  required: boolean;
}

export function DocumentStep({
  defaultValues,
  onSaveAndContinue,
  setCurrentStep,
  onSave
}: DocumentsStepProps) {
  const documentSchema = createDocumentSchema();

  const [documents, setDocuments] = useState<DocumentFile>({
    isBritish: false,
    passport: '',
    dbs: '',
    rightToWork: '',
    immigrationStatus: '',
    proofOfAddress: '',
    niDoc: ''
  });

  useEffect(() => {
    if (defaultValues) {
      setDocuments({
        isBritish: defaultValues.isBritish ?? false,
        passport: defaultValues.passport ?? '',
        dbs: defaultValues.dbs ?? '',
        rightToWork: defaultValues.rightToWork ?? '',
        immigrationStatus: defaultValues.immigrationStatus ?? '',
        proofOfAddress: defaultValues.proofOfAddress ?? '',
        niDoc: defaultValues.niDoc ?? ''
      });
    }
  }, [defaultValues]);

  const documentsRef = useRef(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { user } = useSelector((state: any) => state.auth);

  const handleRemoveFile = (field: keyof DocumentFile) => {
    setDocuments((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBack = () => setCurrentStep(3);

  const handleSubmit = () => {
    const validationResult = documentSchema.safeParse(documents);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    onSaveAndContinue(validationResult.data);
  };

  const isDocumentUploaded = (field: keyof DocumentFile): boolean => {
    return !!documents[field];
  };

  // Compute required docs based on isBritish status
  const currentDocumentTypes = getDocumentTypes(documents.isBritish || false);

  const allDocumentsUploaded = currentDocumentTypes
    .filter((doc) => doc.required)
    .every((doc) => !!documents[doc.id as keyof DocumentFile]);

  const hasUploadedDocuments = currentDocumentTypes.some((doc) =>
    isDocumentUploaded(doc.id as keyof DocumentFile)
  );

  // --- Dialog & Upload State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocOption, setSelectedDocOption] =
    useState<SingleValue<DocOption> | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadableOptions: DocOption[] = currentDocumentTypes
    .map((doc) => ({
      value: doc.id as keyof DocumentFile,
      label: `${doc.label}${doc.required ? ' *' : ''}`,
      required: doc.required
    }))
    .filter((option) => !isDocumentUploaded(option.value));

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedDocOption(null);
      setFileToUpload(null);
      setIsUploading(false);
      setUploadError(null);
      setUploadedFileUrl(null);
    }
  };

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB.');
      return false;
    }
    return true;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocOption || !user?._id) return;

    if (!validateFile(file)) return;

    setFileToUpload(file);
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('entityId', user._id);
    formData.append('file_type', 'careerDoc');
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const fileUrl = res.data?.data?.fileUrl;
      if (!fileUrl) throw new Error('No file URL returned');

      setUploadedFileUrl(fileUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload document. Please try again.');
      setFileToUpload(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitDocument = () => {
    if (!uploadedFileUrl || !selectedDocOption) return;

    const field = selectedDocOption.value;
    setDocuments((prev) => ({
      ...prev,
      [field]: uploadedFileUrl
    }));

    setTimeout(
      () => onSave({ ...documentsRef.current, [field]: uploadedFileUrl }),
      0
    );

    setUploadedFileUrl(null);
    setFileToUpload(null);
    setSelectedDocOption(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsDialogOpen(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveSelectedFile = () => {
    setFileToUpload(null);
    setUploadedFileUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardHeader className="p-0">
          <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
          <p className="text-md mt-1 text-gray-600">
            Please upload all required documents to complete your application
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-6 lg:flex-row mt-6">
            {/* Left: Upload Area */}
            <div className="lg:flex-1">
              
              {/* ✅ British Applicant Toggle */}
              <div className="mb-6 flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Checkbox
                  id="isBritish"
                  checked={documents.isBritish}
                  onCheckedChange={(checked) => {
                    setDocuments((prev) => ({
                      ...prev,
                      isBritish: checked === true
                    }));
                  }}
                />
                <Label
                  htmlFor="isBritish"
                  className="cursor-pointer text-sm font-semibold text-gray-800"
                >
                  Is the applicant British?
                </Label>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-end gap-4">
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        Add Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Document</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div>
                          <Label
                            htmlFor="docType"
                            className="mb-2 block text-sm font-medium"
                          >
                            Document Type
                          </Label>
                          <Select<DocOption>
                            inputId="docType"
                            value={selectedDocOption}
                            onChange={setSelectedDocOption}
                            options={uploadableOptions}
                            placeholder="Choose document type"
                            isClearable={false}
                            isSearchable={true}
                            className="basic-single"
                            classNamePrefix="select"
                          />
                        </div>

                        {selectedDocOption && (
                          <div>
                            <Label className="mb-2 block text-sm font-medium">
                              Upload File
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
                              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                                isUploading
                                  ? 'border-blue-300 bg-blue-50'
                                  : uploadedFileUrl
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
                              }`}
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
                                  <p className="text-sm font-medium text-gray-900">
                                    Uploading...
                                  </p>
                                </div>
                              ) : uploadedFileUrl ? (
                                <div className="flex flex-col items-center">
                                  <CheckCircle className="mb-2 h-8 w-8 text-green-600" />
                                  <p className="text-sm font-medium text-gray-900">
                                    File Uploaded Successfully!
                                  </p>
                                  <p className="mt-1 max-w-full truncate text-xs text-gray-600">
                                    {fileToUpload?.name}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSelectedFile();
                                    }}
                                    className="mt-2"
                                  >
                                    Choose Different File
                                  </Button>
                                </div>
                              ) : fileToUpload ? (
                                <div className="flex flex-col items-center">
                                  <FileText className="mb-2 h-8 w-8 text-blue-600" />
                                  <p className="text-sm font-medium text-gray-900">
                                    Ready to Upload
                                  </p>
                                  <p className="mt-1 max-w-full truncate text-xs text-gray-600">
                                    {fileToUpload.name}
                                  </p>
                                  <div className="mt-2 flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSelectedFile();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        triggerFileInput();
                                      }}
                                    >
                                      Change File
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                                  <p className="text-sm font-medium text-gray-900">
                                    Click to select file
                                  </p>
                                  <p className="mt-1 text-xs text-gray-600">
                                    Max file size: 5MB
                                  </p>
                                </div>
                              )}
                            </div>

                            {uploadError && (
                              <div className="mt-2 flex items-center rounded bg-red-50 p-2 text-sm text-red-600">
                                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                                {uploadError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitDocument}
                          disabled={!uploadedFileUrl || isUploading}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Submit Document
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 🔽🔽🔽 DYNAMIC UI SECTION 🔽🔽🔽 */}
                <div className="mt-6 space-y-3">
                  {!hasUploadedDocuments && (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
                      <p className="text-sm text-gray-500">
                        No documents uploaded yet.
                      </p>
                      <p className="text-xs text-gray-400">
                        Click "Add Document" to start.
                      </p>
                    </div>
                  )}

                  {currentDocumentTypes.map(({ id, label, required }) => {
                    const fileUrl = documents[id as keyof DocumentFile];
                    if (!fileUrl) return null;

                    return (
                      <div
                        key={id}
                        className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* File Info */}
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                            <FileCheck className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col">
                            <h4 className="font-semibold text-gray-900">
                              {label}
                              {required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </h4>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Button
                            size="sm"
                            onClick={() => window.open(fileUrl as string, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            variant={'destructive'}
                            size="sm"
                            onClick={() =>
                              handleRemoveFile(id as keyof DocumentFile)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 🔼🔼🔼 END DYNAMIC UI SECTION 🔼🔼🔼 */}
              </div>
            </div>

            {/* Right: Progress Sidebar */}
            <div className="lg:w-80">
              <Card className="sticky top-6 border border-gray-200">
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Required Documents
                  </h3>
                  <p className="text-sm text-gray-600">
                    {
                      currentDocumentTypes.filter(
                        (d) =>
                          d.required &&
                          isDocumentUploaded(d.id as keyof DocumentFile)
                      ).length
                    }{' '}
                    of {currentDocumentTypes.filter((d) => d.required).length}{' '}
                    completed
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {currentDocumentTypes
                      .filter((doc) => doc.required)
                      .map(({ id, label }) => {
                        const uploaded = isDocumentUploaded(
                          id as keyof DocumentFile
                        );
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between py-2"
                          >
                            <span className="text-sm text-gray-600">
                              {label}
                            </span>
                            {uploaded ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full justify-center sm:w-auto"
            >
              Back
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!allDocumentsUploaded}
              className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}