import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users, // Icon for Supervision context
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';

import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import moment from 'moment';

// --- Interfaces ---

interface ComplianceRow {
  _id: string; // User ID
  supervisionRecordId?: string; // Document ID (optional if missing)
  email: string;
  firstName: string;
  lastName: string;
  scheduledDate: string | null;
  // Status calculated on-the-fly
  status?: 'not-scheduled' | 'overdue' | 'due-soon' | 'scheduled';
}

const SupervisionExpiryPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const {id} = useParams()
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<ComplianceRow[]>([]);

  // Schedule Settings - Default to 30
  const [checkInterval, setCheckInterval] = useState<number>(30);

  // --- 1. Fetch Schedule Settings ---
  const fetchScheduleSettings = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(
        `/schedule-check?companyId=${id}`
      );
      const result = res.data?.data?.result;
      if (result && result.length > 0) {
        // Use supervisionCheckDate from settings
        setCheckInterval(result[0].supervisionCheckDate || 30);
      }
    } catch (err) {
      console.error('Error fetching schedule settings:', err);
    }
  };

  // --- 2. Helper: Calculate Status ---
  const getComplianceStatus = (dateString: string | null) => {
    if (!dateString) return 'not-scheduled';

    const now = moment().startOf('day');
    const target = moment(dateString).startOf('day');
    const diffDays = target.diff(now, 'days');

    if (now.isAfter(target, 'day')) {
      return 'overdue';
    } else if (checkInterval > 0 && diffDays <= checkInterval) {
      return 'due-soon';
    } else {
      return 'scheduled';
    }
  };

  // --- 3. Fetch Employees ---
  const fetchEmployees = async () => {
    const companyId = id || user?.company;
    if (!companyId) return;

    setLoading(true);
    try {
      // Endpoint adapted for Supervision
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/supervision`
      );

      const rawData = response.data.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData: ComplianceRow[] = rawData.map((item: any) => {
        const userObj = item.employeeId || item;

        return {
          _id: userObj._id,
          supervisionRecordId: item._id !== userObj._id ? item._id : undefined,
          firstName: userObj.firstName || 'Unknown',
          lastName: userObj.lastName || '',
          email: userObj.email || '',
          scheduledDate: item.scheduledDate || null, 
        };
      });

      setEmployees(mappedData);
    } catch (error) {
      console.error('Failed to fetch Supervision list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleSettings();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 4. Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-scheduled':
        return <Badge className="bg-gray-500 text-white">Not Scheduled</Badge>;
      case 'overdue':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Due Soon</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD MMM YYYY');
  };

  // --- 5. Handlers ---

  const handleEmployeeClick = (employeeId: string) => {
    // Navigate to employee profile with the 'supervision' tab active
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'supervision' }
    });
  };

  return (
    <div className="">
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Users className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Supervision Status
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-theme hover:bg-theme/90 flex items-center space-x-2 border-none text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="">
                    <TableHead>Employee</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-gray-500"
                      >
                        No pending supervisions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => {
                      const status = getComplianceStatus(emp.scheduledDate);

                      return (
                        <TableRow
                          key={emp._id}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => handleEmployeeClick(emp._id)}
                        >
                          <TableCell>
                            <p className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{emp.email}</p>
                          </TableCell>
                          <TableCell className="font-medium text-gray-600">
                             {formatDate(emp.scheduledDate)}
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmployeeClick(emp._id);
                              }}
                              className="bg-theme hover:bg-theme/90 text-white"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisionExpiryPage;