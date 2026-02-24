import React, { useState } from 'react';
import { EditableField } from '../EditableField';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Make sure this is installed
import {
  Camera,
  Loader2,
  Upload,
  AlertCircle,
  User,
  Phone,
  Lock
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// --- Zod Schema for Password Validation ---
const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// --- Layout Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
    <Icon className="h-4 w-4 text-theme" />
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
      {title}
    </h3>
  </div>
);

const FormRow = ({
  label,
  children,
  className = ''
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`group flex flex-col border-b border-gray-100 last:border-0 sm:flex-row ${className}`}
  >
    {/* Label Column */}
    <div className="flex items-center bg-gray-50/30 px-4 py-3 sm:w-1/3 lg:w-2/5 xl:w-1/3">
      <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900">
        {label}
      </span>
    </div>
    {/* Input Column */}
    <div className="flex items-center bg-white px-4 py-2 sm:w-2/3 lg:w-3/5 xl:w-2/3">
      <div className="w-full">{children}</div>
    </div>
  </div>
);

// --- Main Component ---

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
  const { eid: id } = useParams();

  // --- Upload State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Password State ---
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const { toast } = useToast();
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image (JPG, PNG, or WEBP)');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const uploadRes = await axiosInstance.post('/documents', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = uploadRes.data?.data?.fileUrl || uploadRes.data.url;

      onUpdate('image', imageUrl);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      // 1. Validate with Zod
      setPasswordErrors({});
      passwordSchema.parse(passwordData);

      // 2. Make API Request
      setIsUpdatingPassword(true);
      await axiosInstance.patch(`/users/${id}`, {
        password: passwordData.password
      });

      setIsPasswordDialogOpen(false);
      setPasswordData({ password: '', confirmPassword: '' });
      toast({
        title:"Password Updated Successfully"
      })
    } catch (error) {
      console.error('Password update failed:', error);
      toast({
        title: error?.response?.data.message || 'Password update failed',
        variant:"destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({ password: '', confirmPassword: '' });
    setPasswordErrors({});
  };

  return (
    <div className="min-h-screen space-y-6 pb-10 duration-500 animate-in fade-in">
      {/* 1. Profile Photo Header */}
      <div className="flex flex-col items-center gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="group relative shrink-0">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md ring-1 ring-gray-200">
            {formData.image ? (
              <img
                src={formData.image}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full p-4 text-gray-300" />
            )}
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="absolute bottom-0 right-0 rounded-full bg-theme p-2 text-white shadow-lg transition-transform hover:scale-110 hover:bg-theme/90"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900">
            {formData.firstName} {formData.lastName}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400 sm:justify-start">
            <span className="rounded border border-theme/20 bg-theme/10 px-2 py-1 capitalize text-theme">
              {formData.employmentType || 'Employment Type N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Column: Identity Information */}
        <div className=" h-fit rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={User} title="General Information" />
          <div className="flex flex-col">
            <FormRow label="Title">
              <EditableField
                id="title"
                label=""
                value={formData.title}
                type="select"
                options={[
                  { value: 'Mr', label: 'Mr' },
                  { value: 'Mrs', label: 'Mrs' },
                  { value: 'Miss', label: 'Miss' },
                  { value: 'Ms', label: 'Ms' },
                  { value: 'Dr', label: 'Dr' }
                ]}
                onUpdate={(val) => onSelectChange('title', val)}
                isSaving={isFieldSaving.title}
              />
            </FormRow>

            <FormRow label="First Name">
              <EditableField
                id="firstName"
                label=""
                value={formData.firstName}
                onUpdate={(val) => onUpdate('firstName', val)}
                isSaving={isFieldSaving.firstName}
                required
              />
            </FormRow>

            <FormRow label="Initial">
              <EditableField
                id="initial"
                label=""
                value={formData.initial}
                onUpdate={(val) => onUpdate('initial', val)}
                isSaving={isFieldSaving.initial}
                required
              />
            </FormRow>

            <FormRow label="Last Name">
              <EditableField
                id="lastName"
                label=""
                value={formData.lastName}
                onUpdate={(val) => onUpdate('lastName', val)}
                isSaving={isFieldSaving.lastName}
                required
              />
            </FormRow>

            <FormRow label="Date of Birth">
              <EditableField
                id="dateOfBirth"
                label=""
                value={formData.dateOfBirth}
                type="date"
                onUpdate={(val) => onDateChange('dateOfBirth', val)}
                isSaving={isFieldSaving.dateOfBirth}
              />
            </FormRow>

            <FormRow label="Gender">
              <EditableField
                id="gender"
                label=""
                value={formData.gender}
                type="select"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
                onUpdate={(val) => onSelectChange('gender', val)}
                isSaving={isFieldSaving.gender}
              />
            </FormRow>

            <FormRow label="Marital Status">
              <EditableField
                id="maritalStatus"
                label=""
                value={formData.maritalStatus}
                type="select"
                options={[
                  { value: 'Single', label: 'Single' },
                  { value: 'Married', label: 'Married' },
                  { value: 'Divorced', label: 'Divorced' },
                  { value: 'Widowed', label: 'Widowed' }
                ]}
                onUpdate={(val) => onSelectChange('maritalStatus', val)}
                isSaving={isFieldSaving.maritalStatus}
              />
            </FormRow>

            <FormRow label="NI Number">
              <EditableField
                id="nationalInsuranceNumber"
                label=""
                value={formData.nationalInsuranceNumber}
                onUpdate={(val) => onUpdate('nationalInsuranceNumber', val)}
                isSaving={isFieldSaving.nationalInsuranceNumber}
              />
            </FormRow>
          </div>
        </div>

        {/* Right Column: Contact Details & Security */}
        <div className="flex flex-col gap-6">
          {/* Contact Details */}
          <div className="h-fit overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader icon={Phone} title="Contact Details" />
            <div className="flex flex-col">
              <FormRow label="Email Address">
                <EditableField
                  id="email"
                  label=""
                  value={formData.email}
                  type="email"
                  onUpdate={(val) => onUpdate('email', val)}
                  isSaving={isFieldSaving.email}
                />
              </FormRow>

              <FormRow label="Mobile Phone">
                <EditableField
                  id="mobilePhone"
                  label=""
                  value={formData.mobilePhone}
                  onUpdate={(val) => onUpdate('mobilePhone', val)}
                  isSaving={isFieldSaving.mobilePhone}
                />
              </FormRow>

              <FormRow label="Home Phone">
                <EditableField
                  id="homePhone"
                  label=""
                  value={formData.homePhone}
                  onUpdate={(val) => onUpdate('homePhone', val)}
                  isSaving={isFieldSaving.homePhone}
                />
              </FormRow>
            </div>
          </div>

          {/* Security Section (New) */}
          <div className="h-fit overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader icon={Lock} title="Security" />
            <div className="flex flex-col p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Account Password
                </h4>
                <p className="text-sm text-gray-500">
                  Update the login password for this user.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-3 sm:mt-0"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Set Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Dialogs --- */}

      {/* Photo Upload Dialog (Existing) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ... (Kept exactly the same to save space, but standard implementation remains) ... */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new photo. Recommended size: 400x400px.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isUploading
                  ? 'cursor-wait border-theme bg-theme/5'
                  : 'border-gray-300 hover:border-theme hover:bg-gray-50'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={isUploading}
              />

              <div className="flex flex-col items-center text-center">
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

      {/* Password Update Dialog (New) */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) resetPasswordForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this account. Must be at least 6
              characters long.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, password: e.target.value })
                }
                className={
                  passwordErrors.password
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
              />
              {passwordErrors.password && (
                <p className="text-xs font-medium text-red-500">
                  {passwordErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value
                  })
                }
                className={
                  passwordErrors.confirmPassword
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs font-medium text-red-500">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            {passwordErrors.root && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{passwordErrors.root}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isUpdatingPassword}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalInfoTab;
