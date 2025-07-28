import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface StepperProps {
  currentStep: number
  steps: { title: string; description: string }[]
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="relative">
      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
        <motion.div
          className="absolute top-0 left-0 h-full bg-supperagent"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center">
            <motion.div
              className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                index <= currentStep
                  ? 'border-supperagent bg-supperagent text-white'
                  : 'border-gray-300 bg-white text-gray-300'
              }`}
              initial={{ scale: 1 }}
              animate={{ scale: index === currentStep ? 1.2 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {index < currentStep ? (
                <Check className="h-6 w-6" />
              ) : (
                <span>{index + 1}</span>
              )}
            </motion.div>
            <div className="mt-2 text-center">
              <motion.div
                className={`text-sm font-medium ${
                  index <= currentStep ? 'text-supperagent' : 'text-gray-500'
                }`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                {step.title}
              </motion.div>
              <motion.div
                className="text-xs text-gray-500"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.1, duration: 0.5 }}
              >
                {step.description}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

