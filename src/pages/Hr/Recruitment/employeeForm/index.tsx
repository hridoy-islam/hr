import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ReactSelect from 'react-select';

function EmployeeForm() {
  const [designations, setDesignations] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const userId = location.state?.user?._id || '';
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [designationRes, departmentRes] = await Promise.all([
        axiosInstance('/hr/designation'),
        // axiosInstance('/hr/training'),
        axiosInstance('/hr/department')
      ]);

      setDesignations(designationRes.data.data.result);
      // setTrainings(trainingRes.data.data.result);
      setDepartments(departmentRes.data.data.result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
  
      const payload: Record<string, string> = {};
      if (selectedDepartment) payload.departmentId = selectedDepartment;
      // if (selectedTraining) payload.trainingId = selectedTraining;
      if (selectedDesignation) payload.designationId = selectedDesignation;
  
      await axiosInstance.patch(`/users/${userId}`, payload);
  
      setSuccess(true);
      toast({
        title: 'User updated successfully',
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      navigate('/admin/hr/employee');
    }
  };
  

  const handleSkip = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate('/admin/hr/employee');
    }
  };


  console.log(departments)

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Which department does this employee belong to?
            </h2>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept: any) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
              <Button 
                onClick={() => setStep(2)} 
              >
                Next
              </Button>
            </div>
          </div>
        );

      // case 2:
      //   return (
      //     <div className="space-y-6">
      //       <h2 className="text-xl font-semibold text-gray-800">
      //         What training is the employee enrolled in?
      //       </h2>
      
      //       <ReactSelect
      //         isMulti
      //         options={trainings.map((training: any) => ({
      //           value: training._id,
      //           label: `${training.name} (Duration: ${training.validityDays} days)`              }))}
      //         value={trainings
      //           .filter((training) =>
      //             Array.isArray(selectedTraining)
      //               ? selectedTraining.includes(training._id)
      //               : false
      //           )
      //           .map((training) => ({
      //             value: training._id,
      //             label: `${training.name} (Duration: ${training.validityDays} days)`                }))}
      //         onChange={(selectedOptions) =>
      //           setSelectedTraining(selectedOptions.map((opt) => opt.value))
      //         }
      //         placeholder="Choose Trainings"
      //         styles={{
      //           control: (base) => ({
      //             ...base,
      //             borderRadius: '9px', 
      //             padding: '0px 5px',
      //           }),
                
               
                
      //         }}
      //       />
      
      //       <div className="flex justify-end gap-2">
      //         <Button variant="outline" onClick={() => setStep(3)}>
      //           Skip
      //         </Button>
      //         <Button onClick={() => setStep(3)}>Next</Button>
      //       </div>
      //     </div>
      //   );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              What is the employee's job designation?
            </h2>

            <Select
              value={selectedDesignation}
              onValueChange={setSelectedDesignation}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((desig: any) => (
                  <SelectItem key={desig._id} value={desig._id}>
                    {desig.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Finish'}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-150px)] w-full flex-col items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        {renderStep()}
      </Card>
    </div>
  );
}

export default EmployeeForm;