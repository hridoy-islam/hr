import React, { useEffect, useState } from 'react';
import { CalendarClock, ListTodo, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactSelect from 'react-select';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import moment from '@/lib/moment-setup';
import { useNavigate, useParams } from 'react-router-dom';

const normalizeToUTCDate = (date: Date) =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();

const CompanyDailyWorkFlowPage: React.FC = () => {
  const { id: companyId } = useParams();
  const navigate = useNavigate();

  // ── Filter State ──
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appliedDate, setAppliedDate] = useState<Date>(new Date());

  // ── List State ──
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTick, setSearchTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  // ── Fetch Employees directly from Access Endpoint ──
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return;
      try {
        const response = await axiosInstance.get(
          `/manage-employee/company/${companyId}`
        );
        const employeeList = response.data?.data?.employees || [];
        setEmployees(employeeList);
      } catch (error) {
        console.error('Error fetching allowed employees:', error);
      }
    };

    fetchEmployees();
  }, [companyId]);

  // ── Fetch Workflows ──
  const fetchWorkflows = async (page: number, limit: number) => {
    if (!companyId) return;
    setInitialLoading(true);
    try {
      const response = await axiosInstance.get(`/daily-work-flow`, {
        params: {
          page,
          limit,
          companyId,
          date: normalizeToUTCDate(appliedDate),
          ...(selectedEmployee ? { employeeId: selectedEmployee.value } : {})
        }
      });
      setWorkflows(response.data.data.result || []);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching daily work flows:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSearched) return;
    fetchWorkflows(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage, appliedDate, searchTick]);

  const handleSearch = () => {
    setHasSearched(true);
    if (currentPage !== 1) setCurrentPage(1);
    setAppliedDate(selectedDate);
    setSearchTick((tick) => tick + 1);
  };

  const getEmployeeName = (wf: any) =>
    typeof wf.employeeId === 'object' && wf.employeeId
      ? `${wf.employeeId.firstName ?? ''} ${wf.employeeId.lastName ?? ''}`.trim()
      : '-';

  const handleViewDetails = (wf: any) => {
    if (!wf?._id) return;
    navigate(`${wf._id}`);
  };

  return (
    <div>
      <Card className="shadow-sm">
        <CardContent className="min-h-screen p-4">
          {/* Filters */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="text-base font-semibold text-gray-800 sm:text-lg">
              <div className="flex flex-row items-center gap-2">
                <ListTodo className="h-8 w-8 text-theme" />
                <h1 className="break-words text-xl font-bold text-black sm:text-2xl">
                  Daily Work Flow
                </h1>
              </div>

              <span>{moment(appliedDate).format('dddd, DD MMMM YYYY')}</span>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto md:flex-nowrap md:items-end">
  {/* Employee Select */}
  <div className="w-full sm:w-60 md:w-56">
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black">
      Employee
    </label>
    <ReactSelect
      options={employees.map((emp) => ({
        value: emp._id,
        label: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
      }))}
      value={selectedEmployee}
      onChange={(option: any) => setSelectedEmployee(option)}
      isClearable
      placeholder="All Employees..."
      className="w-full text-sm"
      classNamePrefix="react-select"
    />
  </div>

  {/* Date Filter */}
  <div className="w-full sm:w-44">
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black">
      Date (DD-MM-YYYY)
    </label>
    <div className="relative w-full">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) setSelectedDate(date);
        }}
        dateFormat="dd-MM-yyyy"
        className="flex h-[38px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme"
        placeholderText="Select date"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperProps={{ strategy: 'fixed' }}
        popperClassName="z-[9999]"
        portalId="root"
        wrapperClassName='w-full'
      />
    </div>
  </div>

  {/* Actions */}
  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
    <Button
      onClick={handleSearch}
      className="h-[38px] w-full sm:w-auto"
    >
      <Search className="mr-2 h-4 w-4 shrink-0" />
      Search
    </Button>

    <Button
      onClick={() =>
        navigate(
          `/company/${companyId}/employee-daily-work-flow/create`
        )
      }
      size="sm"
      className="h-[38px] w-full whitespace-nowrap sm:w-auto"
    >
      <Plus className="mr-2 h-4 w-4 shrink-0" />
      Add WorkFlow
    </Button>
  </div>
</div>
          </div>

          {/* List */}
          <div className="mt-6 w-full">
            {initialLoading ? (
              <div className="flex items-center justify-center py-16">
                <BlinkingDots size="large" color="bg-theme" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <div className="mb-4 rounded-full bg-gray-50 p-4">
                  <CalendarClock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {hasSearched
                    ? 'No work flows found'
                    : 'Search to view work flows'}
                </h3>
                <p className="mt-1 max-w-[280px] text-sm text-gray-500">
                  {hasSearched
                    ? 'No daily work flow recorded for this date.'
                    : 'Select an employee and date above, then click Search.'}
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-3">Employee Name</TableHead>
                      <TableHead className="py-3">Date</TableHead>
                      <TableHead className="w-[15%] py-3 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((wf) => (
                      <TableRow
                        key={wf._id}
                        className="cursor-pointer hover:bg-gray-50/50"
                        onClick={() => handleViewDetails(wf)}
                      >
                        <TableCell className="py-3 text-sm font-medium text-gray-900">
                          {getEmployeeName(wf)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-3 font-mono text-sm">
                          {wf.date
                            ? moment(wf.date).format('DD-MM-YYYY')
                            : '-'}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(wf);
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!initialLoading && totalPages > 1 && (
              <div className="mt-4">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDailyWorkFlowPage;