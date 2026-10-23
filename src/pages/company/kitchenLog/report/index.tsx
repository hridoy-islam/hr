import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { pdf } from '@react-pdf/renderer';
import {
  ArrowLeft,
  CalendarDays,
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
  selectStyles,
  toApiDate
} from '@/pages/company/cleaningLog/shared';
import {
  FREQUENCY_LABEL,
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULES,
  KitchenModule,
  modulesOf
} from '../constants';
import { KitchenLogRecord } from '../shared';
import {
  buildReportLayout,
  KitchenReportLayout,
  KitchenReportMeta,
  rangeLabel,
  ReportCell,
  ReportSection
} from './reportLayout';
import { KitchenReportPDF } from './KitchenReportPDF';

const MODULE_OPTIONS = KITCHEN_FREQUENCIES.map(({ key, label }) => ({
  label,
  options: modulesOf(key).map((module) => ({
    value: module,
    label: KITCHEN_MODULES[module].label
  }))
}));

// The log picker: every text black, the frequency headings bold
const logSelectStyles: typeof selectStyles = {
  ...selectStyles,
  option: (base, state) => ({
    ...selectStyles.option!(base, state),
    color: state.isSelected ? 'white' : 'black'
  }),
  groupHeading: (base) => ({
    ...base,
    color: 'black',
    fontSize: 13,
    fontWeight: 700
  }),
  placeholder: (base) => ({ ...base, color: 'black' }),
  singleValue: (base) => ({ ...base, color: 'black' })
};

// Kept in step with the API's limit
const MAX_DAYS = 366;

const pickerClass =
  'h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm text-black focus:border-theme focus:outline-none';

// Signatures are stored elsewhere; the PDF gets them as data so it never
// depends on cross-origin image loading. One that cannot be read is left out.
const toDataUrl = async (url: string) => {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
};

const inlineImages = async (
  layout: KitchenReportLayout
): Promise<KitchenReportLayout> => {
  const urls = new Set<string>();
  layout.sections.forEach((section) =>
    section.rows.forEach((row) =>
      row.forEach((cell) => cell.image && urls.add(cell.image))
    )
  );
  const data = new Map<string, string | undefined>();
  await Promise.all(
    Array.from(urls).map(async (url) => data.set(url, await toDataUrl(url)))
  );

  return {
    ...layout,
    sections: layout.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) =>
        row.map((cell) => {
          if (!cell.image) return cell;
          const image = data.get(cell.image);
          return image
            ? { ...cell, image }
            : { ...cell, image: undefined, text: cell.text || 'Signed' };
        })
      )
    }))
  };
};

