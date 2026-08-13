import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { useToast } from '@/components/ui/use-toast';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { ArrowLeft, FileText, Loader2, Plus, Upload, X } from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface OptionType {
  value: string;
  label: string;
}

interface UploadedFile {
  name: string;
  url: string;
}

export default function CreateAuditPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);

  const [employees, setEmployees] = useState<OptionType[]>([]);
  const [serviceUsers, setServiceUsers] = useState<OptionType[]>([]);
  const [auditTypes, setAuditTypes] = useState<OptionType[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState<OptionType | null>(
    null
  );
  const [selectedServiceUser, setSelectedServiceUser] =
    useState<OptionType | null>(null);
  const [selectedAuditType, setSelectedAuditType] =
    useState<OptionType | null>(null);
  const [auditDate, setAuditDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);
      const [empRes, suRes, atRes] = await Promise.all([
        axiosInstance.get(`/users?role=employee&company=${companyId}&limit=all`),
        axiosInstance.get(`/serviceuser?companyId=${companyId}&limit=all`),
        axiosInstance.get(`/audit-type?companyId=${companyId}&limit=all`)
      ]);

      setEmployees(
        (empRes.data.data.result || []).map((e: any) => ({
          value: e._id,
          label: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || e.name
        }))
      );
      setServiceUsers(
        (suRes.data.data.result || []).map((s: any) => ({
          value: s._id,
          label: s.name
        }))
      );
      setAuditTypes(
        (atRes.data.data.result || []).map((a: any) => ({
          value: a._id,
          label: a.title
        }))
      );
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Failed to load options',
        variant: 'destructive'
      });
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [companyId]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast({
          title: `Invalid file type: ${file.name}`,
          variant: 'destructive'
        });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: `File too large: ${file.name}. Must be less than 20MB.`,
          variant: 'destructive'
        });
        return;
      }
    }

    setIsUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('entityId', user._id);
          formData.append('file_type', 'auditDoc');
          formData.append('file', file);
          const res = await axiosInstance.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return { name: file.name, url: res.data?.data?.fileUrl };
        })
      );
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch {
      toast({
        title: 'Failed to upload one or more documents.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedServiceUser || !selectedAuditType) {
      toast({
        title: 'Please select employee, service user and audit type',
        variant: 'destructive'
      });
      return;
    }
    if (!auditDate) {
      toast({
        title: 'Audit date is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyId,
        employeeId: selectedEmployee.value,
        serviceUserId: selectedServiceUser.value,
        auditTypeId: selectedAuditType.value,
        auditDate: new Date(
          Date.UTC(
            auditDate.getFullYear(),
            auditDate.getMonth(),
            auditDate.getDate()
          )
        ).toISOString(),
        note,
        document:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.url)
            : undefined,
        updatedBy: user._id
      };

      await axiosInstance.post('/audit', payload);
      toast({
        title: 'Audit created successfully',
        className: 'bg-theme text-white'
      });
      navigate(`/company/${companyId}/audit`);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to create audit',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Plus className="h-6 w-6" />
          Create Audit
        </h2>
        <Button
          size="sm"
          onClick={() => navigate(`/company/${companyId}/audit`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audits
        </Button>
      </div>

      <div className="space-y-4 rounded-md border border-gray-200 p-5">
        {auditTypes.length === 0 && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            No audit types found. Please create an audit type under Settings
            first.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Audit Type <span className="text-red-500">*</span>
            </Label>
            <Select
              options={auditTypes}
              value={selectedAuditType}
              onChange={setSelectedAuditType}
              placeholder="Select audit type..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Employee <span className="text-red-500">*</span>
            </Label>
            <Select
              options={employees}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Select employee..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Service User <span className="text-red-500">*</span>
            </Label>
            <Select
              options={serviceUsers}
              value={selectedServiceUser}
              onChange={setSelectedServiceUser}
              placeholder="Select service user..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Audit Date (DD-MM-YYYY) <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              selected={auditDate}
              onChange={(date) => setAuditDate(date)}
              dateFormat="dd-MM-yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
              placeholderText="Select audit date..."
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              wrapperClassName='w-full'
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Note <span className="font-normal text-gray-400">(Optional)</span>
          </Label>
          <Textarea
            placeholder="Add any notes about this audit..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Supporting Document(s){' '}
            <span className="font-normal text-gray-400">(Optional)</span>
          </Label>

          {uploadedFiles.length > 0 && (
            <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex w-full items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <p
                      className="truncate text-xs font-medium text-green-700"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    className="h-8 w-8 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

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
                <span className="text-sm font-medium text-gray-600">
                  Upload Audit Document(s)
                </span>
                <span className="text-xs text-gray-400">
                  PDF/Images (Max 20MB each)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/company/${companyId}/audit`)}
          >
            Cancel
          </Button>
          <Button
            className="bg-theme text-white hover:bg-theme/90"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Audit'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
