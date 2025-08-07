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
  nextCheckData: string | null;
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'expired' | null>(null);
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

  // === Modal for activation with date inputs ===
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationData, setActivationData] = useState({
    startDate: null as Date | null,
    expiryDate: null as Date | null,
    nextCheckDate: null as Date | null
  });

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
          nextCheckDate: nextCheckDateObj
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

  // === Handle status click: expired → show activation modal, active → confirm expire ===
  const handleStatusClick = () => {
    if (rtwStatus === 'expired') {
      // Show modal to re-activate with required dates
      setShowActivationModal(true);
    } else {
      // Mark as expired — use confirmation dialog
      setPendingStatus('expired');
      setShowConfirmDialog(true);
    }
  };

  // === Confirm deactivation (expired) ===
  const confirmStatusChange = () => {
    if (pendingStatus) {
      setRtwStatus(pendingStatus);
      setPendingStatus(null);
      setShowConfirmDialog(false);
    }
  };

  const cancelStatusChange = () => {
    setPendingStatus(null);
    setShowConfirmDialog(false);
  };


const handleActivate = async () => {
  const { startDate, expiryDate, nextCheckDate } = activationData;

  if (!startDate || !expiryDate || !nextCheckDate) {
    toast({
      title: 'All dates are required to activate RTW.',
      className: 'bg-destructive text-white'
    });
    return;
  }

  const payload = {
    startDate: startDate.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    nextCheckDate: nextCheckDate.toISOString().split('T')[0],
    status: 'active' as const,
    updatedBy: user?._id
  };

  try {
    await axiosInstance.patch(`/hr/right-to-work/${rtwId}`, payload);

    // On success, update frontend state
    setStartDate(startDate);
    setExpiryDate(expiryDate);
    setNextCheckDate(nextCheckDate);
    setRtwStatus('active');
    setShowActivationModal(false);
    setActivationData({ startDate: null, expiryDate: null, nextCheckDate: null });

    // Refresh original data to prevent accidental "Save" prompts
    setOriginalData({
      startDate,
      expiryDate,
      nextCheckDate,
      status: 'active'
    });

    // Show success toast
    toast({
      title: 'RTW re-activated successfully!',
      className: 'bg-supperagent text-white'
    });

    // Optionally re-fetch to ensure consistency
    fetchData();
  } catch (err: any) {
    console.error('Error reactivating RTW:', err);
    toast({
      title: err.response?.data?.message || 'Failed to reactivate RTW.',
      className: 'bg-destructive text-white'
    });
  }
};

  const cancelActivation = () => {
    setShowActivationModal(false);
    setActivationData({ startDate: null, expiryDate: null, nextCheckDate: null });
  };

  // === Determine if inputs should be disabled ===
  const areInputsDisabled = rtwStatus === 'expired';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
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
                    className={`w-full rounded-md border px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                      areInputsDisabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100'
                        : 'border-gray-300'
                    }`}
                    placeholderText={areInputsDisabled ? '—' : 'Select start date'}
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    disabled={areInputsDisabled}
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
                    className={`w-full rounded-md border px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                      areInputsDisabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100'
                        : 'border-gray-300'
                    }`}
                    placeholderText={areInputsDisabled ? '—' : 'Select expiry date'}
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    disabled={areInputsDisabled}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="default"
                      onClick={handleStatusClick}
                      className={
                        rtwStatus === 'active'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-supperagent hover:bg-supperagent/90 text-white'
                      }
                    >
                      {rtwStatus === 'active' ? 'Expired' : 'Active'}
                    </Button>
                  
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
                      if (date && !areInputsDisabled) {
                        setNextCheckDate(date);
                        setShowNeedsCheck(false);
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full rounded-md border px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                      areInputsDisabled || showNeedsCheck
                        ? 'cursor-not-allowed border-amber-300 bg-amber-50'
                        : 'border-gray-300'
                    }`}
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText={areInputsDisabled ? '—' : 'Select next check date'}
                    disabled={areInputsDisabled}
                  />
                  <p className="mt-1 text-sm text-gray-500">(Every 3 Months)</p>
                </div>
              </div>

              {/* Save Button (only if dirty and not expired) */}
              {isDirty && rtwStatus !== 'expired' && (
                <div className="-mt-6 flex justify-end">
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
                      <TableCell className="text-right text-gray-600">
                        {typeof entry.updatedBy === 'object'
                          ? `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}`
                          : entry.updatedBy}{' '}
                        - {moment(entry.date).format('DD MMM YYYY')}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* === Confirmation Dialog (for marking as expired) === */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Confirm Status Change</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to mark this status as{' '}
              <span className="font-bold">Expired</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={cancelStatusChange}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={confirmStatusChange}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Activation Modal (when expired → activate) === */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Reactivate Right to Work</h2>
            <p className="mb-4 text-sm text-gray-700">
              Please provide the required dates to reactivate RTW status.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <DatePicker
                  selected={activationData.startDate}
                  onChange={(date: Date | null) =>
                    setActivationData({ ...activationData, startDate: date })
                  }
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-1"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <DatePicker
                  selected={activationData.expiryDate}
                  onChange={(date: Date | null) =>
                    setActivationData({ ...activationData, expiryDate: date })
                  }
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-1"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Next Check Date
                </label>
                <DatePicker
                  selected={activationData.nextCheckDate}
                  onChange={(date: Date | null) =>
                    setActivationData({ ...activationData, nextCheckDate: date })
                  }
                  dateFormat="dd-MM-yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-1"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={cancelActivation}>
                Cancel
              </Button>
              <Button className="bg-supperagent hover:bg-supperagent/90 text-white" onClick={handleActivate}>
                Active
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightToWorkTab;