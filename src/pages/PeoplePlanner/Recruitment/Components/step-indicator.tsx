'use client';

import { cn } from '@/lib/utils';
import {
  User,
  Home,
  BookOpen,
  Phone,
  Check
} from 'lucide-react';

interface StepsIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  steps: { id: number; label: string; icon: string }[];
  onStepClick: (stepId: number) => void;
}

export function StepsIndicator({
  currentStep,
  completedSteps,
  steps,
  onStepClick
}: StepsIndicatorProps) {
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'general':
        // return <User className={className} />;
        return 1;
      case 'equality':
        // return <Home className={className} />;
        return 2;     
      case 'review':
        // return <Phone className={className} />;
        return 3;
      default:
        return <User className={className} />;
    }
  };

  const progressPercentage =
     steps.length > 1 
      ? (completedSteps.length / (steps.length - 1)) * 70
      : 0;

  return (
    <div className="mb-10 pt-4 w-full relative ">
      {/* Progress bar background */}
      <div className="absolute top-10 left-[16%] right-[12%] h-1 bg-gray-200 rounded-full z-0" />

      {/* Progress bar filled */}
      <div
        className="absolute top-10 left-[16%] right-[10%] h-1 bg-blue-600 rounded-full z-10 transition-all duration-300"
        style={{ width: `${progressPercentage}%` }}
      />

      <div className="flex justify-around relative z-20">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isPrevious = step.id < currentStep;

          return (
            <div
              key={step.id}
              className="flex cursor-pointer flex-col items-center"
              onClick={() => onStepClick(step.id)}
            >
              <div
                className={cn(
                  'mb-2 flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'scale-110 bg-supperagent text-white shadow-lg'
                    : isCompleted || isPrevious
                    ? 'bg-blue-600 text-white'
                    : 'border-2 border-gray-300 bg-white text-gray-500 hover:border-blue-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : (
                  getIcon(step.icon, 'h-5 w-5')
                )}
              </div>
              <span
                className={cn(
                  'text-center text-sm font-medium transition-colors',
                  isActive
                    ? 'text-supperagent'
                    : isCompleted || isPrevious
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
