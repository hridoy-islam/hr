import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import { useToast } from '@/components/ui/use-toast';

export const useEditEmployee = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isFieldSaving, setIsFieldSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    title: '',
    firstName: '',
    initial: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    ethnicOrigin: '',

    // Contact Information
    email: '',
    homePhone: '',
    mobilePhone: '',
    otherPhone: '',
    address: '',
    cityOrTown: '',
    stateOrProvince: '',
    postCode: '',
    country: '',

    // Employment Details
    employmentType: '',
    position: '',
    source: '',
    branch: '',
    applicationDate: null as moment.Moment | null,
    availableFromDate: null as moment.Moment | null,
    startDate: null as moment.Moment | null,
    isFullTime: false,
    carTravelAllowance: false,
    recruitmentEmploymentType: '',
    area: '',

    // Identification
    nationalInsuranceNumber: '',
    nhsNumber: '',

    // Right to Work
    rightToWork: {
      hasExpiry: false,
      expiryDate: null as moment.Moment | null
    },

    // Payroll
    payroll: {
      payrollNumber: '',
      paymentMethod: ''
    },

    // Equality Information
    equalityInformation: {
      nationality: '',
      religion: '',
      hasDisability: false,
      disabilityDetails: ''
    },

    // Disability Information
    hasDisability: false,
    disabilityDetails: '',
    needsReasonableAdjustment: false,
    reasonableAdjustmentDetails: '',

    // Beneficiary
    beneficiary: {
      fullName: '',
      relationship: '',
      email: '',
      mobile: '',
      sameAddress: false,
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postCode: '',
        country: ''
      }
    },

    // Bank Details
    accountNo: '',
    sortCode: '',

    // Department, Designation, Training
    designationId: '',
    departmentId: '',
    trainingId: [] as string[],

    // Notes
    notes: ''
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/users/${id}`);
        const data = response.data.data;

        // Set form data
        setFormData({
          // Personal Information
          title: data.title || '',
          firstName: data.firstName || '',
          initial: data.initial || '',
          lastName: data.lastName || '',
          dateOfBirth: data.dateOfBirth ? moment(data.dateOfBirth) : '',
          gender: data.gender || '',
          maritalStatus: data.maritalStatus || '',
          ethnicOrigin: data.ethnicOrigin || '',

          // Contact Information
          email: data.email || '',
          homePhone: data.homePhone || '',
          mobilePhone: data.mobilePhone || '',
          otherPhone: data.otherPhone || '',
          address: data.address || '',
          cityOrTown: data.cityOrTown || '',
          stateOrProvince: data.stateOrProvince || '',
          postCode: data.postCode || '',
          country: data.country || '',

          // Employment Details
          employmentType: data.employmentType || '',
          position: data.position || '',
          source: data.source || '',
          branch: data.branch || '',
          applicationDate: data.applicationDate
            ? moment(data.applicationDate)
            : null,
          availableFromDate: data.availableFromDate
            ? moment(data.availableFromDate)
            : null,
          startDate: data.startDate ? moment(data.startDate) : null,
          isFullTime: data.isFullTime || false,
          carTravelAllowance: data.carTravelAllowance || false,
          recruitmentEmploymentType: data.recruitmentEmploymentType || '',
          area: data.area || '',

          // Identification
          nationalInsuranceNumber: data.nationalInsuranceNumber || '',
          nhsNumber: data.nhsNumber || '',

          // Right to Work
          rightToWork: {
            hasExpiry: data.rightToWork?.hasExpiry || false,
            expiryDate: data.rightToWork?.expiryDate
              ? moment(data.rightToWork.expiryDate)
              : null
          },

          // Payroll
          payroll: {
            payrollNumber: data.payroll?.payrollNumber || '',
            paymentMethod: data.payroll?.paymentMethod || ''
          },

          // Equality Information
          equalityInformation: {
            nationality: data.equalityInformation?.nationality || '',
            religion: data.equalityInformation?.religion || '',
            hasDisability: data.equalityInformation?.hasDisability || false,
            disabilityDetails: data.equalityInformation?.disabilityDetails || ''
          },

          // Disability Information
          hasDisability: data.hasDisability || false,
          disabilityDetails: data.disabilityDetails || '',
          needsReasonableAdjustment: data.needsReasonableAdjustment || false,
          reasonableAdjustmentDetails: data.reasonableAdjustmentDetails || '',

          // Beneficiary
          beneficiary: {
            fullName: data.beneficiary?.fullName || '',
            relationship: data.beneficiary?.relationship || '',
            email: data.beneficiary?.email || '',
            mobile: data.beneficiary?.mobile || '',
            sameAddress: data.beneficiary?.sameAddress || false,
            address: {
              line1: data.beneficiary?.address?.line1 || '',
              line2: data.beneficiary?.address?.line2 || '',
              city: data.beneficiary?.address?.city || '',
              state: data.beneficiary?.address?.state || '',
              postCode: data.beneficiary?.address?.postCode || '',
              country: data.beneficiary?.address?.country || ''
            }
          },

          // Bank Details
          accountNo: data.accountNo || '',
          sortCode: data.sortCode || '',

          // Department, Designation, Training
          designationId: data.designationId || '',
          departmentId: data.departmentId || '',
          trainingId: Array.isArray(data.trainingId) ? data.trainingId : [],

          // Notes
          notes: data.notes || ''
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch employee data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, toast]);

  const updateField = useCallback(async (fieldName: string, value: any) => {
    try {
      setIsFieldSaving((prev) => ({ ...prev, [fieldName]: true }));
      
      // Create update payload with just the field being changed
      const updateData = { [fieldName]: value };
      
      // For date fields, convert moment to ISO string
      if (value && typeof value === 'object' && moment.isMoment(value)) {
        updateData[fieldName] = value.toISOString();
      }
      
      await axiosInstance.patch(`/users/${id}`, updateData);
      
      // Update local state
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value
      }));
      
      toast({
        title: 'Field updated',
        description: 'Changes saved successfully',
        duration: 1500
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not save changes'
      });
    } finally {
      setIsFieldSaving((prev) => ({ ...prev, [fieldName]: false }));
    }
  }, [id, toast]);

  const handleFieldUpdate = useCallback((fieldName: string, value: any) => {
    updateField(fieldName, value);
  }, [updateField]);

  const handleNestedFieldUpdate = useCallback((parentField: string, fieldName: string, value: any) => {
    const currentParentData = formData[parentField as keyof typeof formData] || {};
    const updatedData = {
      ...currentParentData,
      [fieldName]: value
    };
    
    updateField(parentField, updatedData);
  }, [formData, updateField]);

  const handleDateChange = useCallback((fieldName: string, dateStr: string) => {
    const parsedDate = dateStr ? moment(dateStr, 'YYYY-MM-DD') : null;
    updateField(fieldName, parsedDate);
  }, [updateField]);

  const handleSelectChange = useCallback((fieldName: string, value: string) => {
    updateField(fieldName, value);
  }, [updateField]);

  const handleCheckboxChange = useCallback((fieldName: string, checked: boolean) => {
    updateField(fieldName, checked);
  }, [updateField]);

  return {
    loading,
    activeTab,
    setActiveTab,
    formData,
    handleFieldUpdate,
    handleNestedFieldUpdate,
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving
  };
};