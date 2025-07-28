import { useState, useEffect } from 'react';

interface FormData {
  // Personal Information
  type: string | null;
  title: string | null;
  image?: any;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: string | null;
  maritalStatus?: string | null;
  ethnicOrigin?: string | null;
  religion?: string;

  // Address & Location
  address: string;
  city: string;
  postCode: string;
  country: string;

  // Contact Information
  phone?: string;
  fax?: string;
  mobile?: string;
  other?: string;
  email: string;
  website?: string;

  // Employment / Service Details
  startDate: string;
  lastDutyDate?: string;
  status: string | null;
  servicePriority: string | null;
  serviceLocationExId: string;
  timesheetSignature: boolean;
  timesheetSignatureNote?: string;

  // Additional Fields (used elsewhere in your app)
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  disability?: string;
  ethnicity?: string;
  nationality?: string;
  preferredLanguage?: string;

  // Allow flexible key-value access
  [key: string]: any;
}

interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

interface TabValidation {
  [key: string]: ValidationResult;
}

export const useEditApplicant = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isFieldSaving, setIsFieldSaving] = useState<Record<string, boolean>>(
    {}
  );
  const [formData, setFormData] = useState<FormData>({
    type: '',
    title: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    ethnicOrigin: '',
    religion: '',
    address: '',
    city: '',
    postCode: '',
    country: '',
    phone: '',
    fax: '',
    mobile: '',
    other: '',
    email: '',
    website: '',
    startDate: '',
    lastDutyDate: '',
    status: '',
    servicePriority: '',
    serviceLocationExId: '',
    timesheetSignature: undefined,
    timesheetSignatureNote: '',
    phoneNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    disability: '',
    ethnicity: '',
    nationality: '',
    preferredLanguage: '',
    emergencyContacts: [
      {
        emergencyContactName: '',
        relationship: '',
        address: '',
        cityOrTown: '',
        country: '',
        postCode: '',
        note: '',
        phone: '',
        mobile: '',
        email: '',
        emailRota: undefined,
        sendInvoice: undefined
      }
    ],
    criticalInfo: [{ date: '', type: null, details: '' }],
    primaryBranch: [
      {
        fromDate: '',
        branch: '',
        area: '',
        note: ''
      }
    ]
  });

  // Define required fields for each tab
  const requiredFieldsByTab = {
    general: [
      { field: 'type', label: 'Service User Type' },
      { field: 'title', label: 'Title' },
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'dateOfBirth', label: 'Date of Birth' },
      { field: 'maritalStatus', label: 'Marital Status' },
      { field: 'startDate', label: 'Start Date' },
      { field: 'lastDutyDate', label: 'Last Duty Date' },
      { field: 'status', label: 'Status' },
      { field: 'servicePriority', label: 'Service Priority' },
      { field: 'address', label: 'Full Address' },
      { field: 'cityOrTown', label: 'City/Town' },
      { field: 'postCode', label: 'Postal Code' },
      { field: 'country', label: 'Country' }
    ],
    equipment: [],
    expense: [],
    tag: [],
    dayOnOff: [],
    emergency: [
      { field: 'emergencyContactName', label: 'Name' },
      { field: 'relationship', label: 'Relationship' }
    ],
    criticalInfo: [
      { field: 'date', label: 'Date' },
      { field: 'type', label: 'Type' },
      { field: 'details', label: 'Details' }
    ],

    primaryBranch: [],
    note: [],
    po: [{ field: 'purchaseOrder', label: 'Requires Purchase Order?' }],
    break:[]
  };

  const getMissingFields = (
    tab: keyof typeof requiredFieldsByTab,
    formData: Record<string, any>
  ) => {
    return requiredFieldsByTab[tab]
      .filter(({ field }) => !formData[field]?.toString().trim())
      .map(({ field }) => field); // Return field names instead of labels
  };

  const validateTab = (tabId: string): ValidationResult => {
    const missingFields: string[] = [];

    if (tabId === 'emergency') {
      formData.emergencyContacts?.forEach((contact: any, index: number) => {
        requiredFieldsByTab.emergency.forEach(({ field }) => {
          if (!contact[field] || contact[field].toString().trim() === '') {
            missingFields.push(`${field}[${index}]`);
          }
        });
      });

      return {
        isValid: missingFields.length === 0,
        missingFields
      };
    }

    if (tabId === 'primaryBranch') {
      formData.primaryBranch?.forEach((item: any, index: number) => {
        requiredFieldsByTab.primaryBranch.forEach(({ field }) => {
          const value = item[field];

          const isEmpty =
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'object' && !value.value); // for select fields

          if (isEmpty) {
            missingFields.push(`${field}[${index}]`);
          }
        });
      });

      return {
        isValid: missingFields.length === 0,
        missingFields
      };
    }

    if (tabId === 'criticalInfo') {
      formData.criticalInfo?.forEach((info: any, index: number) => {
        requiredFieldsByTab.criticalInfo.forEach(({ field }) => {
          const value = info[field];
          const isEmpty =
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'object' && !value.value); // for { label, value } objects like `type`

          if (isEmpty) {
            missingFields.push(`${field}[${index}]`);
          }
        });
      });

      return {
        isValid: missingFields.length === 0,
        missingFields
      };
    }

    // All other tabs
    const requiredFields =
      requiredFieldsByTab[tabId as keyof typeof requiredFieldsByTab] || [];

    requiredFields.forEach(({ field }) => {
      // Conditionally require timesheetSignatureNote
      if (
        field === 'timesheetSignatureNote' &&
        formData['timesheetSignature'] !== false
      ) {
        return;
      }

      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const getTabValidation = (): TabValidation => {
    const validation: TabValidation = {};
    Object.keys(requiredFieldsByTab).forEach((tabId) => {
      validation[tabId] = validateTab(tabId);
    });
    return validation;
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    setIsFieldSaving((prev) => ({ ...prev, [field]: true }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsFieldSaving((prev) => ({ ...prev, [field]: false }));
  };

  const handleDateChange = async (field: string, value: string) => {
    setIsFieldSaving((prev) => ({ ...prev, [field]: true }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsFieldSaving((prev) => ({ ...prev, [field]: false }));
  };

  const handleSelectChange = async (field: string, value: string) => {
    setIsFieldSaving((prev) => ({ ...prev, [field]: true }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsFieldSaving((prev) => ({ ...prev, [field]: false }));
  };

  const handleCheckboxChange = async (field: string, value: boolean) => {
    setIsFieldSaving((prev) => ({ ...prev, [field]: true }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsFieldSaving((prev) => ({ ...prev, [field]: false }));
  };

  return {
    loading,
    activeTab,
    setActiveTab,
    formData,
    handleFieldUpdate,
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving,
    getTabValidation,
    validateTab,
    requiredFieldsByTab,
    getMissingFields
  };
};