export default function KitchenReportPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [module, setModule] = useState<KitchenModule | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [companyName, setCompanyName] = useState('');

  const [layout, setLayout] = useState<KitchenReportLayout | null>(null);
  const [meta, setMeta] = useState<KitchenReportMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get(`/users/${id}`)
      .then((res) => setCompanyName(res.data?.data?.name || ''))
      .catch(() => setCompanyName(''));
  }, [id]);

  const frequency = module ? KITCHEN_MODULES[module].frequency : 'daily';
  const byWeek = frequency === 'weekly' || frequency === 'twice_weekly';
  const byMonth = frequency === 'monthly';

  // Switching between a daily, weekly and monthly log starts the period over
  const pickModule = (next: KitchenModule | null) => {
    const nextFrequency = next ? KITCHEN_MODULES[next].frequency : 'daily';
    if (nextFrequency !== frequency) {
      setFromDate(null);
      setToDate(null);
    }
    setModule(next);
    setError('');
  };

  // Any day picked stands for its whole Monday to Sunday week
  const pickWeek = (date: Date | null) => {
    if (!date) {
      setFromDate(null);
      setToDate(null);
    } else {
      const monday = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      setFromDate(monday);
      setToDate(
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
      );
    }
    setError('');
  };

  const pickMonth = (date: Date | null) => {
    setFromDate(date && new Date(date.getFullYear(), date.getMonth(), 1));
    setToDate(date && new Date(date.getFullYear(), date.getMonth() + 1, 0));
    setError('');
  };

  const validate = () => {
    if (!module) return 'Please select a log';
    if (byWeek && !fromDate) return 'Please select a week';
    if (byMonth && !fromDate) return 'Please select a month';
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

  const generate = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError('');

    try {
      setLoading(true);
      const res = await axiosInstance.get('/kitchen-log/report', {
        params: {
          companyId: id,
          module,
          fromDate: toApiDate(fromDate!),
          toDate: toApiDate(toDate!)
        }
      });
      const logs: KitchenLogRecord[] = res.data?.data?.logs || [];
      setLayout(
        buildReportLayout(module!, logs, {
          fromDate: fromDate!,
          toDate: toDate!
        })
      );
      setMeta({
        companyName: companyName || 'Company',
        module: module!,
        fromDate: fromDate!,
        toDate: toDate!
      });
    } catch (err) {
      setLayout(null);
      setError(apiError(err, 'Failed to generate the report'));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!layout || !meta) return;
    try {
      setDownloading(true);
      const blob = await pdf(
        <KitchenReportPDF layout={await inlineImages(layout)} meta={meta} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kitchen_${meta.module}_${toApiDate(meta.fromDate)}_${toApiDate(meta.toDate)}.pdf`;
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

  const renderPeriodPicker = (
    label: string,
    onChange: (date: Date | null) => void,
    options: {
      showWeekPicker?: boolean;
      showMonthYearPicker?: boolean;
      dateFormat: string;
      placeholderText: string;
      value?: string;
    }
  ) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-black">{label}</p>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-theme" />
        <DatePicker
          selected={fromDate}
          onChange={onChange}
          calendarStartDay={1}
          wrapperClassName="w-full"
          className={pickerClass}
          {...options}
        />
      </div>
    </div>
  );

  const renderDateFilters = () => {
    if (byWeek)
      return renderPeriodPicker('Week*', pickWeek, {
        showWeekPicker: true,
        dateFormat: 'dd-MM-yyyy',
        placeholderText: 'Select week',
        value:
          fromDate && toDate
            ? rangeLabel({
                companyName,
                module: module!,
                fromDate,
                toDate
              })
            : ''
      });
    if (byMonth)
      return renderPeriodPicker('Month*', pickMonth, {
        showMonthYearPicker: true,
        dateFormat: 'MMMM yyyy',
        placeholderText: 'Select month'
      });
    return (
      <>
        {renderPicker('From Date*', fromDate, setFromDate)}
        {renderPicker('To Date*', toDate, setToDate)}
      </>
    );
  };

  const renderCell = (cell: ReportCell, cellIndex: number, sheet?: boolean) => (
    <td
      key={cellIndex}
      colSpan={cell.span}
      className={cn(
        'whitespace-pre-line px-2 py-1.5 align-top',
        sheet
          ? 'border border-gray-800'
          : 'border-b border-r border-gray-200 last:border-r-0',
        !sheet && cellIndex === 0 && 'font-semibold',
        cell.strong && 'font-bold',
        !cell.heading && 'text-sm sm:text-base',
        cell.align === 'center' && 'text-center',
        cell.align === 'right' && 'text-right',
        cell.tall && 'h-16'
      )}
    >
      {cell.image && (
        <img
          src={cell.image}
          alt="Signature"
          className={cn(
            'mb-1 h-10 max-w-[160px] object-contain',
            cell.align === 'center' && 'mx-auto block'
          )}
        />
      )}
      {cell.label && <span className="font-bold">{cell.label}</span>}
      {cell.text}
    </td>
  );

  const renderSection = (section: ReportSection, index: number) => (
    <div key={index} className="space-y-1.5">
      {section.title && (
        <p className="text-sm font-bold text-black">{section.title}</p>
      )}
      <div
        className={cn(
          'overflow-x-auto',
          !section.sheet && 'rounded-xl border border-gray-200'
        )}
      >
        <table
          className={cn(
            'w-full border-collapse text-xs text-black',
            section.sheet ? 'min-w-[520px]' : 'min-w-[720px]'
          )}
        >
          {!section.sheet && (
            <thead>
              <tr className="bg-gray-100">
                {section.columns.map((column, columnIndex) => (
                  <th
                    key={`${column.label}-${columnIndex}`}
                    className="border-b border-r border-gray-200 px-2 py-2 text-left font-bold last:border-r-0"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {section.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={!section.sheet && rowIndex % 2 ? 'bg-gray-50' : ''}
              >
                {row.map((cell, cellIndex) =>
                  renderCell(cell, cellIndex, section.sheet)
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {section.note && (
        <p className="whitespace-pre-line pt-1 text-xs text-black">
          {section.note}
        </p>
      )}
    </div>
  );

  const renderReport = () => {
    if (!layout || !meta) return null;
    const config = KITCHEN_MODULES[meta.module];

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-black sm:text-base">
              {layout.title}
            </p>
            <p className="text-xs text-black sm:text-sm">
              {[
                meta.companyName,
                FREQUENCY_LABEL[config.frequency],
                rangeLabel(meta)
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

        {layout.logCount === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-black">
            No {config.label.toLowerCase()} was completed in this period.
          </div>
        ) : (
          layout.sections.map(renderSection)
        )}

        {layout.logCount > 0 && layout.instructions && (
          <div className="space-y-2 rounded-xl border border-gray-200 p-3 text-xs text-black sm:p-4 sm:text-sm">
            <p className="text-center text-base font-bold underline">
              {layout.instructions.title}
            </p>
            <p className="font-bold underline">{layout.instructions.heading}</p>
            {layout.instructions.groups.map((group) => (
              <div key={group.title}>
                <p className="mt-2 font-bold underline">{group.title}</p>
                {group.intro && <p>{group.intro}</p>}
                <ul className="ml-5 list-disc">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="pt-1">{layout.instructions.footer}</p>
          </div>
        )}

        {layout.notes.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-black sm:text-sm">
            {layout.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
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
            Kitchen Report
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Pick a log and a date range to see it laid out like its paper sheet.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/company/${id}/kitchen-log`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Filters */}
      <div
        className={cn(
          'grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 sm:p-4 lg:items-end',
          byWeek || byMonth
            ? 'lg:grid-cols-[1.4fr_2fr_auto]'
            : 'lg:grid-cols-[1.4fr_1fr_1fr_auto]'
        )}
      >
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-black">Log*</p>
          <Select
            options={MODULE_OPTIONS}
            value={
              module
                ? { value: module, label: KITCHEN_MODULES[module].label }
                : null
            }
            onChange={(option: any) => pickModule(option?.value || null)}
            placeholder="Select log"
            styles={logSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>
        {renderDateFilters()}
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
      ) : layout ? (
        renderReport()
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-black">
          Select the log and its{' '}
          {byWeek ? 'week' : byMonth ? 'month' : 'from and to date'}, then press{' '}
          <span className="font-semibold">Generate</span>.
        </div>
      )}
    </div>
  );
}
