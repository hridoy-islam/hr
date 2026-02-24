import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Calendar,
  Mail,
  MapPin,
  MoveLeft,
  Phone
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';

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
  const user = useSelector((state: any) => state.auth.user); // Get user from Redux state

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
    // console.log('Saving personal details:', data);
  };

  const handleGeneralInformationSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, GeneralInformation: data }));
    markStepAsCompleted(1);
    setCurrentStep(2);
  };

  const handleEqualityInformationSave = (data: any) => {
    setFormData((prev) => ({ ...prev, EqualityInformation: data }));
    // console.log('Saving equality information:', data);
  };

  const handleEqualityInformationSaveAndContinue = (data: any) => {
    setFormData((prev) => ({ ...prev, EqualityInformation: data }));
    markStepAsCompleted(2);
    setCurrentStep(3);
  };

  const { id,aid } = useParams();
  const navigate = useNavigate();

  // const handleSubmit = async () => {
  //   const requiredSteps = [1, 2];
  //   const missingSteps = requiredSteps.filter(
  //     (step) => !completedSteps.includes(step)
  //   );

  //   if (missingSteps.length > 0) {
  //     const missingStepNames = missingSteps.map(
  //       (stepId) =>
  //         formSteps.find((step) => step.id === stepId)?.label ||
  //         `Step ${stepId}`
  //     );

  //     toast({
  //       title: 'Incomplete Application',
  //       description: `Please complete the following sections before submitting: ${missingStepNames.join(', ')}`,
  //       variant: 'destructive'
  //     });

  //     setCurrentStep(missingSteps[0]);
  //     return;
  //   }

  //   try {
  //     // 1. Prepare User Data
  //     const flatDataWithStatus = {
  //       ...formData.GeneralInformation,
  //       ...formData.EqualityInformation,
  //       applicantId: id,
  //       status: 'hired'
  //     };

  //     await axiosInstance.patch(`/hr/applicant/${id}`, { status: 'hired' });

  //     const { status: _, ...flatData } = flatDataWithStatus;
  //     const { status: __, ...cleanApplicant } = applicant;

  //     const data = {
  //       ...cleanApplicant,
  //       ...flatData,
  //       role: 'employee',
  //       company: user?._id
  //     };

  //     // 2. Create User
  //     const res = await axiosInstance.post(`/auth/signup`, data);
  //     const newUser = res.data.data;

  //     // 3. Create Right-to-Work Record (Only if duration > 0)

  //     await axiosInstance.post(`/hr/right-to-work`, {
  //       nextCheckDate: newUser?.rtwCheckDate,
  //       employeeId: newUser._id,
  //       updatedBy: user?._id,
  //       document: newUser?.rightToWork
  //     });

  //     // 4. Create Passport Record (If passport info exists)
  //     if (newUser.passportNo || newUser.passportExpiry) {
  //       await axiosInstance.post(`/passport`, {
  //           userId: newUser._id,
  //           passportNumber: newUser.passportNo,
  //           passportExpiryDate: newUser.passportExpiry,
  //           document:newUser.passport
  //       });
  //     }

  //     toast({
  //       title: 'Application Submitted',
  //       description: 'Your application has been successfully submitted.',
  //       variant: 'default'
  //     });

  //     navigate('/company/vacancy/recruit-applicant/employee', {
  //       state: { user: newUser }
  //     });
  //     setFormSubmitted(true);
  //   } catch (error: any) {
  //     console.error('Error during submission:', error);

  //     toast({
  //       title: 'Submission Failed',
  //       description: error?.response?.data?.message || 'Something went wrong!',
  //       variant: 'destructive'
  //     });
  //   }
  // };

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
      // 1. Prepare User Data
      const flatDataWithStatus = {
        ...formData.GeneralInformation,
        ...formData.EqualityInformation,
        applicantId: aid,
        status: 'hired'
      };

      const { status: _, ...flatData } = flatDataWithStatus;
      const { status: __,_id:applicantId, ...cleanApplicant } = applicant;

      const data = {
        ...cleanApplicant,
        ...flatData,
        role: 'employee',
        company: id
      };

      // 2. Create User (Employee) - CRITICAL STEP
      const res = await axiosInstance.post(`/auth/signup`, data);
      const newUser = res.data.data;
      // Update applicant status
      // We keep this in the main try/catch because if this fails, we probably shouldn't proceed

      await axiosInstance.patch(`/hr/applicant/${aid}`, { status: 'hired' });
      try {
        const documentTypes = [
          { key: 'passport', label: 'Passport' },
          { key: 'dbs', label: 'DBS Certificate' },
          { key: 'rightToWork', label: 'Right to Work' },
          { key: 'immigrationStatus', label: 'Immigration Status' },
          { key: 'proofOfAddress', label: 'Proof of Address' },
          { key: 'niDoc', label: 'Ni number/Driving licence' }
        ];

        const documentPromises = documentTypes
          .filter((doc) => newUser[doc.key])
          .map((doc) => {
            return axiosInstance.post('/employee-documents', {
              employeeId: newUser._id,
              documentTitle: doc.label,
              documentUrl: newUser[doc.key]
            });
          });

        if (documentPromises.length > 0) {
          await Promise.all(documentPromises);
        }
      } catch (docError) {
        console.error(
          'Failed to create employee documents, skipping step:',
          docError
        );
      }

      // 4. Create Right-to-Work Record
      try {
        await axiosInstance.post(`/hr/right-to-work`, {
          nextCheckDate: newUser?.rtwCheckDate,
          employeeId: newUser._id,
          updatedBy: user?._id,
          document: newUser?.rightToWork
        });
      } catch (rtwError) {
        console.error('Failed to create RTW record, skipping step:', rtwError);
      }

      // 5. Create Passport Record
      try {
        if (newUser.passportNo || newUser.passportExpiry) {
          await axiosInstance.post(`/passport`, {
            userId: newUser._id,
            passportNumber: newUser.passportNo,
            passportExpiryDate: newUser.passportExpiry,
            document: newUser.passport
          });
        }
      } catch (passportError) {
        console.error(
          'Failed to create Passport record, skipping step:',
          passportError
        );
      }

      toast({
        title: 'Application Submitted',
        description: 'Employee created successfully.',
        variant: 'default'
      });

      navigate(`/company/${id}/vacancy/recruit-applicant/employee`, {
        state: { user: newUser }
      });
      setFormSubmitted(true);
    } catch (error: any) {
      console.error('Critical Error during submission:', error);

      toast({
        title: 'Submission Failed',
        description:
          error?.response?.data?.message ||
          'Something went wrong during user creation!',
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
            applicantData={applicant}
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
    <div className="mx-auto  w-full">
      {/* Bounded container */}
      <div className="mx-auto ">
        {currentStep !== 3 && (
          <Card className="mb-3 bg-white  p-4 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side: Identity & Contact */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {applicant.title} {applicant?.firstName}{' '}
                    {applicant?.initial} {applicant?.lastName}
                  </h3>
                  {/* Gender & Emp Type as mini-badges next to name */}
                  <Badge className="h-5 px-1.5 text-[10px] font-semibold text-black">
                    {applicant.gender || 'N/A'}
                  </Badge>
                  <Badge className="h-5 bg-white px-1.5 text-[10px] font-semibold text-black">
                    {applicant.employmentType
                      ? applicant.employmentType
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (char) => char.toUpperCase())
                      : 'N/A'}
                  </Badge>
                </div>

                {/* Metadata Row - Flex wrap for responsiveness */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate text-black">
                      {applicant.email}
                    </span>
                  </div>
                  <div className="hidden h-3 w-px bg-gray-300 sm:block" />{' '}
                  {/* Divider */}
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 " />
                    <span className="text-black">
                      {applicant.mobilePhone || 'N/A'}
                    </span>
                  </div>
                  <div className="hidden h-3 w-px bg-gray-300 sm:block" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="max-w-[250px] truncate text-black">
                      {applicant.address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 " />
                    <span className="text-black">
                      Born:{' '}
                      {moment(applicant.dateOfBirth).format('DD MMM, YYYY')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Header */}

        {/* Step Indicator & Form */}
        <Card className="overflow-hidden  bg-white shadow-lg">
          <div className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              {currentStep !== 3 ? 'Recruit Applicant' : 'Review Application'}
            </h1>
            <Button
              className="flex h-9 items-center gap-2 bg-theme text-white hover:bg-theme/90"
              onClick={() => navigate(-1)}
            >
              <MoveLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="">{renderStep()}</div>
        </Card>
      </div>
    </div>
  );
};

export default RecruitApplicantForm;
