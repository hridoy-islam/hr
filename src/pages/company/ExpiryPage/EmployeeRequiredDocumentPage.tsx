import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileWarning,
  AlertCircle,
  CheckCircle2,
  FileX
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

// --- Interfaces ---
interface EmployeeDocData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  missingDocuments: string[];
  status: string;
}

const EmployeeRequiredDocumentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Company ID
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeDocData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Updated Endpoint based on your route
        const response = await axiosInstance.get(
          `/schedule-status/${id}/required-documents`
        );

        // Map backend response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const employees = response.data.data.map((item: any) => ({
          _id: item.employeeId._id,
          firstName: item.employeeId.firstName,
          lastName: item.employeeId.lastName,
          email: item.employeeId.email,
          missingDocuments: item.missingDocuments || [],
          status: item.status || 'missing'
        }));

        setData(employees);
      } catch (error) {
        console.error('Error fetching document status:', error);
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
    // Navigate to the specific employee's document tab
    navigate(`/company/${id}/employee/${employeeId}`, {
      state: { activeTab: 'document' }
    });
  };

  return (
    <div className="">
      {/* Content */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
              <FileWarning className="h-6 w-6 text-red-600" />
              Missing Required Documents
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              The following employees are missing mandatory compliance
              documents.
            </p>
          </div>
          <Button size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
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
                          <p>All employees have uploaded required documents.</p>
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
                        <TableCell className="align-top">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {emp.email}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Action Required
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeClick(emp._id);
                            }}
                            className="bg-theme text-white hover:bg-theme/90"
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

export default EmployeeRequiredDocumentPage;
