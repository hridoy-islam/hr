import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import type { StylesConfig } from 'react-select';
import {
  Download,
  History,
  Search,
  Calendar,
  FileText,
  Users,
  Eye,
  ClipboardCheck,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import moment from '@/lib/moment-setup';
import type { ModuleComponentProps } from '../types';

const selectStyles = (color?: string): StylesConfig<MatrixOption, false> => ({
  control: (base) => ({
    ...base,
    minHeight: 38,
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    '&:hover': { borderColor: color || '#38bdf8' }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? color || '#38bdf8'
      : state.isFocused
        ? `${color || '#38bdf8'}1a`
        : 'white',
    color: state.isSelected ? 'white' : base.color
  })
});

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  const parsed = moment.utc(dateString);
  return parsed.isValid() ? parsed.format('DD MMM, YYYY') : '—';
};

interface MatrixOption {
  value: string;
  label: string;
}

interface SupervisionMatrixRow {
  _id: string | null;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    departmentId?:
      | { departmentName?: string }
      | { departmentName?: string }[]
      | null;
    designationId?: { title?: string } | { title?: string }[] | null;
    noRtwCheck?: boolean;
  };
  supervisionId: string | null;
  scheduledDate: string | null;
  completionDate: string | null;
  sessionNote: string | null;
  isClosed: boolean;
  status: 'scheduled' | 'due-soon' | 'overdue' | 'completed' | 'closed' | 'missing';
  logs?: Array<{
    _id: string;
    title: string;
    date: string;
    document?: string[] | string;
    note?: string;
    updatedBy: string | { firstName: string; lastName: string; name?: string };
    scheduledDate?: string;
    completionDate?: string;
  }>;
  createdAt: string | null;
  updatedAt: string | null;
}

const getDepartmentName = (row: SupervisionMatrixRow) => {
  const dept = row.employeeId.departmentId;
  if (Array.isArray(dept)) {
    return dept
      .map((d) => d?.departmentName)
      .filter(Boolean)
      .join(', ');
  }
  return dept?.departmentName || '';
};

const getDesignationName = (row: SupervisionMatrixRow) => {
  const desig = row.employeeId.designationId;
  if (Array.isArray(desig)) {
    return desig
      .map((d) => d?.title)
      .filter(Boolean)
      .join(', ');
  }
  return desig?.title || '';
};

const getFileNameFromUrl = (url: string) => {
  if (!url) return 'Document';
  try {
    const cleanUrl = url.split('?')[0];
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    return decodeURIComponent(fileName).replace(/^\d+-/, '');
  } catch (e) {
    return 'Document';
  }
};

const getStatusBadge = (status: SupervisionMatrixRow['status']) => {
  const statusConfig = {
    scheduled: {
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      label: 'Scheduled'
    },
    'due-soon': {
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      label: 'Due Soon'
    },
    overdue: {
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      label: 'Overdue'
    },
    completed: {
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      label: 'Completed'
    },
    closed: {
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      label: 'Closed'
    },
    missing: {
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      label: 'Not Set'
    }
  };

  const config = statusConfig[status] || statusConfig.missing;
  return (
    <Badge className={`px-3 py-1 ${config.className}`}>{config.label}</Badge>
  );
};

// Supervision Status options
const SUPERVISION_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'due-soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'missing', label: 'Not Set' }
];

