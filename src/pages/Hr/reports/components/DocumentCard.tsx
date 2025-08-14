import { Download, Eye, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentRequest } from '../types/report-types';
import moment from 'moment';

interface DocumentCardProps {
  request: DocumentRequest;
  onView?: (request: DocumentRequest) => void;
  onDownload?: (request: DocumentRequest) => void;
}

export const DocumentCard = ({ request, onView, onDownload }: DocumentCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: CheckCircle,
          text: 'Approved'
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Ready'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          text: 'Rejected'
        };
      case 'pending':
      default:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle,
          text: 'Pending'
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-green-600" />
            {request.documentType}
          </CardTitle>
          <Badge className={`px-2 py-1 text-xs capitalize ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Staff ID:</span>
            <span className="ml-2 text-gray-900">{request.staffId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Department:</span>
            <span className="ml-2 text-gray-900">{request.department}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Requested:</span>
            <span className="ml-2 text-gray-900">{moment(request.requestDate).format('MMM D, YYYY')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-medium text-gray-600">Purpose:</span>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
            {request.reason}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`px-2 py-1 text-xs ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
          </Badge>
          
          <div className="flex gap-2">
            {(request.status === 'completed' || request.status === 'approved') && request.documentUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload?.(request)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView?.(request)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {request.approvedBy && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Approved by {request.approvedBy} on {moment(request.approvedDate).format('MMM D, YYYY')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};