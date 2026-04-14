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
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function VisaModule({
  isOpen,
  onClose,
  document,
  module,
  employeeId
}: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ─────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // User & Visa Data
  const [employeeName, setEmployeeName] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [visaId, setVisaId] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/visa?employeeId=${employeeId}`)
      ])
        .then(([userRes, visaRes]) => {
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setUserData(fetchedUserData);
            setEmployeeName(
              `${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim()
            );
          }

          const recordsList = visaRes.data?.data?.result || [];
          if (recordsList.length > 0) {
            setVisaId(recordsList[0]._id);
          } else {
            setVisaId(null);
          }
        })
        .catch(console.error);
    } else {
      setNewStartDate(null);
      setNewExpiryDate(null);
    }
  }, [isOpen, employeeId]);

  // ─── Save Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (userData?.noRtwCheck) return;

    if (!newStartDate || !newExpiryDate) {
      return toast({
        title: 'Validation Error',
        description: 'Please select both start and expiry dates.',
        variant: 'destructive'
      });
    }
    if (!document?.signedDocument) {
      return toast({
        title: 'Document Missing',
        description: 'No signed document is attached.',
        variant: 'destructive'
      });
    }

    setIsUploading(true);

    const payload: any = {
      updatedBy: user?._id,
      document: [document.signedDocument],
      title: 'Visa Check Updated',
      startDate: moment(newStartDate).toISOString(),
      expiryDate: moment(newExpiryDate).toISOString()
    };

    if (!visaId && employeeId) {
      payload.employeeId = employeeId;
    }

    try {
      const url = visaId ? `/visa/${visaId}` : `/visa`;
      const method = visaId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      toast({
        title: 'Success',
        description: 'Visa updated successfully.',
        className: 'bg-theme border-none text-white'
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update visa.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isExempt = userData?.noRtwCheck;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Visa Information</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isExempt && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This employee is exempt from Visa checks. Update is disabled.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newStartDate}
                onChange={(date: any) => setNewStartDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholderText="Select start..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                disabled={isExempt}
                preventOpenOnFocus
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newExpiryDate}
                onChange={(date: any) => setNewExpiryDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholderText="Select expiry..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                disabled={isExempt}
                preventOpenOnFocus
              />
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Attached Visa Document
            </Label>
            <div
              className={`flex items-center gap-3 rounded-md border border-gray-200 p-3 ${isExempt ? 'bg-gray-100 opacity-60' : 'bg-gray-50'} border-gray-200'`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme/20 text-theme">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_RTW_Document.pdf'}
                </p>
                
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUploading || !newStartDate || !newExpiryDate || isExempt
            }
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{' '}
            Save Visa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
