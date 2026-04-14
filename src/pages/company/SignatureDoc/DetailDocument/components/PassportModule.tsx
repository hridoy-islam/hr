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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function PassportModule({
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
  const [newPassportNumber, setNewPassportNumber] = useState<string>('');
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // User & Passport Data
  const [employeeName, setEmployeeName] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [passportId, setPassportId] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/passport?userId=${employeeId}`)
      ])
        .then(([userRes, passportRes]) => {
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setUserData(fetchedUserData);
            setEmployeeName(
              `${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim()
            );
          }

          const recordsList = passportRes.data?.data?.result || [];
          if (recordsList.length > 0) {
            setPassportId(recordsList[0]._id);
            setNewPassportNumber(recordsList[0].passportNumber || '');
          } else {
            setPassportId(null);
            setNewPassportNumber('');
          }
        })
        .catch(console.error);
    } else {
      setNewExpiryDate(null);
      setNewPassportNumber('');
    }
  }, [isOpen, employeeId]);

  // ─── Save Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (userData?.noRtwCheck) return;

    if (!newPassportNumber.trim() || !newExpiryDate) {
      return toast({
        title: 'Validation Error',
        description: 'Please provide both passport number and expiry date.',
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
      title: 'Passport Details Updated',
      document: [document.signedDocument],
      passportNumber: newPassportNumber,
      passportExpiryDate: moment(newExpiryDate).toISOString()
    };

    if (!passportId && employeeId) {
      payload.userId = employeeId;
    }

    try {
      const url = passportId ? `/passport/${passportId}` : `/passport`;
      const method = passportId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      toast({
        title: 'Success',
        description: 'Passport updated successfully.',
        className: 'bg-theme text-white'
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update passport.',
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
          <DialogTitle>Update Passport</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isExempt && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This employee is exempt from Passport checks. Update is
                disabled.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Passport Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newPassportNumber}
              onChange={(e) => setNewPassportNumber(e.target.value)}
              placeholder="e.g. 123456789"
              disabled={isExempt}
              className="bg-white"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-theme disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholderText="Select expiry date..."
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              disabled={isExempt}
            />
          </div>

          <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Attached Document
            </Label>
            <div
              className={`flex items-center gap-3 rounded-md border border-gray-200 p-3 ${isExempt ? 'bg-gray-100 opacity-60' : 'bg-gray-50'} border-gray-200'`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme/20 text-theme">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Passport_Document.pdf'}
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
              isUploading || !newPassportNumber || !newExpiryDate || isExempt
            }
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{' '}
            Save Passport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
