import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';
import axiosInstance from '@/lib/axios';
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

  const recruitmentEmploymentTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'intern', label: 'Intern' }
  ];

  const carTravelAllowanceOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EditableField
            id="employmentType"
            label="Employment Type"
            value={formData.employmentType}
            type="select"
            options={employmentTypeOptions}
            onUpdate={(value) => onSelectChange('employmentType', value)}
            isSaving={isFieldSaving['employmentType']}
          />

          <EditableField
            id="position"
            label="Position"
            value={formData.position}
            onUpdate={(value) => onUpdate('position', value)}
            isSaving={isFieldSaving['position']}
          />

          <EditableField
            id="source"
            label="Source"
            value={formData.source}
            onUpdate={(value) => onUpdate('source', value)}
            isSaving={isFieldSaving['source']}
          />

          <EditableField
            id="branch"
            label="Branch"
            value={formData.branch}
            onUpdate={(value) => onUpdate('branch', value)}
            isSaving={isFieldSaving['branch']}
          />

          <EditableField
            id="applicationDate"
            label="Application Date"
            value={
              formData.applicationDate
                ? formData.applicationDate.format('YYYY-MM-DD')
                : ''
            }
            type="date"
            onUpdate={(value) => onDateChange('applicationDate', value)}
            isSaving={isFieldSaving['applicationDate']}
          />

          <EditableField
            id="availableFromDate"
            label="Available From Date"
            value={
              formData.availableFromDate
                ? formData.availableFromDate.format('YYYY-MM-DD')
                : ''
            }
            type="date"
            onUpdate={(value) => onDateChange('availableFromDate', value)}
            isSaving={isFieldSaving['availableFromDate']}
          />

          <EditableField
            id="startDate"
            label="Start Date"
            value={
              formData.startDate ? formData.startDate.format('YYYY-MM-DD') : ''
            }
            type="date"
            onUpdate={(value) => onDateChange('startDate', value)}
            isSaving={isFieldSaving['startDate']}
          />

          <EditableField
            id="contractHours"
            label="Contract Hours"
            value={formData.contractHours}
            onUpdate={(value) => onUpdate('contractHours', value)}
            isSaving={isFieldSaving['contractHours']}
          />

          <EditableField
            id="carTravelAllowance"
            label="Car Travel Allowance"
            value={formData.carTravelAllowance}
            type="select"
            options={carTravelAllowanceOptions}
            onUpdate={(value) => onSelectChange('carTravelAllowance', value)}
            isSaving={isFieldSaving['carTravelAllowance']}
          />

          <EditableField
            id="area"
            label="Area"
            value={formData.area}
            onUpdate={(value) => onUpdate('area', value)}
            isSaving={isFieldSaving['area']}
          />

          {/* <EditableField
            id="designationId"
            label="Designation"
            value={formData.designationId || ''}
            type="select"
            options={designationOptions}
            onUpdate={(value) => onSelectChange('designationId', value)}
            isSaving={isFieldSaving['designationId']}
          />

          <EditableField
            id="departmentId"
            label="Department"
            value={formData.departmentId || ''}
            type="select"
            options={departmentOptions}
            onUpdate={(value) => onSelectChange('departmentId', value)}
            isSaving={isFieldSaving['departmentId']}
          />

          <EditableField
            id="trainingId"
            label="Training"
            value={formData.trainingId || ''}
            type="select"
            multiple={true}
            options={trainingOptions}
            onUpdate={(value) => onSelectChange('trainingId', value)}
            isSaving={isFieldSaving['trainingId']}
          /> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmploymentDetailsTab;
