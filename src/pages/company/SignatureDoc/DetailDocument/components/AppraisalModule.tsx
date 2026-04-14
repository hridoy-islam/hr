import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2, FileText, AlertCircle, Award } from 'lucide-react';
import moment from '@/lib/moment-setup';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function AppraisalModule({ isOpen, onClose, document, module, employeeId }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ─────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [newCheckDate, setNewCheckDate] = useState<Date | null>(null);

  // User & Appraisal Data State
  const [employeeName, setEmployeeName] = useState<string>('');
  const [appraisalId, setAppraisalId] = useState<string | null>(null);
  const [currentCheckDate, setCurrentCheckDate] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/appraisal?employeeId=${employeeId}`)
      ])
        .then(([userRes, appraisalRes]) => {
          // Set User Data
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setEmployeeName(`${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim());
          }

          // Set Existing Appraisal Data
          const recordsList = appraisalRes.data?.data?.result || [];
          if (recordsList.length > 0) {
            setAppraisalId(recordsList[0]._id);
            setCurrentCheckDate(recordsList[0].nextCheckDate);
          } else {
            setAppraisalId(null);
            setCurrentCheckDate(null);
          }
        })
        .catch(console.error);
    } else {
      // Reset state on close
      setNewCheckDate(null);
    }
  }, [isOpen, employeeId]);

  // ─── Save Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (!newCheckDate) {
      return toast({ 
        title: 'Validation Error', 
        description: 'Please select a new appraisal date.', 
        variant: 'destructive' 
      });
    }

    if (!document?.signedDocument) {
      return toast({
        title: 'Document Missing',
        description: 'No signed document is attached to this module.',
        variant: 'destructive'
      });
    }

    setIsUploading(true);

    const payload: any = {
      updatedBy: user?._id,
      title: 'Performance Appraisal Updated',
      document: [document.signedDocument], // Sending the pre-filled doc as an array
      nextCheckDate: moment(newCheckDate).toISOString()
    };

    if (!appraisalId && employeeId) {
      payload.employeeId = employeeId;
    }

    try {
      const url = appraisalId ? `/appraisal/${appraisalId}` : `/appraisal`;
      const method = appraisalId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      toast({ 
        title: 'Success', 
        description: 'Appraisal updated successfully.',
        className: 'bg-theme text-white'
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update appraisal.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Performance Appraisal</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* 1. Context Alert (If an existing check exists) */}
          {currentCheckDate && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <p>
                Previous/Current appraisal date is{' '}
                <span className="font-semibold">
                  {moment(currentCheckDate).format('DD MMM YYYY')}
                </span>
                .
              </p>
            </div>
          )}

          {/* 2. Date Input exactly matching the Tab's format */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              New Appraisal Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              selected={newCheckDate}
              onChange={(date: any) => setNewCheckDate(date)}
              dateFormat="dd-MM-yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select date..."
              showMonthDropdown
              showYearDropdown
              dropdownMode='select'
            />
          </div>

          {/* 3. Pre-Filled Document View (Replacing standard Upload drag/drop) */}
          <div className="space-y-2 mt-2">
            <Label className="text-sm font-medium text-gray-700">Attached Appraisal Document <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Award className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_Appraisal_Form.pdf'}
                </p>
                <p className="text-xs text-gray-500">Ready to be saved as proof</p>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUploading || !newCheckDate} 
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            {isUploading ? 'Saving...' : 'Update Appraisal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}