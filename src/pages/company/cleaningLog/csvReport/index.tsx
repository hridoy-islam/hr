import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import {
  apiError,
  areaLabel,
  CleaningArea,
  CleaningEmployee,
  CleaningType,
  personName,
  SelectOption,
  selectStyles,
  sortAreasByRoom,
  toApiDate
} from '../shared';
import { CleaningReport, formatPickedDate } from '../report/reportData';
import { buildCsv } from './components/buildCsv';

const TYPE_OPTIONS: SelectOption<CleaningType>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' }
];

const ALL_AREAS: SelectOption = { value: '', label: 'All areas' };
const ALL_EMPLOYEES: SelectOption = { value: '', label: 'All employees' };

const pickerClass =
  'h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm text-black focus:border-theme focus:outline-none';

interface GeneratedCsv {
  report: CleaningReport;
  fileName: string;
  period: string;
  employeeName: string;
}

export default function CleaningCsvReportPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [type, setType] = useState<CleaningType | null>(null);
  const [area, setArea] = useState<SelectOption>(ALL_AREAS);
  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [employee, setEmployee] = useState<SelectOption>(ALL_EMPLOYEES);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);

  const [generated, setGenerated] = useState<GeneratedCsv | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/cleaning-access', { params: { companyId: id } })
      .then((res) => setEmployees(res.data?.data?.employeeId || []))
      .catch(() => setEmployees([]));
  }, [id]);

  // The area list follows the picked type
  useEffect(() => {
    setAreas([]);
    if (!type) return;

    let current = true;
    axiosInstance
      .get('/cleaning-area', {
        params: { companyId: id, type, limit: 'all', sort: 'areaName' }
      })
      .then((res) => {
        if (current) setAreas(sortAreasByRoom(res.data?.data?.result || []));
      })
      .catch(() => {
        if (current) setAreas([]);
      });
    return () => {
      current = false;
    };
  }, [id, type]);

  const areaOptions: SelectOption[] = [
    ALL_AREAS,
    ...areas.map((item) => ({ value: item._id, label: areaLabel(item) }))
  ];

  const employeeOptions: SelectOption[] = [
    ALL_EMPLOYEES,
    ...employees.map((emp) => ({ value: emp._id, label: personName(emp) }))
  ];

  // A file made for the old filters goes as soon as they change
  const resetResult = () => {
    setGenerated(null);
    setError('');
  };

  const validate = () => {
    if (!fromDate) return 'Please select a from date';
    if (!toDate) return 'Please select a to date';
    if (toDate < fromDate) return 'To date cannot be before from date';
    if (!type) return 'Please select a type';
    return '';
  };

  const generate = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    resetResult();

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
      const rows = (data?.rows || []).filter(
        (row) => !area.value || row.areaId === area.value
      );
      setGenerated({
        report: { ...data, rows: sortAreasByRoom(rows) },
        fileName: `Cleaning_Report_${type}_${toApiDate(from)}_${toApiDate(to)}.csv`,
        period: `${formatPickedDate(from)} to ${formatPickedDate(to)}`,
        employeeName: employee.value ? employee.label : ''
      });
    } catch (err) {
      setError(apiError(err, 'Failed to generate the CSV'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!generated) return;
    // The BOM lets Excel read the file as UTF-8
    const blob = new Blob(
      [String.fromCharCode(0xfeff), buildCsv(generated.report)],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generated.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          onChange={(date) => {
            onChange(date);
            resetResult();
          }}
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

  const renderResult = () => {
    if (!generated) return null;
    const { report, fileName, period, employeeName } = generated;

    const completed = report.rows.reduce(
      (count, row) => count + Object.keys(row.cells).length,
      0
    );

    if (completed === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-black">
          No completed cleaning found for these filters.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-black">Your CSV is ready</p>
            <p className="break-all text-xs text-black">{fileName}</p>
            {/* <p className="mt-1 text-xs text-black">
              {[period, employeeName, `${completed} completed`]
                .filter(Boolean)
                .join(' · ')}
            </p> */}
          </div>
        </div>
        <Button
          className="w-full shrink-0 bg-black text-white hover:bg-black/90 sm:w-auto"
          onClick={downloadCsv}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download CSV
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-[97vh] rounded-md bg-white p-3 shadow-sm ">
      <div className="mx-auto space-y-5 rounded-2xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme/10">
              <FileSpreadsheet className="h-6 w-6 text-theme" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-black">Cleaning CSV Export</h2>
              <p className="text-xs text-black sm:text-sm">
                Download cleaning logs as a spreadsheet file.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => navigate(`/company/${id}/cleaning-log`)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_1fr_1fr_auto] lg:items-end">
          {renderPicker('From Date*', fromDate, setFromDate)}
          {renderPicker('To Date*', toDate, setToDate)}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-black">Type*</p>
            <Select
              options={TYPE_OPTIONS}
              value={TYPE_OPTIONS.find((opt) => opt.value === type) || null}
              onChange={(option: any) => {
                setType(option?.value || null);
                setArea(ALL_AREAS);
                resetResult();
              }}
              placeholder="Select type"
              isSearchable={false}
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-black">Area</p>
            <Select
              options={areaOptions}
              value={area}
              onChange={(option: any) => {
                setArea(option || ALL_AREAS);
                resetResult();
              }}
              isDisabled={!type}
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-black">Employee</p>
            <Select
              options={employeeOptions}
              value={employee}
              onChange={(option: any) => {
                setEmployee(option || ALL_EMPLOYEES);
                resetResult();
              }}
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
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            )}
            Generate CSV
          </Button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 sm:text-sm">
            {error}
          </p>
        )}

        {renderResult()}
      </div>
    </div>
  );
}
