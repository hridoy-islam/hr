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
  const [complianceStatus, setComplianceStatus] = useState<'active' | 'expired'>('active');
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

  // Track original values for dirty checking
  const [originalData, setOriginalData] = useState<{
    startDate: string | null;
    expiryDate: string | null;
    nextCheckDate: string | null;
  } | null>(null);

  // === Fetch Data ===
  const fetchData = async () => {
    if (!id) return;
    try {
      const rtwRes = await axiosInstance.get(`/hr/right-to-work?employeeId=${id}`);
      const rtwData: RTWData = rtwRes.data.data.result[0];

      if (rtwData) {
        const startDateObj = rtwData.startDate ? new Date(rtwData.startDate) : null;
        const expiryDateObj = rtwData.expiryDate ? new Date(rtwData.expiryDate) : null;
        const nextCheckDateObj = rtwData.nextCheckDate ? new Date(rtwData.nextCheckDate) : null;

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
  const recalculateStatus = (expiryStr: string | null, nextCheckStr: string | null) => {
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

  // === Track if form has changes (dirty) ===
  const isFormDirty = () => {
    if (!originalData) return false;

    const current = {
      startDate: startDate?.toISOString().split('T')[0] || null,
      expiryDate: expiryDate?.toISOString().split('T')[0] || null
    };

    return (
      current.startDate !== originalData.startDate ||
      current.expiryDate !== originalData.expiryDate
    );
  };

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

  // === Open modal for renewal (when compliance is expired) ===
  const handleRenewClick = () => {
    setUploadFile(null);
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    if (complianceStatus === 'expired' && !uploadFile) {
      toast({
        title: 'Please upload a document to renew the RTW check.',
        className: 'bg-destructive text-white'
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    if (startDate) {
      formData.append('startDate', moment(startDate).toISOString());
    }
    if (expiryDate) {
      formData.append('expiryDate', moment(expiryDate).toISOString());
    }
    if (nextCheckDate) {
      formData.append('nextCheckDate', moment(nextCheckDate).toISOString());
    }

    if (complianceStatus === 'expired') {
      const newNextCheck = moment().add(90, 'days').toISOString();
      formData.set('nextCheckDate', newNextCheck);
      if (uploadFile) {
        formData.append('document', uploadFile);
      }
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
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Combined Visa Info & Documents */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Calendar className="h-6 w-6 text-supperagent" />
            Right to Work Verification
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Visa Information (Left Side) */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Start Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Visa Start Date</Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Visa Expiry Date</Label>
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date: Date | null) => setExpiryDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select expiry date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>

                {/* Visa Status */}
               <div className="flex flex-col space-y-2">
  <Label className="text-sm font-medium text-gray-700">Visa Status</Label>
  <div
    className={`self-start inline-block rounded px-2 py-1 text-xs font-medium ${
      visaStatus === 'active'
        ? 'bg-gray-200 text-gray-800'
        : 'bg-red-100 text-red-700'
    }`}
  >
    {visaStatus === 'active' ? 'Active' : 'Expired'}
  </div>
</div>



                {/* RTW Check Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">RTW Check Date</Label>
                  <div className="flex items-center gap-2">
                    <DatePicker
                      selected={nextCheckDate}
                      onChange={(date: Date | null) => setNextCheckDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholderText="Next check date"
                      // disabled
                    />
                    {complianceStatus === 'expired' && (
                      <Badge variant="destructive" className="text-xs px-2">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">(Every 3 months)</p>
                </div>
              </div>

              {/* Action Button */}
              {(isFormDirty() || complianceStatus === 'expired') && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={
                      complianceStatus === 'expired' ? handleRenewClick : handleSubmitUpdate
                    }
                    className="bg-supperagent hover:bg-supperagent/90 text-white"
                  >
                    {complianceStatus === 'expired' ? 'Renew Check' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Scrollable Documents Section (Right Side) */}
            <div className="flex flex-col">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <FileText className="h-5 w-5 text-supperagent" />
                Uploaded Documents
              </h3>

              <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 max-h-96">
                {documents.length > 0 ? (
                  <ul className="space-y-3">
                    {documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between rounded border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div className="truncate text-xs">
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-gray-500">
                              {doc.uploadDate} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="rounded p-1 text-gray-600 hover:bg-blue-50 hover:text-supperagent">
                            <Eye className="h-3 w-3" />
                          </button>
                          <button className="rounded p-1 text-gray-600 hover:bg-green-50 hover:text-green-600">
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm text-gray-500 italic">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

      {/* Renew Modal */}
      {showUpdateModal && complianceStatus === 'expired' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Renew RTW Check</h2>
            <p className="mb-4 text-sm text-gray-700">
              Your RTW compliance check is expired. Please upload a valid document (PDF) to renew. The next check date will be set to 90 days from now.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rtw-upload">Upload Document (PDF)</Label>
                <Input
                  id="rtw-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {uploadFile && (
                  <p className="mt-2 truncate text-sm text-green-600" title={uploadFile.name}>
                    📄 {uploadFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowUpdateModal(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="bg-supperagent hover:bg-supperagent/90 text-white"
                onClick={handleSubmitUpdate}
                disabled={!uploadFile || isSubmitting}
              >
                {isSubmitting ? 'Uploading...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightToWorkTab;