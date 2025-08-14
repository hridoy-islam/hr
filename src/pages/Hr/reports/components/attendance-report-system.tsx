

import { useState } from "react"
import { Calendar, FileText, Download, Clock, CheckCircle, XCircle, Eye, Filter, Users, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import moment from "moment"

// Mock data for attendance reports
const attendanceReports = [
  {
    id: "AR001",
    employeeId: "EMP001",
    employeeName: "John Smith",
    department: "Care Services",
    requestDate: "2025-01-10",
    startDate: "2025-01-01",
    endDate: "2025-01-15",
    status: "pending",
    reason: "Monthly payroll verification",
    totalHours: 120,
    workingDays: 15,
    adminNotes: "",
  },
  {
    id: "AR002",
    employeeId: "EMP002",
    employeeName: "Sarah Johnson",
    department: "Administration",
    requestDate: "2025-01-08",
    startDate: "2024-12-16",
    endDate: "2024-12-31",
    status: "approved",
    reason: "Year-end documentation",
    totalHours: 128,
    workingDays: 16,
    adminNotes: "Approved for year-end processing",
  },
  {
    id: "AR003",
    employeeId: "EMP003",
    employeeName: "Michael Brown",
    department: "Field Services",
    requestDate: "2025-01-12",
    startDate: "2025-01-01",
    endDate: "2025-01-31",
    status: "rejected",
    reason: "Insurance claim documentation",
    totalHours: 0,
    workingDays: 0,
    adminNotes: "Incomplete attendance records for requested period",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4" />
    case "pending":
      return <Clock className="h-4 w-4" />
    case "rejected":
      return <XCircle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function AttendanceReportSystem() {
  const [activeTab, setActiveTab] = useState("request")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [reason, setReason] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  const handleSubmitRequest = () => {
    if (!startDate || !endDate || !reason.trim()) {
      alert("Please fill in all required fields")
      return
    }

    // Here you would typically submit to your API
    console.log("Submitting request:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: reason.trim(),
    })

    // Reset form
    setStartDate(null)
    setEndDate(null)
    setReason("")
    setIsRequestDialogOpen(false)

    alert("Attendance report request submitted successfully!")
  }

  const handleDownloadPDF = (report: any) => {
    // Mock PDF generation
    console.log("Generating PDF for report:", report.id)
    alert(
      `Generating PDF report for ${report.employeeName} (${moment(report.startDate).format("MMM D")} - ${moment(report.endDate).format("MMM D, YYYY")})`,
    )
  }

  const filteredReports = attendanceReports.filter((report) => filterStatus === "all" || report.status === filterStatus)

  const stats = [
    {
      title: "Total Requests",
      value: attendanceReports.length.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Approval",
      value: attendanceReports.filter((r) => r.status === "pending").length.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Approved Reports",
      value: attendanceReports.filter((r) => r.status === "approved").length.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "This Month",
      value: attendanceReports.filter((r) => moment(r.requestDate).isSame(moment(), "month")).length.toString(),
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Report System</h1>
                <p className="text-gray-600 mt-1">Request and manage attendance reports with admin approval</p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Request Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Request Attendance Report
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                          Select Date Range *
                        </Label>
                        <DatePicker
                          selectsRange
                          startDate={startDate}
                          endDate={endDate}
                          onChange={handleDateChange}
                          placeholderText="Select start and end date"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          dateFormat="MMM d, yyyy"
                          maxDate={new Date()}
                        />
                        {startDate && endDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            Duration: {moment(endDate).diff(moment(startDate), "days") + 1} days
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                          Reason for Request *
                        </Label>
                        <Textarea
                          id="reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Please specify why you need this attendance report..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitRequest} className="bg-blue-600 hover:bg-blue-700">
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger
              value="request"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md"
            >
              My Requests
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md"
            >
              Admin Panel
            </TabsTrigger>
          </TabsList>

          {/* My Requests Tab */}
          <TabsContent value="request">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    My Attendance Report Requests
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{moment(report.startDate).format("MMM D, YYYY")}</div>
                              <div className="text-gray-500">to {moment(report.endDate).format("MMM D, YYYY")}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                          <TableCell>{moment(report.requestDate).format("MMM D, YYYY")}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(report.status)} border`}>
                              {getStatusIcon(report.status)}
                              <span className="capitalize ml-1">{report.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {report.status === "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadPDF(report)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Panel Tab */}
          <TabsContent value="admin">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Admin: Manage Report Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{report.employeeName}</div>
                              <div className="text-sm text-gray-500">{report.employeeId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              {report.department}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{moment(report.startDate).format("MMM D")}</div>
                              <div className="text-gray-500">to {moment(report.endDate).format("MMM D, YYYY")}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(report.status)} border`}>
                              {getStatusIcon(report.status)}
                              <span className="capitalize ml-1">{report.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {report.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => alert(`Approved report for ${report.employeeName}`)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => alert(`Rejected report for ${report.employeeName}`)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Report Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Report Details
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Employee</Label>
                    <p className="text-sm text-gray-900">{selectedReport.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Department</Label>
                    <p className="text-sm text-gray-900">{selectedReport.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                    <p className="text-sm text-gray-900">{moment(selectedReport.startDate).format("MMM D, YYYY")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">End Date</Label>
                    <p className="text-sm text-gray-900">{moment(selectedReport.endDate).format("MMM D, YYYY")}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Reason</Label>
                  <p className="text-sm text-gray-900">{selectedReport.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={`${getStatusColor(selectedReport.status)} border w-fit`}>
                    {getStatusIcon(selectedReport.status)}
                    <span className="capitalize ml-1">{selectedReport.status}</span>
                  </Badge>
                </div>
                {selectedReport.adminNotes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Admin Notes</Label>
                    <p className="text-sm text-gray-900">{selectedReport.adminNotes}</p>
                  </div>
                )}
                {selectedReport.status === "approved" && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Report Ready</p>
                        <p className="text-sm text-green-600">Total Hours: {selectedReport.totalHours}h</p>
                      </div>
                      <Button
                        onClick={() => handleDownloadPDF(selectedReport)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
