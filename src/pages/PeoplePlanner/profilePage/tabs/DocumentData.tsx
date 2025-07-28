import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  FileText,
  ExternalLink,
  Upload,
  CheckCircle
} from 'lucide-react';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { ImageUploader } from '../components/document-uploader';
import Loader from '@/components/shared/loader';

// Zod validation schema
export const documentSchema = z.object({
  // image: z.string().min(1, { message: 'Photo ID is required' }),
  photoId: z.string().optional(),
  passport: z.array(z.string()).nonempty({
    message: 'Passport is required'
  }),
  bankStatement: z.array(z.string()).nonempty({
    message: 'Bank Statement is required'
  }),
  qualification: z.array(z.string()).optional(),
  workExperience: z.array(z.string()).optional(),
  personalStatement: z.array(z.string()).optional()
});

export type DocumentFile = z.infer<typeof documentSchema>;

interface DocumentDataProps {
  userData: DocumentFile;
  isEditing?: boolean;
  onSave: (documents: DocumentFile) => void;
  onCancel: () => void;
  onEdit: () => void;
  loading: any;
}

export default function DocumentData({
  userData,
  isEditing = false,
  onSave,
  onCancel,
  onEdit,
  loading
}: DocumentDataProps) {
  const [documents, setDocuments] = useState<DocumentFile>(userData);
  const [uploadState, setUploadState] = useState<{
    isOpen: boolean;
    field: keyof Omit<DocumentFile, 'photoId'> | 'photoId' | null;
  }>({
    isOpen: false,
    field: null
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { user } = useSelector((state: any) => state.auth);

  const handleRemoveFile = (field: keyof DocumentFile, fileName: string) => {
    if (field === 'photoId') {
      setDocuments((prev) => ({
        ...prev,
        photoId: ''
      }));
    } else {
      setDocuments((prev) => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((file) => file !== fileName)
      }));
    }
  };

  const hasChanges = () => {
    return JSON.stringify(userData) !== JSON.stringify(documents);
  };

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
    onSave(documents);
  };

  const renderUploadedFiles = (field: keyof DocumentFile) => {
    if (field === 'photoId') {
      const fileUrl = documents.photoId;
      if (fileUrl) {
        const fileName = decodeURIComponent(
          fileUrl.split('/').pop() || 'Photo-ID'
        );
        return (
          <div className="mt-3 space-y-2 ">
            <div className="flex w-auto items-center justify-between overflow-hidden rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex min-w-0 flex-1 gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm font-medium text-gray-900 transition-colors hover:text-watney/90"
                  >
                    <Button className="flex flex-row items-center gap-4 bg-supperagent text-white hover:bg-supperagent/90">
                      View <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </Button>
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(field, fileUrl)}
                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }
      return null;
    }

    const value = documents[field];
    if (Array.isArray(value) && value.length > 0) {
      return (
        <div className="mt-3 space-y-2">
          {value.map((fileUrl, index) => {
            const fileName = decodeURIComponent(
              fileUrl.split('/').pop() || `File-${index}`
            );
            return (
              <div
                key={`${fileUrl}-${index}`}
                className="flex w-auto items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-900 transition-colors hover:text-watney/90"
                    >
                      <Button className="flex flex-row items-center gap-4 bg-supperagent text-white hover:bg-supperagent/90">
                        View <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </Button>
                    </a>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(field, fileUrl)}
                  className="h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const openImageUploader = (field: keyof DocumentFile) => {
    setUploadState({ isOpen: true, field });
  };

  const handleUploadComplete = (uploadResponse: any) => {
    const { field } = uploadState;
    if (!field || !uploadResponse?.success || !uploadResponse.data?.fileUrl) {
      setUploadState({ isOpen: false, field: null });
      return;
    }
    const fileUrl = uploadResponse.data.fileUrl;
    if (field === 'photoId') {
      setDocuments((prev) => ({
        ...prev,
        photoId: fileUrl
      }));
    } else {
      setDocuments((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), fileUrl]
      }));
    }
    setUploadState({ isOpen: false, field: null });
  };

  const documentTypes = [
    // {
    //   id: 'image',
    //   label: 'Photo ID',
    //   required: true,
    //   instructions:
    //     "Upload a clear copy of any valid photo ID (e.g., passport, driver's license)",
    //   formats: 'PDF, JPG, PNG',
    //   error: validationErrors.image,
    //   icon: FileText
    // },
    {
      id: 'passport',
      label: 'Passport',
      required: true,
      instructions: 'Upload a clear copy of your passport',
      formats: 'PDF, JPG, PNG',
      error: validationErrors.passport,
      icon: FileText
    },
    {
      id: 'bankStatement',
      label: 'Bank Statement',
      required: true,
      instructions: 'Upload recent bank statement showing your address',
      formats: 'PDF, JPG, PNG',
      error: validationErrors.bankStatement,
      icon: FileText
    },

    {
      id: 'workExperience',
      label: 'Work Experience Documents',
      required: false,
      instructions: 'Upload relevant work experience documents',
      formats: 'PDF, JPG, PNG',
      icon: FileText,
      uploadLabel: 'You can upload multiple files'
    },
    {
      id: 'personalStatement',
      label: 'Personal Statement',
      required: false,
      instructions: 'Upload your personal statement',
      formats: 'PDF, DOCX, JPG, PNG',
      icon: FileText
    }
  ];

  return (
    <div className="">
      <Card className="border-0 shadow-none">
        <CardHeader className="">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document</h2>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
         
          {loading ? (
            <Loader />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 ">
                {documentTypes.map(
                  ({
                    id,
                    label,
                    required,
                    instructions,
                    formats,
                    error,
                    icon: Icon,
                    uploadLabel
                  }) => {
                    const hasFiles =
                      id === 'photoId'
                        ? !!documents.photoId
                        : Array.isArray(documents[id as keyof DocumentFile]) &&
                          (documents[id as keyof DocumentFile] as string[])
                            .length > 0;
                    return (
                      <div
                        key={id}
                        className={`rounded-xl border-2 transition-all ${
                          error
                            ? 'border-red-200 bg-red-50'
                            : hasFiles
                              ? 'border-gray-100 bg-gray-50 hover:border-gray-200'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center space-x-3">
                                <div
                                  className={`rounded-lg p-2 ${
                                    error
                                      ? 'bg-red-100'
                                      : hasFiles
                                        ? 'bg-gray-100'
                                        : 'bg-gray-100'
                                  }`}
                                >
                                  <Icon
                                    className={`h-5 w-5 ${
                                      error
                                        ? 'text-red-600'
                                        : hasFiles
                                          ? 'text-green-600'
                                          : 'text-gray-600'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <h3 className="flex items-center text-lg font-semibold text-gray-900">
                                    {label}
                                    {required && (
                                      <span className="ml-2 text-red-500">
                                        *
                                      </span>
                                    )}
                                    {hasFiles && (
                                      <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {instructions}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Accepted formats: {formats}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-gray-800">
                                    {uploadLabel}
                                  </p>
                                </div>
                              </div>
                              {error && (
                                <div className="mt-2 rounded-lg border border-red-200 bg-red-100 p-3">
                                  <p className="text-sm font-medium text-red-700">
                                    {error}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              onClick={() =>
                                openImageUploader(id as keyof DocumentFile)
                              }
                              className="ml-4 flex items-center space-x-2 rounded-lg bg-supperagent px-6 py-2 text-white transition-colors hover:bg-supperagent/90"
                            >
                              <Upload className="h-4 w-4" />
                              <span>Upload</span>
                            </Button>
                          </div>
                          {renderUploadedFiles(id as keyof DocumentFile)}
                        </div>
                        <ImageUploader
                          open={uploadState.isOpen}
                          onOpenChange={(isOpen) =>
                            setUploadState((prev) => ({ ...prev, isOpen }))
                          }
                          onUploadComplete={handleUploadComplete}
                          entityId={user?._id}
                        />
                      </div>
                    );
                  }
                )}
              </div>
              {/* Navigation Buttons */}
              <div className="flex justify-end pt-8">
                {hasChanges() && (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                  >
                    Save
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
