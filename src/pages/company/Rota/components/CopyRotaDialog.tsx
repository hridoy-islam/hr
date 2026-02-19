
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AlertTriangle, X, CalendarIcon, ArrowRight } from 'lucide-react';

// Custom Input Component to display the computed date range inside the field
const RangeInput = React.forwardRef<HTMLInputElement, any>(
  ({ onClick, placeholder, displayValue, iconColor }, ref) => (
    <div className="relative w-full" onClick={onClick}>
      <input
        ref={ref}
        readOnly
        value={displayValue}
        placeholder={placeholder}
        className="flex h-10 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 pl-9 text-[13px] font-medium text-gray-800    transition-shadow"
      />
      <CalendarIcon
        className={`absolute left-3 top-2.5 h-4 w-4 pointer-events-none ${
          iconColor || 'text-gray-400'
        }`}
      />
    </div>
  )
);
RangeInput.displayName = 'RangeInput';

export default function CopyRotaDialog({ isOpen, onClose, companyId, onSuccess,setGlobalSkippedRecords }: any) {
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
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(`/rota/copy`, {
        companyId,
        type: copyType,
        sourceStart: moment(sourceDate).format('YYYY-MM-DD'),
        targetStart: moment(targetDate).format('YYYY-MM-DD')
      });

      if (response.data.data.meta?.hasSkippedRecords) {
        setGlobalSkippedRecords(response.data.data.meta.skippedRecords);
      } else {
        setGlobalSkippedRecords([]);
      }

      // 2. Close dialog
      onClose();

      
        onSuccess();
      

      toast({
        title: 'Success',
        description: 'All shifts copied successfully.'
      });

      onSuccess(); // triggers fetchUsersAndRotas → which reads ref and sets state
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
    // FIX: Changed 'isoWeek' to 'week' here as well
    const start = moment(date).startOf(copyType === 'week' ? 'week' : 'month').format('DD-MM-YYYY');
    const end = moment(date).endOf(copyType === 'week' ? 'week' : 'month').format('DD-MM-YYYY');
    return `${start}  to  ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Copy {copyType === 'week' ? 'Weekly' : 'Monthly'} Shifts
          </h2>
          <button 
            onClick={onClose} 
            className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button 
              onClick={() => { setCopyType('week'); setSourceDate(new Date()); setTargetDate(null); }} 
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                copyType === 'week' 
                  ? 'bg-theme shadow-sm text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Copy by Week
            </button>
            <button 
              onClick={() => { setCopyType('month'); setSourceDate(new Date()); setTargetDate(null); }} 
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                copyType === 'month' 
                  ? 'bg-theme shadow-sm text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Copy by Month
            </button>
          </div>

          {/* Date Selection Inputs */}
          <div className="flex items-center gap-3">
            <div className="flex-1 w-full overflow-hidden">
              <label className="text-[11px] font-bold uppercase tracking-wider  mb-2 block">
                Source {copyType}
              </label>
              <DatePicker 
                selected={sourceDate} 
                onChange={setSourceDate} 
                showWeekPicker={copyType === 'week'}
                showMonthYearPicker={copyType === 'month'}
                wrapperClassName="w-full"
                portalId='root'
                customInput={
                  <RangeInput 
                    displayValue={getRangeText(sourceDate)} 
                    placeholder="Select source" 
                    iconColor="text-gray-400"
                  />
                }
              />
            </div>
            
            <div className="pt-6 text-gray-300 flex-shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>
            
            <div className="flex-1 w-full overflow-hidden">
              <label className="text-[11px] font-bold uppercase tracking-wider  mb-2 block">
                Target {copyType}
              </label>
              <DatePicker 
                selected={targetDate} 
                onChange={setTargetDate} 
                showWeekPicker={copyType === 'week'}
                showMonthYearPicker={copyType === 'month'}
                wrapperClassName="w-full"
                portalId='root'
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

          {/* Conflict Warning Box */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-amber-800">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-900">
                  Conflict Warning
                </h4>
                <p className="text-xs leading-relaxed text-amber-700">
                  Existing shifts in the target {copyType} will be preserved. 
                  Copied shifts that conflict will be added alongside the existing ones.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !sourceDate || !targetDate} 
            className="bg-theme hover:bg-theme/90 text-white px-5 shadow-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Shifts
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}