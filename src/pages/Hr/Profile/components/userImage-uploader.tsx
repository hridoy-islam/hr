import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import axiosInstance from "@/lib/axios";

export function ImageUploader({
  open,
  onOpenChange,
  onUploadComplete,
  entityId
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE) {
      alert("File size exceeds the 2MB limit.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = inputRef.current?.files?.[0];
      if (!file) {
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('entityId', entityId);
      formData.append('file_type', 'profile');
      formData.append('file', file);

      const response = await axiosInstance.post(
        '/documents',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (response.status === 200) {
        onUploadComplete(response.data);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('An error occurred while uploading the image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedImage(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            role="region"
            aria-labelledby="fileUploadInstructions"
            className={cn(
              'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
              dragActive ? 'border-primary' : 'border-muted-foreground/25',
              selectedImage ? 'pb-0' : 'min-h-[200px]'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {selectedImage ? (
              <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm font-medium">
                  Drag & drop an image here, or click to select
                </div>
                <div className="text-xs text-muted-foreground">
                  PNG, JPG or GIF (max. 2MB)
                </div>
              </div>
            )}
          </div>

          {uploadError && <p className="text-red-600">{uploadError}</p>}

          {selectedImage && !uploading && (
            <Button className="w-full" onClick={uploadImage}>
              Upload Image
            </Button>
          )}

          {uploading && (
            <div className="relative mx-auto h-12 w-12">
              <svg
                className="h-12 w-12 -rotate-90 transform"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-muted-foreground/20"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="2"
                  strokeDasharray={100}
                  strokeDashoffset={100 - uploadProgress}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
