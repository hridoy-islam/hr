

import { useState } from "react"
import { Calendar, Clock, User, Send, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ShiftRequests() {
  const [requestType, setRequestType] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [reason, setReason] = useState("")
  const [suggestedStaff, setSuggestedStaff] = useState("")

  const pendingRequests = [
    {
      id: 1,
      type: "Shift Change",
      date: "2025-07-15",
      time: "09:00-17:00",
      requestedBy: "Sarah Johnson",
      reason: "Medical appointment",
      status: "pending",
      suggestedReplacement: "Mike Wilson",
    },
    {
      id: 2,
      type: "Time Off",
      date: "2025-07-20",
      time: "All Day",
      requestedBy: "John Smith",
      reason: "Family emergency",
      status: "pending",
      suggestedReplacement: "Emma Davis",
    },
    {
      id: 3,
      type: "Shift Swap",
      date: "2025-07-18",
      time: "14:00-22:00",
      requestedBy: "Lisa Brown",
      reason: "Personal commitment",
      status: "approved",
      suggestedReplacement: "Tom Anderson",
    },
  ]

  const staffMembers = [
    "Mike Wilson",
    "Emma Davis",
    "Tom Anderson",
    "Sarah Johnson",
    "John Smith",
    "Lisa Brown",
    "David Lee",
    "Anna Taylor",
  ]

  const handleSubmitRequest = () => {
    // Handle request submission
    console.log("Request submitted:", {
      type: requestType,
      date: selectedDate,
      time: selectedTime,
      reason,
      suggestedStaff,
    })

    // Reset form
    setRequestType("")
    setSelectedDate("")
    setSelectedTime("")
    setReason("")
    setSuggestedStaff("")
  }

  return (
    <div className=" space-y-6">
      <Tabs defaultValue="new-request" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="new-request">New Request</TabsTrigger>
          <TabsTrigger value="manage-requests">Manage Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="new-request">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Request Shift Change</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Type</label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shift-change">Shift Change</SelectItem>
                      <SelectItem value="time-off">Time Off</SelectItem>
                      <SelectItem value="shift-swap">Shift Swap</SelectItem>
                      <SelectItem value="overtime">Overtime Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07:00-15:00">07:00 - 15:00 (Day Shift)</SelectItem>
                      <SelectItem value="15:00-23:00">15:00 - 23:00 (Evening Shift)</SelectItem>
                      <SelectItem value="23:00-07:00">23:00 - 07:00 (Night Shift)</SelectItem>
                      <SelectItem value="09:00-17:00">09:00 - 17:00 (Standard)</SelectItem>
                      <SelectItem value="all-day">All Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Suggested Replacement</label>
                  <Select value={suggestedStaff} onValueChange={setSuggestedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Suggest a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff} value={staff}>
                          {staff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Request</label>
                <Textarea
                  placeholder="Please provide a reason for your shift change request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="border-gray-300"
                />
              </div>

              <Button
                onClick={handleSubmitRequest}
                className="w-full md:w-auto"
                disabled={!requestType || !selectedDate || !reason}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-requests">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">{request.type}</Badge>
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "default"
                                  : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{request.requestedBy}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{request.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{request.time}</span>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600">
                              <strong>Reason:</strong> {request.reason}
                            </div>

                            {request.suggestedReplacement && (
                              <div className="text-sm text-gray-600">
                                <strong>Suggested Replacement:</strong> {request.suggestedReplacement}
                              </div>
                            )}
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Request History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Request History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "2025-07-10", type: "Shift Change", status: "Approved", requestedBy: "Emma Davis" },
                    { date: "2025-07-08", type: "Time Off", status: "Approved", requestedBy: "Mike Wilson" },
                    { date: "2025-07-05", type: "Shift Swap", status: "Rejected", requestedBy: "Tom Anderson" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium">{item.date}</div>
                        <Badge variant="default">{item.type}</Badge>
                        <div className="text-sm text-gray-600">{item.requestedBy}</div>
                      </div>
                      <Badge variant={item.status === "Approved" ? "default" : "destructive"}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
