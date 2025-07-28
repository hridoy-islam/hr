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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeScrollListProps {
  title: string;
  items: { value: number; label: string }[];
  selectedValue: number;
  onSelect: (value: number) => void;
}

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
    | 'checkbox'
    | 'time';
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
  isMissing?: boolean;
  compact?: boolean;
}

function TimeScrollList({
  items,
  selectedValue,
  onSelect
}: TimeScrollListProps) {
  return (
    <ScrollArea className="h-32 rounded-md">
      <div className="flex flex-col gap-1 p-1">
        {items.map((item) => (
          <Button
            key={item.value}
            variant="ghost"
            className={cn(
              'h-8 w-full justify-center px-1 text-xs',
              item.value === selectedValue && 'bg-gray-100 font-medium'
            )}
            onClick={() => onSelect(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
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
  rows = 2,
  multiple = false,
  isMissing = false,
  compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  const [tempTime, setTempTime] = useState({
    hour: 0,
    minute: 0
  });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setFieldValue(value);

    if (type === 'time' && typeof value === 'string') {
      const [hour, minute] = value.split(':').map(Number);
      setTempTime({
        hour: isNaN(hour) ? 0 : hour,
        minute: isNaN(minute) ? 0 : minute
      });
    }
  }, [value, type]);

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

  const formatTime = (timeStr: string | number) => {
    if (!timeStr) return '';
    if (typeof timeStr === 'string') {
      const [hour, minute] = timeStr.split(':').map(Number);
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    return timeStr.toString();
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

  const handleTimeSave = () => {
    const timeStr = `${String(tempTime.hour).padStart(2, '0')}:${String(tempTime.minute).padStart(2, '0')}`;
    setFieldValue(timeStr);
    onUpdate(timeStr);
    setIsEditing(false);
  };

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
          className={`h-4 w-4 ${isMissing ? 'border-red-500' : ''}`}
        />
        <Label
          htmlFor={id}
          className={`text-xs ${isSaving ? 'opacity-70' : ''} ${isMissing ? 'text-red-600' : ''}`}
        >
          {label}
          {isSaving && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
          {isMissing && <span className="ml-0.5 text-red-500">*</span>}
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
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className={`text-xs ${isMissing ? 'text-red-600' : ''}`}>
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
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
                minHeight: '32px',
                fontSize: '0.75rem',
                borderColor: isMissing ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: isMissing ? '#ef4444' : base.borderColor
                }
              }),
              option: (base) => ({
                ...base,
                fontSize: '0.75rem',
                padding: '4px 8px'
              }),
              menu: (base) => ({
                ...base,
                fontSize: '0.75rem'
              }),
              singleValue: (base) => ({
                ...base,
                fontSize: '0.75rem'
              }),
              multiValue: (base) => ({
                ...base,
                fontSize: '0.75rem'
              }),
              input: (base) => ({
                ...base,
                fontSize: '0.75rem',
                margin: 0,
                padding: 0
              })
            }}
          />
        ) : (
          <div
            className={`flex min-h-[32px] cursor-pointer items-center rounded-md border ${getBorderColor()} p-1.5 text-xs transition-all hover:border-gray-200 hover:bg-gray-50`}
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
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={`text-xs ${isMissing ? 'text-red-600' : ''}`}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
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
            className={`w-full text-xs ${isMissing ? 'border-red-500' : 'border-gray-300'}`}
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
            className={`w-full rounded-md border text-xs ${isMissing ? 'border-red-500' : 'border-gray-300'} px-2 py-1.5`}
            dateFormat="MM-dd-yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        ) : type === 'time' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-xs rounded-lg bg-white p-4">
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="mb-1 text-sm font-medium">Select {label}</div>
                  <div className="mb-2 flex items-center justify-center space-x-1">
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={tempTime.hour.toString().padStart(2, '0')}
                      onChange={(e) => {
                        const val = Math.min(
                          23,
                          Math.max(0, parseInt(e.target.value)) || 0
                        );
                        setTempTime((prev) => ({ ...prev, hour: val }));
                      }}
                      className="w-14 text-center text-xl font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xl font-medium">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={tempTime.minute.toString().padStart(2, '0')}
                      onChange={(e) => {
                        const val = Math.min(
                          59,
                          Math.max(0, parseInt(e.target.value)) || 0
                        );
                        setTempTime((prev) => ({ ...prev, minute: val }));
                      }}
                      className="w-14 text-center text-xl font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 border border-gray-300 rounded-md">
                    <div className="mb-0.5 text-center text-xs font-medium">
                      Hours
                    </div>
                    <TimeScrollList
                      items={Array.from({ length: 24 }, (_, i) => ({
                        value: i,
                        label: String(i).padStart(2, '0')
                      }))}
                      selectedValue={tempTime.hour}
                      onSelect={(val) =>
                        setTempTime((prev) => ({ ...prev, hour: val }))
                      }
                    />
                  </div>
                  <div className="flex-1 border border-gray-300 rounded-md">
                    <div className="mb-0.5 text-center text-xs font-medium">
                      Minutes
                    </div>
                    <TimeScrollList
                      items={Array.from({ length: 60 }, (_, i) => i).map(
                        (m) => ({
                          value: m,
                          label: String(m).padStart(2, '0')
                        })
                      )}
                      selectedValue={tempTime.minute}
                      onSelect={(val) =>
                        setTempTime((prev) => ({ ...prev, minute: val }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFieldValue(value);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTimeSave}
                    className="hover:bg-suppergant/90 bg-supperagent text-white"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
            className={`w-full text-xs ${isMissing ? 'border-red-500' : ''}`}
          />
        )
      ) : (
        <div
          className={`flex min-h-[32px] cursor-pointer items-center rounded-md border ${getBorderColor()} p-1.5 text-xs transition-all hover:border-gray-200 hover:bg-gray-50`}
          onClick={() => setIsEditing(true)}
        >
          {type === 'checkbox' ? (
            <span>{(fieldValue as boolean) ? 'Yes' : 'No'}</span>
          ) : (
            <span
              className={`${!fieldValue ? 'italic text-gray-400' : ''} ${isMissing ? 'text-red-600' : ''}`}
            >
              {type === 'date'
                ? fieldValue
                  ? formatDate(fieldValue)
                  : 'Click to select'
                : type === 'time'
                  ? fieldValue
                    ? formatTime(fieldValue)
                    : 'Click to select'
                  : fieldValue || 'Click to edit'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};