import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Upload,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axios'; // Adjust path
import { useToast } from '@/components/ui/use-toast';


interface DocumentsTabProps {
  formData: any;
  applicantId: string;
  onRefresh: () => void;
}

// Define the documents we expect
const documentTypes = [
  { key: 'passport', label: 'Passport' },
  { key: 'dbs', label: 'DBS Certificate' },
  { key: 'rightToWork', label: 'Right to Work' },
  { key: 'immigrationStatus', label: 'Immigration Status' },
  { key: 'proofOfAddress', label: 'Proof of Address' },
];

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  formData,
  applicantId,
  onRefresh
}) => {
  // Dialog & Upload State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);
  const [activeDocLabel, setActiveDocLabel] = useState<string | null>(null);
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
     const {toast} = useToast()
  // Open Dialog for specific document
  const handleOpenUploadDialog = (key: string, label: string) => {
    setActiveDocKey(key);
    setActiveDocLabel(label);
    setFileToUpload(null);
    setUploadedFileUrl(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setActiveDocKey(null);
    setActiveDocLabel(null);
    setFileToUpload(null);
    setUploadedFileUrl(null);
    setUploadError(null);
  };

  // Validate File
  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB.');
      return false;
    }
    return true;
  };

  // 1. Handle File Selection & Immediate Upload to Storage
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeDocKey) return;

    if (!validateFile(file)) return;

    setFileToUpload(file);
    setUploadError(null);
    setIsUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('entityId', applicantId);
    uploadFormData.append('file_type', 'careerDoc'); // or specific type based on activeDocKey if needed
    uploadFormData.append('file', file);

    try {
      // Step A: Upload file to get URL
      const res = await axiosInstance.post('/documents', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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

  // 2. Save the URL to the Applicant Record
  const handleSaveDocument = async () => {
    if (!uploadedFileUrl || !activeDocKey) return;

    setIsUploading(true);
    try {
    
      const updateData = {
        [activeDocKey]: uploadedFileUrl
      };
      


      await axiosInstance.patch(`/hr/applicant/${applicantId}`, updateData);

      toast({title:`${activeDocLabel} updated successfully`});
      handleCloseDialog();
     if (onRefresh) {
      onRefresh();
    }
    } catch (error) {
      console.log('Error saving document URL:', error);
      toast({title:'Failed to update applicant record'});
    } finally {
      setIsUploading(false);
    }
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
    <div className="space-y-6 relative ">
      <div className="bg-white ">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
          Applicant Documents
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {documentTypes.map((doc) => {
            // Check flat or nested structure
            const currentUrl = formData?.documents?.[doc.key] || formData?.[doc.key];

            return (
              <div
                key={doc.key}
                className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                {/* File Info */}
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${currentUrl ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {currentUrl ? <FileCheck className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-gray-900">
                      {doc.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {currentUrl ? 'Document uploaded' : 'No document provided'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  {currentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(currentUrl, '_blank')}
                      className="flex-1 sm:flex-none gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleOpenUploadDialog(doc.key, doc.label)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {currentUrl ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Upload Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {uploadedFileUrl ? 'Save Document' : `Upload ${activeDocLabel}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Upload File for <span className="text-blue-600">{activeDocLabel}</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              <div
                onClick={!uploadedFileUrl ? triggerFileInput : undefined}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                  isUploading
                    ? 'border-blue-300 bg-blue-50 cursor-wait'
                    : uploadedFileUrl
                    ? 'border-green-300 bg-green-50 cursor-default'
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
                  // This state might happen if file selected but upload failed or pending
                  <div className="flex flex-col items-center">
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-900">
                      Processing...
                    </p>
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
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={!uploadedFileUrl || isUploading}
              className="bg-theme text-white hover:bg-theme/90"
            >
              {isUploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsTab;