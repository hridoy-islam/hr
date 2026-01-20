import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { format } from 'date-fns';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Loader2, Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Types based on your descriptions
interface TCompanyOption {
  value: string;
  label: string;
}

interface TReportLog {
  _id: string;
  createdAt: string;
  companyId: {
    _id: string;
    name: string;
    email: string;
  };
  subscriptionPlanId: {
    _id: string;
    title: string;
  };
  logMessage: string;
  amount: number;
}

export default function ReportPage() {
  const { toast } = useToast();

  // -- Data States --
  const [reports, setReports] = useState<TReportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<TCompanyOption[]>([]);

  // -- Filter States --
  const [selectedCompany, setSelectedCompany] = useState<TCompanyOption | null>(
    null
  );
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null
  ]);
  const [startDate, endDate] = dateRange;

  // 1. Fetch Company Options
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get('/users', {
          params: { role: 'company', limit: 'all' }
        });
        const users = response.data.data?.result || [];

        const options = users.map((user: any) => ({
          value: user._id,
          label: user?.name
        }));

        setCompanyOptions(options);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };
    fetchCompanies();
    handleSearch();
  }, []);

  // 2. Main Search Function
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        limit: 100
      };

      if (selectedCompany) {
        params.companyId = selectedCompany.value;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await axiosInstance.get('/company-report', { params });
      const result = response.data.data?.result || [];
      setReports(result);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Failed to fetch reports',
        variant: 'destructive'
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 ">
      {/* Unified Single Card for Filters and Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Company Filter */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company Filter
              </label>
              <Select
                options={companyOptions}
                value={selectedCompany}
                onChange={setSelectedCompany}
                placeholder="Select a company..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Date Range Filter */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="relative">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  placeholderText="Select date range"
                  className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  wrapperClassName="w-full"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="w-full md:w-auto">
              <Button
                onClick={handleSearch}
                className="w-full md:w-auto"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search Results
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <BlinkingDots size="large" color="bg-theme" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-gray-500"
                    >
                      No reports found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell className="font-medium">
                        {report.createdAt
                          ? format(new Date(report.createdAt), 'dd MMM yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {report.companyId?.name || 'Unknown Company'}
                      </TableCell>
                      <TableCell>{report.logMessage}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: 'GBP'
                        }).format(report.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
