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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function DbsModule({ isOpen, onClose, document, module, employeeId }: any) {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // ─── State ─────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [newDisclosureNumber, setNewDisclosureNumber] = useState<string>('');
  const [newDateOfIssue, setNewDateOfIssue] = useState<Date | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);

  // User & DBS Data State
  const [employeeName, setEmployeeName] = useState<string>('');
  const [dbsId, setDbsId] = useState<string | null>(null);
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && employeeId) {
      Promise.all([
        axiosInstance.get(`/users/${employeeId}`),
        axiosInstance.get(`/dbs?userId=${employeeId}`)
      ])
        .then(([userRes, dbsRes]) => {
          // Set User Data
          const fetchedUserData = userRes.data?.data || userRes.data;
          if (fetchedUserData) {
            setEmployeeName(`${fetchedUserData.firstName || ''} ${fetchedUserData.lastName || ''}`.trim());
          }

          // Set Existing DBS Data
          const recordsList = dbsRes.data?.data?.result || [];
          if (recordsList.length > 0) {
            const data = recordsList[0];
            setDbsId(data._id);
            setCurrentExpiryDate(data.expiryDate);
            setNewDisclosureNumber(data.disclosureNumber || '');
          } else {
            setDbsId(null);
            setCurrentExpiryDate(null);
            setNewDisclosureNumber('');
          }
        })
        .catch(console.error);
    } else {
      // Reset state on close
      setNewDateOfIssue(null);
      setNewExpiryDate(null);
      setNewDisclosureNumber('');
    }
  }, [isOpen, employeeId]);

  // ─── Save Logic ──────────────────────────────────────
  const handleSave = async () => {
    if (!newDisclosureNumber.trim() || !newDateOfIssue || !newExpiryDate) {
      return toast({ 
        title: 'Validation Error', 
        description: 'Please provide the disclosure number, date of issue, and expiry date.', 
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
      title: 'DBS Details Updated',
      dbsDocumentUrl: [document.signedDocument], // Sending the pre-filled doc as an array
      disclosureNumber: newDisclosureNumber,
      dateOfIssue: moment(newDateOfIssue).toISOString(),
      expiryDate: moment(newExpiryDate).toISOString(),
      date: new Date().toISOString()
    };

    if (!dbsId && employeeId) {
      payload.userId = employeeId;
    }

    try {
      const url = dbsId ? `/dbs/${dbsId}` : `/dbs`;
      const method = dbsId ? 'patch' : 'post';

      await axiosInstance[method](url, payload);

      toast({ 
        title: 'Success', 
        description: 'DBS certificate updated successfully.',
        className: 'bg-theme text-white'
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update DBS details.', 
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
          <DialogTitle>Update DBS Certificate</DialogTitle>
          <DialogDescription>
            {employeeName ? `Saving for ${employeeName}` : 'Loading details...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          
          {/* 1. Context Alert (If an existing check exists) */}
          {currentExpiryDate && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <p>
                Current DBS certificate expires on{' '}
                <span className="font-semibold">
                  {moment(currentExpiryDate).format('DD MMM YYYY')}
                </span>
                .
              </p>
            </div>
          )}

          {/* 2. Disclosure Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Disclosure Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newDisclosureNumber}
              onChange={(e) => setNewDisclosureNumber(e.target.value)}
              placeholder="Enter certificate number"
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 3. Date of Issue */}
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Date of Issue <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newDateOfIssue}
                onChange={(date: any) => setNewDateOfIssue(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            
            {/* 4. Expiry Date */}
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newExpiryDate}
                onChange={(date: any) => setNewExpiryDate(date)}
                dateFormat="dd-MM-yyyy"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date..."
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={newDateOfIssue || undefined} // Expiry cannot be before Issue
              />
            </div>
          </div>

          {/* 5. Pre-Filled Document View */}
          <div className="space-y-2 mt-2">
            <Label className="text-sm font-medium text-gray-700">Attached Certificate <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {document?.content || 'Signed_DBS_Certificate.pdf'}
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
            disabled={isUploading || !newDisclosureNumber || !newDateOfIssue || !newExpiryDate} 
            className="bg-theme text-white hover:bg-theme/90"
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            {isUploading ? 'Saving...' : 'Update DBS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}