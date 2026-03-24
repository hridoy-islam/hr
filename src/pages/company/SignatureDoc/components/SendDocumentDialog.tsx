import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, FileText, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';

// --- Helpers ---
const getInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
};

// --- Zod Schema Validation ---
const signatureDocSchema = z.object({
  employeeIds: z.array(z.string()).min(1, 'Please select at least one employee.'),
  content: z.string().min(5, 'Content must be at least 5 characters long.'),
  document: z.string().min(1, 'Please upload a document.'),
});

type SignatureDocForm = z.infer<typeof signatureDocSchema>;

interface SendDocumentDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SendDocumentDialog({ onClose, onSuccess }: SendDocumentDialogProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extract company ID from params
  const { id: companyId } = useParams();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignatureDocForm>({
    resolver: zodResolver(signatureDocSchema),
    defaultValues: {
      employeeIds: [],
      content: '',
      document: '',
    },
  });

  const selectedEmployees = watch('employeeIds');
  const uploadedDocument = watch('document');

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get(`/users?company=${companyId}&limit=all&role=employee`);
        setEmployees(response.data.data.result || []);
      } catch (error) {
        console.error('Failed to fetch employees', error);
      }
    };
    if (companyId) {
      fetchEmployees();
    }
  }, [companyId]);

  // Derived lists
  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEmployeesData = employees.filter((emp) => selectedEmployees.includes(emp._id));

  // Handlers for selection
  const handleToggleEmployee = (employeeId: string) => {
    const current = selectedEmployees || [];
    if (current.includes(employeeId)) {
      setValue(
        'employeeIds',
        current.filter((id) => id !== employeeId),
        { shouldValidate: true }
      );
    } else {
      setValue('employeeIds', [...current, employeeId], { shouldValidate: true });
    }
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setValue(
        'employeeIds',
        filteredEmployees.map((e) => e._id),
        { shouldValidate: true }
      );
    } else {
      const filteredIds = filteredEmployees.map((e) => e._id);
      setValue(
        'employeeIds',
        selectedEmployees.filter((id) => !filteredIds.includes(id)),
        { shouldValidate: true }
      );
    }
  };

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File exceeds 5MB limit.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('document', res.data.data.fileUrl || res.data.url, { shouldValidate: true });
      toast({ title: 'Success', description: 'Document uploaded successfully.' });
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Could not upload document.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Handler
  const onSubmit = async (data: SignatureDocForm) => {
    setIsSubmitting(true);
    try {
      // FIX: Map over selected employee IDs and send individual records 
      // with both companyId and employeeId explicitly defined.
      const uploadPromises = data.employeeIds.map((empId) => 
        axiosInstance.post('/signature-documents', {
          employeeId: empId,
          companyId: companyId,
          content: data.content,
          document: data.document
        })
      );

      await Promise.all(uploadPromises);

      toast({ title: 'Success', description: 'Documents sent to staff successfully!' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send documents.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployees.includes(emp._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Document to Staff</h2>
            <p className="text-sm text-gray-500">Select employees and assign a signature document.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ---------------- LEFT COLUMN: DUAL SCROLL AREAS ---------------- */}
            <div className="flex flex-col space-y-4">
              <label className="text-sm font-semibold text-gray-700">Employees</label>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search employees..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Scroll Area 1: Available Employees */}
              <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white">
                <div className="flex items-center space-x-2 bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <Checkbox
                    id="selectAll"
                    checked={isAllFilteredSelected}
                    onCheckedChange={handleToggleAll}
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Select All
                  </label>
                </div>
                <div className="h-[180px] overflow-y-auto p-2 space-y-1">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-xs text-center text-gray-500 mt-4">No employees found.</p>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleToggleEmployee(emp._id)}
                      >
                        <Checkbox
                          checked={selectedEmployees.includes(emp._id)}
                          onCheckedChange={() => handleToggleEmployee(emp._id)}
                        />
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-blue-100 text-theme">
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-700 font-medium">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scroll Area 2: Selected Employees */}
              <div className="flex flex-col border border-theme rounded-md overflow-hidden bg-white">
                <div className="bg-theme/5 border-b border-theme/10 px-3 py-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-theme">
                    Selected Employees ({selectedEmployees.length})
                  </span>
                  {selectedEmployees.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setValue('employeeIds', [], { shouldValidate: true })}
                      className="text-xs text-theme hover:text-theme/90 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="h-[140px] overflow-y-auto p-2 space-y-1">
                  {selectedEmployeesData.length === 0 ? (
                    <p className="text-xs text-center text-gray-400 mt-4">None selected yet.</p>
                  ) : (
                    selectedEmployeesData.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">
                              {getInitials(emp.firstName, emp.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleToggleEmployee(emp._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {errors.employeeIds && <p className="text-xs text-red-500">{errors.employeeIds.message}</p>}
            </div>

            {/* ---------------- RIGHT COLUMN: FORM & UPLOAD ---------------- */}
            <div className="space-y-6">
              {/* Document Content */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Document Content / Instructions</label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Write your document instructions or content here..."
                      className="min-h-[140px] resize-none focus-visible:ring-theme"
                    />
                  )}
                />
                {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Attachment</label>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`flex h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    errors.document ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-theme" />
                      <p className="text-xs text-theme">Uploading...</p>
                    </div>
                  ) : uploadedDocument ? (
                    <div className="flex flex-col items-center gap-1 text-center text-green-600">
                      <FileText className="h-8 w-8" />
                      <span className="text-sm font-medium">Document Attached</span>
                      <span className="text-xs text-gray-500">(Click to replace)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Click to Upload Document</span>
                      <span className="text-xs text-gray-400">PDF/Images (Max 5MB)</span>
                    </div>
                  )}
                </div>
                {errors.document && <p className="text-xs text-red-500">{errors.document.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isUploading}
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send to Staff
          </Button>
        </div>
      </div>
    </div>
  );
}