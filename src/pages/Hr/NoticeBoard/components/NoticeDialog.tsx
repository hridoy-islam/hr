import { useEffect, useState } from 'react';
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

  const [department, setDepartment] = useState<any[]>([]);
  const [designation, setDesignation] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const user = useSelector((state: any) => state.auth?.user) || null;

  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const [deptRes, desigRes, usersRes] = await Promise.all([
        axiosInstance.get('/hr/department?limit=all'),
        axiosInstance.get('/hr/designation?limit=all'),
        axiosInstance.get('/users?limit=all')
      ]);

      setDepartmentOptions(
        deptRes.data.data.result.map((d: any) => ({ 
          value: d._id, 
          label: d.departmentName 
        }))
      );
      setDesignationOptions(
        desigRes.data.data.result.map((d: any) => ({ 
          value: d._id, 
          label: d.title 
        }))
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

  // Helper function to extract ID from object or string
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
      console.log('Initial Data:', initialData); // Debug log

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

      // Departments - handle both populated objects and IDs
      if (initialData.department && Array.isArray(initialData.department)) {
        const selectedDepartments = initialData.department
          .map((item: any) => {
            const id = extractId(item);
            return departmentOptions.find((d) => d.value === id);
          })
          .filter(Boolean); // Remove undefined values
        
        console.log('Selected Departments:', selectedDepartments);
        setDepartment(selectedDepartments);
      }

      // Designations - handle both populated objects and IDs
      if (initialData.designation && Array.isArray(initialData.designation)) {
        const selectedDesignations = initialData.designation
          .map((item: any) => {
            const id = extractId(item);
            return designationOptions.find((d) => d.value === id);
          })
          .filter(Boolean); // Remove undefined values
        
        console.log('Selected Designations:', selectedDesignations);
        setDesignation(selectedDesignations);
      }

      // Users - handle both populated objects and IDs
      if (initialData.users && Array.isArray(initialData.users)) {
        const selectedUsers = initialData.users
          .map((item: any) => {
            const id = extractId(item);
            return userOptions.find((u) => u.value === id);
          })
          .filter(Boolean); // Remove undefined values
        
        setUsers(selectedUsers);
      }
    }

    // Reset on close
    if (!open) {
      setNoticeType(null);
      setNoticeDescription('');
      setNoticeSetting(null);
      setDepartment([]);
      setDesignation([]);
      setUsers([]);
    }
  }, [initialData, open, departmentOptions, designationOptions, userOptions]);

  const handleNoticeSettingChange = (selectedOption: any) => {
    setNoticeSetting(selectedOption);
    // Clear irrelevant fields
    if (selectedOption?.value !== 'department') setDepartment([]);
    if (selectedOption?.value !== 'designation') setDesignation([]);
    if (selectedOption?.value !== 'individual') setUsers([]);
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
      noticeBy: user._id
    };

    onSubmit(formData);
    onOpenChange(false);
  };

  const shouldShowDepartment = noticeSetting?.value === 'department';
  const shouldShowDesignation = noticeSetting?.value === 'designation';
  const shouldShowUsers = noticeSetting?.value === 'individual';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
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
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90">
                {initialData ? 'Update' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}