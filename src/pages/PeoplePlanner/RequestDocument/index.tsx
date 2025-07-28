import React, { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Search } from 'lucide-react';
import moment from 'moment';
import { DocumentRequest } from '@/types/DocumentTypes';
import DocumentRequestForm from './components/DocumentRequestForm';
import DocumentRequestList from './components/DocumentRequestList';
import DocumentViewer from './components/DocumentViewer';
import { pdf } from '@react-pdf/renderer';
import {
  PayslipPDF,
  ExperienceLetterPDF,
  AppointmentLetterPDF,
  JobContractPDF
} from './components/PDFDocuments';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import AdminDocumentRequestPage from './components/AdminDocumentRequestPage';

const ServiceUserRequestDocument: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockRequests: DocumentRequest[] = [
      {
        id: '1',
        staffId: 'STAFF001',
        staffName: 'John Smith',
        staffEmail: 'john.smith@company.com',
        department: 'Care Services',
        documentType: 'payslip',
        requestDate: '2025-01-10',
        status: 'approved',
        adminNotes: 'Approved for current month payslip',
        approvedBy: 'Sarah Johnson',
        approvedDate: '2025-01-12',
        documentUrl: '/documents/payslip-john-smith.pdf',
        reason: 'Required for bank loan application'
      },
      {
        id: '2',
        staffId: 'STAFF001',
        staffName: 'John Smith',
        staffEmail: 'john.smith@company.com',
        department: 'Care Services',
        documentType: 'experience-letter',
        requestDate: '2025-01-08',
        status: 'pending',
        reason: 'Needed for new job application'
      },
      {
        id: '3',
        staffId: 'STAFF001',
        staffName: 'John Smith',
        staffEmail: 'john.smith@company.com',
        department: 'Care Services',
        documentType: 'appointment-letter',
        requestDate: '2025-01-05',
        status: 'rejected',
        adminNotes:
          'Original appointment letter is not available in digital format. Please contact HR for physical copy.',
        reason: 'Personal records'
      }
    ];
    setRequests(mockRequests);
  }, []);

  const handleSubmitRequest = (
    newRequest: Omit<DocumentRequest, 'id' | 'requestDate' | 'status'>
  ) => {
    const request: DocumentRequest = {
      ...newRequest,
      id: Date.now().toString(),
      requestDate: moment().format('YYYY-MM-DD'),
      status: 'pending'
    };

    setRequests((prev) => [request, ...prev]);
    setShowForm(false);
  };

  const handleViewDocument = (request: DocumentRequest) => {
    setSelectedRequest(request);
  };

  const handleDownloadDocument = async (request: DocumentRequest) => {
    try {
      let pdfComponent;

      switch (request.documentType) {
        case 'payslip':
          pdfComponent = <PayslipPDF request={request} />;
          break;
        case 'experience-letter':
          pdfComponent = <ExperienceLetterPDF request={request} />;
          break;
        case 'appointment-letter':
          pdfComponent = <AppointmentLetterPDF request={request} />;
          break;
        case 'job-contract':
          pdfComponent = <JobContractPDF request={request} />;
          break;
        default:
          pdfComponent = <PayslipPDF request={request} />;
      }

      const blob = await pdf(pdfComponent).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `${request.documentType}-${request.staffName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter;
    const matchesType =
      typeFilter === 'all' || request.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // If user is admin, render the admin page
  if (user?.role === 'admin') {
    return <AdminDocumentRequestPage />;
  }

  // Otherwise render the service user page
  return (
    <div className="min-h-screen  ">
      <div>
        {/* Header */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Document Requests
              </h1>
              <p className="mt-2 text-gray-600">
                Request and manage your HR documents
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center space-x-2 rounded-md bg-supperagent px-6 py-3 text-white transition-colors duration-200 hover:bg-supperagent/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Request</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Request Form */}
        {showForm && (
          <div className="mb-8">
            <DocumentRequestForm
              onSubmitRequest={handleSubmitRequest}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Request List */}
        <DocumentRequestList
          requests={filteredRequests}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
        />

        {/* Document Viewer Modal */}
        {selectedRequest && (
          <DocumentViewer
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onDownload={() => handleDownloadDocument(selectedRequest)}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceUserRequestDocument;