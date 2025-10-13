import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  FileText,
  Clock,
  CheckCircle,
  Download
} from 'lucide-react';

// Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// React Select
import Select from 'react-select';
import moment from 'moment';
import { useSelector } from 'react-redux';
import axiosInstance from '@/lib/axios'; // ✅ Import axiosInstance
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Types
type DocumentType =
  | 'Employment Certificate'
  | 'Tax Certificate'
  | 'Reference Letter'
  | 'Salary Certificate'
  | 'Experience Letter'
  | 'Increment Letter'
  | 'Promotion Letter'
  | 'Attendance Report';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface DocumentRequest {
  _id: string;
  userId: string;
  documentType: DocumentType;
  requestDate: string;
  status: RequestStatus;
  startDate?: string;
  endDate?: string;
  document?: string;
}

const documentTypes: DocumentType[] = [
  'Attendance Report',
  'Employment Certificate',
  'Tax Certificate',
  'Reference Letter',
  'Salary Certificate',
  'Experience Letter',
  'Increment Letter',
  'Promotion Letter'
];

// Transform for react-select
const documentTypeOptions = documentTypes.map((type) => ({
  value: type,
  label: type
}));

export default function ReportPage() {
  const user = useSelector((state: any) => state.auth?.user);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch requests on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/hr/request-document`, {
          params: { userId: user._id }
        });
        setRequests(response?.data?.data?.result || []); // assuming response.data.data is the array
      } catch (err: any) {
        console.error('Failed to fetch document requests:', err);
        setError(err.response?.data?.message || 'Could not load requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?._id]);

  const pendingCount = requests.filter(
    (req) => req.status === 'pending'
  ).length;
  const approvedCount = requests.filter(
    (req) => req.status === 'approved'
  ).length;

  const handleSubmitRequest = async () => {
    if (!selectedDocumentType || !user?._id) return;

    const payload = {
      userId: user._id,
      requestDate: moment().format('MM-DD-YYYY'),
      documentType: selectedDocumentType,
      ...(selectedDocumentType === 'Attendance Report' && {
        startDate,
        endDate
      })
    };

    try {
      const response = await axiosInstance.post(
        '/hr/request-document',
        payload
      );
      const newRequest = response.data.data; // assuming server returns created request
      setRequests((prev) => [...prev, newRequest]);

      // Reset form
      setSelectedDocumentType(null);
      setStartDate('');
      setEndDate('');
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to submit document request:', err);
      alert(err.response?.data?.message || 'Could not submit request.');
    }
  };

  // Format selected option for react-select
  const selectedOption = selectedDocumentType
    ? { value: selectedDocumentType, label: selectedDocumentType }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Document Request</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Requests
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Button with Dialog */}
      <div className="flex w-full flex-row justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-supperagent text-white hover:bg-supperagent/90">
              <FileText className="mr-2 h-4 w-4" />
              Request New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request New Document</DialogTitle>
              <DialogDescription>
                Select the type of document you need and provide details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Document Type (React Select) */}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  id="document-type"
                  instanceId="document-type-select"
                  value={selectedOption}
                  onChange={(option) =>
                    setSelectedDocumentType(
                      option ? (option.value as DocumentType) : null
                    )
                  }
                  options={documentTypeOptions}
                  placeholder="Select document type"
                  isSearchable
                  styles={{
                    control: (base, { isFocused }) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: isFocused ? '#2563eb' : '#d1d5db',
                      boxShadow: isFocused ? '0 0 0 1px #2563eb' : 'none',
                      '&:hover': {
                        borderColor: '#9ca3af'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999
                    }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isSelected
                        ? '#2563eb'
                        : isFocused
                          ? '#eff6ff'
                          : 'white',
                      color: isSelected ? 'white' : 'black'
                    })
                  }}
                />
              </div>

              {/* Date Range for Attendance Report */}
              {selectedDocumentType === 'Attendance Report' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <div className="relative">
                      <DatePicker
                        selected={
                          startDate
                            ? moment(startDate, 'MM-DD-YYYY', true).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          if (date && moment(date).isValid()) {
                            setStartDate(moment(date).format('MM-DD-YYYY'));
                          }
                        }}
                        selectsStart
                        startDate={
                          startDate
                            ? moment(startDate, 'MM-DD-YYYY', true).toDate()
                            : undefined
                        }
                        endDate={
                          endDate
                            ? moment(endDate, 'MM-DD-YYYY', true).toDate()
                            : undefined
                        }
                        dateFormat="MM-dd-yyyy"
                        dropdownMode="select"
                        showMonthDropdown
                        showYearDropdown
                        customInput={
                          <div className="relative">
                            <Input
                              type="text"
                              value={startDate || ''}
                              readOnly
                              className="pl-3 pr-10"
                            />
                            <CalendarIcon className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <div className="relative">
                      <DatePicker
                        selected={
                          endDate
                            ? moment(endDate, 'MM-DD-YYYY', true).toDate()
                            : null
                        }
                        onChange={(date: Date | null) => {
                          if (date && moment(date).isValid()) {
                            setEndDate(moment(date).format('MM-DD-YYYY'));
                          }
                        }}
                        selectsEnd
                        startDate={
                          startDate
                            ? moment(startDate, 'MM-DD-YYYY', true).toDate()
                            : undefined
                        }
                        endDate={
                          endDate
                            ? moment(endDate, 'MM-DD-YYYY', true).toDate()
                            : undefined
                        }
                        minDate={
                          startDate
                            ? moment(startDate, 'MM-DD-YYYY', true).toDate()
                            : undefined
                        }
                        dateFormat="MM-dd-yyyy"
                        dropdownMode="select"
                        showMonthDropdown
                        showYearDropdown
                        customInput={
                          <div className="relative">
                            <Input
                              type="text"
                              value={endDate || ''}
                              readOnly
                              className="pl-3 pr-10"
                            />
                            <CalendarIcon className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitRequest}
                className="bg-supperagent text-white hover:bg-supperagent/90"
                disabled={
                  !selectedDocumentType ||
                  (selectedDocumentType === 'Attendance Report' &&
                    (!startDate || !endDate))
                }
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>My Document Requests</CardTitle>
          <CardDescription>
            Track the status of your document requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">
                      {request.documentType}
                    </TableCell>
                    <TableCell>
                      {request.requestDate
                        ? moment(request.requestDate).format('DD MMM, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize
      ${
        request.status === 'approved'
          ? 'bg-green-100 text-green-800'
          : request.status === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-orange-100 text-orange-800' // pending
      }
    `}
                      >
                        {request.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.startDate && request.endDate ? (
                        <span className="text-sm text-muted-foreground">
                          {moment(request.startDate).format('DD MMM, YYYY')} -{' '}
                          {moment(request.endDate).format('DD MMM, YYYY')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="flex flex-row justify-end">
                      {request.document ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-supperagent text-white hover:bg-supperagent"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = request?.document;
                            link.setAttribute('download', '');
                            link.setAttribute('target', '_blank');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          aria-label="Download document"
                        >
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
