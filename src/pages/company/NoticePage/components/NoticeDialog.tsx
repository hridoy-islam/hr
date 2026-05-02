import { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const noticeSettingOptions = [
  { value: 'department', label: 'Department' },
  { value: 'designation', label: 'Designation' },
  { value: 'individual', label: 'Individual' },
  { value: 'all', label: 'All' }
];

const noticeTypeOptions = [
  { value: 'general', label: 'General' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' }
];

export function NoticeDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: NoticeDialogProps) {
  const [noticeType, setNoticeType] = useState<any>(null);
  const [noticeDescription, setNoticeDescription] = useState('');
  const [noticeSetting, setNoticeSetting] = useState<any>(null);
  const { id: companyId } = useParams();
  const [department, setDepartment] = useState<any[]>([]);
  const [designation, setDesignation] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const user = useSelector((state: any) => state.auth?.user) || null;

  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ---------- File upload states ----------
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const [deptRes, desigRes, usersRes] = await Promise.all([
        axiosInstance.get(`/hr/department?companyId=${companyId}&limit=all`),
        axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`),
        axiosInstance.get(`/users?company=${companyId}&limit=all&status=active`)
      ]);

      setDepartmentOptions(
        deptRes.data.data.result.map((d: any) => ({ value: d._id, label: d.departmentName }))
      );
      setDesignationOptions(
        desigRes.data.data.result.map((d: any) => ({ value: d._id, label: d.title }))
      );
      setUserOptions(
        usersRes.data.data.result.map((u: any) => ({
          value: u._id,
          label: `${u.firstName} ${u.lastName}`
        }))
      );
    } catch (err) {
      console.error('Failed to fetch options', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract ID from object or string
  const extractId = (item: any) => {
    return typeof item === 'object' && item !== null ? item._id || item.value : item;
  };

  useEffect(() => {
    if (
      initialData &&
      open &&
      departmentOptions.length > 0 &&
      designationOptions.length > 0 &&
      userOptions.length > 0
    ) {
      // Notice Type
      setNoticeType(
        noticeTypeOptions.find((o) => o.value === initialData.noticeType) || null
      );

      // Notice Description
      setNoticeDescription(initialData.noticeDescription || '');

      // Notice Setting
      setNoticeSetting(
        noticeSettingOptions.find((o) => o.value === initialData.noticeSetting) || null
      );

      // Departments
      if (initialData.department && Array.isArray(initialData.department)) {
        const selectedDepartments = initialData.department
          .map((item: any) => {
            const id = extractId(item);
            return departmentOptions.find((d) => d.value === id);
          })
          .filter(Boolean);
        setDepartment(selectedDepartments);
      }

      // Designations
      if (initialData.designation && Array.isArray(initialData.designation)) {
        const selectedDesignations = initialData.designation
          .map((item: any) => {
            const id = extractId(item);
            return designationOptions.find((d) => d.value === id);
          })
          .filter(Boolean);
        setDesignation(selectedDesignations);
      }

      // Users
      if (initialData.users && Array.isArray(initialData.users)) {
        const selectedUsers = initialData.users
          .map((item: any) => {
            const id = extractId(item);
            return userOptions.find((u) => u.value === id);
          })
          .filter(Boolean);
        setUsers(selectedUsers);
      }

      // Existing documents
      if (initialData.documents && Array.isArray(initialData.documents)) {
        const existingDocs = initialData.documents.map((url: string, idx: number) => ({
          name: url.split('/').pop() || `Document ${idx + 1}`,
          url
        }));
        setUploadedFiles(existingDocs);
      } else {
        setUploadedFiles([]);
      }
    }

    // Reset everything on close
    if (!open) {
      setNoticeType(null);
      setNoticeDescription('');
      setNoticeSetting(null);
      setDepartment([]);
      setDesignation([]);
      setUsers([]);
      setUploadedFiles([]);
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [initialData, open, departmentOptions, designationOptions, userOptions]);

  const handleNoticeSettingChange = (selectedOption: any) => {
    setNoticeSetting(selectedOption);
    // Clear irrelevant fields
    if (selectedOption?.value !== 'department') setDepartment([]);
    if (selectedOption?.value !== 'designation') setDesignation([]);
    if (selectedOption?.value !== 'individual') setUsers([]);
  };

  // ---------- File handling functions ----------
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Only PDF, JPEG, or PNG allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('entityId', user?._id);
        formData.append('file_type', 'document');
        formData.append('file', file);

        const res = await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedResults]);
    } catch (err) {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noticeType || !noticeDescription || !noticeSetting) {
      alert('Please fill all required fields');
      return;
    }

    const formData = {
      noticeType: noticeType.value,
      noticeDescription,
      noticeSetting: noticeSetting.value,
      department: noticeSetting.value === 'department' ? department.map(d => d.value) : [],
      designation: noticeSetting.value === 'designation' ? designation.map(d => d.value) : [],
      users: noticeSetting.value === 'individual' ? users.map(u => u.value) : [],
      documents: uploadedFiles.map(f => f.url),
      noticeBy: user._id,
      companyId: companyId
    };

    onSubmit(formData);
    onOpenChange(false);
  };

  const shouldShowDepartment = noticeSetting?.value === 'department';
  const shouldShowDesignation = noticeSetting?.value === 'designation';
  const shouldShowUsers = noticeSetting?.value === 'individual';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px] border-gray-200">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Notice</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading options...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Notice Setting */}
              <div className="space-y-2">
                <Label htmlFor="noticeSetting">
                  Choose Notice Setting <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="noticeSetting"
                  value={noticeSetting}
                  onChange={handleNoticeSettingChange}
                  options={noticeSettingOptions}
                  placeholder="Select Notice Setting"
                  isClearable
                  required
                />
              </div>

              {shouldShowDepartment && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    id="department"
                    value={department}
                    onChange={(selected) => setDepartment(selected || [])}
                    options={departmentOptions}
                    isMulti
                    required
                  />
                </div>
              )}

              {shouldShowDesignation && (
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Select
                    id="designation"
                    value={designation}
                    onChange={(selected) => setDesignation(selected || [])}
                    options={designationOptions}
                    isMulti
                    required
                  />
                </div>
              )}

              {shouldShowUsers && (
                <div className="space-y-2">
                  <Label htmlFor="users">Users</Label>
                  <Select
                    id="users"
                    value={users}
                    onChange={(selected) => setUsers(selected || [])}
                    options={userOptions}
                    isMulti
                    required
                  />
                </div>
              )}

              {/* Notice Type */}
              <div className="space-y-2">
                <Label htmlFor="noticeType">
                  Notice Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="noticeType"
                  value={noticeType}
                  onChange={(selected) => setNoticeType(selected)}
                  options={noticeTypeOptions}
                  isClearable
                  required
                />
              </div>

              {/* Notice Description */}
              <div className="space-y-2">
                <Label htmlFor="noticeDescription">
                  Notice Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="noticeDescription"
                  value={noticeDescription}
                  onChange={(e) => setNoticeDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter notice description"
                  className="flex w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {/* ---------- File Upload Section ---------- */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                    isUploading
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf,image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      <p className="text-xs text-blue-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Upload Document</span>
                      <span className="text-xs text-gray-400">PDF/Images (Max 5MB each)</span>
                    </div>
                  )}
                </div>
                {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-theme  "
                        >
                          {file.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 ml-2 text-xl"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-theme text-white hover:bg-theme/90">
                {initialData ? 'Update' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}