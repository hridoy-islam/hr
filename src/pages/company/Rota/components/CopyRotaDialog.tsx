import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AlertTriangle, X, CalendarIcon, ArrowRight } from 'lucide-react';

// Custom Input Component
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
  const [copyType, setCopyType] = useState<'week' | 'month'>('week');
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
          .startOf(copyType === 'week' ? 'week' : 'month')
          .format('YYYY-MM-DD'),
        targetStart: moment(targetDate)
          .startOf(copyType === 'week' ? 'week' : 'month')
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

    const start = moment(date)
      .startOf(copyType === 'week' ? 'week' : 'month')
      .format('DD-MM-YYYY');

    const end = moment(date)
      .endOf(copyType === 'week' ? 'week' : 'month')
      .format('DD-MM-YYYY');

    return `${start}  to  ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">
            Copy {copyType === 'week' ? 'Weekly' : 'Monthly'} Shifts
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
              onClick={() => {
                setCopyType('week');
                setSourceDate(new Date());
                setTargetDate(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                copyType === 'week' ? 'bg-theme text-white' : 'text-gray-500'
              }`}
            >
              Copy by Week
            </button>

            <button
              onClick={() => {
                setCopyType('month');
                setSourceDate(new Date());
                setTargetDate(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                copyType === 'month' ? 'bg-theme text-white' : 'text-gray-500'
              }`}
            >
              Copy by Month
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-2 block text-[11px] font-bold uppercase">
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

            <ArrowRight className="mt-6 h-5 w-5 text-gray-300" />

            <div className="flex-1">
              <label className="mb-2 block text-[11px] font-bold uppercase">
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
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Conflict Warning
                </h4>
                <p className="text-xs text-amber-700">
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
