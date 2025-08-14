import { useState, useMemo } from 'react';
import {
  Building,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Mail,
  User,
  Plus,
  Filter,
  Calendar,
  CheckCircle,
  MapPin,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import 'react-datepicker/dist/react-datepicker.css';

import { ReportRequestModal } from './components/ReportRequestModal';
import { DocumentRequestModal } from './components/DocumentRequestModal';
import { ReportCard } from './components/ReportCard';
import { DocumentCard } from './components/DocumentCard';
import {
  mockReportRequests,
  mockDocumentRequests,
  generateMockPayrollData,
  generateMockAttendanceData
} from './data/mock-data';
import { ReportRequest, DocumentRequest } from './types/report-types';

const payrollData = generateMockPayrollData();
const attendanceData = generateMockAttendanceData();

export const ReportPage = () => {
  const [reportRequests, setReportRequests] =
    useState<ReportRequest[]>(mockReportRequests);
  const [documentRequests, setDocumentRequests] =
    useState<DocumentRequest[]>(mockDocumentRequests);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>(
    moment().startOf('month').toDate()
  );
  const [endDate, setEndDate] = useState<Date>(
    moment().endOf('month').toDate()
  );

  const handleReportRequest = (newRequest: ReportRequest) => {
    setReportRequests((prev) => [newRequest, ...prev]);
  };

  const handleDocumentRequest = (newRequest: DocumentRequest) => {
    setDocumentRequests((prev) => [newRequest, ...prev]);
  };

  const handleViewReport = (request: ReportRequest) => {
    console.log('View report:', request);
  };

  const handleDownloadReport = (request: ReportRequest) => {
    console.log('Download report:', request);
  };

  const handleViewDocument = (request: DocumentRequest) => {
    console.log('View document:', request);
  };

  const handleDownloadDocument = (request: DocumentRequest) => {
    console.log('Download document:', request);
  };

  // Statistics
  const stats = useMemo(() => {
    const totalHours = attendanceData
      .filter((record) =>
        moment(record.date).isBetween(startDate, endDate, 'day', '[]')
      )
      .reduce((sum, record) => sum + parseFloat(record.totalHours), 0);

    const approvedReports = reportRequests.filter(
      (req) => req.status === 'approved' || req.status === 'completed'
    ).length;
    const pendingRequests = [...reportRequests, ...documentRequests].filter(
      (req) => req.status === 'pending'
    ).length;
    const thisMonthPayroll = payrollData.find(
      (pay) => pay.status === 'processed' || pay.status === 'paid'
    );

    return [
      {
        title: 'Total Hours This Month',
        value: totalHours.toFixed(1),
        subtext: 'hours worked',
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        trend: '+5.2% from last month'
      },
      {
        title: 'Approved Reports',
        value: approvedReports.toString(),
        subtext: 'reports ready',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: `${reportRequests.length} total requests`
      },
      {
        title: 'Pending Requests',
        value: pendingRequests.toString(),
        subtext: 'awaiting approval',
        icon: ClipboardList,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        trend: 'Average 2-3 days processing'
      },
      {
        title: 'Latest Payroll',
        value: thisMonthPayroll?.net || '$0.00',
        subtext: 'net pay',
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        trend: thisMonthPayroll?.status || 'N/A'
      }
    ];
  }, [reportRequests, documentRequests, startDate, endDate]);

  const filteredReportRequests = useMemo(() => {
    return reportRequests.filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter)
        return false;
      const requestDate = moment(request.requestDate);
      return requestDate.isBetween(startDate, endDate, 'day', '[]');
    });
  }, [reportRequests, statusFilter, startDate, endDate]);

  const filteredDocumentRequests = useMemo(() => {
    return documentRequests.filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter)
        return false;
      const requestDate = moment(request.requestDate);
      return requestDate.isBetween(startDate, endDate, 'day', '[]');
    });
  }, [documentRequests, statusFilter, startDate, endDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reports & Documents
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your reports, payroll, and document requests
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => setShowReportModal(true)}
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Request Report
              </Button>
              <Button
                variant="default"
                onClick={() => setShowDocumentModal(true)}
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                <FileText className="mr-2 h-4 w-4" />
                Request Document
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="mb-1 text-xs text-gray-500">{stat.subtext}</p>
                <p className="text-xs text-gray-400">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 border border-gray-300 bg-white shadow-sm">
            <TabsTrigger value="reports">Report Requests</TabsTrigger>
            <TabsTrigger value="documents">Document Requests</TabsTrigger>
            <TabsTrigger value="payroll">Payroll Data</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          </TabsList>

          {/* Report Requests Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">My Report Requests</h2>
                </div>
                
              </div>

              {filteredReportRequests.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredReportRequests.map((request) => (
                    <ReportCard
                      key={request.id}
                      request={request}
                      onView={handleViewReport}
                      onDownload={handleDownloadReport}
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-12 text-center">
                  <CardContent>
                    <ClipboardList className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No report requests found
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Request attendance, payroll, or timesheet reports with
                      custom date ranges
                    </p>
                    <Button
                      onClick={() => setShowReportModal(true)}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Request Your First Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Document Requests Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Document Requests</h2>
                <Badge variant="secondary">
                  {filteredDocumentRequests.length} requests
                </Badge>
              </div>

              {filteredDocumentRequests.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocumentRequests.map((request) => (
                    <DocumentCard
                      key={request.id}
                      request={request}
                      onView={handleViewDocument}
                      onDownload={handleDownloadDocument}
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-12 text-center">
                  <CardContent>
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No document requests found
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Request your first document to get started
                    </p>
                    <Button
                      onClick={() => setShowDocumentModal(true)}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Request Document
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payroll History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pay Period</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollData.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell className="font-medium">
                            {pay.period}
                          </TableCell>
                          <TableCell>{pay.hours}</TableCell>
                          <TableCell>{pay.rate}</TableCell>
                          <TableCell>{pay.gross}</TableCell>
                          <TableCell>{pay.tax}</TableCell>
                          <TableCell className="font-semibold text-green-700">
                            {pay.net}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(pay.status)}>
                              {pay.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Present</TableHead>
                        <TableHead>Total Absent</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          {moment('2025-08-14').format('MMM D, YYYY')} –{' '}
                          {moment('2025-08-30').format('MMM D, YYYY')}
                        </TableCell>
                        <TableCell className="font-semibold text-green-700">
                          {attendanceData.length}
                        </TableCell>
                        <TableCell className="font-semibold text-red-700">
                          0
                        </TableCell>
                        <TableCell className="font-semibold text-red-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {}}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ReportRequestModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportRequest}
        />

        <DocumentRequestModal
          isOpen={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          onSubmit={handleDocumentRequest}
        />
      </div>
    </div>
  );
};
