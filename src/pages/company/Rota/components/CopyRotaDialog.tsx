import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AlertTriangle, X, CalendarIcon, ArrowRight } from 'lucide-react';

// Custom Input Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RangeInput = React.forwardRef<HTMLInputElement, any>(
  ({ onClick, placeholder, displayValue, iconColor }, ref) => (
    <div className="relative w-full" onClick={onClick}>
      <input
        ref={ref}
        readOnly
        value={displayValue}
        placeholder={placeholder}
        className="flex h-10 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 pl-9 text-[13px] font-medium text-gray-800 transition-shadow"
      />
      <CalendarIcon
        className={`pointer-events-none absolute left-3 top-2.5 h-4 w-4 ${
          iconColor || 'text-gray-400'
        }`}
      />
    </div>
  )
);
RangeInput.displayName = 'RangeInput';

export default function CopyRotaDialog({
  isOpen,
  onClose,
  companyId,
  onSuccess,
  setGlobalSkippedRecords
}: any) {
  const { toast } = useToast();
  const [copyType, setCopyType] = useState<'day' | 'week' | 'month'>('week');
  const [sourceDate, setSourceDate] = useState<Date | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSourceDate(new Date());
      setTargetDate(null);
      setCopyType('week');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!sourceDate || !targetDate) return;

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post(`/rota/copy`, {
        companyId,
        type: copyType,
        sourceStart: moment(sourceDate)
          .startOf(copyType) // Moment neatly accepts 'day', 'week', or 'month'
          .format('YYYY-MM-DD'),
        targetStart: moment(targetDate)
          .startOf(copyType)
          .format('YYYY-MM-DD')
      });

      if (response.data.data.meta?.hasSkippedRecords) {
        setGlobalSkippedRecords(response.data.data.meta.skippedRecords);
      } else {
        setGlobalSkippedRecords([]);
      }

      toast({
        title: 'Success',
        description: 'All shifts copied successfully.'
      });

      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to copy rota',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRangeText = (date: Date | null) => {
    if (!date) return '';

    // If day, just show the exact day.
    if (copyType === 'day') {
      return moment(date).format('DD-MM-YYYY');
    }

    // If week or month, show the range
    const start = moment(date).startOf(copyType).format('DD-MM-YYYY');
    const end = moment(date).endOf(copyType).format('DD-MM-YYYY');

    return `${start}  to  ${end}`;
  };

  const resetDatesOnTypeChange = (type: 'day' | 'week' | 'month') => {
    setCopyType(type);
    setSourceDate(new Date());
    setTargetDate(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">
            Copy {copyType === 'day' ? 'Daily' : copyType === 'week' ? 'Weekly' : 'Monthly'} Shifts
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => resetDatesOnTypeChange('day')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                copyType === 'day' ? 'bg-theme text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Copy by Day
            </button>

            <button
              onClick={() => resetDatesOnTypeChange('week')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                copyType === 'week' ? 'bg-theme text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Copy by Week
            </button>

            <button
              onClick={() => resetDatesOnTypeChange('month')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                copyType === 'month' ? 'bg-theme text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Copy by Month
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-[11px] font-bold uppercase text-gray-600">
                Source {copyType}
              </label>
              <DatePicker
                selected={sourceDate}
                onChange={setSourceDate}
                showWeekPicker={copyType === 'week'}
                showMonthYearPicker={copyType === 'month'}
                wrapperClassName="w-full"
                customInput={
                  <RangeInput
                    displayValue={getRangeText(sourceDate)}
                    placeholder="Select source"
                  />
                }
              />
            </div>

            <ArrowRight className="mt-6 h-5 w-5 text-gray-300 flex-shrink-0" />

            <div className="flex-1">
              <label className="mb-2 block text-[11px] font-bold uppercase text-gray-600">
                Target {copyType}
              </label>
              <DatePicker
                selected={targetDate}
                onChange={setTargetDate}
                showWeekPicker={copyType === 'week'}
                showMonthYearPicker={copyType === 'month'}
                wrapperClassName="w-full"
                customInput={
                  <RangeInput
                    displayValue={getRangeText(targetDate)}
                    placeholder="Select target"
                    iconColor="text-theme"
                  />
                }
              />
            </div>
          </div>

          {/* Warning Box */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-amber-800">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Conflict Warning
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Existing shifts in the target {copyType} will be preserved.
                  Copied shifts will be added alongside existing ones.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 p-5">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !sourceDate || !targetDate}
            className="bg-theme text-white"
          >
            {isSubmitting ? 'Processing...' : 'Copy Shifts'}
          </Button>
        </div>
      </div>
    </div>
  );
}