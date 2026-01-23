import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  GraduationCap, // Icon for Training context
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
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';

// --- Interfaces ---

interface TrainingComplianceRow {
  _id: string; // The EmployeeTraining document ID
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  trainingId: {
    _id: string;
    name: string;
  };
  assignedDate: string;
  expireDate: string;
  status?: string; // 'expiring' comes from backend, or we calc
}

const TrainingExpiryPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = useSelector((state: any) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<TrainingComplianceRow[]>([]);

  // --- 1. Fetch Training Status ---
  const fetchTrainingStatus = async () => {
    const companyId = user?._id || user?.company;
    if (!companyId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/schedule-status/${companyId}/training`
      );

      // The backend returns a list of EmployeeTraining documents that are non-compliant
      // populated with employeeId and trainingId
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch Training list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 2. Helpers ---
  
  const getStatusBadge = (expiryDate: string) => {
    const now = moment().startOf('day');
    const target = moment(expiryDate).startOf('day');
    
    // If expired
    if (now.isAfter(target)) {
      return <Badge className="bg-red-600 text-white hover:bg-red-700">Expired</Badge>;
    } 
    // If expiring soon (future date but returned by backend as 'bad')
    return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Expiring Soon</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD MMM YYYY');
  };

  // --- 3. Handlers ---

  const handleNavigateToEmployee = (employeeId: string) => {
    // Navigate to employee profile with the 'training' tab active
    navigate(`/company/employee/${employeeId}`, {
      state: { activeTab: 'training' }
    });
  };

  return (
    <div className="">
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-rose-100 p-2">
                <GraduationCap className="h-6 w-6 text-rose-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Training Compliance
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
                    <TableHead>Training Module</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        All employee trainings are compliant.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow
                        key={record._id}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => handleNavigateToEmployee(record.employeeId._id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {record.employeeId.firstName} {record.employeeId.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {record.employeeId.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-700">
                            {record.trainingId?.name || 'Unknown Training'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-600">
                           {formatDate(record.expireDate)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.expireDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToEmployee(record.employeeId._id);
                            }}
                            className="bg-theme hover:bg-theme/90 text-white"
                          >
                            Update
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

export default TrainingExpiryPage;