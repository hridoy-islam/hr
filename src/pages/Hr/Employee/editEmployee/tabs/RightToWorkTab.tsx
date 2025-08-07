import React, { useEffect, useState } from 'react';
import {
  User,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Eye,
  MoveLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from 'moment';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface HistoryEntry {
  _id: string;
  title: string;
  date: string;
  updatedBy:
    | string
    | {
        firstName: string;
        lastName: string;
      };
}

interface RTWDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface RTWData {
  _id: string;
  startDate: string | null;
  expiryDate: string | null;
  status: 'active' | 'expired' | 'needs-check';
  nextCheckDate: string | null;
  employeeId: string;
  logs?: Array<{
    _id: string;
    title: string;
    date: string;
    updatedBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

function RightToWorkTab() {
  const { id } = useParams();
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rtwStatus, setRtwStatus] = useState<'active' | 'expired' | 'needs-check'>('active');
  const [employee, setEmployee] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [nextCheckDate, setNextCheckDate] = useState<Date | null>(null);
  const [showNeedsCheck, setShowNeedsCheck] = useState(false);
  const [rtwId, setRtwId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents] = useState<RTWDocument[]>([
    {
      id: '1',
      name: 'Passport_Ridoy_2025.pdf',
      type: 'PDF',
      uploadDate: '04-Aug-2025',
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Work_Visa_2025.pdf',
      type: 'PDF',
      uploadDate: '01-Dec-2025',
      size: '1.8 MB'
    }
  ]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Track original data for dirty checking
  const [originalData, setOriginalData] = useState<{
    startDate: Date | null;
    expiryDate: Date | null;
    status: 'active' | 'expired' | 'needs-check';
    nextCheckDate: Date | null;
  } | null>(null);

  // Track if form has changes
  const [isDirty, setIsDirty] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const employeeRes = await axiosInstance.get(`/users/${id}`);
      setEmployee(employeeRes.data.data);

      const rtwRes = await axiosInstance.get(`/hr/right-to-work?employeeId=${id}`);
      const rtwData: RTWData = rtwRes.data.data.result[0];

      if (rtwData) {
        const startDateObj = rtwData.startDate ? new Date(rtwData.startDate) : null;
        const expiryDateObj = rtwData.expiryDate ? new Date(rtwData.expiryDate) : null;
        const nextCheckDateObj = rtwData.nextCheckDate ? new Date(rtwData.nextCheckDate) : null;

        setRtwId(rtwData._id);
        setStartDate(startDateObj);
        setExpiryDate(expiryDateObj);
        setRtwStatus(rtwData.status);
        setNextCheckDate(nextCheckDateObj);
        setHistory(rtwData.logs || []);

        // Save original data for comparison
        setOriginalData({
          startDate: startDateObj,
          expiryDate: expiryDateObj,
          status: rtwData.status,
          nextCheckDate: nextCheckDateObj,
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (nextCheckDate && new Date() > nextCheckDate) {
      setShowNeedsCheck(true);
    } else {
      setShowNeedsCheck(false);
    }
  }, [nextCheckDate]);

  // Detect changes in form fields
  useEffect(() => {
    if (!originalData) return;

    const isStartDateChanged = startDate?.getTime() !== originalData.startDate?.getTime();
    const isExpiryDateChanged = expiryDate?.getTime() !== originalData.expiryDate?.getTime();
    const isStatusChanged = rtwStatus !== originalData.status;
    const isNextCheckDateChanged = nextCheckDate?.getTime() !== originalData.nextCheckDate?.getTime();

    setIsDirty(
      isStartDateChanged ||
      isExpiryDateChanged ||
      isStatusChanged ||
      isNextCheckDateChanged
    );
  }, [startDate, expiryDate, rtwStatus, nextCheckDate, originalData]);

  const handleSave = async () => {
    if (!rtwId || !isDirty) return;

    const payload = {
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      status: rtwStatus,
      nextCheckDate: nextCheckDate ? nextCheckDate.toISOString().split('T')[0] : null,
      updatedBy: user?._id
    };

    try {
      await axiosInstance.patch(`/hr/right-to-work/${rtwId}`, payload);
      toast({
        title: 'RTW information updated successfully!',
        className: 'bg-supperagent text-white'
      });
      fetchData(); // Re-fetch to reset form state and original data
    } catch (err: any) {
      console.error('Error updating RTW:', err);
      toast({
        title: err.response?.data?.message || err.message,
        className: 'bg-destructive text-white'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* RTW Info and Documents Side by Side */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* RTW Information - 2/3 */}
          <div className="md:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Calendar className="h-6 w-6 text-supperagent" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Right To Work Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    RTW Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    RTW Expiry Date
                  </label>
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date: Date | null) => setExpiryDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select expiry date"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Status (Switch + Badge) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="rtw-status-switch"
                      checked={rtwStatus === 'active'}
                      onCheckedChange={(checked) =>
                        setRtwStatus(checked ? 'active' : 'expired')
                      }
                      className="data-[state=checked]:bg-supperagent"
                    />
                    <Badge
                      variant="secondary"
                      className={
                        rtwStatus === 'active'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {rtwStatus === 'active' ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                </div>

                {/* Next Check Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Next Scheduled Check
                  </label>
                  <DatePicker
                    selected={nextCheckDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setNextCheckDate(date);
                        setShowNeedsCheck(false);
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full rounded-md border ${
                      showNeedsCheck ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                    } px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="Select next check date"
                  />
                  <p className="mt-1 text-sm text-gray-500">(Every 3 Months)</p>
                </div>
              </div>

              {/* Save Button (only if dirty) */}
              {isDirty && (
                <div className=" flex justify-end -mt-6">
                  <Button
                    onClick={handleSave}
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                  >
                    Save Changes
                  </Button>
                </div>
              )}

             
            </div>
          </div>

          {/* Documents - 1/3 */}
          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-supperagent" />
                  <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-supperagent px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </div>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.uploadDate} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded p-2 text-gray-600 hover:bg-blue-50 hover:text-supperagent">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded p-2 text-gray-600 hover:bg-green-50 hover:text-green-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* History Section - Full Width */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">History</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Details</TableHead>
                  <TableHead className="text-right">Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .slice()
                  .sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((entry) => (
                    <TableRow key={entry._id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">{entry.title}</TableCell>
                      <TableCell className="text-gray-600 text-right">
                       
                        {typeof entry.updatedBy === 'object'
                          ? `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}`
                          : entry.updatedBy} - {moment(entry.date).format('DD MMM YYYY')}
                      </TableCell>
                      
                    </TableRow>
                  ))} 
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightToWorkTab;