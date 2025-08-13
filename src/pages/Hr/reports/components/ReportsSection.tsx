import {
  Download,
  Calendar,
  FileText,
  User,
  Mail,
  Building,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export const ReportsSection = () => {
  const [documentRequests] = useState([
    {
      id: '1',
      staffId: 'STAFF001',
      staffName: 'John Smith',
      staffEmail: 'john.smith@company.com',
      department: 'Care Services',
      documentType: 'Payslip',
      requestDate: '2025-01-10',
      status: 'pending',
      reason: 'Required for bank loan application'
    },
    {
      id: '2',
      staffId: 'STAFF002',
      staffName: 'Jane Doe',
      staffEmail: 'jane.doe@company.com',
      department: 'HR Department',
      documentType: 'Employment Certificate',
      requestDate: '2025-01-12',
      status: 'approved',
      reason: 'Visa application requirement'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Request for Document
        </h2>

        {/* Request New Document Button with Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-none bg-supperagent text-white hover:bg-supperagent/90"
            >
              Request New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Request New Document</DialogTitle>
            </DialogHeader>

            <form className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Input id="documentType" placeholder="e.g., Payslip, Employment Certificate" />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea className='border-gray-300' id="reason" placeholder="Enter reason for request" />
              </div>
            </form>

            <DialogFooter>
              <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90">
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Requests List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documentRequests.map((req) => (
          <Card
            key={req.id}
            className="overflow-hidden rounded-lg border border-gray-200 shadow-md transition-shadow duration-200 hover:shadow-lg"
          >
            <CardHeader className="bg-gradient-to-r from-supperagent/5 to-transparent p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-supperagent">
                <FileText className="h-5 w-5 text-supperagent" />
                {req.documentType}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 p-4 text-sm text-gray-800">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-supperagent" />
                <span className="font-medium">{req.staffName}</span>
                <span className="text-gray-500">({req.staffId})</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-supperagent" />
                <span className="truncate">{req.staffEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Building className="h-4 w-4 text-supperagent" />
                <span>
                  <span className="font-medium">Dept:</span> {req.department}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-supperagent" />
                <span>
                  <time dateTime={req.requestDate}>{req.requestDate}</time>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <ClipboardList className="h-4 w-4 text-supperagent" />
                <span>
                  <span className="font-medium">Reason:</span> {req.reason}
                </span>
              </div>
              <Badge
                className={`w-fit rounded px-2 py-1 text-xs ${getStatusColor(req.status)}`}
              >
                {req.status}
              </Badge>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="hover:bg-supperagent-dark flex-1 bg-supperagent font-medium text-white transition-colors duration-200"
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white transition-colors duration-200 hover:bg-supperagent/10 hover:text-supperagent"
                  aria-label="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
