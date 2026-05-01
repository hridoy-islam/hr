import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Edit
} from 'lucide-react';

import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import moment from '@/lib/moment-setup';

interface SettingsTabProps {
  formData: any;
  onSelectChange: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

// Pre-defined options for Leaver selects
export const LEAVING_REASONS = [
  { value: 'Death in Service', label: 'Death in Service' },
  { value: 'Dismissal', label: 'Dismissal' },
  { value: 'End of Contract', label: 'End of Contract' },
  { value: 'Other', label: 'Other' },
  { value: 'Resignation', label: 'Resignation' },
  {
    value: 'Visa - Right to work expired',
    label: 'Visa - Right to work expired'
  }
];

export const DISMISSAL_REASONS = [
  { value: 'Family reasons', label: 'Family reasons' },
  { value: 'Health reasons', label: 'Health reasons' },
  { value: 'Hours', label: 'Hours' },
  {
    value: 'New job - different industry',
    label: 'New job - different industry'
  },
  { value: 'New job - same industry', label: 'New job - same industry' },
  { value: 'No reason given', label: 'No reason given' },
  { value: 'Other', label: 'Other' },
  { value: 'Pay', label: 'Pay' },
  { value: 'Relocation', label: 'Relocation' },
  { value: 'Retirement', label: 'Retirement' },
  { value: 'Returning to education', label: 'Returning to education' },
  { value: 'Training and development', label: 'Training and development' },
  { value: 'Travel time', label: 'Travel time' },
  { value: 'Work life balance', label: 'Work life balance' }
];

// Zod Validation Schema
const leaverSchema = z.object({
  leavingReason: z.any().refine((val) => val && val.value, {
    message: 'Reason for leaving is required'
  }),
  dissmissalReason: z.any().refine((val) => val && val.value, {
    message: 'Resignation/Dismissal reason is required'
  }),
  terminationDate: z.date({
    required_error: 'Termination date is required',
    invalid_type_error: 'Please select a valid date'
  }),
  note: z.string().optional()
});

const SettingsTab: React.FC<SettingsTabProps> = ({
  formData,
  onSelectChange,
  isFieldSaving
}) => {
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Leaver States ---
  const [leaverData, setLeaverData] = useState<any>(null);
  const [isLeaverDialogOpen, setIsLeaverDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteLeaverConfirmOpen, setIsDeleteLeaverConfirmOpen] =
    useState(false);
  const [isDeletingLeaver, setIsDeletingLeaver] = useState(false);
  const [leaverForm, setLeaverForm] = useState({
    leavingReason: null as any,
    dissmissalReason: null as any,
    terminationDate: null as Date | null,
    note: ''
  });
  const [leaverErrors, setLeaverErrors] = useState<Record<string, string>>({});
  const [isSubmittingLeaver, setIsSubmittingLeaver] = useState(false);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Get companyId and eid from params (adjust if eid is prop-based)
  const { id: companyId, eid } = useParams();
  const employeeId = eid || formData?._id;
  const user = useSelector((state: any) => state.auth?.user) || null;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [designationRes, departmentRes, leaverRes] = await Promise.all([
        axiosInstance(`/hr/designation?companyId=${companyId}&limit=all`),
        axiosInstance(`/hr/department?companyId=${companyId}&limit=all`),
        employeeId
          ? axiosInstance(`/leaver?userId=${employeeId}`)
          : Promise.resolve(null)
      ]);
      setDesignations(designationRes.data.data.result || []);
      setDepartments(departmentRes.data.data.result || []);

      // Handle Leaver Data
      if (
        leaverRes?.data?.data?.result &&
        leaverRes.data.data.result.length > 0
      ) {
        setLeaverData(leaverRes.data.data.result[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, employeeId]);

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

  const getAvailableOptions = (type: 'designationId' | 'departmentId') => {
    if (type === 'designationId') {
      return designations
        .filter((d) => !currentDesignationIds.includes(d._id))
        .map((d) => ({ value: d._id, label: d.title }));
    }

    const options: any[] = [];
    const roots = departments.filter((d) => !d.parentDepartmentId);

    roots.forEach((root) => {
      const allChildrenOfThisRoot = departments.filter(
        (child) =>
          (child.parentDepartmentId?._id || child.parentDepartmentId) ===
          root._id
      );

      const availableChildren = allChildrenOfThisRoot.filter(
        (child) => !currentDepartmentIds.includes(child._id)
      );

      const isParentAlreadySelected = currentDepartmentIds.includes(root._id);

      if (!isParentAlreadySelected || availableChildren.length > 0) {
        options.push({
          value: root._id,
          label: root.departmentName,
          isChild: false,
          isDisabled: isParentAlreadySelected,
          isHeader: isParentAlreadySelected
        });

        availableChildren.forEach((child) => {
          options.push({
            value: child._id,
            label: child.departmentName,
            isChild: true,
            parentName: root.departmentName
          });
        });
      }
    });

    return options;
  };

  // --- Actions ---
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

  // --- Upload Logic ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Must be less than 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setFormErrors((prev: any) => ({ ...prev, uploadedFiles: undefined }));

    try {
      const uploadPromises = files.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('entityId', user?._id);
        uploadFormData.append('file_type', 'document');
        uploadFormData.append('file', file);

        const res = await axiosInstance.post('/documents', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { name: file.name, url: res.data?.data?.fileUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedResults]);
    } catch (err) {
      setUploadError('Failed to upload one or more documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // --- Leaver Handlers ---
  const handleOpenCreateLeaver = () => {
    setIsEditMode(false);
    setLeaverForm({
      leavingReason: null,
      dissmissalReason: null,
      terminationDate: null,
      note: ''
    });
    setUploadedFiles([]);
    setLeaverErrors({});
    setIsLeaverDialogOpen(true);
  };

  const handleOpenEditLeaver = () => {
    if (!leaverData) return;
    setIsEditMode(true);

    // Pre-fill existing data
    setLeaverForm({
      leavingReason:
        LEAVING_REASONS.find((r) => r.value === leaverData.leavingReason) ||
        null,
      dissmissalReason:
        DISMISSAL_REASONS.find(
          (r) => r.value === leaverData.dissmissalReason
        ) || null,
      terminationDate: leaverData.terminationDate
        ? new Date(leaverData.terminationDate)
        : null,
      note: leaverData.note || ''
    });

    if (leaverData.documents?.length > 0) {
      setUploadedFiles(
        leaverData.documents.map((doc: string, idx: number) => ({
          name: `Document ${idx + 1}`,
          url: doc
        }))
      );
    } else {
      setUploadedFiles([]);
    }

    setLeaverErrors({});
    setIsLeaverDialogOpen(true);
  };

  const handleLeaverSubmit = async () => {
    try {
      setLeaverErrors({});

      // Zod Validation
      const validatedData = leaverSchema.parse(leaverForm);

      setIsSubmittingLeaver(true);
      const payload = {
        companyId,
        userId: employeeId,
        approvedBy: user?._id,
        leavingReason: validatedData.leavingReason.value,
        dissmissalReason: validatedData.dissmissalReason.value,
        terminationDate: validatedData.terminationDate.toISOString(),
        note: validatedData.note,
        documents: uploadedFiles.map((f) => f.url)
      };

      if (isEditMode && leaverData?._id) {
        // PATCH Request
        await axiosInstance.patch(`/leaver/${leaverData._id}`, payload);
      } else {
        // POST Request
        await axiosInstance.post('/leaver', payload);
      }

      await fetchData();
      setIsLeaverDialogOpen(false);
    } catch (error) {
      // Catch Zod Validation Errors
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setLeaverErrors(fieldErrors);
        return;
      }
      console.error('Failed to apply/update leaver:', error);
    } finally {
      setIsSubmittingLeaver(false);
    }
  };

  const handleDeleteLeaverConfirm = async () => {
    if (!leaverData?._id) return;
    try {
      setIsDeletingLeaver(true);
      await axiosInstance.delete(`/leaver/${leaverData._id}`);
      setLeaverData(null); // Clear locally to remove from UI
      setIsDeleteLeaverConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete leaver record:', error);
    } finally {
      setIsDeletingLeaver(false);
    }
  };

  return (
    <div className="space-y-6 duration-500 animate-in fade-in">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {/* --- Leaver Section --- */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Employment Status
        </h3>

        {leaverData ? (
          <Card className="border-red-100 bg-red-50/50 shadow-sm">
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <CardTitle className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                Employee Leaver Record
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditLeaver}
                  className="h-8 border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Record
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteLeaverConfirmOpen(true)}
                  className="h-8 border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 text-sm text-gray-800 md:grid-cols-2">
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Leaving Reason:</span>{' '}
                  {leaverData.leavingReason || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold">Dismissal Reason:</span>{' '}
                  {leaverData.dissmissalReason || 'N/A'}
                </p>
                {leaverData.approvedBy && (
                  <p>
                    <span className="font-semibold">Approved By:</span>{' '}
                    {leaverData.approvedBy?.name ||
                      `${leaverData.approvedBy?.firstName} ${leaverData.approvedBy?.lastName}` ||
                      'N/A'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Termination Date:</span>{' '}
                  {leaverData.terminationDate
                    ? moment(leaverData.terminationDate).format('DD MMM, YYYY')
                    : 'N/A'}
                </p>
                {leaverData.note && (
                  <p>
                    <span className="font-semibold">Note:</span>{' '}
                    {leaverData.note || '-'}
                  </p>
                )}
              </div>
              {leaverData.documents?.length > 0 && (
                <div className="col-span-1 md:col-span-2">
                  <span className="font-semibold">Attachments:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {leaverData.documents.map((doc: string, idx: number) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-theme shadow-sm hover:underline"
                      >
                        <FileText className="h-3 w-3" /> Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Button variant="destructive" onClick={handleOpenCreateLeaver}>
            Apply for Leaver
          </Button>
        )}
      </div>

      {/* --- Apply/Update Leaver Dialog --- */}
      <Dialog open={isLeaverDialogOpen} onOpenChange={setIsLeaverDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gray-200 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Update Leaver Record' : 'Apply for Leaver'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reason for Leaving</Label>
                <Select
                  classNamePrefix="react-select"
                  options={LEAVING_REASONS}
                  value={leaverForm.leavingReason}
                  onChange={(val) =>
                    setLeaverForm((prev) => ({ ...prev, leavingReason: val }))
                  }
                  placeholder="Select reason..."
                />
                {leaverErrors.leavingReason && (
                  <p className="mt-1 text-xs text-red-500">
                    {leaverErrors.leavingReason}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Resignation/Dismissal Reason</Label>
                <Select
                  classNamePrefix="react-select"
                  options={DISMISSAL_REASONS}
                  value={leaverForm.dissmissalReason}
                  onChange={(val) =>
                    setLeaverForm((prev) => ({
                      ...prev,
                      dissmissalReason: val
                    }))
                  }
                  placeholder="Select specific reason..."
                />
                {leaverErrors.dissmissalReason && (
                  <p className="mt-1 text-xs text-red-500">
                    {leaverErrors.dissmissalReason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Termination Date</Label>
              <DatePicker
                selected={leaverForm.terminationDate}
                onChange={(date: Date) =>
                  setLeaverForm((prev) => ({ ...prev, terminationDate: date }))
                }
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-theme"
                placeholderText="Select termination date"
                dateFormat="dd-MM-yyyy"
              />
              {leaverErrors.terminationDate && (
                <p className="mt-1 text-xs text-red-500">
                  {leaverErrors.terminationDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Note{' '}
                <span className="text-xs font-normal text-gray-400">
                  (Optional)
                </span>
              </Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-theme"
                placeholder="Enter any additional notes..."
                value={leaverForm.note}
                onChange={(e) =>
                  setLeaverForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
              {leaverErrors.note && (
                <p className="mt-1 text-xs text-red-500">{leaverErrors.note}</p>
              )}
            </div>

            {/* Document Upload Implementation */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Attachments{' '}
                <span className="text-xs font-normal text-gray-400">
                  (Optional)
                </span>
              </Label>
              <div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all',
                  isUploading
                    ? 'border-theme bg-theme/5'
                    : formErrors.uploadedFiles
                      ? 'border-red-500 bg-red-50 hover:bg-red-100/50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/80'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
                    <p className="text-sm font-medium text-theme">
                      Uploading files...
                    </p>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Upload
                        className={cn(
                          'h-5 w-5',
                          formErrors.uploadedFiles
                            ? 'text-red-500'
                            : 'text-gray-500'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        formErrors.uploadedFiles
                          ? 'text-red-600'
                          : 'text-gray-700'
                      )}
                    >
                      Click or drag to upload
                    </span>
                    <span className="text-xs text-gray-500">(Max 5MB)</span>
                  </div>
                )}
              </div>

              {formErrors.uploadedFiles && !isUploading && (
                <p className="text-xs font-medium text-red-500">
                  {formErrors.uploadedFiles}
                </p>
              )}

              {uploadError && (
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>{' '}
                  {uploadError}
                </p>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-2">
                  <ul className="max-h-[140px] space-y-2 overflow-y-auto pr-1">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 flex-shrink-0 text-theme" />
                          <span className="truncate font-medium text-gray-700">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaverDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLeaverSubmit}
              disabled={isSubmittingLeaver || isUploading}
              variant="destructive"
            >
              {isSubmittingLeaver && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? 'Update Leaver' : 'Submit Leaver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete Leaver Confirmation --- */}
      <AlertDialog
        open={isDeleteLeaverConfirmOpen}
        onOpenChange={setIsDeleteLeaverConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leaver Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leaver record? This action
              cannot be undone and will restore the employee's active status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLeaver}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteLeaverConfirm}
              disabled={isDeletingLeaver}
            >
              {isDeletingLeaver && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Record
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Add Departments/Designation Dialog --- */}
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
                })
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

      {/* --- Delete Entity Assigned Items Confirmation --- */}
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
  <Card className="border border-gray-200 bg-white shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 rounded-t-xl border-gray-300 bg-gray-100 pb-2">
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
