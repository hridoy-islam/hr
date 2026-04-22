import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import { useToast } from '@/components/ui/use-toast';

export const useEditEmployee = () => {
  const { id, eid } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isFieldSaving, setIsFieldSaving] = useState<Record<string, boolean>>(
    {}
  );
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
    contractHours: 0,
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
      paymentMethod: '',
      bankName: '',
      accountNumber: '',
      sortCode: '',
      beneficiary: '',
      payRate:0
    },

    // Equality Information
    equalityInformation: {
      nationality: '',
      religion: '',
      hasDisability: undefined,
      disabilityDetails: ''
    },

    // Disability Information
    hasDisability: undefined,
    disabilityDetails: '',
    needsReasonableAdjustment: undefined,
    reasonableAdjustmentDetails: '',

    // Beneficiary
    beneficiary: {
      fullName: '',
      relationship: '',
      email: '',
      mobile: '',
      sameAddress: undefined,
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
        const response = await axiosInstance.get(`/users/${eid}`);
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
          image: data.image || '',
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
          drivingLicenceNo: data.drivingLicenceNo || '',

          drivingLicenceExpiry: data.drivingLicenceExpiry
            ? moment(data.drivingLicenceExpiry)
            : null,
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
          contractHours: data.contractHours || 0,
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
            paymentMethod: data.payroll?.paymentMethod || '',
            bankName: data?.payroll?.bankName || '',
            accountNumber: data?.payroll?.accountNumber || '',
            sortCode: data?.payroll?.sortCode || '',
            beneficiary: data?.payroll?.beneficiary || '',
            payRate: data.payroll?.payRate ?? 0
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
          designationId: Array.isArray(data.designationId)
            ? data.designationId
            : [],
          departmentId: Array.isArray(data.departmentId)
            ? data.departmentId
            : [],
          training: Array.isArray(data.training) ? data.training : [],
          passportNo: data.passportNo || '',
          passportExpiry: data.passportExpiry
            ? moment(data.passportExpiry)
            : '',
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
  }, [eid, toast]);

  // In useEditEmployee.tsx - fix serializeMoments
  const serializeMoments = (obj: any): any => {
    if (moment.isMoment(obj)) {
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map(serializeMoments); // ✅ arrays preserved as-is (strings pass through)
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(obj)) {
        // ❌ BUG: skipping null/undefined causes array fields set to [] to be lost
        // when the whole updateData object is processed — but more critically,
        // empty arrays ARE falsy in some checks. Preserve them explicitly:
        if (val !== null && val !== undefined) {
          result[key] = serializeMoments(val);
        } else {
          result[key] = val; // keep null/undefined as-is instead of dropping
        }
      }
      return result;
    }

    return obj;
  };

  // In useEditEmployee.tsx - updateField, fix the setFormData update for arrays
  const updateField = useCallback(
    async (fieldName: string, value: any) => {
      try {
        setIsFieldSaving((prev) => ({ ...prev, [fieldName]: true }));
        if (fieldName === 'contractHours') {
          value = Number(value);
        }

        let updateData;
        if (fieldName.includes('.')) {
          const [parentField, childField] = fieldName.split('.');
          updateData = {
            [parentField]: {
              ...(formData[parentField as keyof typeof formData] as object),
              [childField]: serializeMoments(value)
            }
          };
        } else {
          // ✅ FIX: Preserve arrays explicitly — don't let serializeMoments drop empty arrays
          updateData = {
            [fieldName]: Array.isArray(value) ? value : serializeMoments(value)
          };
        }

        await axiosInstance.patch(`/users/${eid}`, updateData);

        setFormData((prev) => ({
          ...prev,
          ...(fieldName.includes('.')
            ? {
                [fieldName.split('.')[0]]: {
                  ...(prev[
                    fieldName.split('.')[0] as keyof typeof prev
                  ] as object),
                  [fieldName.split('.')[1]]: value
                }
              }
            : { [fieldName]: value })
        }));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: error?.response?.data?.message || 'Update failed'
        });
      } finally {
        setIsFieldSaving((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [eid, toast, formData]
  );

  const handleFieldUpdate = useCallback(
    (fieldName: string, value: any) => {
      updateField(fieldName, value);
    },
    [updateField]
  );

  const handleNestedFieldUpdate = useCallback(
    (parentField: string, fieldName: string, value: any) => {
      const currentParentData =
        formData[parentField as keyof typeof formData] || {};
      const updatedData = {
        ...currentParentData,
        [fieldName]: value
      };

      updateField(parentField, updatedData);
    },
    [formData, updateField]
  );

  const handleDateChange = useCallback(
    (fieldName: string, dateStr: string) => {
      const parsedDate = dateStr ? moment(dateStr, 'YYYY-MM-DD') : null;
      updateField(fieldName, parsedDate);
    },
    [updateField]
  );

  const handleSelectChange = useCallback(
    (fieldName: string, value: string) => {
      updateField(fieldName, value);
    },
    [updateField]
  );

  const handleCheckboxChange = useCallback(
    (fieldName: string, checked: boolean) => {
      updateField(fieldName, checked);
    },
    [updateField]
  );

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
