import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';

// New Imports for DatePicker
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  multiple?: boolean;
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
    if (isEditing && inputRef.current && type !== 'date') {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

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

  const handleSelectChange = (val: string | string[]) => {
    setFieldValue(val);
    onUpdate(val);
    setIsEditing(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFieldValue(checked);
    onUpdate(checked);
  };

  // --- Date Helpers ---
  
  // Safely parses a YYYY-MM-DD or DD-MM-YYYY string into a JS Date object for react-datepicker
  const parseDateForPicker = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // Handle standard YYYY-MM-DD
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        // Handle DD-MM-YYYY
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    // Fallback for native JS parsing
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  };

  // Formats JS Date back to YYYY-MM-DD for storage/API consistency
  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format the display text (Read-only view) strictly to DD-MM-YYYY
  const getDisplayText = () => {
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      return 'Click to edit';
    }
    
    if (type === 'date' && typeof fieldValue === 'string') {
      const parts = fieldValue.split('-');
      if (parts.length === 3) {
        // If it's YYYY-MM-DD, flip it to DD-MM-YYYY
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // If it's already DD-MM-YYYY, return it as is
        return fieldValue;
      }
    }
    
    return fieldValue as string;
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
  
    const formattedOptions = options.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  
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
            onBlur={() => setIsEditing(false)}
            autoFocus
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
        ) : type === 'date' ? (
          <DatePicker
            selected={parseDateForPicker(fieldValue as string)}
            onChange={(date: Date | null) => {
              if (date) {
                const formatted = formatDateForStorage(date);
                setFieldValue(formatted);
                onUpdate(formatted);
              } else {
                setFieldValue('');
                onUpdate('');
              }
              setIsEditing(false); // Close edit mode upon selection
            }}
            onClickOutside={() => setIsEditing(false)}
            dateFormat="dd-MM-yyyy"
            placeholderText={placeholder || "DD-MM-YYYY"}
            disabled={isSaving}
           
            autoFocus
            className="border-2 p-2 rounded-lg border-gray-300 "
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
              {getDisplayText()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};