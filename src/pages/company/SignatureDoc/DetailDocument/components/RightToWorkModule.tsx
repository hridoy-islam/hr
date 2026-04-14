import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
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

export function RightToWorkModule({ isOpen, onClose, document, module, employeeId }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ─────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [newCheckDate, setNewCheckDate] = useState<Date | null>(null);

  // User & RTW Data State
  const [employeeName, setEmployeeName] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [rtwId, setRtwId] = useState<string | null>(null);
  const [currentCheckDate, setCurrentCheckDate] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/hr/right-to-work?employeeId=${employeeId}`)
      ])
        .then(([userRes, rtwRes]) => {
          // Set User Data
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setUserData(fetchedUserData);
            setEmployeeName(`${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim());
          }

          // Set Existing RTW Data
          const rtwList = rtwRes.data?.data?.result || [];
          if (rtwList.length > 0) {
            setRtwId(rtwList[0]._id);
            setCurrentCheckDate(rtwList[0].nextCheckDate);
          } else {
            setRtwId(null);
            setCurrentCheckDate(null);
          }
        })
        .catch(console.error);
    } else {
      // Reset state on close
      setNewCheckDate(null);
    }
  }, [isOpen, employeeId]);

  // ─── Exact Submit Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (userData?.noRtwCheck) {
      return toast({
        title: 'Submission Disabled',
        description: 'This employee is exempt from Right to Work checks.',
        variant: 'destructive'
      });
    }

    if (!newCheckDate) {
      return toast({ 
        title: 'Validation Error', 
        description: 'Please select a new next check date.', 
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

    // Payload exactly matches the RightToWorkTab structure
    const payload: any = {
      updatedBy: user?._id,
      document: [document.signedDocument], // Sending the pre-filled doc as an array 
      title: 'Right to Work Check',
      nextCheckDate: moment(newCheckDate).toISOString()
    };

    if (!rtwId && employeeId) {
      payload.employeeId = employeeId;
    }

    try {
      const url = rtwId ? `/hr/right-to-work/${rtwId}` : `/hr/right-to-work`;
      const method = rtwId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      toast({ 
        title: 'Success', 
        description: 'Right to Work check updated successfully.',
        className: 'bg-theme text-white'
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update RTW check.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isRtwDisabled = userData?.noRtwCheck;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Right to Work</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading employee details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* 1. RTW Exemption Alert */}
          {isRtwDisabled && (
            <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This employee is exempt from Right to Work checks (e.g. British citizen). Updates are disabled.
              </p>
            </div>
          )}

          {/* 2. Context Alert (If an existing check exists and not disabled) */}
          {currentCheckDate && !isRtwDisabled && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <p>
                Current check expires on{' '}
                <span className="font-semibold">
                  {moment(currentCheckDate).format('DD MMM YYYY')}
                </span>
                .
              </p>
            </div>
          )}

          {/* 3. Date Input exactly matching the Tab's format */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              New Next Check Date <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              selected={newCheckDate}
              onChange={(date: any) => setNewCheckDate(date)}
              dateFormat="dd-MM-yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholderText="Select date..."
              showMonthDropdown
              showYearDropdown
              dropdownMode='select'
              minDate={
                currentCheckDate && moment(currentCheckDate).isValid()
                  ? new Date(currentCheckDate)
                  : new Date()
              }
              preventOpenOnFocus
              disabled={isRtwDisabled} // Disable the calendar input if exempt
            />
          </div>

          {/* 4. Pre-Filled Document View (Replacing standard Upload drag/drop) */}
          <div className="space-y-2 mt-2">
            <Label className="text-sm font-medium text-gray-700">Attached Document <span className="text-red-500">*</span></Label>
            <div className={`flex items-center gap-3 rounded-md border p-3 ${isRtwDisabled ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_RTW_Document.pdf'}
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
            disabled={isUploading || !employeeName || !newCheckDate || isRtwDisabled} 
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            {isUploading ? 'Saving...' : 'Update RTW Check'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}