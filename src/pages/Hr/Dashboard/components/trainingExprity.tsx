import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BlinkingDots } from "@/components/shared/blinking-dots";
import { DynamicPagination } from "@/components/shared/DynamicPagination";
import axiosInstance from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import moment from "moment";

// === Types ===
interface LocalTraining {
  _id?: string;
  trainingId: { _id: string; name: string }; // matches backend
  assignedDate: string;
  expireDate?: string | null;
  status: "inProgress" | "completed" | "expired";
  completedAt?: string;
  certificate?: File | null;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: { departmentName: string };
  training?: LocalTraining[];
}

const TrainingExpiryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // === Fetch Employees ===
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/users", { params: { role: "employee", limit: "all" } });
        const fetchedEmployees: Employee[] = response.data.data.result || response.data.data;

        // Filter employees with expired or expiring trainings
        const expiringEmployees = fetchedEmployees.filter((emp) =>
          emp.training?.some((t) => t.expireDate && (isTrainingExpired(t.expireDate) || isTrainingExpiringSoon(t.expireDate)))
        );

        setEmployees(expiringEmployees);
        setFilteredEmployees(expiringEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // === Filter by Search Term ===
  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.departmentId?.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, employees]);

  // === Helpers ===
  const isTrainingExpired = (expireDate: string) => moment(expireDate).isBefore(moment(), "day");

  const isTrainingExpiringSoon = (expireDate: string, days = 90) => {
    const today = moment();
    const expiry = moment(expireDate);
    const threshold = today.clone().add(days, "days");
    return expiry.isSameOrAfter(today, "day") && expiry.isSameOrBefore(threshold, "day");
  };

  const formatDate = (dateString?: string | null) =>
    dateString ? moment(dateString).format("DD/MM/YYYY") : "N/A";

  const getExpiryStatus = (expireDate?: string | null) => {
    if (!expireDate) return { status: "No Expiry", color: "bg-gray-500" };
    if (isTrainingExpired(expireDate)) return { status: "Expired", color: "bg-red-500" };
    if (isTrainingExpiringSoon(expireDate)) return { status: "Expiring Soon", color: "bg-yellow-500" };
    return { status: "Valid", color: "bg-green-500" };
  };

const getExpiringTrainings = (employee: Employee) =>
  employee.training?.filter((t) => {
    // exclude completed unless recurring
    if (t.status === "completed" && !(t.trainingId as any).isRecurring) return false;

    return (
      t.expireDate &&
      (isTrainingExpired(t.expireDate) || isTrainingExpiringSoon(t.expireDate))
    );
  });


  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`, { state: { activeTab: "training" } });
  };

  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage);
  const currentData = filteredEmployees.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Training Course Expiry Details</h1>
              <p className="text-sm text-gray-600">Expiring training courses</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="bg-supperagent hover:bg-supperagent/90 border-none flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {/* Search */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Search:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search employees..." className="w-64 pl-10" />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Training Course</TableHead>
                      <TableHead>Expiry Date (dd/mm/yyyy)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                          No employees found with expiring training courses.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((employee) => {
                        const expiringTrainings = getExpiringTrainings(employee);
                        if (!expiringTrainings || expiringTrainings.length === 0) return null;

                        return expiringTrainings.map((training) => {
                          const status = getExpiryStatus(training.expireDate);
                          return (
                            <TableRow key={`${employee._id}-${training._id}`} className="hover:bg-gray-50">
                              <TableCell>
                                <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                                <p className="text-sm text-gray-500">{employee.email}</p>
                              </TableCell>
                              <TableCell className="text-gray-600">{employee.departmentId?.departmentName}</TableCell>
                              <TableCell className="text-gray-600">{employee.position}</TableCell>
                              <TableCell className="font-medium">{training.trainingId.name}</TableCell>
                              <TableCell className="font-medium">{formatDate(training.expireDate)}</TableCell>
                              <TableCell>
                                <Badge className={`${status.color} text-white`}>{status.status}</Badge>
                              </TableCell>
                              <TableCell className="flex justify-end">
                                <Button size="sm" onClick={() => handleEmployeeClick(employee._id)} className="bg-supperagent hover:bg-supperagent/90 text-white">
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <DynamicPagination pageSize={entriesPerPage} setPageSize={setEntriesPerPage} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingExpiryPage;
