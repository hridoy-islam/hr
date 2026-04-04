import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Upload,
  X,
  Loader2,
  FileText,
  Search,
  Eye,
  FileSignature,
  RefreshCw,
  ExternalLink
} from 'lucide-react'; // <-- Imported New Icons
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
const getInitials = (firstName?: string, lastName?: string) => {
  if (firstName && lastName)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
};

const signatureDocSchema = z.object({
  employeeIds: z
    .array(z.string())
    .min(1, 'Please select at least one employee.'),
  content: z.string().min(5, 'Content must be at least 5 characters long.'),
  document: z.string().min(1, 'Document or Template is required.')
});

type SignatureDocForm = z.infer<typeof signatureDocSchema>;

export function SendDocumentDialog({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Send Mode: 'upload' or 'template'
  const [sendMode, setSendMode] = useState<'upload' | 'template'>('upload');
  const [templates, setTemplates] = useState<
    { templateId: string; name: string }[]
  >([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id: companyId } = useParams();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignatureDocForm>({
    resolver: zodResolver(signatureDocSchema),
    defaultValues: { employeeIds: [], content: '', document: '' }
  });

  const selectedEmployees = watch('employeeIds');
  const uploadedDocument = watch('document');

  // Fetch Employees
  useEffect(() => {
    if (companyId) {
      axiosInstance
        .get(`/users?company=${companyId}&limit=all&role=employee`)
        .then((res) => setEmployees(res.data.data.result || []))
        .catch((err) => console.error(err));
    }
  }, [companyId]);

  // 🚀 NEW: Extracted fetch function so we can refresh manually
  const fetchDocuSignTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await axiosInstance.get(`/signature-documents/templates?companyId=${companyId}`);
      setTemplates(res.data.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch templates from DocuSign',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch Templates when switching to template mode
  useEffect(() => {
    if (sendMode === 'template' && templates.length === 0) {
      fetchDocuSignTemplates();
    }
  }, [sendMode]);

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  const selectedEmployeesData = employees.filter((emp) =>
    selectedEmployees.includes(emp._id)
  );

  const handleToggleEmployee = (employeeId: string) => {
    const current = selectedEmployees || [];
    if (current.includes(employeeId)) {
      setValue(
        'employeeIds',
        current.filter((id) => id !== employeeId),
        { shouldValidate: true }
      );
    } else {
      setValue('employeeIds', [...current, employeeId], {
        shouldValidate: true
      });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File exceeds 5MB limit.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValue('document', res.data.data.fileUrl || res.data.url, {
        shouldValidate: true
      });
    } catch (err) {
      toast({
        title: 'Upload Failed',
        description: 'Could not upload document.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: SignatureDocForm) => {
    if (sendMode === 'template' && !selectedTemplateId) {
      toast({
        title: 'Error',
        description: 'Please select a DocuSign template.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/signature-documents/send', {
        employeeIds: data.employeeIds,
        companyId,
        content: data.content,
        document: data.document,
        templateId: sendMode === 'template' ? selectedTemplateId : undefined
      });

      toast({
        title: 'Success',
        description: 'Documents sent to staff successfully!'
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to process document.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (
    selectedOption: { value: string; label: string } | null
  ) => {
    const val = selectedOption?.value || '';
    setSelectedTemplateId(val);
    if (val) {
      setValue('document', 'docusign-template-used', { shouldValidate: true });
    } else {
      setValue('document', '', { shouldValidate: true });
    }
  };

  const isAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployees.includes(emp._id));

  return (
    <div className="fixed inset-0 -top-8 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Send Document to Staff
            </h2>
            <p className="text-sm text-gray-500">
              Assign a signature document to your employees.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          {/* Left Column: Employees */}
          <div className="flex flex-col space-y-4">
            <label className="text-sm font-semibold text-gray-700">
              1. Select Employees
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees..."
                className="h-9 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="flex items-center space-x-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                <Checkbox
                  id="selectAll"
                  checked={isAllFilteredSelected}
                  onCheckedChange={handleToggleAll}
                />
                <label
                  htmlFor="selectAll"
                  className="cursor-pointer text-sm font-medium text-gray-700"
                >
                  Select All
                </label>
              </div>
              <div className="h-[140px] space-y-1 overflow-y-auto p-2">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-50"
                    onClick={() => handleToggleEmployee(emp._id)}
                  >
                    <Checkbox
                      checked={selectedEmployees.includes(emp._id)}
                      onCheckedChange={() => handleToggleEmployee(emp._id)}
                    />
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-theme/5 text-[10px] text-theme">
                        {getInitials(emp.firstName, emp.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">
                      {emp.firstName} {emp.lastName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-md border border-theme bg-white">
              <div className="flex items-center justify-between border-b border-theme/10 bg-theme/5 px-3 py-2">
                <span className="text-sm font-semibold text-theme">
                  Selected ({selectedEmployees.length})
                </span>
              </div>
              <div className="h-[100px] space-y-1 overflow-y-auto p-2">
                {selectedEmployeesData.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-white p-2 shadow-sm"
                  >
                    <span className="text-sm text-gray-700">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-red-500"
                      onClick={() => handleToggleEmployee(emp._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {errors.employeeIds && (
              <p className="text-xs text-red-500">
                {errors.employeeIds.message}
              </p>
            )}
          </div>

          {/* Right Column: Mode Selection & Details */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                2. Document Source
              </label>
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSendMode('upload');
                    setValue('document', '');
                    setSelectedTemplateId('');
                  }}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${sendMode === 'upload' ? 'bg-white text-theme shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Upload Custom PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendMode('template');
                    setValue('document', '');
                  }}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${sendMode === 'template' ? 'bg-white text-theme shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  DocuSign Template
                </button>
              </div>
            </div>

            {/* If Mode is Upload */}
            {sendMode === 'upload' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                <label className="text-sm font-semibold text-gray-700">
                  Attachment
                </label>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx"
                />
                <div
                  onClick={() =>
                    !isUploading &&
                    !uploadedDocument &&
                    fileInputRef.current?.click()
                  }
                  className={`flex h-[120px] ${!uploadedDocument ? 'cursor-pointer hover:bg-gray-100' : ''} flex-col items-center justify-center rounded-lg border-2 border-dashed ${errors.document ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-theme" />
                  ) : uploadedDocument ? (
                    <div className="flex flex-col items-center gap-2 text-green-600">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm font-medium">
                        Document Attached
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(uploadedDocument, '_blank');
                          }}
                        >
                          <Eye className="mr-2 h-3 w-3" /> View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload className="mr-2 h-3 w-3" /> Replace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="h-6 w-6" />
                      <span className="mt-1 text-sm text-gray-600">
                        Click to Upload Document
                      </span>
                    </div>
                  )}
                </div>
                {errors.document && (
                  <p className="text-xs text-red-500">
                    {errors.document.message}
                  </p>
                )}
              </div>
            )}

            {/* If Mode is Template */}
            {sendMode === 'template' && (
              <div className="w-full space-y-2 animate-in fade-in slide-in-from-left-4">
                {/* 1. Header Row: Label & Create New Link */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Select Template from DocuSign
                  </label>
                  <a
                    href="https://appdemo.docusign.com/templates"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-theme hover:text-theme/90 hover:underline"
                  >
                    Create New <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* 2. Input Row: React-Select & Refresh Button */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Select
                      options={templates.map((t) => ({
                        value: t.templateId,
                        label: t.name
                      }))}
                      value={
                        selectedTemplateId
                          ? {
                              value: selectedTemplateId,
                              label:
                                templates.find(
                                  (t) => t.templateId === selectedTemplateId
                                )?.name || ''
                            }
                          : null
                      }
                      onChange={handleTemplateSelect}
                      placeholder="-- Choose a template --"
                      isClearable
                      isSearchable
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '44px',
                          borderColor: errors.document ? '#fca5a5' : '#e5e7eb',
                          backgroundColor: errors.document
                            ? '#fef2f2'
                            : 'white',
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: '#cbd5e1'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Manual Refresh Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-[44px]"
                    onClick={fetchDocuSignTemplates}
                    title="Refresh Templates"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                3. Document Title / Instructions
              </label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="E.g., Please sign the updated 2024 Employee Handbook..."
                    className="min-h-[100px] resize-none"
                  />
                )}
              />
              {errors.content && (
                <p className="text-xs text-red-500">{errors.content.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isUploading}
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSignature className="mr-2 h-4 w-4" />
            )}
            Send to Staff
          </Button>
        </div>
      </div>
    </div>
  );
}
