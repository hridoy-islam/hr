import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Send } from 'lucide-react';
import { PayrollRequest } from '@/types/payroll';
import 'react-datepicker/dist/react-datepicker.css';

interface PayrollRequestFormProps {
  onSubmitRequest: (
    request: Omit<PayrollRequest, 'id' | 'requestDate' | 'status'>
  ) => void;
  isSubmitting?: boolean;
}

export const PayrollRequestForm: React.FC<PayrollRequestFormProps> = ({
  onSubmitRequest,
  isSubmitting = false
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!startDate || !endDate || !reason.trim()) return;

  onSubmitRequest({
    fromDate: startDate,
    toDate: endDate,
    reason: reason.trim(),
  });

  setStartDate(null);
  setEndDate(null);
  setReason('');
};

  const isFormValid =
    startDate && endDate && reason.trim() && startDate <= endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Request Payroll Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Request payroll information for a specific date range
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Select start date"
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="MMM dd, yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode='select'
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="Select end date"
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="MMM dd, yyyy"
                 showMonthDropdown
                showYearDropdown
                dropdownMode='select'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason for Request
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need this payroll data..."
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500">
              {reason.length}/500 characters
            </div>
          </div>

          {startDate && endDate && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Request Summary:</strong> Payroll data from{' '}
                {format(startDate, 'MMM dd, yyyy')} to{' '}
                {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-theme text-white hover:bg-theme/90"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
