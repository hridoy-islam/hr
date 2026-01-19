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
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' }
];

export function NoticeDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: NoticeDialogProps) {
  // Removed noticeType state
  const [noticeDescription, setNoticeDescription] = useState('');
  const [noticeSetting, setNoticeSetting] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const user = useSelector((state: any) => state.auth?.user) || null;

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
      // Updated to fetch 'company' role instead of 'employee'
      const usersRes = await axiosInstance.get('/users?limit=all&role=company');

      setUserOptions(
        usersRes.data.data.result.map((u: any) => ({
          value: u._id,
          label: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
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
      userOptions.length > 0
    ) {
      // Removed noticeType logic

      // Notice Description
      setNoticeDescription(initialData.noticeDescription || '');

      // Notice Setting
      setNoticeSetting(
        noticeSettingOptions.find((o) => o.value === initialData.noticeSetting) || null
      );

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
      setNoticeDescription('');
      setNoticeSetting(null);
      setUsers([]);
    }
  }, [initialData, open, userOptions]);

  const handleNoticeSettingChange = (selectedOption: any) => {
    setNoticeSetting(selectedOption);
    // Clear users if switching away from individual
    if (selectedOption?.value !== 'individual') setUsers([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noticeDescription || !noticeSetting) {
      alert('Please fill all required fields');
      return;
    }

    const formData = {
      // Removed noticeType from payload
      noticeDescription,
      noticeSetting: noticeSetting.value,
      department: [],
      designation: [],
      users: noticeSetting.value === 'individual' ? users.map(u => u.value) : [],
      noticeBy: user._id
    };

    onSubmit(formData);
    onOpenChange(false);
  };

  const shouldShowUsers = noticeSetting?.value === 'individual';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto overflow-y-auto sm:max-w-[80vw]">
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
                    placeholder="Select Companies" 
                  />
                </div>
              )}

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
                  className="flex w-full h-[30vh] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-supperagent focus:ring-supperagent"
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