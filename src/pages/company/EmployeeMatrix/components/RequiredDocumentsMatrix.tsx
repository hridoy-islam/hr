import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import type { StylesConfig } from 'react-select';
import {
  Download,
  History,
  Search,
  FileText,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  FileWarning,
  FolderOpen
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

interface DocumentItem {
  _id: string;
  documentTitle: string;
  documentUrl: string[];
  note?: string;
  createdAt?: string;
}

interface RequiredDocumentsMatrixRow {
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
    isBritish?: boolean;
  };
  totalUploaded: number;
  missingDocuments: string[];
  isCompliant: boolean;
  status: 'compliant' | 'missing';
  documents: DocumentItem[];
}

const getDepartmentName = (row: RequiredDocumentsMatrixRow) => {
  const dept = row.employeeId.departmentId;
  if (Array.isArray(dept)) {
    return dept
      .map((d) => d?.departmentName)
      .filter(Boolean)
      .join(', ');
  }
  return dept?.departmentName || '';
};

const getDesignationName = (row: RequiredDocumentsMatrixRow) => {
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

const getStatusBadge = (status: RequiredDocumentsMatrixRow['status']) => {
  if (status === 'compliant') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1 flex items-center">
        <CheckCircle className="mr-1 h-3 w-3" />
        Compliant
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-3 py-1 flex items-center">
      <AlertCircle className="mr-1 h-3 w-3" />
      Missing Documents
    </Badge>
  );
};

// Required Documents Status options
const REQUIRED_DOCS_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'missing', label: 'Missing Documents' }
];

export const RequiredDocumentsMatrix = ({ moduleSelect }: ModuleComponentProps) => {
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
  const [rows, setRows] = useState<RequiredDocumentsMatrixRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Documents Dialog State
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] =
    useState<RequiredDocumentsMatrixRow | null>(null);

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
        `/schedule-status/${companyId}/employee-matrix/required-documents`,
        { params }
      );
      setRows(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch Required Documents matrix:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedEmployee, selectedStatus]);

  const openDocuments = (row: RequiredDocumentsMatrixRow) => {
    setSelectedEmployeeData(row);
    setDocumentsOpen(true);
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

      const headers = [
        'Employee Name',
        'Email',
        'Department',
        'Designation',
        'Total Uploaded',
        'Status',
        'Missing Documents'
      ];

      const csvRows = [headers.join(',')];

      rows.forEach((row) => {
        const emp = row.employeeId;
        const rowData = [
          escapeCSV(`${emp.firstName || ''} ${emp.lastName || ''}`.trim()),
          escapeCSV(emp.email),
          escapeCSV(getDepartmentName(row)),
          escapeCSV(getDesignationName(row)),
          escapeCSV(row.totalUploaded),
          escapeCSV(row.isCompliant ? 'Compliant' : 'Missing Documents'),
          escapeCSV(row.missingDocuments.join('; '))
        ];

        csvRows.push(rowData.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Employee_Matrix_Required_Documents.csv');
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
  const renderStatusIcon = (row: RequiredDocumentsMatrixRow) => {
    if (row.isCompliant) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />;
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
            options={REQUIRED_DOCS_STATUSES}
            value={selectedStatus}
            onChange={(opt) => setSelectedStatus(opt || REQUIRED_DOCS_STATUSES[0])}
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
          <FileText className="h-5 w-5 text-theme" />
          Required Documents Records
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
              <FileText className="h-10 w-10" />
              <p className="text-sm">
                Select filters and click Search to view employee document compliance
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
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={`${row.employeeId._id}-${idx}`}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => openDocuments(row)}
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
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {row.totalUploaded}
                          </span>
                          {row.missingDocuments.length > 0 && (
                            <span className="text-xs text-red-500">
                              ({row.missingDocuments.length} missing)
                            </span>
                          )}
                        </div>
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
                            openDocuments(row);
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
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

      {/* Documents Dialog */}
      <Dialog open={documentsOpen} onOpenChange={setDocumentsOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-theme" />
              Documents
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
                  <div className="mt-2 flex flex-wrap items-center gap-4 rounded-md p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>
                        Total Uploaded:{' '}
                        <span className="font-semibold">
                          {selectedEmployeeData.totalUploaded}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEmployeeData.isCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {selectedEmployeeData.isCompliant ? 'Compliant' : `${selectedEmployeeData.missingDocuments.length} document(s) missing`}
                      </span>
                    </div>
                  </div>
                  {!selectedEmployeeData.isCompliant && (
                    <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      <span className="font-medium">Missing Documents:</span>
                      <ul className="mt-1 list-disc pl-5">
                        {selectedEmployeeData.missingDocuments.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployeeData && selectedEmployeeData.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileWarning className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No documents uploaded for this employee.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployeeData?.documents.map((doc) => (
                    <TableRow key={doc._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {doc.documentTitle}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {doc.note || <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {doc.documentUrl &&
                            doc.documentUrl.length > 0 &&
                            doc.documentUrl.map((url, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => handleViewDocument(url)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                {doc.documentUrl.length > 1 ? `Doc ${idx + 1}` : 'View'}
                              </Button>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDocumentsOpen(false)}>Close</Button>
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