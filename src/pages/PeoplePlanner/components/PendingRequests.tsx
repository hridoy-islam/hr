import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const PendingRequests = () => {
  const requests = [
    {
      id: 1,
      type: 'Leave Request',
      description: 'Vacation Leave - Dec 25-29',
      submittedDate: '2 days ago',
      status: 'pending',
      priority: 'normal'
    },
    {
      id: 2,
      type: 'Shift Change',
      description: 'Swap shift with Alice on Dec 24',
      submittedDate: '1 day ago',
      status: 'approved',
      priority: 'low'
    },
    {
      id: 3,
      type: 'Time Off',
      description: 'Doctor appointment - Dec 22, 2 hours',
      submittedDate: '3 hours ago',
      status: 'pending',
      priority: 'urgent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pending Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{request.type}</h4>
                  <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Submitted {request.submittedDate}</p>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status}</span>
                  </div>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};