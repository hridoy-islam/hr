import { useState, useEffect } from "react"
import { ArrowLeft, BookOpen, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { DynamicPagination } from "@/components/shared/DynamicPagination"
import axiosInstance from "@/lib/axios"
import { useNavigate } from "react-router-dom"

interface Training {
  _id: string
  name: string
  expiryDate?: string
  reminderBeforeDays?: number
}

interface Employee {
  _id: string
  email: string
  firstName: string
  lastName: string
  position: string
  departmentId: { departmentName: string }
  training?: Array<{
    trainingId: Training
    endDate: string
    status: string
  }>
}

const TrainingExpiryPage = () => {
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

        // Filter employees with expiring training
        const expiringTrainingEmployees = fetchedEmployees.filter((emp) =>
          emp.training?.some((training) => 
            training.endDate && 
            (isTrainingExpiringSoon(training.endDate, training.trainingId?.reminderBeforeDays) || 
            isTrainingExpired(training.endDate)
        )))

        setEmployees(expiringTrainingEmployees)
        setFilteredEmployees(expiringTrainingEmployees)
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

  // Helper function to check if training is expiring soon (within reminder days)
  const isTrainingExpiringSoon = (endDate: string, reminderDays = 0) => {
    const expiryDate = new Date(endDate)
    const today = new Date()
    const reminderDate = new Date(expiryDate)
    reminderDate.setDate(expiryDate.getDate() - (reminderDays || 0))

    return today >= reminderDate && today <= expiryDate
  }

  // Helper function to check if training is expired
  const isTrainingExpired = (endDate: string) => {
    const expiryDate = new Date(endDate)
    const today = new Date()
    return today > expiryDate
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  const getExpiryStatus = (endDate: string, reminderDays = 0) => {
    if (isTrainingExpired(endDate)) {
      return { status: "Expired", color: "bg-red-500" }
    } else if (isTrainingExpiringSoon(endDate, reminderDays)) {
      return { status: "Expiring Soon", color: "bg-yellow-500" }
    }
    return { status: "Valid", color: "bg-green-500" }
  }

  const getExpiringTrainings = (employee: Employee) => {
    return employee.training?.filter((training) => 
      training.endDate && 
      (isTrainingExpiringSoon(training.endDate, training.trainingId?.reminderBeforeDays) || 
       isTrainingExpired(training.endDate))
    )
  }

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin/hr/employee/${employeeId}`)
  }

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get("/reports/training-expiry", {
        responseType: "blob"
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "training_expiry_report.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Failed to export training expiry data:", error)
    }
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
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Course Expiry Details</h1>
                <p className="text-sm text-gray-600">
                Expiring training courses
                </p>
              </div>
            </div>
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
              <BlinkingDots size="large" color="bg-orange-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-700">Department</TableHead>
                      <TableHead className="font-semibold text-gray-700">Position</TableHead>
                      <TableHead className="font-semibold text-gray-700">Training Course</TableHead>
                      <TableHead className="font-semibold text-gray-700">Expiry Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Action</TableHead>
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
                        const expiringTrainings = getExpiringTrainings(employee)
                        
                        if (!expiringTrainings || expiringTrainings.length === 0) return null

                        return expiringTrainings.map((training) => {
                          const status = training.endDate 
                            ? getExpiryStatus(training.endDate, training.trainingId?.reminderBeforeDays)
                            : { status: "N/A", color: "bg-gray-500" }

                          return (
                            <TableRow key={`${employee._id}-${training.trainingId?._id}`} className="transition-colors hover:bg-gray-50">
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
                              <TableCell className="font-medium">{training.trainingId?.name || "N/A"}</TableCell>
                              <TableCell className="font-medium">
                                {training.endDate ? formatDate(training.endDate) : "N/A"}
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

export default TrainingExpiryPage