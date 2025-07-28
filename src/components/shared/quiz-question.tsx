import { useState } from 'react'
import { Question } from '@/types/index'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from 'framer-motion'

interface QuizQuestionProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

export function QuizQuestion({ question, value, onChange }: QuizQuestionProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <Label htmlFor={question.id} className="text-lg font-medium">
        {question.question}
      </Label>
      {question.type === 'select' ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={question.id} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="relative">
          <Input
            id={question.id}
            type={question.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full p-4 text-lg"
            required={question.required}
          />
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  )
}

