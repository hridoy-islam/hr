import { Download, Eye, Clock, CheckCircle, XCircle, AlertCircle, FileText, DollarSign, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReportRequest } from '../types/report-types';
import moment from 'moment';

interface ReportCardProps {
  request: ReportRequest;
  onView?: (request: ReportRequest) => void;
  onDownload?: (request: ReportRequest) => void;
}

export const ReportCard = ({ request, onView, onDownload }: ReportCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          text: 'Approved'
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Completed'
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

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return Clock;
      case 'payroll': return DollarSign;
      case 'timesheet': return CheckSquare;
      case 'hours': return FileText;
      default: return FileText;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'attendance': return 'text-blue-600';
      case 'payroll': return 'text-green-600';
      case 'timesheet': return 'text-purple-600';
      case 'hours': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const ReportTypeIcon = getReportTypeIcon(request.reportType);
  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
      <CardHeader className={`bg-gradient-to-r ${
        request.reportType === 'attendance' ? 'from-blue-50' : 
        request.reportType === 'payroll' ? 'from-green-50' : 
        request.reportType === 'timesheet' ? 'from-purple-50' : 'from-orange-50'
      } to-transparent p-4 pb-2`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ReportTypeIcon className={`h-5 w-5 ${getReportTypeColor(request.reportType)}`} />
            <span className="capitalize">{request.reportType} Report</span>
            {request.status === 'completed' && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                PDF Ready
              </Badge>
            )}
          </CardTitle>
          <Badge className={`px-2 py-1 text-xs capitalize ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Period:</span>
            <p className="text-gray-900">
              {moment(request.dateRange.startDate).format('MMM D')} - {moment(request.dateRange.endDate).format('MMM D, YYYY')}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Requested:</span>
            <p className="text-gray-900">{moment(request.requestDate).format('MMM D, YYYY')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-medium text-gray-600">Reason:</span>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
            {request.reason}
          </p>
        </div>

        {request.reportType === 'attendance' && request.includeBreakdowns && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            Includes detailed breakdowns (clock times, breaks, locations)
          </div>
        )}

        {request.employeeIds && request.employeeIds.length > 1 && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
            Report covers {request.employeeIds.length} employee(s)
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge className={`px-2 py-1 text-xs ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
          </Badge>
          
          <div className="flex gap-2">
            {request.status === 'completed' && request.documentUrl && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onDownload?.(request)}
              >
                <Download className="h-4 w-4" />
                <span className="ml-1 text-xs">PDF</span>
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
            {request.status === 'completed' ? 'Completed' : 'Approved'} by {request.approvedBy} on {moment(request.approvedDate).format('MMM D, YYYY')}
            {request.status === 'completed' && (
              <span className="ml-2 text-green-600 font-medium">• PDF Generated</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};