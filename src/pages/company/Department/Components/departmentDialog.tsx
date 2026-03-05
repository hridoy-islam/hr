import { useEffect, useState } from 'react';
import Select from 'react-select'; // Importing react-select
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DepartmentDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  departments // Receive the flat list to create options
}: any) {
  const [departmentName, setDepartmentName] = useState('');
  const [parentDepartmentId, setParentDepartmentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setDepartmentName(initialData?.departmentName || '');
    // Handle whether the backend populated it as an object or returned it as a string
    const parentId =
      initialData?.parentDepartmentId?._id ||
      initialData?.parentDepartmentId ||
      null;
    setParentDepartmentId(parentId);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = { departmentName };
    if (parentDepartmentId) {
      payload.parentDepartmentId = parentDepartmentId;
    } else {
      payload.parentDepartmentId = null; // Important to nullify if removed
    }

    onSubmit(payload);
    onOpenChange(false);
    setDepartmentName('');
    setParentDepartmentId(null);
  };

  // Only root departments should be allowed as parents to keep a simple 1-level tree as per your request.
  // We also exclude the current department being edited to prevent circular assignment.
  const parentOptions =
    departments
      ?.filter((d: any) => !d.parentDepartmentId && d._id !== initialData?._id)
      .map((d: any) => ({
        value: d._id,
        label: d.departmentName
      })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentDepartment">
              Parent Department (Optional)
            </Label>
            <Select
              id="parentDepartment"
              options={parentOptions}
              value={
                parentOptions.find(
                  (opt: any) => opt.value === parentDepartmentId
                ) || null
              }
              onChange={(selectedOption: any) =>
                setParentDepartmentId(
                  selectedOption ? selectedOption.value : null
                )
              }
              isClearable
              placeholder="Select parent department..."
             
            />
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
              className="border-none bg-theme text-white hover:bg-theme/90"
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
