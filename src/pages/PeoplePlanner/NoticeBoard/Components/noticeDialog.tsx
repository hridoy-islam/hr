import { useEffect, useState } from 'react';
import Select from 'react-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import moment from 'moment';

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

// Mock data for dropdowns - replace with actual API calls
const noticeSettingOptions = [
  { value: 'department', label: 'Department' },
  { value: 'designation', label: 'Designation' },
  { value: 'individual', label: 'Individual' },
  { value: 'all', label: 'All' }
];

const departmentOptions = [
  { value: 'hr', label: 'Human Resources' },
  { value: 'it', label: 'Information Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' }
];

const designationOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'executive', label: 'Executive' }
];

const userOptions = [
  { value: 'john_doe', label: 'John Doe' },
  { value: 'jane_smith', label: 'Jane Smith' },
  { value: 'bob_johnson', label: 'Bob Johnson' },
  { value: 'alice_brown', label: 'Alice Brown' },
  { value: 'charlie_davis', label: 'Charlie Davis' }
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

  useEffect(() => {
    if (initialData) {
      setNoticeType(
        initialData.noticeType
          ? noticeTypeOptions.find(
              (option) => option.value === initialData.noticeType
            )
          : null
      );
      setNoticeDescription(initialData.noticeDescription || '');
      setNoticeSetting(
        initialData.noticeSetting
          ? noticeSettingOptions.find(
              (option) => option.value === initialData.noticeSetting
            )
          : null
      );
      setDepartment(initialData.department || []);
      setDesignation(initialData.designation || []);
      setUsers(initialData.users || []);
    } else {
      // Reset form
      setNoticeType('');
      setNoticeDescription('');
   
      setNoticeSetting(null);
      setDepartment([]);
      setDesignation([]);
      setUsers([]);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      noticeType,
      noticeDescription,
      noticeSetting: noticeSetting?.value,
      department:
        noticeSetting?.value === 'department' || noticeSetting?.value === 'all'
          ? department
          : [],
      designation:
        noticeSetting?.value === 'designation' || noticeSetting?.value === 'all'
          ? designation
          : [],
      users:
        noticeSetting?.value === 'individual' || noticeSetting?.value === 'all'
          ? users
          : []
    };

    onSubmit(formData);
    onOpenChange(false);
  };

  const handleNoticeSettingChange = (selectedOption: any) => {
    setNoticeSetting(selectedOption);
    // Reset conditional fields when notice setting changes
    if (
      selectedOption?.value !== 'department' &&
      selectedOption?.value !== 'all'
    ) {
      setDepartment([]);
    }
    if (
      selectedOption?.value !== 'designation' &&
      selectedOption?.value !== 'all'
    ) {
      setDesignation([]);
    }
    if (
      selectedOption?.value !== 'individual' &&
      selectedOption?.value !== 'all'
    ) {
      setUsers([]);
    }
  };

  const shouldShowDepartment =
    noticeSetting?.value === 'department' || noticeSetting?.value === 'all';
  const shouldShowDesignation =
    noticeSetting?.value === 'designation' || noticeSetting?.value === 'all';
  const shouldShowUsers =
    noticeSetting?.value === 'individual' || noticeSetting?.value === 'all';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Notice</DialogTitle>
        </DialogHeader>
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
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {shouldShowDepartment && (
              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="department"
                  value={department}
                  onChange={(selectedOptions) =>
                    setDepartment(selectedOptions || [])
                  }
                  options={departmentOptions}
                  placeholder="Select Department"
                  isMulti
                  required={shouldShowDepartment}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}

            {shouldShowDesignation && (
              <div className="space-y-2">
                <Label htmlFor="designation">
                  Designations <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="designation"
                  value={designation}
                  onChange={(selectedOptions) =>
                    setDesignation(selectedOptions || [])
                  }
                  options={designationOptions}
                  placeholder="Select Designation"
                  isMulti
                  required={shouldShowDesignation}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}

            {shouldShowUsers && (
              <div className="space-y-2">
                <Label htmlFor="users">
                  Users <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="users"
                  value={users}
                  onChange={(selectedOptions) =>
                    setUsers(selectedOptions || [])
                  }
                  options={userOptions}
                  placeholder="Select Users"
                  isMulti
                  required={shouldShowUsers}
                  className="react-select-container"
                  classNamePrefix="react-select"
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
                onChange={(selectedOption) => setNoticeType(selectedOption)}
                options={noticeTypeOptions}
                placeholder="Select Notice Type"
                isClearable
                required
                className="react-select-container"
                classNamePrefix="react-select"
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
                className="flex w-full rounded-md border border-gray-300   px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

           
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="border-none bg-supperagent text-white hover:bg-supperagent/90"
            >
              {initialData ? 'Update' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
