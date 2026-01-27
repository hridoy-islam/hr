import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  CheckCircle2,
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
import { useSelector } from 'react-redux';

// --- Interfaces ---

interface InductionComplianceRow {
  _id: string; // User ID
  email: string;
  firstName: string;
  lastName: string;
  inductionDate: string | null;
  status: 'missing' | 'completed'; // The API primarily returns 'missing' for this list
}

const InductionExpiryPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  const {id} = useParams()
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InductionComplianceRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch from the new induction status endpoint
        const response = await axiosInstance.get(
          `/schedule-status/${id}/induction`
        );

        // Map the backend response structure { employeeId: User, status: ... } to flat rows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const employees = response.data.data.map((item: any) => ({
          _id: item.employeeId._id,
          firstName: item.employeeId.firstName,
          lastName: item.employeeId.lastName,
          email: item.employeeId.email,
          inductionDate: item.inductionDate || null,
          status: item.status || 'missing'
        }));

        setData(employees);
      } catch (error) {
        console.error('Error fetching induction status:', error);
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
      state: { activeTab: 'induction' }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'missing':
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            Missing
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="">
      {/* Header */}

      {/* Content */}
      <div className="rounded-xl  bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
              <UserPlus className="h-6 w-6 text-lime-600" />
              Induction Status
            </h1>
          </div>
          <Button size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>
        <div className="">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-900">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Induction Date
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
                          <p>
                            Great job! All employees have completed induction.
                          </p>
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
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {emp.inductionDate ? (
                              <span>{emp.inductionDate}</span>
                            ) : (
                              <span className="italic text-gray-400">
                                Not Set
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handleEmployeeClick(emp._id);
                            }}
                            className="bg-theme text-white hover:bg-theme/90"
                          >
                            Set Induction
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

export default InductionExpiryPage;
