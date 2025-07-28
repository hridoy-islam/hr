import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { DocumentRequest } from '@/types/DocumentTypes';
import { PayslipPDF, ExperienceLetterPDF, AppointmentLetterPDF, JobContractPDF } from './PDFDocuments';

interface DocumentViewerProps {
  request: DocumentRequest;
  onClose: () => void;
  onDownload: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ request, onClose, onDownload }) => {
  const getPDFComponent = () => {
    switch (request.documentType) {
      case 'payslip':
        return <PayslipPDF request={request} />;
      case 'experience-letter':
        return <ExperienceLetterPDF request={request} />;
      case 'appointment-letter':
        return <AppointmentLetterPDF request={request} />;
      case 'job-contract':
        return <JobContractPDF request={request} />;
      default:
        return <PayslipPDF request={request} />;
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full min-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {formatDocumentType(request.documentType)}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onDownload}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer 
            style={{ 
              width: '100%', 
              height: '80vh',
              border: 'none'
            }}
          >
            {getPDFComponent()}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;