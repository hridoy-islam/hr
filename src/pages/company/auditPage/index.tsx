import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';
import moment from '@/lib/moment-setup';
import {
  Plus,
  Eye,
  Search
} from 'lucide-react';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface OptionType {
  value: string;
  label: string;
}

export default function CompanyAuditPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [audits, setAudits] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);

  // Filter options
  const [employees, setEmployees] = useState<OptionType[]>([]);
  const [serviceUsers, setServiceUsers] = useState<OptionType[]>([]);
  const [auditTypes, setAuditTypes] = useState<OptionType[]>([]);

  // Selected filters
  const [selectedEmployee, setSelectedEmployee] = useState<OptionType | null>(
    null
  );
  const [selectedServiceUser, setSelectedServiceUser] =
    useState<OptionType | null>(null);
  const [selectedAuditType, setSelectedAuditType] = useState<OptionType | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<OptionType | null>(null);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth() + 1,
    0
  );
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startOfMonth,
    endOfMonth
  ]);

  // Complete confirm
  const [completeAudit, setCompleteAudit] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const [fromDate, toDate] = dateRange;

  const fetchData = async (page: number, limit: number) => {
    try {
      setInitialLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page,
        limit,
        companyId
      };
      if (selectedEmployee) params.employeeId = selectedEmployee.value;
      if (selectedServiceUser) params.serviceUserId = selectedServiceUser.value;
      if (selectedAuditType) params.auditTypeId = selectedAuditType.value;
      if (selectedStatus) params.status = selectedStatus.value;
      if (fromDate) {
        params.fromDate = new Date(
          Date.UTC(
            fromDate.getFullYear(),
            fromDate.getMonth(),
            fromDate.getDate()
          )
        ).toISOString();
      }
      if (toDate) {
        const end = new Date(
          Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
        );
        end.setUTCDate(end.getUTCDate() );
        params.toDate = end.toISOString();
      }

      const response = await axiosInstance.get(`/audit`, { params });
      setAudits(response.data.data.result || []);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching audits:', error);
      toast({
        title: 'Failed to fetch audits',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [empRes, suRes, atRes] = await Promise.all([
        axiosInstance.get(
          `/users?role=employee&company=${companyId}&limit=all&status=active`
        ),
        axiosInstance.get(
          `/serviceuser?companyId=${companyId}&limit=all&status=active`
        ),
        axiosInstance.get(
          `/audit-type?companyId=${companyId}&limit=all&status=active`
        )
      ]);

      setEmployees(
        (empRes.data.data.result || []).map((e: any) => ({
          value: e._id,
          label: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || e.name
        }))
      );
      setServiceUsers(
        (suRes.data.data.result || []).map((s: any) => ({
          value: s._id,
          label: s.name
        }))
      );
      setAuditTypes(
        (atRes.data.data.result || []).map((a: any) => ({
          value: a._id,
          label: a.title
        }))
      );
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [companyId]);

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, entriesPerPage);
  };

  const handleReset = () => {
    setSelectedEmployee(null);
    setSelectedServiceUser(null);
    setSelectedAuditType(null);
    setSelectedStatus(null);
    setDateRange([null, null]);
    setCurrentPage(1);
    fetchData(1, entriesPerPage);
  };

  const getAuditStatus = (audit: any) => {
    if (audit.status === 'completed') {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    if (
      audit.nextCheckDate &&
      moment(audit.nextCheckDate)
        .startOf('day')
        .isBefore(moment().startOf('day'))
    ) {
      return {
        label: 'Due',
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }
    return {
      label: 'Active',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  };

  const statusOptions: OptionType[] = [
    { value: 'active', label: 'Active' },
    { value: 'due', label: 'Due' },
    { value: 'completed', label: 'Completed' }
  ];

  const employeeName = (audit: any) => {
    const emp = audit.employeeId;
    if (!emp) return '-';
    if (typeof emp === 'object') {
      return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.name;
    }
    return '-';
  };

  const submitComplete = async () => {
    if (!completeAudit) return;
    setIsCompleting(true);
    try {
      await axiosInstance.patch(`/audit/${completeAudit._id}`, {
        action: 'complete'
      });
      toast({
        title: 'Audit completed successfully',
        className: 'bg-theme text-white'
      });
      setCompleteAudit(null);
      fetchData(currentPage, entriesPerPage);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to complete audit',
        variant: 'destructive'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-screen space-y-3 rounded-md bg-white  p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Search className="h-6 w-6" />
          All Audits
        </h2>
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size={'sm'}
          onClick={() => navigate(`/company/${companyId}/audit/create`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Audit
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-2  md:grid-cols-2 xl:grid-cols-6">
        <div className="flex flex-col space-y-1">
          <Label className="text-xs font-medium text-black">Employee</Label>
          <Select
            options={employees}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            isClearable
            placeholder="All employees..."
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Label className="text-xs font-medium text-black">Service User</Label>
          <Select
            options={serviceUsers}
            value={selectedServiceUser}
            onChange={setSelectedServiceUser}
            isClearable
            placeholder="All service users..."
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Label className="text-xs font-medium text-black">Audit Type</Label>
          <Select
            options={auditTypes}
            value={selectedAuditType}
            onChange={setSelectedAuditType}
            isClearable
            placeholder="All audit types..."
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Label className="text-xs font-medium text-black">Status</Label>
          <Select
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            isClearable
            placeholder="All statuses..."
          />
        </div>
        <div className="flex flex-col space-y-1 ">
          <Label className="text-xs font-medium text-black">
            Audit Check Date Range
          </Label>
          <DatePicker
            selectsRange={true}
            startDate={fromDate}
            endDate={toDate}
            onChange={(update: any) => setDateRange(update)}
            dateFormat="dd-MM-yyyy"
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme"
            placeholderText="Select date range..."
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable
          />
        </div>
        <div className="my-5 flex items-end gap-2">
          <Button
            onClick={handleSearch}
            size="sm"
            className="h-10 min-w-[100px] border-none bg-theme text-white hover:bg-theme/90"
          >
            <Search className="mr-1 h-4 w-4" />
            Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-10"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : audits.length === 0 ? (
          <div className="flex justify-center py-6 text-black">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Service User</TableHead>
                <TableHead>Audit Type</TableHead>
                <TableHead>Audit Date</TableHead>
                <TableHead>Next Check Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => {
                const status = getAuditStatus(audit);
                return (
                  <TableRow key={audit._id} className='cursor-pointer'>
                    <TableCell
                      className="font-medium text-black"
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/audit/view/${audit._id}`
                        )
                      }
                    >
                      {employeeName(audit)}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/audit/view/${audit._id}`
                        )
                      }
                    >
                      {audit.serviceUserId?.name || '-'}
                    </TableCell>
                    <TableCell>{audit.auditTypeId?.title || '-'}</TableCell>
                    <TableCell
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/audit/view/${audit._id}`
                        )
                      }
                    >
                      {audit.auditDate
                        ? moment(audit.auditDate).format('DD MMM YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/audit/view/${audit._id}`
                        )
                      }
                    >
                      {audit.nextCheckDate
                        ? moment(audit.nextCheckDate).format('DD MMM YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/audit/view/${audit._id}`
                        )
                      }
                    >
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          disabled={isCompleted}
                          onClick={() => setCompleteAudit(audit)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Complete Audit
                        </Button> */}
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/company/${companyId}/audit/view/${audit._id}`
                            )
                          }
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Complete Confirm Dialog */}
      <AlertDialog
        open={!!completeAudit}
        onOpenChange={(open) => !open && setCompleteAudit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this audit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The audit will be marked as
              completed and can no longer be extended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitComplete}
              disabled={isCompleting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isCompleting ? 'Completing...' : 'Complete Audit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