export const SupervisionMatrix = ({ moduleSelect }: ModuleComponentProps) => {
  const { id } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const companyId = id || user?.company;

  const [selectedEmployee, setSelectedEmployee] = useState<MatrixOption | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<MatrixOption>({
    value: 'all',
    label: 'All Statuses'
  });

  const [employees, setEmployees] = useState<MatrixOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SupervisionMatrixRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // History Dialog State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] =
    useState<SupervisionMatrixRow | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Document preview state
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');

  useEffect(() => {
    if (!companyId) return;
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const employeeRes = await axiosInstance.get('/users', {
          params: {
            role: 'employee',
            company: companyId,
            limit: 'all',
            status: 'active'
          }
        });
        setEmployees(
          (employeeRes.data.data.result || []).map(
            (e: {
              _id: string;
              firstName?: string;
              lastName?: string;
              email?: string;
            }) => ({
              value: e._id,
              label: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email
            })
          )
        );
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [companyId]);

  const fetchMatrix = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params: Record<string, string> = {};
      if (selectedEmployee) params.employeeId = selectedEmployee.value;
      if (selectedStatus && selectedStatus.value !== 'all') {
        params.status = selectedStatus.value;
      }
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/employee-matrix/supervision`,
        { params }
      );
      setRows(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch Supervision matrix:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedEmployee, selectedStatus]);

  const openHistory = (row: SupervisionMatrixRow) => {
    setSelectedEmployeeData(row);
    setHistoryLoading(false);
    setHistoryOpen(true);
  };

  const handleViewDocument = (url: string) => {
    setPreviewUrl(url);
    setPreviewFileName(getFileNameFromUrl(url));
    setIsPreviewDialogOpen(true);
  };

  const handleForceDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      let fileName = url.split('/').pop() || 'document_download';
      fileName = fileName.split('?')[0];

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.setAttribute('download', '');
      fallbackLink.setAttribute('target', '_blank');
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    const lowerUrl = previewUrl.toLowerCase();
    const isImage = lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/) != null;
    const isPdf = lowerUrl.match(/\.(pdf)(\?.*)?$/) != null;
    const isWord = lowerUrl.match(/\.(docx|doc)(\?.*)?$/) != null;

    if (isImage) {
      return (
        <img
          src={previewUrl}
          alt="Document Preview"
          className="max-h-full max-w-full rounded-md object-contain shadow-sm"
        />
      );
    }

    if (isWord) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        previewUrl
      )}`;
      return (
        <iframe
          src={officeViewerUrl}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="Word Document Preview"
        />
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="h-full w-full rounded-md border-0 shadow-sm"
          title="PDF Preview"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileText className="mb-4 h-16 w-16 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Preview not available
        </h3>
        <p className="mb-6 mt-2 text-sm text-gray-500">
          This file format cannot be safely previewed in the browser.
        </p>
        <Button
          onClick={() => previewUrl && handleForceDownload(previewUrl)}
          className="bg-theme text-white hover:bg-theme/90"
        >
          <Download className="mr-2 h-4 w-4" /> Download to View
        </Button>
      </div>
    );
  };

  const downloadCsv = async () => {
    if (rows.length === 0) return;
    setIsDownloading(true);
    try {
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      };

      const formatCSVDate = (dateString?: string | null) => {
        if (!dateString) return '';
        const parsed = moment.utc(dateString);
        return parsed.isValid() ? `="${parsed.format('DD-MM-YYYY')}"` : '';
      };

      const STATUS_LABELS: Record<string, string> = {
        scheduled: 'Scheduled',
        'due-soon': 'Due Soon',
        overdue: 'Overdue',
        completed: 'Completed',
        closed: 'Closed',
        missing: 'Not Set'
      };

      // 1. Find the maximum number of logs across all records
      const maxLogs = rows.reduce((max, row) => {
        const logCount = row.logs ? row.logs.length : 0;
        return Math.max(max, logCount);
      }, 0);

      // 2. Setup base headers
      const headers = [
        'Employee Name',
        'Email',
        'Department',
        'Designation',
        'Scheduled Date',
        'Completion Date',
        'Session Note',
        'Closed',
        'Status'
      ];

      // 3. Dynamically append headers for each log (1, 2, 3...)
      for (let i = 1; i <= maxLogs; i++) {
        headers.push(
          `Log ${i} Activity`,
          `Log ${i} Updated By`,
          `Log ${i} Date`,
          `Log ${i} Documents`,
          `Log ${i} Note`
        );
      }

      const csvRows = [headers.join(',')];

      // 4. Populate data for each row
      rows.forEach((row) => {
        const emp = row.employeeId;
        const base = [
          escapeCSV(`${emp.firstName || ''} ${emp.lastName || ''}`.trim()),
          escapeCSV(emp.email),
          escapeCSV(getDepartmentName(row)),
          escapeCSV(getDesignationName(row)),
          escapeCSV(formatCSVDate(row.scheduledDate)),
          escapeCSV(formatCSVDate(row.completionDate)),
          escapeCSV(row.sessionNote || ''),
          escapeCSV(row.isClosed ? 'Yes' : 'No'),
          escapeCSV(STATUS_LABELS[row.status] || row.status)
        ];

        const logColumns: string[] = [];
        const logs = row.logs || [];

        // Loop up to maxLogs to ensure columns align with the headers
        for (let i = 0; i < maxLogs; i++) {
          const log = logs[i];
          if (log) {
            const updatedByName = typeof log.updatedBy === 'object' && log.updatedBy
              ? log.updatedBy.name || `${log.updatedBy.firstName ?? ''} ${log.updatedBy.lastName ?? ''}`.trim()
              : 'System';

            // Handle documents - join multiple document URLs with comma
            let documents = '';
            if (Array.isArray(log.document) && log.document.length > 0) {
              documents = log.document.join(', ');
            } else if (log.document && typeof log.document === 'string') {
              documents = log.document;
            }

            logColumns.push(
              escapeCSV(log.title || 'Update'),
              escapeCSV(updatedByName),
              escapeCSV(formatCSVDate(log.date)),
              escapeCSV(documents),
              escapeCSV(log.note || '')
            );
          } else {
            // Push empty strings if this employee doesn't have a log at this index
            logColumns.push('', '', '', '', '');
          }
        }

        // Combine the base data and dynamic log columns into one single CSV row
        csvRows.push([...base, ...logColumns].join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Matrix_Supervision.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV report:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to render status icon
  const renderStatusIcon = (row: SupervisionMatrixRow) => {
    if (row.isClosed) {
      return <Lock className="h-4 w-4 text-gray-500" />;
    }
    if (row.completionDate) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (row.status === 'overdue') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters — module + fields in the same row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleSelect}

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee
          </label>
          <Select
            options={employees}
            value={selectedEmployee}
            onChange={(opt) => setSelectedEmployee(opt)}
            isClearable
            isSearchable
            isLoading={loadingOptions}
            placeholder="All Employees"
            styles={selectStyles()}
          />
        </div>

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            options={SUPERVISION_STATUSES}
            value={selectedStatus}
            onChange={(opt) => setSelectedStatus(opt || SUPERVISION_STATUSES[0])}
            isSearchable
            placeholder="Select Status"
            styles={selectStyles()}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            onClick={fetchMatrix}
            disabled={loading}
            className="bg-theme hover:bg-theme/90 border-none text-white"
          >
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
          {rows.length > 0 && (
            <Button
              onClick={downloadCsv}
              disabled={isDownloading}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download CSV'}
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Users className="h-5 w-5 text-theme" />
          Supervision Records
          {hasSearched && (
            <Badge className="bg-theme/10 text-theme">
              {rows.length} employees
            </Badge>
          )}
        </h2>

        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Users className="h-10 w-10" />
              <p className="text-sm">
                Select filters and click Search to view employee Supervision status
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={row.supervisionId || `${row.employeeId._id}-missing-${idx}`}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => openHistory(row)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={row.employeeId.avatar || '/placeholder.jpg'}
                            alt="avatar"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {row.employeeId.firstName} {row.employeeId.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {row.employeeId.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getDepartmentName(row) || '—'}</TableCell>
                      <TableCell>{getDesignationName(row) || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {formatDate(row.scheduledDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(row.completionDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStatusIcon(row)}
                          {getStatusBadge(row.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-theme hover:bg-theme/90 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistory(row);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Supervision History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-theme" />
              Supervision History
            </DialogTitle>
            <DialogDescription>
              {selectedEmployeeData && (
                <div className="mt-2 space-y-1">
                  <p className="text-base font-semibold text-gray-900">
                    {selectedEmployeeData.employeeId.firstName}{' '}
                    {selectedEmployeeData.employeeId.lastName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">
                      Email: {selectedEmployeeData.employeeId.email}
                    </span>
                    <span className="text-gray-500">
                      Department: {getDepartmentName(selectedEmployeeData) || '—'}
                    </span>
                    <span className="text-gray-500">
                      Designation: {getDesignationName(selectedEmployeeData) || '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 rounded-md bg-blue-50 p-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Scheduled:{' '}
                        <span className="font-semibold">
                          {formatDate(selectedEmployeeData.scheduledDate)}
                        </span>
                      </span>
                    </div>
                    {selectedEmployeeData.completionDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          Completed:{' '}
                          <span className="font-semibold">
                            {formatDate(selectedEmployeeData.completionDate)}
                          </span>
                        </span>
                      </div>
                    )}
                    {selectedEmployeeData.isClosed && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="font-semibold text-gray-700">Closed</span>
                      </div>
                    )}
                    <span className="ml-2">{getStatusBadge(selectedEmployeeData.status)}</span>
                  </div>
                  {selectedEmployeeData.sessionNote && (
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700 border border-gray-100">
                      <span className="font-medium">Note:</span> {selectedEmployeeData.sessionNote}
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : selectedEmployeeData?.logs && selectedEmployeeData.logs.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No Supervision history records found for this employee.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployeeData?.logs
                    ?.slice()
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((log) => (
                      <TableRow key={log._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {log.title || 'Update'}
                          {log.note && (
                            <div className="mt-1 text-xs text-gray-500">
                              Note: {log.note}
                            </div>
                          )}
                          {log.scheduledDate && (
                            <div className="mt-1 text-xs text-gray-500">
                              Scheduled: {formatDate(log.scheduledDate)}
                            </div>
                          )}
                          {log.completionDate && (
                            <div className="mt-1 text-xs text-gray-500">
                              Completed: {formatDate(log.completionDate)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {typeof log.updatedBy === 'object' && log.updatedBy
                                ? log.updatedBy.name ||
                                  `${log.updatedBy.firstName ?? ''} ${log.updatedBy.lastName ?? ''}`.trim()
                                : 'System'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(log.date)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {Array.isArray(log.document) &&
                            log.document.length > 0
                              ? log.document.map((docUrl, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => handleViewDocument(docUrl)}
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    {log.document!.length > 1 ? `Doc ${idx + 1}` : 'Document'}
                                  </Button>
                                ))
                              : log.document && typeof log.document === 'string'
                                ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      handleViewDocument(log.document as string)
                                    }
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    Document
                                  </Button>
                                )
                                : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <div className="z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Document Preview
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-sm truncate text-xs text-gray-500">
                {previewFileName || 'Unknown Document'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => previewUrl && handleForceDownload(previewUrl)}
                className="bg-theme text-white shadow-sm hover:bg-theme/90"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPreviewDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-auto bg-gray-100 p-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};