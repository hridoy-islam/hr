
import { useState, useEffect } from "react"
import { ArrowLeft, BadgeIcon as IdCard, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { DynamicPagination } from "@/components/shared/DynamicPagination"
import axiosInstance from "@/lib/axios"
import { useNavigate } from "react-router-dom"

interface Employee {
  _id: string
  email: string
  firstName: string
  lastName: string
  position: string
  departmentId: { departmentName: string }
  passportExpiry: {
    hasExpiry: boolean
    expiryDate: string
  }
}

const PassportExpiryPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const response = await axiosInstance.get("/users", {
          params: {
            role: "employee",
            limit: "all",
          },
        })

        const fetchedEmployees: Employee[] = response.data.data.result || response.data.data

        // Filter employees with expiring passports
        const expiringPassports = fetchedEmployees.filter(
          (emp) =>
            emp?.passportExpiry &&
            (isExpiringSoon(emp.passportExpiry) || isExpired(emp.passportExpiry)),
        )

        setEmployees(expiringPassports)
        setFilteredEmployees(expiringPassports)
      } catch (error) {
        console.error("Failed to fetch employees:", error)
        setEmployees([])
        setFilteredEmployees([])
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.departmentId?.departmentName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredEmployees(filtered)
    setCurrentPage(1)
  }, [searchTerm, employees])

  // Helper function to check if date is expiring within 30 days
  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate >= today
  }

  // Helper function to check if date is expired
  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString)
    const today = new Date()
    return expiryDate < today
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  const getExpiryStatus = (dateString: string) => {
    if (isExpired(dateString)) {
      return { status: "Expired", color: "bg-red-500" }
    } else if (isExpiringSoon(dateString)) {
      return { status: "Expiring Soon", color: "bg-yellow-500" }
    }
    return { status: "Valid", color: "bg-green-500" }
  }

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`)
  }

  const handleExport = () => {
    console.log("Exporting passport expiry data...")
    // Implement export functionality here
  }

  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage)
  const startIndex = (currentPage - 1) * entriesPerPage
  const endIndex = startIndex + entriesPerPage
  const currentData = filteredEmployees.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between  w-full">
            
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-100 p-2">
                <IdCard className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Passport Expiry Details</h1>
                <p className="text-sm text-gray-600">{filteredEmployees.length} employees with expiring passports</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-2 bg-supperagent hover:bg-supperagent/90 border-none">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
          {/* <Button onClick={handleExport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button> */}
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {/* Controls */}
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

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-red-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto ">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-700">Department</TableHead>
                      <TableHead className="font-semibold text-gray-700">Position</TableHead>
                      <TableHead className="font-semibold text-gray-700">Passport Expiry Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Action</TableHead>
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
                      currentData.map((employee) => {
                        const status = getExpiryStatus(employee?.passportExpiry)
                        return (
                          <TableRow key={employee._id} className="transition-colors hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {employee.firstName} {employee.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{employee.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{employee.departmentId?.departmentName}</TableCell>
                            <TableCell className="text-gray-600">{employee.position}</TableCell>
                            <TableCell className="font-medium">
                              {formatDate(employee?.passportExpiry)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${status.color} text-white`}>{status.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleEmployeeClick(employee._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
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
    </div>
  )
}

export default PassportExpiryPage
