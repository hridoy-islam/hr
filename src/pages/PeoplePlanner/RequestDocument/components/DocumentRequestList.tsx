import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, Download, Eye, Calendar, User } from 'lucide-react';
import moment from 'moment';
import { DocumentRequest } from '../types/DocumentTypes';
import { Button } from '@/components/ui/button';

interface DocumentRequestListProps {
  requests: DocumentRequest[];
  onViewDocument: (request: DocumentRequest) => void;
  onDownloadDocument: (request: DocumentRequest) => void;
}

const DocumentRequestList: React.FC<DocumentRequestListProps> = ({
  requests,
  onViewDocument,
  onDownloadDocument
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons = {
      'payslip': '💰',
      'experience-letter': '📋',
      'appointment-letter': '📄',
      'job-contract': '📝'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const formatDocumentType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Requests</h3>
        <p className="text-gray-500">You haven't submitted any document requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Left Section - Document Info */}
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{getDocumentIcon(request.documentType)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDocumentType(request.documentType)}
                    </h3>
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Requested on {moment(request.requestDate).format('MMMM Do, YYYY')}</span>
                    </div>
                    
                    {request.approvedDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Approved on {moment(request.approvedDate).format('MMMM Do, YYYY')}
                          {request.approvedBy && ` by ${request.approvedBy}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span> {request.reason}
                    </p>
                  </div>
                  
                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Admin Notes:</span> {request.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {request.status === 'approved' && request.documentUrl && (
                <>
                  <Button
                    onClick={() => onViewDocument(request)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-supperagent text-white rounded-md hover:bg-supperagent/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                  <Button
                    onClick={() => onDownloadDocument(request)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </>
              )}
              
              {request.status === 'pending' && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                  <Clock className="h-4 w-4" />
                  <span>Processing</span>
                </div>
              )}
              
              {request.status === 'rejected' && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-md border border-red-200">
                  <XCircle className="h-4 w-4" />
                  <span>Rejected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentRequestList;