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
  onSubmitRequest: (request: Omit<PayrollRequest, 'id' | 'requestDate' | 'status'>) => void;
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
      employeeId: 'EMP001', // This would come from auth context
      requestedBy: 'John Doe', // This would come from auth context
      startDate,
      endDate,
      reason: reason.trim()
    });

    // Reset form
    setStartDate(null);
    setEndDate(null);
    setReason('');
  };

  const isFormValid = startDate && endDate && reason.trim() && startDate <= endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Request Payroll Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Request payroll information for a specific date range
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Select start date"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dateFormat="MMM dd, yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dateFormat="MMM dd, yyyy"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Request
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need this payroll data..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          {startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Request Summary:</strong> Payroll data from{' '}
                {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-supperagent text-white hover:bg-supperagent/90"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};