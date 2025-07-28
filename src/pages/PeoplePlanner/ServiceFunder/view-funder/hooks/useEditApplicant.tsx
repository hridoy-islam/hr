import { useState, useEffect } from 'react';

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
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    startDate: '',
    lastDutyDate: '',
    status: '',
    servicePriority: '',
    branch: '',
    area: '',
    description: '',
    address: '',
    city: '',
    postCode: '',
    country: '',
    phone: '',
    fax: '',
    email: '',
    mobilePhone: '',
    otherPhone: '',
    website: '',
    invoice: {
      phone: '',
      fax: '',
      mobile: '',
      other: '',
      email: '',
      website: '',
      deliveryType: '',
      linked: '',
      type: '',
      name: '',
      address: '',
      cityTown: '',
      county: '',
      postCode: '',
      customerExternalId: '',
      invoiceRun: '',
      invoiceFormat: '',
      invoiceGrouping: ''
    },
    purchaseOrder: '',
    travelDetails: [
      {
        fromDate: '',
        distance: '',
        type: '',
        reason: '',
        linkedInvoiceRateSheet: ''
      }
    ],
    adhocInvoice: [
      {
        invoiceStartDate: '',
        invoiceEndDate: '',
        invoiceType: undefined,
        invoiceValue: '',
        invoiceSummary: '',
        note: ''
      }
    ]
  });

  // Define required fields for each tab
  const requiredFieldsByTab = {
    general: [
      { field: 'type', label: 'Funder Type' },
      { field: 'title', label: 'Title' },
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'startDate', label: 'Start Date' },
      { field: 'lastDutyDate', label: 'Last Duty Date' },
      { field: 'status', label: 'Status' },
      { field: 'servicePriority', label: 'Service Priority' },
      { field: 'branch', label: 'Branch' },
      { field: 'area', label: 'Area' },
      { field: 'description', label: 'Description' },
      { field: 'address', label: 'Full Address' },
      { field: 'city', label: 'City/Town' },
      { field: 'postCode', label: 'Postal Code' },
      { field: 'country', label: 'Country' }
    ],

    contact: [
      { field: 'phone', label: 'Phone Number' },
      { field: 'mobilePhone', label: 'Mobile Phone' },
      { field: 'email', label: 'Email' }
    ],
    travel: [{ field: 'travelType', label: 'Travel Type' }],
    travelDetails: [
      { field: 'fromDate', label: 'From Date' },
      { field: 'type', label: 'Travel Type' },
      { field: 'linkedInvoiceRateSheet', label: 'Linked Invoice Rate Sheet' }
    ],
    invoice: [
      { field: 'invoice.linked', label: 'Linked' },
      { field: 'invoice.type', label: 'Type' },
      { field: 'invoice.name', label: 'Name' },
      { field: 'invoice.address', label: 'Address' },
      { field: 'invoice.cityTown', label: 'City / Town' },
      { field: 'invoice.postCode', label: 'Post Code' },
      { field: 'invoice.customerExternalId', label: 'Customer External ID' },
      { field: 'invoice.invoiceRun', label: 'Invoice Run' },
      { field: 'invoice.invoiceFormat', label: 'Invoice Format' },
      { field: 'invoice.invoiceGrouping', label: 'Invoice Grouping' }
    ],
    invoiceContact: [
      { field: 'invoice.email', label: 'Email' },
      { field: 'invoice.deliveryType', label: 'Invoice Delivery Type' }
    ],
    po: [{ field: 'purchaseOrder', label: 'Requires Purchase Order?' }],
    adhocInvoice: [
      { field: 'invoiceStartDate', label: 'Invoice Start Date' },
      { field: 'invoiceEndDate', label: 'Invoice End Date' },
      { field: 'invoiceType', label: 'Invoice Type' },
      { field: 'invoiceValue', label: 'Invoice Value' },
      { field: 'invoiceSummary', label: 'Invoice Summary' },
      { field: 'note', label: 'Note' }
    ]
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

    if (tabId === 'travelDetails') {
      // Loop over each travel detail object
      formData.travelDetails?.forEach((info: any, index: number) => {
        requiredFieldsByTab.travelDetails.forEach(({ field }) => {
          const value = info[field];

          // Check if the value is empty or undefined, including for { label, value } objects
          const isEmpty =
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'object' && !value?.value); // Update this for { label, value } objects

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

    if (tabId === 'adhocInvoice') {
      formData.adhocInvoice?.forEach((info: any, index: number) => {
        requiredFieldsByTab.adhocInvoice.forEach(({ field }) => {
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
