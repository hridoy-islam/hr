import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Upload, AlertCircle } from 'lucide-react';
import axiosInstance from '@/lib/axios'; // Ensure correct path
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PersonalInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onDateChange: (fieldName: string, dateStr: string) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  isFieldSaving
}) => {
  const { id } = useParams();
  
  // --- Upload State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(formData?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync uploaded URL with local state if formData updates from parent
  useEffect(() => {
    if (formData?.image) {
      setUploadedDocUrl(formData.image);
    }
  }, [formData?.image]);

  // --- Options ---
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Civil Partnership', label: 'Civil Partnership' }
  ];

  // --- File Upload Logic ---
  const validateFile = (file: File) => {
    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return false;
    }
    // Allow images only
    if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (JPG, PNG).');
        return false;
    }
    return true;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; 

    if (!validateFile(file)) return;

    setUploadError(null);
    setIsUploading(true);

    const data = new FormData();
    if (id) data.append('entityId', id); 
    // Use 'profile' as requested for file_type
    data.append('file_type', 'profile'); 
    data.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const url = res.data?.data?.fileUrl; 
      
      if (!url) throw new Error('No file URL returned from server');

      setUploadedDocUrl(url);
      
      // Update parent component with new image URL
      onUpdate('image', url);
      
      setIsDialogOpen(false); 
      
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        
        {/* Layout: Image on Left (desktop), Inputs on Right */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-full border-4 border-gray-100 shadow-sm">
              <img
                src={uploadedDocUrl || '/user.png'}
                alt="Profile"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => setIsDialogOpen(true)}
                className="absolute bottom-3 right-8 z-10 rounded-full bg-theme hover:bg-theme/90 shadow-md"
              >
                <Camera className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EditableField
              id="title"
              label="Title"
              value={formData.title}
              type="select"
              options={titleOptions}
              onUpdate={(value) => onSelectChange('title', value)}
              isSaving={isFieldSaving['title']}
            />

            <EditableField
              id="firstName"
              label="First Name"
              value={formData.firstName}
              onUpdate={(value) => onUpdate('firstName', value)}
              isSaving={isFieldSaving['firstName']}
              required
            />

            <EditableField
              id="initial"
              label="Initial"
              value={formData.initial}
              onUpdate={(value) => onUpdate('initial', value)}
              isSaving={isFieldSaving['initial']}
            />

            <EditableField
              id="lastName"
              label="Last Name"
              value={formData.lastName}
              onUpdate={(value) => onUpdate('lastName', value)}
              isSaving={isFieldSaving['lastName']}
              required
            />

            <EditableField
              id="dateOfBirth"
              label="Date of Birth"
              value={formData.dateOfBirth ? moment(formData.dateOfBirth).format('YYYY-MM-DD') : ''}
              type="date"
              onUpdate={(value) => onDateChange('dateOfBirth', value)}
              isSaving={isFieldSaving['dateOfBirth']}
              max={moment().subtract(16, 'years').format('YYYY-MM-DD')}
            />

            <EditableField
              id="gender"
              label="Gender"
              value={formData.gender}
              type="select"
              options={genderOptions}
              onUpdate={(value) => onSelectChange('gender', value)}
              isSaving={isFieldSaving['gender']}
            />

            <EditableField
              id="maritalStatus"
              label="Marital Status"
              value={formData.maritalStatus}
              type="select"
              options={maritalStatusOptions}
              onUpdate={(value) => onSelectChange('maritalStatus', value)}
              isSaving={isFieldSaving['maritalStatus']}
            />

            <EditableField
              id="ethnicOrigin"
              label="Ethnic Origin"
              value={formData.ethnicOrigin}
              onUpdate={(value) => onUpdate('ethnicOrigin', value)}
              isSaving={isFieldSaving['ethnicOrigin']}
            />
          </div>
        </div>
      </CardContent>

      {/* --- Image Upload Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new photo for your profile. Max size 5MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mb-2 h-10 w-10 animate-spin text-theme" />
                    <p className="text-sm font-medium text-theme">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload photo
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG (Max 5MB)
                    </p>
                  </>
                )}

                {uploadError && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PersonalInfoTab;