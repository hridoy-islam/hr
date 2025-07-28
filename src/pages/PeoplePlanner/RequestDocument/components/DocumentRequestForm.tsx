import React, { useState } from 'react';
import {
  FileText,
  Send,
  Clock,
  User,
  Building,
  MessageSquare
} from 'lucide-react';
import moment from 'moment';
import { DocumentRequest, DocumentTemplate } from '../types/DocumentTypes';
import { Button } from '@/components/ui/button';

interface DocumentRequestFormProps {
  onSubmitRequest: (
    request: Omit<DocumentRequest, 'id' | 'requestDate' | 'status'>
  ) => void;
  onCancel: () => void;
}

const DocumentRequestForm: React.FC<DocumentRequestFormProps> = ({
  onSubmitRequest,
  onCancel
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const documentTypes: DocumentTemplate[] = [
    {
      type: 'payslip',
      title: 'Payslip',
      description: 'Monthly salary statement with deductions and allowances',
      icon: '💰',
      processingTime: '1-2 business days'
    },
    {
      type: 'experience-letter',
      title: 'Experience Letter',
      description: 'Official letter confirming your work experience and role',
      icon: '📋',
      processingTime: '3-5 business days'
    },
    {
      type: 'appointment-letter',
      title: 'Appointment Letter',
      description: 'Original appointment letter from your joining date',
      icon: '📄',
      processingTime: '2-3 business days'
    },
    {
      type: 'job-contract',
      title: 'Job Contract',
      description: 'Complete employment contract with terms and conditions',
      icon: '📝',
      processingTime: '3-5 business days'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument || !reason.trim()) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newRequest: Omit<DocumentRequest, 'id' | 'requestDate' | 'status'> = {
      staffId: 'STAFF001',
      staffName: 'John Smith',
      staffEmail: 'john.smith@company.com',
      department: 'Care Services',
      documentType: selectedDocument as any,
      reason: reason.trim()
    };

    onSubmitRequest(newRequest);

    // Reset form
    setSelectedDocument('');
    setReason('');
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center space-x-3">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Request Document
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff Information */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            Staff Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  John Smith
                </div>
                <div className="text-xs text-gray-500">Staff ID: STAFF001</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Care Services
                </div>
                <div className="text-xs text-gray-500">Department</div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">
            Select Document Type *
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {documentTypes.map((doc) => (
              <div
                key={doc.type}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                  selectedDocument === doc.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDocument(doc.type)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{doc.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {doc.title}
                    </h4>
                    <p className="mt-1 text-xs text-gray-600">
                      {doc.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {doc.processingTime}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedDocument === doc.type && (
                  <div className="absolute right-2 top-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reason for Request */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Reason for Request *
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a brief reason for requesting this document..."
              rows={4}
              className="w-full resize-none rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Minimum 10 characters required
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-6 py-3 text-white hover:bg-black/90"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !selectedDocument || reason.trim().length < 10 || isSubmitting
            }
            className="inline-flex items-center space-x-2 rounded-md bg-supperagent px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Request</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentRequestForm;
