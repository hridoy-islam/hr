import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
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

// 🚀 UPDATED: Added approverIds to the schema
const signatureDocSchema = z.object({
  employeeIds: z
    .array(z.string())
    .min(1, 'Please select at least one recipients member.'),
  approverIds: z.array(z.string()).optional(),
  content: z
    .string()
    .min(5, 'Content/Instructions must be at least 5 characters long.'),
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
  const { id: companyId } = useParams();

  // Step Management
  const [step, setStep] = useState(1);

  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [approverSearchQuery, setApproverSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sendMode, setSendMode] = useState<'upload' | 'template'>('template');
  const [templates, setTemplates] = useState<
    { templateId: string; name: string }[]
  >([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<SignatureDocForm>({
    resolver: zodResolver(signatureDocSchema),
    defaultValues: {
      employeeIds: [],
      approverIds: [],
      content: '',
      document: ''
    }
  });

  const selectedEmployees = watch('employeeIds') || [];
  const selectedApprovers = watch('approverIds') || [];
  const uploadedDocument = watch('document');

  useEffect(() => {
    if (companyId) {
      axiosInstance
        .get(`/users?company=${companyId}&limit=all&role=employee`)
        .then((res) => setEmployees(res.data.data.result || []))
        .catch((err) => console.error(err));
    }
  }, [companyId]);

  const fetchDocuSignTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await axiosInstance.get(
        `/signature-documents/templates?companyId=${companyId}`
      );
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

  useEffect(() => {
    if (sendMode === 'template' && templates.length === 0) {
      fetchDocuSignTemplates();
    }
  }, [sendMode]);

  // Employee Lists
  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  const selectedEmployeesData = employees.filter((emp) =>
    selectedEmployees.includes(emp._id)
  );

  // Approver Lists (Excluding selected recipients)
  const availableApprovers = employees.filter(
    (emp) => !selectedEmployees.includes(emp._id)
  );
  const filteredApprovers = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`
      .toLowerCase()
      .includes(approverSearchQuery.toLowerCase())
  );

  // Maintain the exact sequence of selected approvers for the timeline
  const selectedApproversData = selectedApprovers
    .map((id) => employees.find((emp) => emp._id === id))
    .filter(Boolean);

  // Handlers for recipients Selection (Step 2)
  const handleToggleEmployee = (employeeId: string) => {
    const current = selectedEmployees;
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

  const handleToggleAllEmployees = (checked: boolean) => {
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

  // Handlers for Approver Selection (Step 3)
  const handleToggleApprover = (employeeId: string) => {
    const current = selectedApprovers;
    if (current.includes(employeeId)) {
      setValue(
        'approverIds',
        current.filter((id) => id !== employeeId)
      );
    } else {
      setValue('approverIds', [...current, employeeId]);
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

  // Step Navigation logic with Validation
  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      if (sendMode === 'template' && !selectedTemplateId) {
        toast({
          title: 'Error',
          description: 'Please select a DocuSign template.',
          variant: 'destructive'
        });
        return;
      }
      isValid = await trigger(['content', 'document']);
    } else if (step === 2) {
      isValid = await trigger(['employeeIds']);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: SignatureDocForm) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/signature-documents/send', {
        employeeIds: data.employeeIds,
        approverIds: data.approverIds, 
        companyId,
        content: data.content.trim(),
        document: data.document,
        templateId: sendMode === 'template' ? selectedTemplateId : undefined
      });

      toast({ title: 'Success', description: 'Documents sent successfully!' });
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

  const getStepTitle = () => {
    if (step === 1) return 'Document Setup';
    if (step === 2) return 'Select Recipients';
    return 'Set Signing Sequence';
  };

  return (
    <div className="fixed inset-0 -top-8 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme/10 font-bold text-theme">
              {step}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getStepTitle()}
              </h2>
              <p className="text-sm text-gray-500">Step {step} of 3</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="h-[500px] overflow-y-auto p-6">
          {/* ================= STEP 1: DOCUMENT SETUP ================= */}
          {step === 1 && (
            <div className="space-y-6 duration-200 animate-in fade-in zoom-in-95">
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">
                  Title
                </label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter document title or signing instructions"
                      
                    />
                  )}
                />
                {errors.content && (
                  <p className="text-xs text-red-500">
                    {errors.content.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-800">
                  Choose how you want to prepare your document
                </label>
                <div className="flex w-full gap-2 rounded-lg bg-gray-100 p-1 md:w-1/2">
                  <button
                    type="button"
                    onClick={() => {
                      setSendMode('template');
                      setValue('document', '');
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      sendMode === 'template'
                        ? 'bg-white text-theme shadow-sm'
                        : 'text-gray-500 hover:'
                    }`}
                  >
                    DocuSign Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendMode('upload');
                      setValue('document', '');
                      setSelectedTemplateId('');
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      sendMode === 'upload'
                        ? 'bg-white text-theme shadow-sm'
                        : 'text-gray-500 hover:'
                    }`}
                  >
                    Upload Your PDF
                  </button>
                </div>
              </div>

            

              <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                {sendMode === 'upload' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800">
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
                      className={`flex h-[140px] ${!uploadedDocument ? 'cursor-pointer hover:bg-gray-50' : ''} flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                        errors.document
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-theme" />
                      ) : uploadedDocument ? (
                        <div className="flex flex-col items-center gap-3 text-green-600">
                          <FileText className="h-8 w-8" />
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
                          <Upload className="mb-2 h-8 w-8" />
                          <span className="text-sm font-medium text-gray-600">
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
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-800">
                        Select Template from DocuSign
                      </label>
                      <a
                        href="https://appdemo.docusign.com/templates"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-theme hover:underline"
                      >
                        Create New <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
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
                              borderColor: errors.document
                                ? '#fca5a5'
                                : '#d1d5db',
                              backgroundColor: errors.document
                                ? '#fef2f2'
                                : 'white',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#9ca3af' }
                            })
                          }}
                        />
                      </div>
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
              </div>
            </div>
          )}

          {/* ================= STEP 2: SELECT recipients ================= */}
          {step === 2 && (
            <div className="grid h-full grid-cols-1 gap-6 duration-200 animate-in fade-in zoom-in-95 md:grid-cols-2">
              {/* Left Panel: Selection */}
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search recipients..."
                      className="h-9 bg-white pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 border-b border-gray-200 bg-white px-4 py-3">
                  <Checkbox
                    id="selectAll"
                    checked={
                      filteredEmployees.length > 0 &&
                      filteredEmployees.every((emp) =>
                        selectedEmployees.includes(emp._id)
                      )
                    }
                    onCheckedChange={handleToggleAllEmployees}
                  />
                  <label
                    htmlFor="selectAll"
                    className="cursor-pointer text-sm font-semibold "
                  >
                    Select All Recipients
                  </label>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto bg-white p-2">
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
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={emp.image}
                          alt={`${emp.firstName} ${emp.lastName}`}
                        />
                        <AvatarFallback>
                          <img
                            src="/user.png"
                            alt="user"
                            className="h-full w-full object-cover"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium ">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Selected Summary */}
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-theme/30">
                <div className="border-b border-theme/20 bg-theme/5 p-3">
                  <h3 className="text-sm font-semibold text-theme">
                    Selected ({selectedEmployees.length})
                  </h3>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto bg-white p-3">
                  {selectedEmployeesData.map((emp) => (
                    <div
                      key={emp._id}
                      className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={emp.image}
                            alt={`${emp.firstName} ${emp.lastName}`}
                          />
                          <AvatarFallback>
                            <img
                              src="/user.png"
                              alt="user"
                              className="h-full w-full object-cover"
                            />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm ">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
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
                  {selectedEmployees.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm italic text-gray-400">
                      No recipients selected.
                    </div>
                  )}
                </div>
                {errors.employeeIds && (
                  <div className="border-t border-red-100 bg-red-50 p-3 text-xs text-red-500">
                    {errors.employeeIds.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 3: FORWARD recipients (TIMELINE) ================= */}
          {step === 3 && (
            <div className="grid h-full grid-cols-1 gap-6 duration-200 animate-in fade-in zoom-in-95 md:grid-cols-2">
              {/* Left Panel: Select Approvers */}
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search authorities..."
                      className="h-9 bg-white pl-9"
                      value={approverSearchQuery}
                      onChange={(e) => setApproverSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto bg-white p-2">
                  {filteredApprovers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No other recipients available.
                    </div>
                  ) : (
                    filteredApprovers.map((emp) => (
                      <div
                        key={emp._id}
                        className="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-50"
                        onClick={() => handleToggleApprover(emp._id)}
                      >
                        <Checkbox
                          checked={selectedApprovers.includes(emp._id)}
                          onCheckedChange={() => handleToggleApprover(emp._id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={emp.image}
                            alt={`${emp.firstName} ${emp.lastName}`}
                          />
                          <AvatarFallback>
                            <img
                              src="/user.png"
                              alt="user"
                              className="h-full w-full object-cover"
                            />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium ">
                          {emp.firstName} {emp.lastName}
                          <p className="mt-1 text-xs text-gray-500">
                              {emp?.designationId?.length
                                ? emp.designationId
                                    .map((d: any) => d.title)
                                    .join(', ')
                                : ''}
                            </p>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel: Timeline */}
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Sequential Timeline
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="relative ml-3 space-y-8 border-l-2 border-gray-200">
                    {/* Primary Signer Node (recipients) */}
                    <div className="relative flex items-center">
                      <div className="absolute -left-[9px] h-4 w-4 rounded-full border-[3px] border-white bg-theme shadow"></div>
                      <div className="pl-6">
                        <span className="text-sm font-bold text-gray-900">
                          1. Primary Signers
                        </span>
                        <p className="mt-1 text-xs text-gray-500">
                          This user will sign the document first.
                        </p>
                      </div>
                    </div>

                    {/* Sequential Approver Nodes */}
                    {selectedApproversData.map((emp: any, index: number) => (
                      <div
                        key={emp._id}
                        className="relative flex items-center animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="absolute -left-[9px] h-4 w-4 rounded-full border-[3px] border-white bg-purple-500 shadow"></div>
                        <div className="flex w-full items-center justify-between pl-6">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">
                              {index + 2}. {emp.firstName} {emp.lastName}
                            </span>
                            <p className="mt-1 text-xs text-gray-500">
                              {emp?.designationId?.length
                                ? emp.designationId
                                    .map((d: any) => d.title)
                                    .join(', ')
                                : ''}
                            </p>{' '}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={() => handleToggleApprover(emp._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Placeholder for clarity if no approvers */}
                    {selectedApproversData.length === 0 && (
                      <div className="relative flex items-center">
                        <div className="absolute -left-[9px] h-4 w-4 rounded-full border-[3px] border-white bg-gray-300"></div>
                        <div className="pl-6">
                          <span className="text-sm italic text-gray-400">
                            Finish (No further approvals)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 p-5">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={isUploading}
                className="bg-theme text-white hover:bg-theme/90"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
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
                Finish & Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
