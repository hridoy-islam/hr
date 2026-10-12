import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { pdf } from '@react-pdf/renderer';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Download,
  FileBarChart2,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  apiError,
  CleaningEmployee,
  CleaningType,
  personName,
  SelectOption,
  selectStyles,
  sortAreasByRoom,
  toApiDate
} from '../shared';
import {
  CleaningReport,
  CleaningReportMeta,
  cellTitle,
  columnLabel,
  monthGroups,
  rangeLabel
} from './reportData';
import { CleaningReportPDF } from './CleaningReportPDF';

const TYPE_OPTIONS: SelectOption<CleaningType>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' }
];

const ALL_EMPLOYEES: SelectOption = { value: '', label: 'All employees' };

// Kept in step with the API's limit
const MAX_DAYS = 93;

const pickerClass =
  'h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm text-black focus:border-theme focus:outline-none';

export default function CleaningReportPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  // Nothing is picked up front; all three are chosen before generating
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [type, setType] = useState<CleaningType | null>(null);
  const [employee, setEmployee] = useState<SelectOption>(ALL_EMPLOYEES);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [companyName, setCompanyName] = useState('');

  const [report, setReport] = useState<CleaningReport | null>(null);
  const [meta, setMeta] = useState<CleaningReportMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/cleaning-access', { params: { companyId: id } })
      .then((res) => setEmployees(res.data?.data?.employeeId || []))
      .catch(() => setEmployees([]));
    axiosInstance
      .get(`/users/${id}`)
      .then((res) => setCompanyName(res.data?.data?.name || ''))
      .catch(() => setCompanyName(''));
  }, [id]);

  const employeeOptions: SelectOption[] = [
    ALL_EMPLOYEES,
    ...employees.map((emp) => ({ value: emp._id, label: personName(emp) }))
  ];

  const validate = () => {
    if (!fromDate) return 'Please select a from date';
    if (!toDate) return 'Please select a to date';
    if (toDate < fromDate) return 'To date cannot be before from date';
    // Plain day count from the picked dates; moment would read them in UK time
    if (Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1 > MAX_DAYS)
      return `A report can cover up to ${MAX_DAYS} days`;
    if (!type) return 'Please select a type';
    return '';
  };

  const generate = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError('');

    const from = fromDate!;
    const to = toDate!;

    try {
      setLoading(true);
      const res = await axiosInstance.get('/cleaning-log/report', {
        params: {
          companyId: id,
          type,
          fromDate: toApiDate(from),
          toDate: toApiDate(to),
          ...(employee.value ? { employeeId: employee.value } : {})
        }
      });
      const data: CleaningReport = res.data?.data;
      setReport({ ...data, rows: sortAreasByRoom(data?.rows || []) });
      setMeta({
        companyName: companyName || 'Company',
        type: type!,
        fromDate: from,
        toDate: to,
        // Left blank for everyone, so only a narrowed report names a person
        employeeName: employee.value ? employee.label : ''
      });
    } catch (err) {
      setReport(null);
      setError(apiError(err, 'Failed to generate the report'));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!report || !meta) return;
    try {
      setDownloading(true);
      const blob = await pdf(
        <CleaningReportPDF report={report} meta={meta} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cleaning_Report_${meta.type}_${toApiDate(meta.fromDate)}_${toApiDate(meta.toDate)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast({
        title: 'Failed to create the PDF. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setDownloading(false);
    }
  };

  const summary = useMemo(() => {
    if (!report) return { done: 0, total: 0 };
    const done = report.rows.reduce(
      (count, row) => count + Object.keys(row.cells).length,
      0
    );
    return { done, total: report.rows.length * report.columns.length };
  }, [report]);

  const renderPicker = (
    label: string,
    value: Date | null,
    onChange: (date: Date | null) => void
  ) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">{label}</p>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-theme" />
        <DatePicker
          selected={value}
          onChange={onChange}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          dateFormat="dd-MM-yyyy"
          placeholderText="Select date"
          wrapperClassName="w-full"
          className={pickerClass}
        />
      </div>
    </div>
  );

  const renderGrid = () => {
    if (!report || !meta) return null;
    const groups = monthGroups(report.columns);

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-black sm:text-base">
              {meta.type === 'monthly' ? 'Monthly' : 'Daily'} Cleaning Report
            </p>
            <p className="text-xs text-black sm:text-sm">
              {[
                meta.companyName,
                rangeLabel(meta),
                meta.employeeName,
                `${summary.done} completed`
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <Button
            className="w-full bg-theme text-white hover:bg-theme/90 sm:w-auto"
            disabled={downloading}
            onClick={downloadPdf}
          >
            {downloading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>

        {report.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-black">
            No {meta.type} area has been set up yet.
          </div>
        ) : (
          // Scrolls sideways on small screens with the area column pinned
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full border-collapse text-xs text-black">
              <thead>
                {groups.length > 1 && (
                  <tr className="bg-gray-100">
                    <th className="sticky left-0 z-20 border-b border-r border-gray-200 bg-gray-100" />
                    {groups.map((group) => (
                      <th
                        key={group.label}
                        colSpan={group.span}
                        className="border-b border-r border-gray-200 px-2 py-1.5 text-center font-semibold"
                      >
                        {group.label}
                      </th>
                    ))}
                  </tr>
                )}
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-20 min-w-[140px] border-b border-r border-gray-200 bg-gray-100 px-3 py-2 text-left font-bold sm:min-w-[200px]">
                    Area
                  </th>
                  {report.columns.map((key) => {
                    const label = columnLabel(key);
                    return (
                      <th
                        key={key}
                        className="min-w-[36px] border-b border-r border-gray-200 px-1 py-1.5 text-center font-semibold"
                      >
                        <span className="block text-[10px] font-normal">
                          {label.top}
                        </span>
                        <span className="block">{label.bottom}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, rowIndex) => {
                  const stripe = rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white';
                  return (
                    <tr key={`${row.areaId || row.areaName}-${rowIndex}`} className={stripe}>
                      <td
                        className={cn(
                          'sticky left-0 z-10 border-b border-r border-gray-200 px-3 py-2 font-semibold',
                          stripe
                        )}
                      >
                        <span className="block break-words">{row.areaName}</span>
                        {row.roomNumber && (
                          <span className="block text-[11px] font-normal">
                            Room {row.roomNumber}
                          </span>
                        )}
                      </td>
                      {report.columns.map((key) => {
                        const cell = row.cells[key];
                        return (
                          <td
                            key={key}
                            title={cell ? cellTitle(cell) : undefined}
                            className="border-b border-r border-gray-200 p-1 text-center"
                          >
                            <span
                              className={cn(
                                'mx-auto flex h-5 w-5 items-center justify-center rounded border',
                                cell
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                  : 'border-gray-300 bg-white'
                              )}
                            >
                              {cell && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <FileBarChart2 className="h-5 w-5 lg:h-6 lg:w-6" />
            Cleaning Report
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Which daily or monthly areas were completed on each day.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/company/${id}/cleaning-log`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_1fr_180px_1fr_auto] lg:items-end">
        {renderPicker('From Date*', fromDate, setFromDate)}
        {renderPicker('To Date*', toDate, setToDate)}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Type*</p>
          <Select
            options={TYPE_OPTIONS}
            value={TYPE_OPTIONS.find((opt) => opt.value === type) || null}
            onChange={(option: any) => setType(option?.value || null)}
            placeholder="Select type"
            isSearchable={false}
            styles={selectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Employee</p>
          <Select
            options={employeeOptions}
            value={employee}
            onChange={(option: any) => setEmployee(option || ALL_EMPLOYEES)}
            styles={selectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <Button
          className="h-10 w-full bg-theme text-white hover:bg-theme/90 sm:col-span-2 lg:col-span-1 lg:w-auto"
          disabled={loading}
          onClick={generate}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileBarChart2 className="mr-1.5 h-4 w-4" />
          )}
          Generate
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : report ? (
        renderGrid()
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select the from date, to date and type, then press{' '}
          <span className="font-semibold">Generate</span>.
        </div>
      )}
    </div>
  );
}
