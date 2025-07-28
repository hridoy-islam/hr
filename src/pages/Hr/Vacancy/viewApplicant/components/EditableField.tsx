import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, Pencil } from 'lucide-react';
import Select from 'react-select';


interface EditableFieldProps {
  id: string;
  label: string;
  value: string | number | boolean | string[];
  type?: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  isSaving?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onUpdate: (value: any) => void;
  maxLength?: number;
  max?: string;
  rows?: number;
  multiple?:boolean
}

export const EditableField: React.FC<EditableFieldProps> = ({
  id,
  label,
  value,
  type = 'text',
  options = [],
  isSaving = false,
  required = false,
  placeholder = '',
  className = '',
  onUpdate,
  maxLength,
  max,
  rows = 3,
  multiple = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (isEditing && fieldValue !== value) {
      onUpdate(fieldValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      if (fieldValue !== value) {
        onUpdate(fieldValue);
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setFieldValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFieldValue(e.target.value);
  };

  const handleSelectChange = (value: string) => {
    setFieldValue(value);
    onUpdate(value);
    setIsEditing(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFieldValue(checked);
    onUpdate(checked);
  };

  if (type === 'checkbox') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox 
          id={id} 
          checked={fieldValue as boolean} 
          onCheckedChange={handleCheckboxChange}
          disabled={isSaving}
        />
        <Label 
          htmlFor={id}
          className={`${isSaving ? 'opacity-70' : ''}`}
        >
          {label}
          {isSaving && <Loader2 className="ml-2 h-3 w-3 inline animate-spin" />}
        </Label>
      </div>
    );
  }

  if (type === 'select') {
    const isMulti = !!multiple;
  
    // Format options for react-select
    const formattedOptions = options.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  
    // Format value for react-select
    const selectValue = isMulti
      ? formattedOptions.filter((opt) => Array.isArray(fieldValue) && fieldValue.includes(opt.value))
      : formattedOptions.find((opt) => opt.value === fieldValue) || null;
  
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
        </div>
  
        {isEditing ? (
          <Select
            inputId={id}
            isMulti={isMulti}
            isDisabled={isSaving}
            value={selectValue}
            onChange={(selected) => {
              if (isMulti) {
                const values = (selected as any[]).map((s) => s.value);
                handleSelectChange(values);
              } else {
                handleSelectChange((selected as any)?.value || '');
              }
            }}
            options={formattedOptions}
            placeholder={placeholder || `Select ${label}`}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        ) : (
          <div
            className="p-2 border border-transparent rounded-md hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-all min-h-[38px] flex items-center"
            onClick={() => setIsEditing(true)}
          >

           <span className={`${!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) ? 'text-gray-400 italic' : ''}`}>
  {Array.isArray(fieldValue)
    ? fieldValue.length === 0
      ? 'Click to select'
      : fieldValue
          .map((val) => options.find((opt) => opt.value === val)?.label || val)
          .join(', ')
    : options.find((opt) => opt.value === fieldValue)?.label || 'Click to select'}
</span>


          </div>
        )}
      </div>
    );
  }

  

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
        {/* {isEditing ? (
          isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
          ) : (
            <Check className="h-4 w-4 text-green-500 cursor-pointer" onClick={handleBlur} />
          )
        ) : (
          <Pencil 
            className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" 
            onClick={() => setIsEditing(true)}
          />
        )} */}
      </div>
      
      {isEditing ? (
        type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            value={fieldValue as string}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            required={required}
            maxLength={maxLength}
            rows={rows}
            className="w-full"
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={id}
            type={type}
            value={fieldValue as string}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            required={required}
            maxLength={maxLength}
            max={max}
            className="w-full"
          />
        )
      ) : (
        <div 
          className="p-2 border border-transparent rounded-md hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-all min-h-[38px] flex items-center"
          onClick={() => setIsEditing(true)}
        >
          {type === 'checkbox' ? (
            <span>{(fieldValue as boolean) ? 'Yes' : 'No'}</span>
          ) : (
            <span className={`${!fieldValue ? 'text-gray-400 italic' : ''}`}>
              {fieldValue || 'Click to edit'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};