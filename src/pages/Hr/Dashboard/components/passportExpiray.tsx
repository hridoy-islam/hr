import { useState, useEffect } from "react";
import { ArrowLeft, BadgeIcon as IdCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BlinkingDots } from "@/components/shared/blinking-dots";
import { DynamicPagination } from "@/components/shared/DynamicPagination";
import axiosInstance from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Employee {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  departmentId: { departmentName: string };
  passportExpiry: string;
}

const PassportExpiryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/users", {
          params: { role: "employee", limit: "all", fields:"firstName lastName email passportExpiry departmentId designationId" },
        });
        const fetchedEmployees: Employee[] = response.data.data.result || response.data.data;

        const expiringPassports = fetchedEmployees.filter(
          (emp) => emp.passportExpiry && (isExpiringSoon(emp.passportExpiry) || isExpired(emp.passportExpiry))
        );

        setEmployees(expiringPassports);
        setFilteredEmployees(expiringPassports);
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

  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    return expiryDate <= ninetyDaysFromNow && expiryDate >= today;
  };

  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const getExpiryStatus = (dateString: string) => {
    if (isExpired(dateString)) return { status: "Expired", color: "bg-red-500" };
    if (isExpiringSoon(dateString)) return { status: "Expiring Soon", color: "bg-yellow-500" };
    return { status: "Valid", color: "bg-green-500" };
  };

  const handleUpdateClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewExpiryDate(employee.passportExpiry ? new Date(employee.passportExpiry) : null);
  };

  const handleSaveUpdate = async () => {
    if (!selectedEmployee || !newExpiryDate) return;

    setUpdating(true);
    try {
      await axiosInstance.patch(`/users/${selectedEmployee._id}`, {
        passportExpiry: newExpiryDate.toISOString(),
      });

      setEmployees(prev =>
        prev.map(emp =>
          emp._id === selectedEmployee._id ? { ...emp, passportExpiry: newExpiryDate.toISOString() } : emp
        )
      );
      setFilteredEmployees(prev =>
        prev.map(emp =>
          emp._id === selectedEmployee._id ? { ...emp, passportExpiry: newExpiryDate.toISOString() } : emp
        )
      );

      setSelectedEmployee(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = filteredEmployees.slice(startIndex, endIndex);

    const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`,{state: { activeTab: "identification" },})
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-red-100 p-2">
              <IdCard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Passport Expiry Details</h1>
              <p className="text-sm text-gray-600">
                {filteredEmployees.length} employees with expiring passports
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 bg-supperagent hover:bg-supperagent/90 border-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Search:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees..."
                  className="w-64 pl-10"
                />
              </div>
            </div>
          </div>

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
                      <TableHead>Passport Expiry Date (dd/mm/yyyy)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                          No employees found with expiring passports.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((emp) => {
                        const status = getExpiryStatus(emp.passportExpiry);
                        return (
                          <TableRow key={emp._id} className="transition-colors hover:bg-gray-50">
                            <TableCell  onClick={() => handleEmployeeClick(emp._id)}>
                              <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                              <p className="text-sm text-gray-500">{emp.email}</p>
                            </TableCell>
                            <TableCell  onClick={() => handleEmployeeClick(emp._id)} className="text-gray-600">{emp.departmentId?.departmentName}</TableCell>
                            <TableCell  onClick={() => handleEmployeeClick(emp._id)} className="text-gray-600">{emp.position}</TableCell>
                            <TableCell  onClick={() => handleEmployeeClick(emp._id)} className="font-medium">{formatDate(emp.passportExpiry)}</TableCell>
                            <TableCell  onClick={() => handleEmployeeClick(emp._id)}>
                              <Badge className={`${status.color} text-white`}>{status.status}</Badge>
                            </TableCell>
                            <TableCell className="flex justify-end">
                                {/* <Button
                                size="sm"
                                onClick={() => handleEmployeeClick(employee._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                View Details
                              </Button> */}
                              <Button
                                size="sm"
                                onClick={() => handleUpdateClick(emp)}
                                className="bg-supperagent hover:bg-suppreagent/90 text-white"
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Passport Expiry for{" "}
              <span className="font-semibold">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Passport Expiry Date</label>
            <DatePicker
              selected={newExpiryDate}
              onChange={(date) => setNewExpiryDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="DD-MM-YYYY"
              wrapperClassName="w-full"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              className="w-full p-2 border rounded-md"
              preventOpenOnFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmployee(null)}>Cancel</Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={updating || !newExpiryDate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updating ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassportExpiryPage;
