import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Gavel
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
import { useSelector } from 'react-redux';
import moment from 'moment';

// --- Interfaces ---

interface DisciplinaryRow {
  _id: string; // Disciplinary Record ID
  employeeId: string; // User ID
  firstName: string;
  lastName: string;
  email: string;
  issueDeadline: string | null;
  status: 'overdue' | 'due-soon';
}

const DisciplinaryExpiryPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const {id} = useParams()
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DisciplinaryRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch from the new disciplinary status endpoint
        const response = await axiosInstance.get(
          `/schedule-status/${id}/disciplinary`
        );

        // Map backend response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const issues = response.data.data.map((item: any) => ({
          _id: item._id,
          employeeId: item.employeeId._id,
          firstName: item.employeeId.firstName,
          lastName: item.employeeId.lastName,
          email: item.employeeId.email,
          issueDeadline: item.issueDeadline,
          status: item.status // 'overdue' or 'due-soon'
        }));

        setData(issues);
      } catch (error) {
        console.error('Error fetching disciplinary status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'disciplinary' }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            Due Soon
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD MMM YYYY');
  };

  return (
    <div className="">
      {/* Header */}

      {/* Content */}
      <div className="space-y-6  rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
              <Gavel className="h-6 w-6 text-red-600" />
              Disciplinary Issues
            </h1>
          </div>
          <Button size="sm" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" /> Back
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
                  <TableRow className="">
                    <TableHead className="font-semibold text-gray-900">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Resolution Deadline
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
                          <p>No active disciplinary issues found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow
                        key={row._id}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => handleEmployeeClick(row.employeeId)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {row.firstName} {row.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {row.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(row.issueDeadline)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeClick(row.employeeId);
                            }}
                            className="bg-theme text-white hover:bg-theme/90"
                          >
                            Manage Issue
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

export default DisciplinaryExpiryPage;
