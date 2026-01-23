import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import moment from 'moment';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Calendar as CalendarIcon,
  History,
  Pencil,
  Check,
  X as XIcon
} from 'lucide-react';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from "@/components/ui/input";

// Custom Imports
import axiosInstance from '@/lib/axios';
import CSVExporter from './components/CSVExporter';
import { useNavigate } from 'react-router-dom';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface RootState {
  auth: {
    user: {
      _id: string;
      companyId: string;
      role: string;
     } | null;
  };
}

const AttendancePage = () => {
  const user = useSelector((state: RootState) => state.auth?.user) || null;
  const navigate = useNavigate();
  
  // State
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [usersOptions, setUsersOptions] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, pending: 0 });

  // Filters State
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Inline Edit State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ clockIn: '', clockOut: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
const [isLoading, setIsLoading] = useState(false);
  // Fetch Meta Data
  useEffect(() => {
    if (!user?._id) return;
    const fetchMetaData = async () => {
      try {
        const companyId = user._id;
        const desRes = await axiosInstance.get(`/hr/designation?companyId=${companyId}&limit=all`);
        setDesignationsOptions((desRes.data?.data?.result || []).map((d: any) => ({ value: d._id, label: d.title })));

        const usersRes = await axiosInstance.get(`/users?company=${companyId}&limit=all`);
        setUsersOptions((usersRes.data?.data?.result || []).map((u: any) => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })));
      } catch (error) {
        console.error('Failed to fetch meta data', error);
      }
    };
    fetchMetaData();
  }, [user]);

  // Fetch Attendance & Stats
  const fetchAttendance = async () => {
  if (!user?._id) return;

  setIsLoading(true);
  try {
    const params = {
      companyId: user._id,
      limit: 'all',
      fromDate: startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
      toDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
      designationId: selectedDesignation?.value,
      userId: selectedUser?.value,
      approvalStatus: activeTab === 'pending' ? 'pending' : undefined
    };

    const res = await axiosInstance.get(`/hr/attendance`, { params });
    const apiResponse = res.data;

    if (apiResponse.success && apiResponse.data) {
      setAttendanceData(apiResponse.data.result || []);
      if (apiResponse.data.meta?.stats) {
        setStats(apiResponse.data.meta.stats);
      }
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate, selectedDesignation, selectedUser, activeTab, user]);

  // Handle Edit Click
  const handleEditClick = (record: any) => {
    setEditingRecordId(record._id);
    setEditForm({
      clockIn: record.clockIn || '',
      clockOut: record.clockOut || ''
    });
    setEditError(null);
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditForm({ clockIn: '', clockOut: '' });
    setEditError(null);
  };

  // Format time input as user types
  const formatTimeInput = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  // Handle time input change
  const handleTimeChange = (field: 'clockIn' | 'clockOut', value: string) => {
    const formatted = formatTimeInput(value);
    setEditForm({ ...editForm, [field]: formatted });
    setEditError(null);
  };

  // Validate and Save
  const handleSaveEdit = async () => {
    // Validation regex for HH:mm (24-hour format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!editForm.clockIn || !timeRegex.test(editForm.clockIn)) {
      setEditError("Clock In must be in HH:mm format (e.g., 09:00)");
      return;
    }
    if (editForm.clockOut && !timeRegex.test(editForm.clockOut)) {
      setEditError("Clock Out must be in HH:mm format (e.g., 17:00)");
      return;
    }

    // Validate hours and minutes
    const [inHour, inMin] = editForm.clockIn.split(':').map(Number);
    if (inHour > 23 || inMin > 59) {
      setEditError("Invalid Clock In time");
      return;
    }

    if (editForm.clockOut) {
      const [outHour, outMin] = editForm.clockOut.split(':').map(Number);
      if (outHour > 23 || outMin > 59) {
        setEditError("Invalid Clock Out time");
        return;
      }
    }

    setIsUpdating(true);
    try {
      await axiosInstance.patch(`/hr/attendance/${editingRecordId}`, {
        clockIn: editForm.clockIn,
        clockOut: editForm.clockOut
      });
      
      await fetchAttendance();
      handleCancelEdit();
    } catch (error) {
      console.error("Failed to update attendance", error);
      setEditError("Failed to update record. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Approve
  const handleApprove = async (recordId: string) => {
    try {
      await axiosInstance.patch(`/hr/attendance/${recordId}`, {
        approvalStatus: 'approved'
      });
      await fetchAttendance();
    } catch (error) {
      console.error("Failed to approve attendance", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold">Attendance Overview</CardTitle>
          </div>
          <CSVExporter
            data={attendanceData}
            filename={`attendance_${moment().format('YYYY-MM-DD')}.csv`}
          />
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl bg-blue-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Present Today</p>
                <h3 className="text-2xl font-bold text-blue-900">{stats.present}</h3>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-red-600">Absent</p>
                <h3 className="text-2xl font-bold text-red-900">{stats.absent}</h3>
              </div>
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending Actions</p>
                <h3 className="text-2xl font-bold text-amber-900">{stats.pending}</h3>
              </div>
              <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>

            <div
              onClick={() => navigate('/company/attendance-report')}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition hover:bg-indigo-100"
            >
              <div>
                <p className="text-sm font-medium text-indigo-600">View Reports</p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
                <History className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Employee</label>
              <Select
                options={usersOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Search Employee..."
                isClearable
                className="text-sm"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Designation</label>
              <Select
                options={designationsOptions}
                value={selectedDesignation}
                onChange={setSelectedDesignation}
                placeholder="All Designations"
                isClearable
                className="text-sm"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Date Range</label>
              <div className="relative w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select dates"
                  maxDate={new Date()}
                />
                <CalendarIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tabs & Data Table */}
          <Tabs
            defaultValue="attendance"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="attendance">Attendance List</TabsTrigger>
              <TabsTrigger value="pending">
                Pendings
                {stats.pending > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                    {stats.pending}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="rounded-md">
              <TabsContent value="attendance" className="m-0">
                <TableSection
  data={attendanceData.filter(d => d.approvalStatus === 'approved')}
  loading={isLoading}
  editingRecordId={editingRecordId}
  editForm={editForm}
  editError={editError}
  isUpdating={isUpdating}
  onEditClick={handleEditClick}
  onCancelEdit={handleCancelEdit}
  onSaveEdit={handleSaveEdit}
  onTimeChange={handleTimeChange}
  showApprove={false}
  onApprove={handleApprove}
/>

              </TabsContent>
              <TabsContent value="pending" className="m-0">
                <TableSection 
                  data={attendanceData}
                  // loading
                  editingRecordId={editingRecordId}
                  editForm={editForm}
                  editError={editError}
                  isUpdating={isUpdating}
                  onEditClick={handleEditClick}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onTimeChange={handleTimeChange}
                  showApprove={true}
                  onApprove={handleApprove}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Reusable Table Section
const TableSection = ({ 
 data,
  loading,
  editingRecordId,
  editForm,
  editError,
  isUpdating,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onTimeChange,
  showApprove,
  onApprove
}: { 
  data: any[];
    loading: boolean;
  editingRecordId: string | null;
  editForm: { clockIn: string; clockOut: string };
  editError: string | null;
  isUpdating: boolean;
  onEditClick: (rec: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTimeChange: (field: 'clockIn' | 'clockOut', value: string) => void;
  showApprove: boolean;
  onApprove: (recordId: string) => void;
}) => {
    if (loading) {
  return (
    <div className="flex items-center justify-center py-16">
      <BlinkingDots size="large" color="bg-theme" />
    </div>
  );
}
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-50 p-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
        <p className="max-w-[250px] text-sm text-gray-500">
          Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record: any) => {
            const firstName = record.userId?.firstName || '';
            const lastName = record.userId?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
            const email = record.userId?.email || '';
            const isEditing = editingRecordId === record._id;

            // Calculate Duration
            let durationStr = '--';
            if (record.clockIn && record.clockOut && record.createdAt) {
              const dateBase = moment(record.createdAt).format('YYYY-MM-DD');
              const start = moment(`${dateBase} ${record.clockIn}`, 'YYYY-MM-DD HH:mm');
              const end = moment(`${dateBase} ${record.clockOut}`, 'YYYY-MM-DD HH:mm');
              if (start.isValid() && end.isValid()) {
                const diff = moment.duration(end.diff(start));
                durationStr = `${diff.hours()}h ${diff.minutes()}m`;
              }
            }

            return (
              <TableRow key={record._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm font-medium">{fullName}</div>
                      <div className="text-xs text-gray-500">{email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {moment(record.createdAt).format('MMM DD, YYYY')}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {isEditing ? (
                    <Input
                      value={editForm.clockIn}
                      onChange={(e) => onTimeChange('clockIn', e.target.value)}
                      placeholder="09:00"
                      className="w-24 h-8"
                      maxLength={5}
                    />
                  ) : (
                    record.clockIn || '--'
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {isEditing ? (
                    <Input
                      value={editForm.clockOut}
                      onChange={(e) => onTimeChange('clockOut', e.target.value)}
                      placeholder="18:00"
                      className="w-24 h-8"
                      maxLength={5}
                    />
                  ) : (
                    record.clockOut || '--'
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {record.clockOut ? (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      {durationStr}
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={record.approvalStatus} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={onCancelEdit}
                          disabled={isUpdating}
                        >
                          <XIcon className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={onSaveEdit}
                          disabled={isUpdating}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {isUpdating ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEditClick(record)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Reconcile
                        </Button>
                        {showApprove && record.approvalStatus === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => onApprove(record._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {editError && (
        <div className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded border border-red-200">
          {editError}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <Badge className={`capitalize shadow-none hover:bg-opacity-80 ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </Badge>
  );
};

export default AttendancePage;