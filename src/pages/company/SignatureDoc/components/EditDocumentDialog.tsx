import React, { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X, Loader2, FileText, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';

// --- Helpers ---
const getInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
};

// --- Zod Schema Validation (Simplified for edit) ---
const editDocSchema = z.object({
  content: z.string().min(5, 'Content must be at least 5 characters long.'),
  document: z.string().min(1, 'Please upload a document.'),
});

type EditDocForm = z.infer<typeof editDocSchema>;

interface EditDocumentDialogProps {
  editDoc: any; 
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDocumentDialog({ editDoc, onClose, onSuccess }: EditDocumentDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditDocForm>({
    resolver: zodResolver(editDocSchema),
    defaultValues: {
      content: editDoc.content || '',
      document: editDoc.document || '',
    },
  });

  const uploadedDocument = watch('document');
  const employee = editDoc.employeeId;

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File exceeds 5MB limit.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('document', res.data.data.fileUrl || res.data.url, { shouldValidate: true });
    //   toast({ title: 'Success', description: 'Document uploaded successfully.' });
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Could not upload document.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Handler
  const onSubmit = async (data: EditDocForm) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/signature-documents/${editDoc._id}`, {
        content: data.content,
        document: data.document
      });
      toast({ title: 'Success', description: 'Document updated successfully!' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update document.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Signature Request
            </h2>
            <p className="text-sm text-gray-500">
              Update the document or instructions for this request.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Employee Display (No scroll area, just pure static display) */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Assigned Employee</label>
            <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarFallback className="bg-white text-theme font-medium text-sm">
                  {getInitials(employee?.firstName, employee?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-xs text-gray-500">{employee?.email || 'Employee'}</p>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Document Content / Instructions</label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Write your document instructions or content here..."
                  className="min-h-[120px] resize-none focus-visible:ring-theme"
                />
              )}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Attachment</label>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
            />
            
            <div
              onClick={() => {
                if (!isUploading && !uploadedDocument) {
                  fileInputRef.current?.click();
                }
              }}
              className={`flex h-[160px] ${!uploadedDocument ? 'cursor-pointer hover:bg-gray-100' : ''} flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                errors.document ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-theme" />
                  <p className="text-xs text-theme">Uploading...</p>
                </div>
              ) : uploadedDocument ? (
                <div className="flex flex-col items-center gap-2 text-center text-green-600">
                  <FileText className="h-8 w-8" />
                  <span className="text-sm font-medium">Document Attached</span>
                  
                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(uploadedDocument, '_blank');
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View File
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Click to Upload Document</span>
                  <span className="text-xs text-gray-400">Upload Document (Max 5MB)</span>
                </div>
              )}
            </div>
            {errors.document && <p className="text-xs text-red-500">{errors.document.message}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isUploading}
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Document
          </Button>
        </div>
      </div>
    </div>
  );
}