import React, { useEffect, useState } from 'react';
import {
  Calendar,
  FileText,
  Upload,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HistoryEntry {
  _id: string;
  title: string;
  date: string;
  updatedBy: string | { firstName: string; lastName: string };
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
    updatedBy: { firstName: string; lastName: string };
  }>;
}

function RightToWorkTab() {
  const { id } = useParams();
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();

  const [visaStatus, setVisaStatus] = useState<'active' | 'expired'>('active');
  const [complianceStatus, setComplianceStatus] = useState<
    'active' | 'expired'
  >('active');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [nextCheckDate, setNextCheckDate] = useState<Date | null>(null);
  const [rtwId, setRtwId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<RTWDocument[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateType, setUpdateType] = useState<'visa' | 'compliance' | null>(
    null
  );

  // Track original values for dirty checking
  const [originalData, setOriginalData] = useState<{
    startDate: string | null;
    expiryDate: string | null;
    nextCheckDate: string | null;
  } | null>(null);

  // Track form changes
  const [visaFormChanged, setVisaFormChanged] = useState(false);
  const [complianceFormChanged, setComplianceFormChanged] = useState(false);

  // === Fetch Data ===
  const fetchData = async () => {
    if (!id) return;
    try {
      const rtwRes = await axiosInstance.get(
        `/hr/right-to-work?employeeId=${id}`
      );
      const rtwData: RTWData = rtwRes.data.data.result[0];

      if (rtwData) {
        const startDateObj = rtwData.startDate
          ? new Date(rtwData.startDate)
          : null;
        const expiryDateObj = rtwData.expiryDate
          ? new Date(rtwData.expiryDate)
          : null;
        const nextCheckDateObj = rtwData.nextCheckDate
          ? new Date(rtwData.nextCheckDate)
          : null;

        setRtwId(rtwData._id);
        setStartDate(startDateObj);
        setExpiryDate(expiryDateObj);
        setNextCheckDate(nextCheckDateObj);
        setHistory(rtwData.logs || []);

        // Save original data for diff
        setOriginalData({
          startDate: rtwData.startDate,
          expiryDate: rtwData.expiryDate,
          nextCheckDate: rtwData.nextCheckDate
        });

        // Set documents from logs
        const fetchedDocs = rtwData.logs
          ?.filter((log) => log.title === 'RTW Document Uploaded')
          .map((log, idx) => ({
            id: log._id,
            name: `RTW_Doc_${idx + 1}.pdf`,
            type: 'PDF',
            uploadDate: moment(log.date).format('DD-MMM-YYYY'),
            size: '1.2 MB'
          }));
        setDocuments(fetchedDocs || []);

        // Recalculate statuses
        recalculateStatus(rtwData.expiryDate, rtwData.nextCheckDate);
      }
    } catch (err) {
      console.error('Error fetching RTW data:', err);
      toast({
        title: 'Failed to load RTW data.',
        className: 'bg-destructive text-white'
      });
    }
  };

  // === Auto Status Calculation ===
  const recalculateStatus = (
    expiryStr: string | null,
    nextCheckStr: string | null
  ) => {
    const now = new Date();

    // Visa Status (based on visa expiry)
    const expiryDate = expiryStr ? new Date(expiryStr) : null;
    if (expiryDate && now > expiryDate) {
      setVisaStatus('expired');
    } else {
      setVisaStatus('active');
    }

    // Compliance Status (based on next check date)
    const nextCheckDate = nextCheckStr ? new Date(nextCheckStr) : null;
    if (nextCheckDate && now > nextCheckDate) {
      setComplianceStatus('expired');
    } else {
      setComplianceStatus('active');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Recalculate status when dates change
  useEffect(() => {
    if (originalData) {
      recalculateStatus(
        expiryDate?.toISOString().split('T')[0] || null,
        nextCheckDate?.toISOString().split('T')[0] || null
      );
    }
  }, [expiryDate, nextCheckDate]);

  // Check if visa form has changes
  useEffect(() => {
    if (!originalData) return;

    const currentStart = startDate?.toISOString().split('T')[0] || null;
    const currentExpiry = expiryDate?.toISOString().split('T')[0] || null;

    setVisaFormChanged(
      currentStart !== originalData.startDate ||
        currentExpiry !== originalData.expiryDate
    );
  }, [startDate, expiryDate, originalData]);

  // Check if compliance form has changes
  useEffect(() => {
    if (!originalData) return;

    const currentNextCheck = nextCheckDate?.toISOString().split('T')[0] || null;

    setComplianceFormChanged(currentNextCheck !== originalData.nextCheckDate);
  }, [nextCheckDate, originalData]);

  // === Handle file input ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadFile(file);
      } else {
        toast({
          title: 'Please upload a PDF file.',
          className: 'bg-destructive text-white'
        });
      }
    }
  };

  // === Open modal for update ===
  const handleUpdateClick = (type: 'visa' | 'compliance') => {
    setUploadFile(null);
    setUpdateType(type);
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    setIsSubmitting(true);
    const formData = new FormData();

    if (updateType === 'visa') {
      if (startDate) {
        formData.append('startDate', moment(startDate).toISOString());
      }
      if (expiryDate) {
        formData.append('expiryDate', moment(expiryDate).toISOString());
      }
    } else if (updateType === 'compliance') {
      if (nextCheckDate) {
        formData.append('nextCheckDate', moment(nextCheckDate).toISOString());
      }
    }

    if (uploadFile) {
      formData.append('document', uploadFile);
    }

    formData.append('updatedBy', user._id);

    try {
      await axiosInstance.patch(`/hr/right-to-work/${rtwId}`, formData);
      await fetchData();
      toast({
        title: 'RTW updated successfully!',
        className: 'bg-supperagent text-white'
      });
      setShowUpdateModal(false);
      setUpdateType(null);
    } catch (err: any) {
      console.error('Error updating RTW:', err);
      toast({
        title: err.response?.data?.message || 'Update failed.',
        className: 'bg-destructive text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="space-y-6">
        {/* Combined Visa Info & Documents */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Calendar className="h-6 w-6 text-supperagent" />
            Right to Work Verification
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Visa Information (Left Side) */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">
                Visa Information
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Start Date */}
                <div className="flex flex-row items-center gap-4 ">
                  <Label className="text-sm font-medium text-gray-700">
                    Visa Start Date
                  </Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Expiry Date */}
                <div className="flex flex-row items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Visa Expiry Date
                  </Label>
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date: Date | null) => setExpiryDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select expiry date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Visa Status */}
                <div className="flex flex-row items-center gap-4 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Visa Status
                  </Label>
                  <Badge
                    variant={
                      visaStatus === 'active' ? 'default' : 'destructive'
                    }
                    className="self-start"
                  >
                    {visaStatus === 'active' ? 'Active' : 'Expired'}
                  </Badge>
                </div>

                {/* Update Button */}
                {visaFormChanged && (
                  <div className="mt-2">
                    <Button
                      onClick={() => handleUpdateClick('visa')}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Update Visa Information
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Information (Right Side) */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">
                Compliance Information
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* RTW Check Date */}
                <div className="flex flex-row items-center gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      RTW Check Date
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      (Every 3 months)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DatePicker
                      selected={nextCheckDate}
                      onChange={(date: Date | null) => setNextCheckDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholderText="Next check date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>

                {/* Compliance Status */}
                <div className="flex flex-row items-center gap-4 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Compliance Status
                  </Label>
                  <Badge
                    variant={
                      complianceStatus === 'active' ? 'default' : 'destructive'
                    }
                  >
                    {complianceStatus === 'active' ? 'Active' : 'Expired'}
                  </Badge>
                </div>

                {/* Update Button */}
                {complianceFormChanged && (
                  <div className="mt-2">
                    <Button
                      onClick={() => handleUpdateClick('compliance')}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Update Compliance
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
              <FileText className="h-5 w-5 text-supperagent" />
              Uploaded Documents
            </h3>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              {documents.length > 0 ? (
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <div className="truncate text-sm">
                          <p className="font-medium text-gray-900">
                            {doc.name}
                          </p>
                          <p className="text-gray-500">
                            {doc.uploadDate} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1 text-gray-600 hover:bg-blue-50 hover:text-supperagent">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1 text-gray-600 hover:bg-green-50 hover:text-green-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm italic text-gray-500">
                  No documents uploaded
                </p>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">History</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((entry) => (
                    <TableRow key={entry._id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">
                        {entry.title}
                      </TableCell>
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

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {updateType === 'visa'
                ? 'Update Visa Information'
                : 'Update Compliance Check'}
            </h2>
            <p className="mb-4 text-sm text-gray-700">
              {updateType === 'visa'
                ? 'You are updating visa information. You may optionally upload a supporting document.'
                : 'You are updating the compliance check date. You may optionally upload a supporting document.'}
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rtw-upload">
                  Upload Document (PDF - Optional)
                </Label>
                <Input
                  id="rtw-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {uploadFile && (
                  <p
                    className="mt-2 truncate text-sm text-green-600"
                    title={uploadFile.name}
                  >
                    📄 {uploadFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdateType(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-supperagent text-white hover:bg-supperagent/90"
                onClick={handleSubmitUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightToWorkTab;
