import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, Pencil } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

interface EditableFieldProps {
  id: string;
  label: string;
  value: string | number | boolean | string[];
  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'email'
    | 'textarea'
    | 'select'
    | 'checkbox';
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
  isMissing?: boolean; // New prop to indicate if this is a missing required field
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
  multiple = false,
  isMissing = false // Default to false
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

  const formatDate = (dateStr: string | number) => {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('MM-DD-YYYY') : dateStr.toString();
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  // Determine border color based on missing status
  const getBorderColor = () => {
    if (isMissing) return 'border-red-500';
    if (isEditing) return 'border-blue-500';
    return 'border-transparent';
  };

  if (type === 'checkbox') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox
          id={id}
          checked={fieldValue as boolean}
          onCheckedChange={handleCheckboxChange}
          disabled={isSaving}
          className={isMissing ? 'border-red-500' : ''}
        />
        <Label htmlFor={id} className={`${isSaving ? 'opacity-70' : ''} ${isMissing ? 'text-red-600' : ''}`}>
          {label}
          {isSaving && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          {isMissing && <span className="ml-1 text-red-500">*</span>}
        </Label>
      </div>
    );
  }

  if (type === 'select') {
    const isMulti = !!multiple;

    const formattedOptions = options.map((opt) => ({
      label: opt.label,
      value: opt.value
    }));

    const selectValue = isMulti
      ? formattedOptions.filter(
          (opt) => Array.isArray(fieldValue) && fieldValue.includes(opt.value)
        )
      : formattedOptions.find((opt) => opt.value === fieldValue) || null;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className={isMissing ? 'text-red-600' : ''}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {isSaving && (
            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
          )}
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
            styles={{
              control: (base) => ({
                ...base,
                borderColor: isMissing ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: isMissing ? '#ef4444' : base.borderColor
                }
              })
            }}
          />
        ) : (
          <div
            className={`flex min-h-[38px] cursor-pointer items-center rounded-md border ${getBorderColor()} p-2 transition-all hover:border-gray-200 hover:bg-gray-50`}
            onClick={() => setIsEditing(true)}
          >
            <span
              className={`${!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) ? 'italic text-gray-400' : ''} ${isMissing ? 'text-red-600' : ''}`}
            >
              {Array.isArray(fieldValue)
                ? fieldValue.length === 0
                  ? 'Click to select'
                  : fieldValue
                      .map(
                        (val) =>
                          options.find((opt) => opt.value === val)?.label || val
                      )
                      .join(', ')
                : options.find((opt) => opt.value === fieldValue)?.label ||
                  'Click to select'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={isMissing ? 'text-red-600' : ''}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
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
            className={`w-full ${isMissing ? 'border-red-500' : 'border-gray-300'}`}
          />
        ) : type === 'date' ? (
          <DatePicker
            selected={fieldValue ? new Date(fieldValue as string) : null}
            onChange={(date: Date | null) => {
              const iso = date ? date.toISOString().split('T')[0] : '';
              setFieldValue(iso);
              onUpdate(iso);
              setIsEditing(false);
            }}
            onBlur={handleBlur}
            placeholderText={placeholder || 'Select date'}
            disabled={isSaving}
            className={`w-full rounded-md border ${isMissing ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
            dateFormat="MM-dd-yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
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
            className={`w-full ${isMissing ? 'border-red-500' : ''}`}
          />
        )
      ) : (
        <div
          className={`flex min-h-[38px] cursor-pointer items-center rounded-md border ${getBorderColor()} p-2 transition-all hover:border-gray-200 hover:bg-gray-50`}
          onClick={() => setIsEditing(true)}
        >
          {type === 'checkbox' ? (
            <span>{(fieldValue as boolean) ? 'Yes' : 'No'}</span>
          ) : (
            <span className={`${!fieldValue ? 'italic text-gray-400' : ''} ${isMissing ? 'text-red-600' : ''}`}>
              {type === 'date' 
                ? (fieldValue ? formatDate(fieldValue) : 'Click to select') 
                : (fieldValue || 'Click to edit')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};