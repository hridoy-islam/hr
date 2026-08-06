import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import type { StylesConfig } from 'react-select';
import {
  Download,
  History,
  Search,
  GraduationCap,
  BookOpenCheck,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
import { StatusBadge } from './StatusBadge';
import { TRAINING_STATUSES } from '../constants';
import type { MatrixRow, HistoryRecord, TCompletionRecord, ModuleComponentProps } from '../types';

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

const getDepartmentName = (row: MatrixRow) => {
  const dept = row.employeeId.departmentId;
  if (Array.isArray(dept)) {
    return dept
      .map((d) => d?.departmentName)
      .filter(Boolean)
      .join(', ');
  }
  return dept?.departmentName || '';
};

const getDesignationName = (row: MatrixRow) => {
  const desig = row.employeeId.designationId;
  if (Array.isArray(desig)) {
    return desig
      .map((d) => d?.title)
      .filter(Boolean)
      .join(', ');
  }
  return desig?.title || '';
};

const renderCertificateLinks = (certData?: string[] | string) => {
  if (!certData || (Array.isArray(certData) && certData.length === 0)) {
    return <span className="text-sm text-gray-400">-</span>;
  }
  const certArray = Array.isArray(certData) ? certData : [certData];
  return (
    <div className="flex flex-col gap-1">
      {certArray.map((certLink, index) => (
        <a
          key={index}
          href={certLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          title={getFileNameFromUrl(certLink)}
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="max-w-[180px] truncate">
            {getFileNameFromUrl(certLink)}
          </span>
        </a>
      ))}
    </div>
  );
};

// Same status logic as the training details page
const getRecordStatus = (record: HistoryRecord) => {
  if (record.status === 'completed') return 'completed';
  if (record.isOptional || !record.expireDate) return 'in-progress';
  const today = moment.utc().startOf('day');
  const expiry = moment.utc(record.expireDate).startOf('day');
  const reminderDays = record.trainingId?.reminderBeforeDays || 30;
  const reminderDate = moment
    .utc(record.expireDate)
    .subtract(reminderDays, 'days')
    .startOf('day');
  if (today.isAfter(expiry, 'day')) return 'expired';
  if (today.isSameOrAfter(reminderDate, 'day')) return 'expiring-soon';
  return 'in-progress';
};

const HistoryRow = ({
  data,
  isLog,
  status
}: {
  data: TCompletionRecord;
  isLog: boolean;
  status: string;
}) => (
  <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
    <div className="grid w-full grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <span className="text-xs font-semibold uppercase text-black">
          Assigned Date
        </span>
        <p className="font-medium text-gray-800">{formatDate(data.assignedDate)}</p>
      </div>
      <div>
        <span className="text-xs font-semibold uppercase text-black">
          Expiry Date
        </span>
        <p className="font-medium text-gray-800">{formatDate(data.expireDate)}</p>
      </div>
      <div>
        <span className="text-xs font-semibold uppercase text-black">
          Completed On
        </span>
        <p
          className={
            isLog ? 'font-medium text-green-600' : 'font-medium text-gray-800'
          }
        >
          {formatDate(data.completedAt)}
        </p>
      </div>
      <div>
        <span className="text-xs font-semibold uppercase text-black">Status</span>
        <div className="mt-1 font-medium">
          <StatusBadge status={status} />
        </div>
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase text-black">
          Certificate
        </span>
        {renderCertificateLinks(data.certificate)}
      </div>
    </div>
  </div>
);

export const TrainingMatrix = ({ moduleSelect }: ModuleComponentProps) => {
  const { id } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const companyId = id || user?.company;

  const [selectedTraining, setSelectedTraining] = useState<MatrixOption | null>(
    null
  );
  const [selectedEmployee, setSelectedEmployee] = useState<MatrixOption | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<MatrixOption>({
    value: 'all',
    label: 'All Statuses'
  });

  const [trainings, setTrainings] = useState<MatrixOption[]>([]);
  const [employees, setEmployees] = useState<MatrixOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<string>('');
  const [historyTraining, setHistoryTraining] = useState<string>('');
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [trainingRes, employeeRes] = await Promise.all([
          axiosInstance.get(`/hr/training?companyId=${companyId}&limit=all`),
          axiosInstance.get('/users', {
            params: { role: 'employee', company: companyId, limit: 'all',status: 'active' }
          })
        ]);
        setTrainings(
          (trainingRes.data.data.result || []).map(
            (t: { _id: string; name: string }) => ({
              value: t._id,
              label: t.name
            })
          )
        );
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
        console.error('Failed to load options:', error);
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
      if (selectedTraining) params.trainingId = selectedTraining.value;
      if (selectedEmployee) params.employeeId = selectedEmployee.value;
      if (selectedStatus && selectedStatus.value !== 'all') {
        params.status = selectedStatus.value;
      }
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/employee-matrix/training`,
        { params }
      );
      setRows(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employee matrix:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedTraining, selectedEmployee, selectedStatus]);

  const openHistory = async (
    employeeId: string,
    employeeName: string,
    trainingId?: string | null,
    trainingName?: string
  ) => {
    setHistoryOpen(true);
    setHistoryEmployee(employeeName);
    setHistoryTraining(trainingName || '');
    setHistoryRecords([]);
    setHistoryLoading(true);
    try {
      const params: Record<string, string> = { employeeId, limit: 'all' };
      if (trainingId) params.trainingId = trainingId;
      const response = await axiosInstance.get('/employee-training', {
        params
      });
      setHistoryRecords(response.data.data.result || []);
    } catch (error) {
      console.error('Failed to load training history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

const downloadCsv = async () => {
    if (rows.length === 0) return;
    setIsDownloading(true);
    try {
      // Missing fields are exported as blank cells
      const escapeCSV = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any
      ) => {
        if (value === null || value === undefined || value === '') return '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      };

      const formatCSVDate = (dateString?: string | null) => {
  if (!dateString) return '';
  const parsed = moment.utc(dateString);
  // Using `="DD-MM-YYYY"` forces Excel to render it as a strict text string
  return parsed.isValid() ? `="${parsed.format('DD-MM-YYYY')}"` : '';
};

      const STATUS_LABELS: Record<string, string> = {
        completed: 'Completed',
        'in-progress': 'In Progress',
        'expiring-soon': 'Expiring Soon',
        expired: 'Expired',
        missing: 'Not Assigned'
      };

      // 1. Find the maximum number of logs across all fetched records
      const maxLogs = rows.reduce((max, row) => {
        const logCount = row.completionHistory ? row.completionHistory.length : 0;
        return Math.max(max, logCount);
      }, 0);

      // 2. Setup base headers
      const headers = [
        'Employee Name',
        'Email',
        'Department',
        'Designation',
        'Training',
        'Assigned Date',
        'Expiry Date',
        'Status',
        'Certificate'
      ];

      // 3. Dynamically append headers for each log (1, 2, 3...)
      for (let i = 1; i <= maxLogs; i++) {
        headers.push(
          `Log ${i} Assigned Date`,
          `Log ${i} Expiry Date`,
          `Log ${i} Completed On`,
          `Log ${i} Certificate`
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
          escapeCSV(row.trainingId?.name || ''),
          escapeCSV(formatCSVDate(row.assignedDate)),
          escapeCSV(formatCSVDate(row.expireDate)),
          escapeCSV(STATUS_LABELS[row.status] || row.status),
          escapeCSV(((row.certificate || []) as string[]).join('; '))
        ];

        const logColumns: string[] = [];
        
        // Loop up to maxLogs to ensure columns align with the headers
        for (let i = 0; i < maxLogs; i++) {
          const log = row.completionHistory && row.completionHistory[i];
          if (log) {
            logColumns.push(
              escapeCSV(formatCSVDate(log.assignedDate)),
              escapeCSV(formatCSVDate(log.expireDate)),
              escapeCSV(formatCSVDate(log.completedAt)),
              escapeCSV(((log.certificate || []) as string[]).join('; '))
            );
          } else {
            // Push empty strings if this employee doesn't have a log at this index
            logColumns.push('', '', '', '');
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
      link.setAttribute('download', 'Employee_Matrix_Training.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV report:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters — module + fields in the same row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {moduleSelect}

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Training Name
          </label>
          <Select
            options={[{ value: '', label: 'All Trainings' }, ...trainings]}
            value={selectedTraining}
            onChange={(opt) =>
              setSelectedTraining(opt && opt.value ? opt : null)
            }
            isClearable
            isSearchable
            isLoading={loadingOptions}
            placeholder="All Trainings"
            styles={selectStyles()}
          />
        </div>

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
            options={TRAINING_STATUSES}
            value={selectedStatus}
            onChange={(opt) => setSelectedStatus(opt || TRAINING_STATUSES[0])}
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
          <BookOpenCheck className="h-5 w-5 text-theme" />
          Training Records
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
              <GraduationCap className="h-10 w-10" />
              <p className="text-sm">
                Select filters and click Search to view employee matrix
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
                    <TableHead>Training</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={row._id || `${row.employeeId._id}-missing-${idx}`}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() =>
                        openHistory(
                          row.employeeId._id,
                          `${row.employeeId.firstName || ''} ${row.employeeId.lastName || ''}`.trim(),
                          row.trainingId?._id,
                          row.trainingId?.name
                        )
                      }
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
                        {row.trainingId ? (
                          <span className="font-medium text-gray-700">
                            {row.trainingId.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(row.assignedDate)}</TableCell>
                      <TableCell>{formatDate(row.expireDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-theme hover:bg-theme/90 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistory(
                              row.employeeId._id,
                              `${row.employeeId.firstName || ''} ${row.employeeId.lastName || ''}`.trim(),
                              row.trainingId?._id,
                              row.trainingId?.name
                            );
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

      {/* Training History Dialog — shows every log for each training */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-theme" />
              Training History — {historyEmployee}
            </DialogTitle>
            <DialogDescription>
              {historyTraining
                ? `Log details for ${historyTraining}`
                : 'No training selected for this record'}
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : historyRecords.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No training records found for this employee.
            </p>
          ) : (
            <div className="space-y-4">
              {historyRecords.map((record) => {
                const isCompleted = record.status === 'completed';
                const sortedCompletionHistory = [...(record.completionHistory || [])].reverse();
                return (
                  <div key={record._id} className="space-y-3">
                    <h3 className="flex items-center gap-2 border-b pb-2 text-base font-semibold text-gray-900">
                      <BookOpenCheck className="h-4 w-4 text-theme" />
                      {record.trainingId?.name || 'Unknown Training'}
                    </h3>

                    <div className="space-y-3">
                      {!isCompleted && record.assignedDate && (
                        <HistoryRow
                          data={{
                            assignedDate: record.assignedDate,
                            expireDate: record.expireDate,
                            completedAt: undefined,
                            certificate: record.certificate
                          }}
                          isLog={false}
                          status={getRecordStatus(record)}
                        />
                      )}

                      {sortedCompletionHistory.length > 0 ? (
                        sortedCompletionHistory.map((log) => (
                          <HistoryRow
                            key={log._id}
                            data={log}
                            isLog
                            status="completed"
                          />
                        ))
                      ) : isCompleted || !record.assignedDate ? (
                        <div className="rounded-lg border bg-gray-50 p-6 text-center italic text-black">
                          No previous history logs available.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
