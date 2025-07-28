import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';
import moment from 'moment';
import axiosInstance from '@/lib/axios';

const SettingsTab = ({
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


  const designationOptions = designations.map((des: any) => ({
    value: des._id,
    label: des.title
  }));

  const departmentOptions = departments.map((dep: any) => ({
    value: dep._id,
    label: dep.departmentName
  }));
  const trainingOptions = trainings.map((dep: any) => ({
    value: dep._id,
    label: dep.name
  }));

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          

          <EditableField
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
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
