import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSelector } from 'react-redux';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
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
  // ✅ Get user role from Redux
  const user = useSelector((state: any) => state.auth.user);
  const canEdit = user?.role === 'admin'; // 🔒 only admin can edit

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

  // 🚨 Hide field if not admin AND no value
  const isEmpty =
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0);

  if (!canEdit && isEmpty) {
    return null; // ⛔ don’t render this field
  }

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

  // 🔹 Checkbox
  if (type === 'checkbox') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox
          id={id}
          checked={fieldValue as boolean}
          onCheckedChange={handleCheckboxChange}
          disabled={isSaving || !canEdit} // ✅ disable if not admin
        />
        <Label htmlFor={id} className={`${isSaving ? 'opacity-70' : ''}`}>
          {label}
          {isSaving && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
        </Label>
      </div>
    );
  }

  // 🔹 Select
  if (type === 'select') {
    const isMulti = !!multiple;

    const formattedOptions = options.map((opt) => ({
      label: opt.label,
      value: opt.value
    }));

    const selectValue = isMulti
      ? formattedOptions.filter((opt) => Array.isArray(fieldValue) && fieldValue.includes(opt.value))
      : formattedOptions.find((opt) => opt.value === fieldValue) || null;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
        </div>

        {isEditing && canEdit ? (
          <Select
            inputId={id}
            isMulti={isMulti}
            isDisabled={isSaving || !canEdit} // ✅ disable if not admin
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
            className={`flex min-h-[38px] items-center rounded-md border border-transparent p-2 ${
              canEdit ? 'cursor-pointer hover:border-gray-200 hover:bg-gray-50' : ''
            }`}
            onClick={() => canEdit && setIsEditing(true)} // ✅ only admin can click
          >
            <span
              className={`${
                !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
                  ? 'italic text-gray-400'
                  : ''
              }`}
            >
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

  // 🔹 Default text / textarea
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      </div>

      {isEditing && canEdit ? (
        type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            value={fieldValue as string}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving || !canEdit}
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
            disabled={isSaving || !canEdit}
            required={required}
            maxLength={maxLength}
            max={max}
            className="w-full"
          />
        )
      ) : (
        <div
          className={`flex min-h-[38px] items-center rounded-md border border-transparent p-2 ${
            canEdit ? 'cursor-pointer hover:border-gray-200 hover:bg-gray-50' : ''
          }`}
          onClick={() => canEdit && setIsEditing(true)} // ✅ only admin can click
        >
          {type === 'checkbox' ? (
            <span>{(fieldValue as boolean) ? 'Yes' : 'No'}</span>
          ) : (
            <span className={`${!fieldValue ? 'italic text-gray-400' : ''}`}>
              {fieldValue || 'Click to edit'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
