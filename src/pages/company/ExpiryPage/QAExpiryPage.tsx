import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  AlertCircle,
  Calendar,
  CheckCircle2
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
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';

// --- Interfaces ---

interface QAComplianceRow {
  _id: string; // User ID
  firstName: string;
  lastName: string;
  email: string;
  scheduledDate: string | null;
  // Status comes from the backend logic (missing, overdue, due-soon, scheduled)
  status: 'not-scheduled' | 'overdue' | 'due-soon' | 'scheduled';
}

const QAExpiryPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QAComplianceRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        // Fetch from the QA status endpoint (you'll need to ensure this route exists in your backend)
        const response = await axiosInstance.get(
          `/schedule-status/${user._id}/qa`
        );

        // Map backend response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const employees = response.data.data.map((item: any) => ({
          _id: item.employeeId._id,
          firstName: item.employeeId.firstName,
          lastName: item.employeeId.lastName,
          email: item.employeeId.email,
          scheduledDate: item.scheduledDate || null,
          status: item.status || 'not-scheduled'
        }));

        setData(employees);
      } catch (error) {
        console.error('Error fetching QA status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/employee/${employeeId}`, {
      state: { activeTab: 'qa' }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Calendar className="mr-1 h-3 w-3" />
            Due Soon
          </Badge>
        );
      case 'not-scheduled':
      case 'missing':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Not Scheduled
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Scheduled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString)
      return <span className="italic text-gray-400">Not Set</span>;
    return moment(dateString).format('DD MMM YYYY');
  };

  return (
    <div className="">
      {/* Header */}

      {/* Content */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
              <ClipboardCheck className="h-6 w-6 text-theme" />
              QA Check Status
            </h1>
          </div>
          <Button size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            back
          </Button>
        </div>
        <div className="">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <div className="">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Scheduled Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-900">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                          <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                          <p>All employees are compliant with QA checks.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((emp) => (
                      <TableRow
                        key={emp._id}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => handleEmployeeClick(emp._id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {emp.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(emp.scheduledDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeClick(emp._id);
                            }}
                            className="bg-theme text-white hover:bg-theme/90"
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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

export default QAExpiryPage;
