import React, { useEffect, useState } from 'react';
import { EditableField } from '../EditableField';
import moment from 'moment';
import axiosInstance from '@/lib/axios';
import { 
  Loader2, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Building2, 
  Clock,
  CreditCard
} from 'lucide-react';

// --- Layout Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
    <Icon className="h-4 w-4 text-theme" />
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
      {title}
    </h3>
  </div>
);

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  isSaving?: boolean;
}

const FormRow = ({ label, children, className = '', required, isSaving }: FormRowProps) => (
  <div className={`group flex flex-col border-b border-gray-100 last:border-0 sm:flex-row ${className}`}>
    {/* Label Column */}
    <div className="flex items-center justify-between bg-gray-50/30 px-4 py-3 sm:w-1/3 lg:w-2/5 xl:w-1/3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900">
          {label}
        </span>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme" />}
    </div>
    {/* Input Column */}
    <div className="flex items-center bg-white px-4 py-2 sm:w-2/3 lg:w-3/5 xl:w-2/3">
      <div className="w-full">
        {children}
      </div>
    </div>
  </div>
);

// --- Main Component ---

interface EmploymentDetailsTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onDateChange: (fieldName: string, dateStr: string) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  onCheckboxChange: (fieldName: string, checked: boolean) => void;
  isFieldSaving: Record<string, boolean>;
}

const EmploymentDetailsTab: React.FC<EmploymentDetailsTabProps> = ({
  formData,
  onUpdate,
  onDateChange,
  onSelectChange,
  onCheckboxChange,
  isFieldSaving
}) => {
  const [designations, setDesignations] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchData = async () => {
    try {
      const [designationRes, trainingRes, departmentRes] = await Promise.all([
        axiosInstance('/hr/designation'),
        axiosInstance('/hr/training'),
        axiosInstance('/hr/department')
      ]);

      setDesignations(designationRes.data.data.result);
      setTrainings(trainingRes.data.data.result);
      setDepartments(departmentRes.data.data.result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employmentTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'intern', label: 'Intern' }
  ];

  const carTravelAllowanceOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Employment Information */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={Briefcase} title="Employment Information" />
          <div className="flex flex-col">
            <FormRow 
              label="Employment Type" 
              isSaving={isFieldSaving['employmentType']}
            >
              <EditableField
                id="employmentType"
                label=""
                value={formData.employmentType}
                type="select"
                options={employmentTypeOptions}
                onUpdate={(value) => onSelectChange('employmentType', value)}
                isSaving={isFieldSaving['employmentType']}
              />
            </FormRow>

            <FormRow 
              label="Position" 
              isSaving={isFieldSaving['position']}
            >
              <EditableField
                id="position"
                label=""
                value={formData.position}
                onUpdate={(value) => onUpdate('position', value)}
                isSaving={isFieldSaving['position']}
              />
            </FormRow>

            <FormRow 
              label="Branch" 
              isSaving={isFieldSaving['branch']}
            >
              <EditableField
                id="branch"
                label=""
                value={formData.branch}
                onUpdate={(value) => onUpdate('branch', value)}
                isSaving={isFieldSaving['branch']}
              />
            </FormRow>

            <FormRow 
              label="Area" 
              isSaving={isFieldSaving['area']}
            >
              <EditableField
                id="area"
                label=""
                value={formData.area}
                onUpdate={(value) => onUpdate('area', value)}
                isSaving={isFieldSaving['area']}
              />
            </FormRow>

            <FormRow 
              label="Source" 
              isSaving={isFieldSaving['source']}
            >
              <EditableField
                id="source"
                label=""
                value={formData.source}
                onUpdate={(value) => onUpdate('source', value)}
                isSaving={isFieldSaving['source']}
              />
            </FormRow>
          </div>
        </div>

        {/* Right Column: Dates & Contract */}
        <div className=" rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={Calendar} title="Dates & Contract" />
          <div className="flex flex-col">
            <FormRow 
              label="Application Date" 
              isSaving={isFieldSaving['applicationDate']}
            >
              <EditableField
                id="applicationDate"
                label=""
                value={formData.applicationDate ? moment(formData.applicationDate).format('YYYY-MM-DD') : ''}
                type="date"
                onUpdate={(value) => onDateChange('applicationDate', value)}
                isSaving={isFieldSaving['applicationDate']}
              />
            </FormRow>

            <FormRow 
              label="Available From" 
              isSaving={isFieldSaving['availableFromDate']}
            >
              <EditableField
                id="availableFromDate"
                label=""
                value={formData.availableFromDate ? moment(formData.availableFromDate).format('YYYY-MM-DD') : ''}
                type="date"
                onUpdate={(value) => onDateChange('availableFromDate', value)}
                isSaving={isFieldSaving['availableFromDate']}
              />
            </FormRow>

            <FormRow 
              label="Start Date" 
              isSaving={isFieldSaving['startDate']}
            >
              <EditableField
                id="startDate"
                label=""
                value={formData.startDate ? moment(formData.startDate).format('YYYY-MM-DD') : ''}
                type="date"
                onUpdate={(value) => onDateChange('startDate', value)}
                isSaving={isFieldSaving['startDate']}
              />
            </FormRow>

            <FormRow 
              label="Contract Hours" 
              isSaving={isFieldSaving['contractHours']}
            >
              <EditableField
                id="contractHours"
                label=""
                type="number"
                value={formData.contractHours}
                onUpdate={(value) => onUpdate('contractHours', value)}
                isSaving={isFieldSaving['contractHours']}
              />
            </FormRow>

            <FormRow 
              label="Car Allowance" 
              isSaving={isFieldSaving['carTravelAllowance']}
            >
              <EditableField
                id="carTravelAllowance"
                label=""
                value={String(formData.carTravelAllowance)}
                type="select"
                options={carTravelAllowanceOptions}
                onUpdate={(value) => onSelectChange('carTravelAllowance', value)}
                isSaving={isFieldSaving['carTravelAllowance']}
              />
            </FormRow>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmploymentDetailsTab;