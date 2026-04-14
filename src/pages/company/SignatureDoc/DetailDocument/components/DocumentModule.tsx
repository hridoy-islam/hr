import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import ReactSelect from 'react-select';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export const REQUIRED_DOCUMENTS_LIST = [
  'Immigration Status',
  'DBS Certificate',
  'Passport',
  'Right to Work',
  'Proof of Address',
  'Application Form',
  'Curriculum Vitae',
  'Contract of Employment',
  'Confidentiality Agreement',
  'Interview Invitation Letter',
  'Interview Notes / Literacy and Numeracy Assessment',
  'Appointment Letter',
  'Job Description',
  'Induction',
  'GDPR declaration form',
  'Health Declaration / Post employment Medical Questionnaire',
  'Identification Document',
  'DBS Reference', 
  'Reference', 
  'National Insurance',
  'Bank Account Details',
  'P46 / P45',
  'Ni number/Driving licence'
];

const OPTIONAL_DOCUMENTS_LIST = [
  'Medication Administration Policy – Statement of Understanding',
  'Other Certificates (Training)',
  'Performance Review',
  'Probationary / Investigation Meeting',
  'Work availability',
  'Holiday Leave Form',
  'Pictures',
  'Car Insurance',
  'Device Details',
  'Medical Report for Absent',
  'Incident Report'
];

export const MIN_REFERENCE_COUNT = 2;

export function DocumentModule({ isOpen, onClose, document, module, employeeId }: any) {
  const { toast } = useToast();
  
  // ─── State ─────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [docType, setDocType] = useState<any>(null);
  const [otherTitle, setOtherTitle] = useState('');
  
  // User & Documents State
  const [employeeName, setEmployeeName] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/employee-documents?limit=all`, { params: { employeeId } })
      ])
        .then(([userRes, docsRes]) => {
          // Set User Data
          const user = userRes.data?.data || userRes.data;
          if (user) {
            setUserData(user);
            setEmployeeName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
          }

          // Set Existing Documents
          const docs = docsRes.data?.data?.result || [];
          setExistingDocs(docs);
        })
        .catch(console.error);
    } else {
      // Reset state on close
      setDocType(null);
      setOtherTitle('');
    }
  }, [isOpen, employeeId]);

  // ─── Computed Options for React Select ──────────────────
  const selectOptions = useMemo(() => {
    const uploadedTitles = existingDocs.map((d: any) => d.documentTitle?.trim());
    const referenceCount = uploadedTitles.filter((t: string) => t === 'Reference').length;

    let dynamicRequiredList = [...REQUIRED_DOCUMENTS_LIST];
    
    // Filter logic based on user data
    if (userData?.noRtwCheck) {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => !["Immigration Status", "Right to Work", "Passport", "Ni number/Driving licence"].includes(req)
      );
    } else if (userData?.isBritish) {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
      );
    } else {
      dynamicRequiredList = dynamicRequiredList.filter(
        (req) => req !== "Ni number/Driving licence"
      );
    }

    const filterUploaded = (list: string[]) => {
      return list
        .filter((title) => {
          if (title === 'Reference') {
            return referenceCount < MIN_REFERENCE_COUNT;
          }
          return !uploadedTitles.includes(title);
        })
        .map((title) => ({ label: title, value: title }));
    };

    const requiredOpts = filterUploaded(dynamicRequiredList);
    const optionalOpts = filterUploaded(OPTIONAL_DOCUMENTS_LIST);

    return [
      {
        label: 'Required Documents (Missing)',
        options: requiredOpts
      },
      {
        label: 'Optional Documents',
        options: optionalOpts
      },
      {
        label: 'Custom',
        options: [{ label: '+ Other (Type Manually)', value: 'Other' }]
      }
    ];
  }, [existingDocs, userData]);

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#e5e7eb',
      boxShadow: 'none',
      '&:hover': { borderColor: '#a1a1aa' },
      padding: '2px',
      fontSize: '0.875rem',
      borderRadius: '0.375rem'
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#1f2937'
    }),
    groupHeading: (base: any) => ({
      ...base,
      fontSize: '0.75rem',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  // ─── Exact Submit Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (!docType) {
      return toast({ 
        title: 'Validation Error', 
        description: 'Please select a document type.', 
        variant: 'destructive' 
      });
    }
    if (docType.value === 'Other' && !otherTitle.trim()) {
      return toast({ 
        title: 'Validation Error', 
        description: 'Please enter a title for the document.', 
        variant: 'destructive' 
      });
    }

    setIsUploading(true);
    try {
      const finalTitle = docType.value === 'Other' ? otherTitle.trim() : docType.value;

      // Payload matched EXACTLY to DocumentTab's backend requirements
      const payload = {
        employeeId: employeeId,
        documentTitle: finalTitle, 
        documentUrl: document.signedDocument,
      };

      // Changed endpoint to match DocumentTab API
      await axiosInstance.post('/employee-documents', payload);

      toast({ 
        title: 'Success', 
        description: 'Document saved successfully.' 
      });
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to save document.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading employee details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* 1. Document Type Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Document Type <span className="text-red-500">*</span>
            </Label>
            <ReactSelect
              options={selectOptions}
              value={docType}
              onChange={(selected: any) => {
                setDocType(selected);
                if (selected?.value !== 'Other') setOtherTitle('');
              }}
              placeholder="Search or Select Document..."
              className="text-sm"
              menuPortalTarget={document.body}
              styles={customSelectStyles}
            />
          </div>

          {/* 2. Custom Title Input (If 'Other' selected) */}
          {docType?.value === 'Other' && (
            <div className="space-y-2 duration-200 animate-in fade-in zoom-in-95">
              <Label className="text-sm font-semibold text-gray-700">
                Document Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter custom document title"
                value={otherTitle}
                onChange={(e) => setOtherTitle(e.target.value)}
                className="bg-gray-50"
              />
            </div>
          )}

          {/* 3. Pre-Filled Document View (Replacing standard Upload drag/drop) */}
          <div className="space-y-2 mt-2">
            <Label className="text-sm font-semibold text-gray-700">Attached File</Label>
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-theme">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_Document.pdf'}
                </p>
                <p className="text-xs text-gray-500">Document ready to be saved</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUploading || !employeeName} 
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Save Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}