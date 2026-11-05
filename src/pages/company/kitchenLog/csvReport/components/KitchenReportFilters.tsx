import { useEffect, useState } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, FileBarChart2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import {
  CleaningEmployee,
  personName,
  SelectOption,
  selectStyles
} from '@/pages/company/cleaningLog/shared';
import {
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULES,
  KitchenFrequency,
  KitchenModule,
  modulesOf
} from '../../constants';

const FREQUENCY_OPTIONS = KITCHEN_FREQUENCIES.map(({ key, label }) => ({
  value: key,
  label
}));

const ALL_EMPLOYEES: SelectOption = { value: '', label: 'All employees' };

// The pickers: every text black
const blackSelectStyles: typeof selectStyles = {
  ...selectStyles,
  option: (base, state) => ({
    ...selectStyles.option!(base, state),
    color: state.isSelected ? 'white' : 'black'
  }),
  placeholder: (base) => ({ ...base, color: 'black' }),
  singleValue: (base) => ({ ...base, color: 'black' })
};

// Kept in step with the API's limit
const MAX_DAYS = 366;

const pickerClass =
  'h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm text-black focus:border-theme focus:outline-none';

// The filters of the CSV report page
export function useKitchenReportFilters(companyId?: string) {
  const [frequency, setFrequency] = useState<KitchenFrequency | null>(null);
  const [module, setModule] = useState<KitchenModule | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [employee, setEmployee] = useState<SelectOption>(ALL_EMPLOYEES);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/kitchen-access', { params: { companyId } })
      .then((res) => setEmployees(res.data?.data?.employeeId || []))
      .catch(() => setEmployees([]));
  }, [companyId]);

  // Each frequency has its own logs, so the picked log starts over
  const pickFrequency = (next: KitchenFrequency | null) => {
    if (next !== frequency) setModule(null);
    setFrequency(next);
    setError('');
  };

  const pickModule = (next: KitchenModule | null) => {
    setModule(next);
    setError('');
  };

  const pickEmployee = (next: SelectOption | null) => {
    setEmployee(next || ALL_EMPLOYEES);
    setError('');
  };

  const validate = () => {
    if (!frequency) return 'Please select a frequency';
    if (!module) return 'Please select a log';
    if (!fromDate) return 'Please select a from date';
    if (!toDate) return 'Please select a to date';
    if (toDate < fromDate) return 'To date cannot be before from date';
    if (
      Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1 >
      MAX_DAYS
    )
      return `A report can cover up to ${MAX_DAYS} days`;
    return '';
  };

  return {
    frequency,
    module,
    fromDate,
    toDate,
    employeeId: employee.value,
    employeeName: employee.value ? employee.label : '',
    employee,
    employeeOptions: [
      ALL_EMPLOYEES,
      ...employees.map((emp) => ({ value: emp._id, label: personName(emp) }))
    ],
    error,
    setError,
    setFromDate,
    setToDate,
    pickFrequency,
    pickModule,
    pickEmployee,
    validate
  };
}

interface KitchenReportFiltersProps {
  filters: ReturnType<typeof useKitchenReportFilters>;
  loading: boolean;
  onGenerate: () => void;
}

export function KitchenReportFilters({
  filters,
  loading,
  onGenerate
}: KitchenReportFiltersProps) {
  const { frequency, module, fromDate, toDate, error, setError } = filters;

  const moduleOptions = (frequency ? modulesOf(frequency) : []).map((key) => ({
    value: key,
    label: KITCHEN_MODULES[key].label
  }));

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
            setError('');
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

  return (
    <>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Frequency*</p>
          <Select
            options={FREQUENCY_OPTIONS}
            value={
              FREQUENCY_OPTIONS.find((opt) => opt.value === frequency) || null
            }
            onChange={(option: any) =>
              filters.pickFrequency(option?.value || null)
            }
            placeholder="Select frequency"
            isSearchable={false}
            styles={blackSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Log*</p>
          <Select
            options={moduleOptions}
            value={moduleOptions.find((opt) => opt.value === module) || null}
            onChange={(option: any) => filters.pickModule(option?.value || null)}
            placeholder="Select log"
            isDisabled={!frequency}
            styles={blackSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        {renderPicker('From Date*', fromDate, filters.setFromDate)}
        {renderPicker('To Date*', toDate, filters.setToDate)}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Employee</p>
          <Select
            options={filters.employeeOptions}
            value={filters.employee}
            onChange={(option: any) => filters.pickEmployee(option)}
            styles={blackSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        <Button
          className="h-10 w-full bg-theme text-white hover:bg-theme/90 lg:w-auto"
          disabled={loading}
          onClick={onGenerate}
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
    </>
  );
}
