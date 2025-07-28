import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, MoveLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { formSteps } from './Components/form-steps';
import { PersonalDetailsStep } from './Components/personal-details-step';
import { DemographicInfoStep } from './Components/demographic-info-step';
import { ContactStep } from './Components/contact-step';
import { StepsIndicator } from './Components/steps-indicator';
import { Card } from '@/components/ui/card';
import ReviewStep from './Components/review-step';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';

interface FormData {
  personalDetails?: any;
  demography?: any;
  courseDetails?: any;
  contact?: any;
  education?: any;
  employment?: any;
  compliance?: any;
  documents?: any;
  termsAndSubmit?: any;
}

export default function AddApplicant() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [formSubmitted, setFormSubmitted] = useState(false);



  const { toast } = useToast();

  // Allow navigation to any step regardless of completion status
  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const markStepAsCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps((prev) => [...prev, stepId]);
    }
  };

  const handlePersonalDetailsSave = (data: any) => {
    setFormData((prev) => ({ ...prev, personalDetails: data }));
    console.log('Saving personal details:', data);
  };

  const handlePersonalDetailsSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, personalDetails: data }));
    markStepAsCompleted(1);
    setCurrentStep(2);
  };

  const handleContactSave = (data: any) => {
    setFormData((prev) => ({ ...prev, contact: data }));
    console.log('Saving contact details:', data);
  };

  const handleContactSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, contact: data }));
    markStepAsCompleted(2);
    setCurrentStep(3);
  };

  const handledemographySave = (data: any) => {
    setFormData((prev) => ({ ...prev, demography: data }));
    console.log('Saving demography:', data);
  };

  const handledemographySaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, demography: data }));
    markStepAsCompleted(3);
    setCurrentStep(4);
  };

  // const handleReviewClick = () => {

  //   // Check if all required steps are completed before showing the review
  //   const requiredSteps = [1, 2, 3, 4, 5, 6, 7, 8]; // All steps except the final Terms & Submit
  //   const missingSteps = requiredSteps.filter(
  //     (step) => !completedSteps.includes(step)
  //   );

  //   if (missingSteps.length > 0) {
  //     // Get the names of the missing steps
  //     const missingStepNames = missingSteps.map(
  //       (stepId) =>
  //         formSteps.find((step) => step.id === stepId)?.label ||
  //         `Step ${stepId}`
  //     );

  //     toast({
  //       title: 'Incomplete Application',
  //       description: `Please complete the following sections before reviewing: ${missingStepNames.join(', ')}`,
  //       variant: 'destructive'
  //     });

  //     // Navigate to the first incomplete step
  //     setCurrentStep(missingSteps[0]);
  //     return;
  //   }

  //   setReviewModalOpen(true);
  // };

  const { id } = useParams();
  const navigate = useNavigate();

  
  const { vacancyTitle } = location.state || {};
  console.log(vacancyTitle);

  // submit full application
  const handleSubmit = async () => {
    // Check if all required steps are completed before final submission
    const requiredSteps = [1, 2, 3]; // All steps except the final Terms & Submit
    const missingSteps = requiredSteps.filter(
      (step) => !completedSteps.includes(step)
    );

    if (missingSteps.length > 0) {
      // Get the names of the missing steps
      const missingStepNames = missingSteps.map(
        (stepId) =>
          formSteps.find((step) => step.id === stepId)?.label ||
          `Step ${stepId}`
      );

      toast({
        title: 'Incomplete Application',
        description: `Please complete the following sections before submitting: ${missingStepNames.join(', ')}`,
        variant: 'destructive'
      });

      // Navigate to the first incomplete step
      setCurrentStep(missingSteps[0]);
      return;
    }

    const flatData = {
      ...formData.personalDetails,
      ...formData.contact,
      ...formData.demography
    };

    flatData.vacancyId = id;
    flatData.vacancyTitle = vacancyTitle;

    flatData.status = 'applied';
    const response = await axiosInstance.post(`/hr/applicant`, flatData);
    console.log(response);
    navigate(`/admin/hr/view-applicants/${id}`);

    // All steps are complete, proceed with submission
    console.log('Submitting form data:', formData);
    setFormSubmitted(true);
  };

  // Render the current step
  const renderStep = () => {
    const handleBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));
  
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetailsStep
            defaultValues={formData.personalDetails}
            onSaveAndContinue={handlePersonalDetailsSaveAndContinue}
            onSave={handlePersonalDetailsSave}
          />
        );
      case 2:
        return (
          <ContactStep
            defaultValues={formData.contact}
            onSaveAndContinue={handleContactSaveAndContinue}
            onSave={handleContactSave}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <DemographicInfoStep
            defaultValues={formData.demography}
            onSaveAndContinue={handledemographySaveAndContinue}
            onSave={handledemographySave}
            onBack={handleBack}
          />
        );
      case 4:
        return <ReviewStep formData={formData} onSubmit={handleSubmit} onBack={handleBack}/>;
  
      default:
        return (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <h2 className="mb-4 text-xl font-semibold">Step {currentStep}</h2>
            <p className="mb-4 text-gray-600">
              This step is not implemented yet.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  markStepAsCompleted(currentStep);
                  setCurrentStep((prev) =>
                    Math.min(formSteps.length, prev + 1)
                  );
                }}
              >
                Save & Continue
              </Button>
            </div>
          </div>
        );
    }
  };
  

  if (formSubmitted) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Success!</AlertTitle>
        <AlertDescription className="text-green-700">
          Your application has been submitted successfully. We will contact you
          shortly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full ">
      <div className='-mt-2 flex flex-row items-center justify-between pb-2'>

      <h1 className=" text-2xl font-semibold ">Add Applicant</h1>
      <Button className='bg-supperagent text-white hover:bg-supperagent/90 h-8' onClick={()=> navigate(-1)}><MoveLeft/> Back</Button>

      </div>
      <Card>
        {/* <StepsIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          steps={formSteps}
          onStepClick={handleStepClick}
        /> */}

        {renderStep()}
      </Card>
    </div>
  );
}
