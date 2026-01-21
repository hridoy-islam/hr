import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
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
  disable?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  id,
  label,
  value,
  type = 'text',
  options = [],
  isSaving = false,
  required = false,
  disable = false,
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFieldValue(e.target.value);
  };

  const handleSelectChange = (value: string | string[]) => {
    setFieldValue(value);
    onUpdate(value);
    setIsEditing(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFieldValue(checked);
    onUpdate(checked);
  };

  // Render Header only if label is provided (prevents empty space in table layouts)
  const renderHeader = () => {
    if (!label) return null;
    return (
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {isSaving && (
          <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
        )}
      </div>
    );
  };

  if (type === 'checkbox') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox
          id={id}
          checked={fieldValue as boolean}
          onCheckedChange={handleCheckboxChange}
          disabled={isSaving || disable}
        />
        {/* For checkbox, we typically always want the label next to it if provided */}
        {label && (
          <Label htmlFor={id} className={`${isSaving ? 'opacity-70' : ''}`}>
            {label}
            {isSaving && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </Label>
        )}
      </div>
    );
  }

if (type === 'date') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {isSaving && (
            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
          )}
        </div>

        <div className="relative">
          <DatePicker
            selected={
              fieldValue ? moment(fieldValue, 'YYYY-MM-DD').toDate() : null
            } // ✅ consistent
            onChange={(date: Date | null) => {
              const formatted = date ? moment(date).format('YYYY-MM-DD') : null;
              setFieldValue(formatted);
              onUpdate(formatted);
            }}
            dateFormat="dd-MM-yyyy"
            placeholderText="DD-MM-YYYY"
            dropdownMode="select"
            showYearDropdown
            showMonthDropdown
            className="w-full rounded p-2 text-sm"
            wrapperClassName="w-full"
          />
        </div>
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
          (opt) => Array.isArray(fieldValue) && (fieldValue as string[]).includes(opt.value)
        )
      : formattedOptions.find((opt) => opt.value === fieldValue) || null;

    return (
      <div className={`${className}`}>
        {renderHeader()}
        {isEditing ? (
          <Select
            inputId={id}
            isMulti={isMulti}
            isDisabled={isSaving || disable}
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
            placeholder={placeholder || `Select`}
            className="react-select-container text-sm"
            classNamePrefix="react-select"
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <div
            className="flex min-h-[38px] cursor-pointer items-center rounded-md border border-transparent px-2 py-1 transition-all hover:border-gray-200 hover:bg-gray-50"
            onClick={() => !disable && setIsEditing(true)}
          >
            <span
              className={`text-sm ${!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) ? 'italic text-gray-400' : ''}`}
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

  // Text / Number / Email / Textarea
  return (
    <div className={`${className}`}>
      {renderHeader()}
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
            disabled={isSaving || disable}
            required={required}
            maxLength={maxLength}
            rows={rows}
            className="w-full text-sm"
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
            disabled={isSaving || disable}
            required={required}
            maxLength={maxLength}
            max={max}
            className="w-full text-sm h-9"
          />
        )
      ) : (
        <div
          className="flex min-h-[38px] cursor-pointer items-center rounded-md border border-transparent px-2 py-1 transition-all hover:border-gray-200 hover:bg-gray-50"
          onClick={() => !disable && setIsEditing(true)}
        >
          <span className={`text-sm ${!fieldValue ? 'italic text-gray-400' : ''}`}>
            {fieldValue || 'Click to edit'}
          </span>
        </div>
      )}
    </div>
  );
};