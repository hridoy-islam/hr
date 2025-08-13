import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, MoveLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { formSteps } from './Components/form-steps';
import { StepsIndicator } from './Components/step-indicator';
import { Card } from '@/components/ui/card';
import { GeneralInformation } from './Components/general-info-steps';
import { EqualityInfomation } from './Components/equality-info-steps';
import ReviewStep from './Components/review-step';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import moment from 'moment';

interface FormData {
  GeneralInformation?: any;
  EqualityInformation?: any;
}

const RecruitApplicantForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const location = useLocation();
  const applicant = location.state?.applicant || '';
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

  const handleGeneralInformationSave = (data: any) => {
    setFormData((prev) => ({ ...prev, GeneralInformation: data }));
    console.log('Saving personal details:', data);
  };

  const handleGeneralInformationSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, GeneralInformation: data }));
    markStepAsCompleted(1);
    setCurrentStep(2);
  };

  const handleEqualityInformationSave = (data: any) => {
    setFormData((prev) => ({ ...prev, EqualityInformation: data }));
    console.log('Saving equality information:', data);
  };

  const handleEqualityInformationSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, EqualityInformation: data }));
    markStepAsCompleted(2);
    setCurrentStep(3);
  };

  const { id } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const requiredSteps = [1, 2];
    const missingSteps = requiredSteps.filter(
      (step) => !completedSteps.includes(step)
    );

    if (missingSteps.length > 0) {
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

      setCurrentStep(missingSteps[0]);
      return;
    }

    try {
      const flatDataWithStatus = {
        ...formData.GeneralInformation,
        ...formData.EqualityInformation,
        applicantId: id,
        status: 'hired'
      };
      // await axiosInstance.post(`/hr/recruitment`, flatDataWithStatus);
      // await axiosInstance.patch(`/hr/applicant/${id}`, {status:'hired'});
      const { status: _, ...flatData } = flatDataWithStatus;
      const { status: __, ...cleanApplicant } = applicant;
      const data = {
        ...cleanApplicant,
        ...flatData,
        role: 'employee'
      };

      // console.log(cleanApplicant)
      const res = await axiosInstance.post(`/auth/signup`, data);
      const newUser = res.data.data;

      // Create Right-to-Work record for the employee
      await axiosInstance.post(`/hr/right-to-work`, {
        nextCheckDate: moment().add(90, 'days').format('YYYY-MM-DD'), // today in YYYY-MM-DD
        employeeId: newUser._id
      });

      toast({
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted.',
        variant: 'default'
      });

      navigate('/admin/hr/recruit-applicant/employee', {
        state: { user: res.data.data }
      });
      setFormSubmitted(true);
    } catch (error: any) {
      console.error('Error during submission:', error);

      toast({
        title: 'Submission Failed',
        description: error?.response?.data?.message || 'Something went wrong!',
        variant: 'destructive'
      });
    }
  };

  const renderStep = () => {
    const handleBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));

    switch (currentStep) {
      case 1:
        return (
          <GeneralInformation
            defaultValues={formData.GeneralInformation}
            onSaveAndContinue={handleGeneralInformationSaveAndContinue}
            onSave={handleGeneralInformationSave}
          />
        );
      case 2:
        return (
          <EqualityInfomation
            defaultValues={formData.EqualityInformation}
            onSaveAndContinue={handleEqualityInformationSaveAndContinue}
            onSave={handleEqualityInformationSave}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            applicantData={applicant}
          />
        );

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
    <div className="mx-auto w-full">
      {/* Bounded container */}
      <div className="mx-auto ">
        {currentStep !== 3 && (
          <Card className="mb-6 overflow-hidden rounded-lg bg-white p-4 shadow-md">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Name:</span>
                <span className="truncate font-medium text-gray-800">
                  {applicant.title} {applicant.firstName} {applicant.initial}{' '}
                  {applicant.lastName}
                </span>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="truncate text-sm text-gray-600">
                  {applicant.email}
                </span>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Location:</span>
                <span className="text-sm text-gray-600">
                  {applicant.address || 'N/A'}
                </span>
              </div>

              {/* DOB */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">DOB:</span>
                <span className="text-sm text-gray-600">
                  {moment(applicant.dateOfBirth).format('MMM D, YYYY')}
                </span>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Phone:</span>
                <span className="text-sm text-gray-600">
                  {applicant.mobilePhone || 'N/A'}
                </span>
              </div>

              {/* Employment Type */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">
                  Employment Type:
                </span>
                <span className="text-sm text-gray-600">
                  {applicant.employmentType || 'N/A'}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Gender:</span>
                <span className="text-sm text-gray-600">
                  {applicant.gender || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {currentStep !== 3 ? 'Recruit Applicant' : 'Review Application'}
          </h1>
          <Button
            className="flex h-9 items-center gap-2 bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Step Indicator & Form */}
        <Card className="overflow-hidden  bg-white shadow-lg">
          {/* Uncomment if you want step indicator */}
          {/* <StepsIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          steps={formSteps}
          onStepClick={handleStepClick}
        /> */}

          <div className="p-6">{renderStep()}</div>
        </Card>
      </div>
    </div>
  );
};

export default RecruitApplicantForm;
