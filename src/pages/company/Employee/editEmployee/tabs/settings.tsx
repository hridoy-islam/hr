import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import {
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle
} from 'lucide-react';

import axiosInstance from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface SettingsTabProps {
  formData: any;
  onSelectChange: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  formData,
  onSelectChange,
  isFieldSaving
}) => {
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState<{
    type: 'designationId' | 'departmentId' | null;
  }>({ type: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<any>(null);

  const { id: companyId } = useParams();
  const user = useSelector((state: any) => state.auth?.user) || null;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [designationRes, departmentRes] = await Promise.all([
        axiosInstance(`/hr/designation?companyId=${companyId}&limit=all`),
        axiosInstance(`/hr/department?companyId=${companyId}&limit=all`)
      ]);
      setDesignations(designationRes.data.data.result || []);
      setDepartments(departmentRes.data.data.result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchData();
  }, [user?._id]);

  // Helpers to parse current values
  const getIds = (field: any) =>
    Array.isArray(field)
      ? field.map((f) => (typeof f === 'object' ? f._id : f))
      : [];

  const currentDesignationIds = useMemo(
    () => getIds(formData?.designationId),
    [formData?.designationId]
  );
  const currentDepartmentIds = useMemo(
    () => getIds(formData?.departmentId),
    [formData?.departmentId]
  );

  // Filter options for React Select (only show what isn't already added)
  // Inside SettingsTab component...

 const getAvailableOptions = (type: 'designationId' | 'departmentId') => {
   if (type === 'designationId') {
     return designations
       .filter((d) => !currentDesignationIds.includes(d._id))
       .map((d) => ({ value: d._id, label: d.title }));
   }

   // --- Improved Department Hierarchy Logic ---
   const options: any[] = [];

   // 1. Get all root departments (no parent)
   const roots = departments.filter((d) => !d.parentDepartmentId);

   roots.forEach((root) => {
     // Find all children for this specific root
     const allChildrenOfThisRoot = departments.filter(
       (child) =>
         (child.parentDepartmentId?._id || child.parentDepartmentId) ===
         root._id
     );

     // Filter to see which children are NOT yet selected
     const availableChildren = allChildrenOfThisRoot.filter(
       (child) => !currentDepartmentIds.includes(child._id)
     );

     const isParentAlreadySelected = currentDepartmentIds.includes(root._id);

     // UX RULE: Show the parent if:
     // a) The parent itself is not selected yet
     // b) The parent IS selected, but it has children that are still available to pick
     if (!isParentAlreadySelected || availableChildren.length > 0) {
       options.push({
         value: root._id,
         label: root.departmentName,
         isChild: false,
         // If parent is already added, make it unclickable but visible for context
         isDisabled: isParentAlreadySelected,
         isHeader: isParentAlreadySelected // Custom flag for styling
       });

       // Add the available children under this parent
       availableChildren.forEach((child) => {
         options.push({
           value: child._id,
           label: child.departmentName,
           isChild: true,
           parentName: root.departmentName // Keep reference just in case
         });
       });
     }
   });

   return options;
 };

  // Actions
  const handleAddConfirm = () => {
    if (!selectedToAdd || !isAddOpen.type) return;
    const currentIds =
      isAddOpen.type === 'designationId'
        ? currentDesignationIds
        : currentDepartmentIds;
    onSelectChange(isAddOpen.type, [...currentIds, selectedToAdd.value]);
    setIsAddOpen({ type: null });
    setSelectedToAdd(null);
  };

  const handleRemove = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    const currentIds =
      type === 'designationId' ? currentDesignationIds : currentDepartmentIds;
    onSelectChange(
      type,
      currentIds.filter((itemId: string) => itemId !== id)
    );
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6  duration-500 animate-in fade-in">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {/* --- Designation Card --- */}
        <SelectionCard
          title="Designations"
          icon={<Briefcase className="h-4 w-4" />}
          items={designations.filter((d) =>
            currentDesignationIds.includes(d._id)
          )}
          labelKey="title"
          isLoading={isLoading || isFieldSaving['designationId']}
          onAdd={() => setIsAddOpen({ type: 'designationId' })}
          onRemove={(item) =>
            setDeleteConfirm({
              type: 'designationId',
              id: item._id,
              name: item.title
            })
          }
        />

        {/* --- Department Card --- */}
        <SelectionCard
          title="Departments"
          icon={<Building2 className="h-4 w-4" />}
          items={departments.filter((d) =>
            currentDepartmentIds.includes(d._id)
          )}
          labelKey="departmentName"
          isLoading={isLoading || isFieldSaving['departmentId']}
          onAdd={() => setIsAddOpen({ type: 'departmentId' })}
          onRemove={(item) =>
            setDeleteConfirm({
              type: 'departmentId',
              id: item._id,
              name: item.departmentName
            })
          }
        />
      </div>

      {/* --- Add Dialog --- */}
      <Dialog
        open={!!isAddOpen.type}
        onOpenChange={() => setIsAddOpen({ type: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add{' '}
              {isAddOpen.type === 'designationId'
                ? 'Designation'
                : 'Department'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={getAvailableOptions(isAddOpen.type!)}
              onChange={setSelectedToAdd}
              placeholder="Search and select..."
              isClearable
              // Important: This allows the disabled parent to still be seen
              isOptionDisabled={(option: any) => option.isDisabled}
              formatOptionLabel={(option: any) => {
                if (isAddOpen.type === 'departmentId') {
                  if (option.isChild) {
                    return (
                      <div className="ml-6 flex items-center gap-2 ">
                        <span className="">└─</span>
                        <span>{option.label}</span>
                      </div>
                    );
                  }
                  // Style for the Parent
                  return (
                    <div
                      className={` ${option.isHeader ? 'text-xs uppercase tracking-wider text-gray-400' : 'text-gray-900'}`}
                    >
                      {option.label} {option.isHeader && '(Already Added)'}
                    </div>
                  );
                }
                return <span>{option.label}</span>;
              }}
              styles={{
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isDisabled
                    ? 'transparent'
                    : base.backgroundColor,
                  cursor: state.isDisabled ? 'default' : 'pointer',
                  padding: state.data.isHeader
                    ? '8px 12px 4px 12px'
                    : '8px 12px'
                }),
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen({ type: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleAddConfirm} disabled={!selectedToAdd}>
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation --- */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{' '}
              <span className="font-semibold">"{deleteConfirm?.name}"</span>{' '}
              from this record. This action can be undone by re-adding the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Sub-component for Cleaner Layout ---

interface SelectionCardProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  labelKey: string;
  isLoading: boolean;
  onAdd: () => void;
  onRemove: (item: any) => void;
}

const SelectionCard = ({
  title,
  icon,
  items,
  labelKey,
  isLoading,
  onAdd,
  onRemove
}: SelectionCardProps) => (
  <Card className="bg-white shadow-sm border border-gray-200" >
    <CardHeader className="border-gray-300 pace-y-0 flex rounded-t-xl flex-row items-center justify-between bg-gray-100 pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
        {icon}
        {title}
      </CardTitle>
      <Button size="sm" onClick={onAdd} className="h-8 gap-1">
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </CardHeader>
    <CardContent className="pt-4">
      {isLoading && items.length === 0 ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item._id}
              className="items-center gap-1 border-gray-200 bg-white py-1 pl-3 pr-1 text-sm font-normal"
            >
              {item[labelKey]}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                onClick={() => onRemove(item)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-6 text-gray-400">
          <AlertCircle className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-xs">No {title.toLowerCase()} assigned</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SettingsTab;
