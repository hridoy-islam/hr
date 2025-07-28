import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, User, MapPin, Phone, Briefcase, Eye } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { ServiceUserFormData, serviceUserSchema } from './components/validation';
import { PersonalInformationStep } from './components/PersonalInformationStep';
import { EqualityStep } from './components/EqualityStep';
import { ContactInformationStep } from './components/ContactInformation';
import { EmploymentServiceStep } from './components/EmploymentServiceStep';
import { ReviewStep } from './components/ReviewStep';

const steps = [
  {
    id: 1,
    title: 'Personal Information',
    icon: User,
    component: PersonalInformationStep
  },
  {
    id: 2,
    title: 'Equality',
    icon: MapPin,
    component: EqualityStep
  },
  {
    id: 3,
    title: 'Contact Information',
    icon: Phone,
    component: ContactInformationStep
  },
  {
    id: 4,
    title: 'Employment / Service Details',
    icon: Briefcase,
    component: EmploymentServiceStep
  },
  {
    id: 5,
    title: 'Review Application',
    icon: Eye,
    component: ReviewStep
  }
];

const CreateServiceUserPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const methods = useForm<ServiceUserFormData>({
    resolver: zodResolver(serviceUserSchema),
    mode: 'onChange',
    defaultValues: {
      type: undefined,
      title: undefined,
      firstName: '',
      middleInitial: '',
      lastName: '',
      preferredName: '',
      dateOfBirth: '',
      gender: undefined,
      maritalStatus: undefined,
      ethnicOrigin: undefined,
      religion: '',
      address: '',
      city: '',
      country: undefined,
      postCode: '',
      phone: '',
      fax: '',
      mobile: '',
      other: '',
      email: '',
      website: '',
      startDate: '',
      lastDutyDate: '',
      status: undefined,
      servicePriority: undefined
    }
  });

  const { handleSubmit, trigger, formState: { errors } } = methods;

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof ServiceUserFormData)[] => {
    switch (step) {
      case 1:
        return ['type', 'title', 'firstName', 'lastName', 'dateOfBirth','address', 'city', 'country', 'postCode'];
      case 2:
        return ['gender', 'maritalStatus', 'ethnicOrigin', 'religion'];
      case 3:
        return ['email'];
      case 4:
        return ['startDate', 'status', 'servicePriority'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: ServiceUserFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', data);
      toast({
        title: 'Success!',
        description: 'Service user has been created successfully.',
        className: 'bg-green-500 border-none text-white'
      });
      
      // Reset form or redirect
      methods.reset();
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create service user. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Service User</h1>
          <p className="text-gray-600">Complete all steps to create a new service user profile</p>
        </div>

        {/* Progress Steps */}
        {/* <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-6 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div> */}

        {/* Form Content */}
        <FormProvider {...methods}>
<form onSubmit={(e) => e.preventDefault()}>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {steps[currentStep - 1].title}
                </h2>
                {/* <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div> */}
              </div>

              <CurrentStepComponent />
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center space-x-2 text-white bg-supperagent hover:bg-supepragent/90"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                 <Button
  type="button"
  onClick={handleSubmit(onSubmit)}
  disabled={isSubmitting}
  className="flex items-center space-x-2 bg-supperagent hover:bg-supperagent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed "
>
  {isSubmitting ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      <span>Creating...</span>
    </>
  ) : (
    <>
      <Check className="h-4 w-4" />
      <span>Create Service User</span>
    </>
  )}
</Button>

                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default CreateServiceUserPage;