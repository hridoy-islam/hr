import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import axiosInstance from "@/lib/axios"

// Mock toast hook for demo
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`${variant || 'info'}: ${title} - ${description}`);
  }
});

export const useEditApplicant = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isFieldSaving, setIsFieldSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state based on TApplicant model
  const [formData, setFormData] = useState({
    vacancyId: '',
    image: '',
    title: '',
    firstName: '',
    initial: '',
    lastName: '',
    dateOfBirth: null as moment.Moment | null,
    nationalInsuranceNumber: '',
    nhsNumber: '',
    applicationDate: null as moment.Moment | null,
    availableFromDate: null as moment.Moment | null,
    employmentType: '',
    position: '',
    source: '',
    branch: '',
    homePhone: '',
    mobilePhone: '',
    otherPhone: '',
    email: '',
    address: '',
    cityOrTown: '',
    stateOrProvince: '',
    postCode: '',
    country: '',
    gender: '',
    maritalStatus: '',
    ethnicOrigin: '',
    hasDisability: false,
    disabilityDetails: '',
    needsReasonableAdjustment: false,
    reasonableAdjustmentDetails: '',
    status: '',
    notes: '',
    passportNo: '',
    passportExpiry: null as moment.Moment | null,
    // Document fields
    dbs: '',
    passport: '',
    rightToWork: '',
    immigrationStatus: '',
    proofOfAddress: '',
  });

  // ✅ 1. Wrap fetching logic in useCallback so it can be exported and reused
  const fetchApplicant = useCallback(async () => {
    // Optional: You can comment this out if you don't want the spinner to appear on refresh
    // setLoading(true); 
    
    try {
      const response = await axiosInstance.get(`/hr/applicant/${id}`);
      const data = response.data.data;

      setFormData({
        vacancyId: data.vacancyId || '',
        image: data.image || '',
        title: data.title || '',
        firstName: data.firstName || '',
        initial: data.initial || '',
        lastName: data.lastName || '',
        dateOfBirth: data.dateOfBirth ? moment(data.dateOfBirth) : null,
        nationalInsuranceNumber: data.nationalInsuranceNumber || '',
        nhsNumber: data.nhsNumber || '',
        applicationDate: data.applicationDate ? moment(data.applicationDate) : null,
        availableFromDate: data.availableFromDate ? moment(data.availableFromDate) : null,
        employmentType: data.employmentType || '',
        position: data.position || '',
        source: data.source || '',
        branch: data.branch || '',
        homePhone: data.homePhone || '',
        mobilePhone: data.mobilePhone || '',
        otherPhone: data.otherPhone || '',
        email: data.email || '',
        address: data.address || '',
        cityOrTown: data.cityOrTown || '',
        stateOrProvince: data.stateOrProvince || '',
        postCode: data.postCode || '',
        country: data.country || '',
        gender: data.gender || '',
        maritalStatus: data.maritalStatus || '',
        ethnicOrigin: data.ethnicOrigin || '',
        hasDisability: data.hasDisability || false,
        disabilityDetails: data.disabilityDetails || '',
        needsReasonableAdjustment: data.needsReasonableAdjustment || false,
        reasonableAdjustmentDetails: data.reasonableAdjustmentDetails || '',
        status: data.status || '',
        notes: data.notes || '',
        passportNo: data.passportNo || '',
        passportExpiry: data.passportExpiry ? moment(data.passportExpiry) : null,
        dbs: data.dbs || '',
        passport: data.passport || '',
        rightToWork: data.rightToWork || '',
        immigrationStatus: data.immigrationStatus || '',
        proofOfAddress: data.proofOfAddress || '',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch applicant data'
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  // ✅ 2. Call the function in useEffect
  useEffect(() => {
    fetchApplicant();
  }, [fetchApplicant]);

  const updateField = useCallback(
    async (fieldName: string, value: any) => {
      try {
        setIsFieldSaving((prev) => ({ ...prev, [fieldName]: true }));

        const serializedValue = moment.isMoment(value) ? value.toISOString() : value;
        const updateData = { [fieldName]: serializedValue };

        await axiosInstance.patch(`/hr/applicant/${id}`, updateData);

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
          title: error?.response?.data?.messsage || 'Update failed',
          description: 'Could not save changes'
        });
      } finally {
        setIsFieldSaving((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [id, toast]
  );

  const handleFieldUpdate = useCallback(
    (fieldName: string, value: any) => {
      updateField(fieldName, value);
    },
    [updateField]
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
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving,
    fetchApplicant // ✅ 3. Export the function
  };
};