import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BulkInvoiceModal = ({ isOpen, onClose }: BulkInvoiceModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedDate) return;

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Generating invoices for:', selectedDate);
      setIsGenerating(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Bulk Payslips</DialogTitle>
          <DialogDescription>
            Select month and year to generate payslips for all active service
            users.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="month-year"
              className="block text-sm font-medium text-gray-700"
            >
              Select Month and Year
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              showFullMonthYearPicker
              preventOpenOnFocus={true} // prevents auto open on focus
              className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedDate || isGenerating}
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            {isGenerating ? 'Generating...' : 'Generate Payslips'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkInvoiceModal;
