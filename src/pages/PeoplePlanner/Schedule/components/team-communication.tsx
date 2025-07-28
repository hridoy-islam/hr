
import { useState } from "react"
import { AlertTriangle, MessageSquare, Flag, Send, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TeamCommunication() {
  const [flagType, setFlagType] = useState("")
  const [flagDescription, setFlagDescription] = useState("")
  const [selectedServiceUser, setSelectedServiceUser] = useState("")
  const [selectedShift, setSelectedShift] = useState("")

  const serviceUsers = [
    { id: "john-doe", name: "John Doe" },
    { id: "jane-smith", name: "Jane Smith" },
    { id: "bob-wilson", name: "Bob Wilson" },
  ]

  const shifts = [
    { id: "morning-shift", name: "Morning Shift (07:00-15:00)" },
    { id: "evening-shift", name: "Evening Shift (15:00-23:00)" },
    { id: "night-shift", name: "Night Shift (23:00-07:00)" },
  ]

  const flags = [
    {
      id: 1,
      type: "Incident",
      priority: "High",
      serviceUser: "John Doe",
      shift: "Morning Shift",
      reportedBy: "Sarah Johnson",
      timestamp: "2025-07-11 10:30",
      description: "Service user had a fall in the bathroom. No injuries sustained. Incident form completed.",
      status: "Under Review",
    },
    {
      id: 2,
      type: "Near Miss",
      priority: "Medium",
      serviceUser: "Jane Smith",
      shift: "Evening Shift",
      reportedBy: "Mike Wilson",
      timestamp: "2025-07-10 18:45",
      description: "Wet floor in kitchen area could have caused a slip. Area was immediately cleaned and dried.",
      status: "Resolved",
    },
    {
      id: 3,
      type: "General Comment",
      priority: "Low",
      serviceUser: "Bob Wilson",
      shift: "Night Shift",
      reportedBy: "Emma Davis",
      timestamp: "2025-07-10 02:15",
      description: "Service user expressed concern about medication timing. Discussed with day shift supervisor.",
      status: "Acknowledged",
    },
  ]

  const handleSubmitFlag = () => {
    if (!flagType || !flagDescription || !selectedServiceUser || !selectedShift) {
      return
    }

    console.log("Flag submitted:", {
      type: flagType,
      description: flagDescription,
      serviceUser: selectedServiceUser,
      shift: selectedShift,
      timestamp: new Date().toISOString(),
    })

    // Reset form
    setFlagType("")
    setFlagDescription("")
    setSelectedServiceUser("")
    setSelectedShift("")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review":
        return "default"
      case "Resolved":
        return "secondary"
      case "Acknowledged":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="raise-flag" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="raise-flag">Raise a Flag</TabsTrigger>
          <TabsTrigger value="view-flags">View Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="raise-flag">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5" />
                <span>Raise a Flag</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Use this form to report incidents, near misses, or general comments that need team attention.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flag Type</label>
                  <Select value={flagType} onValueChange={setFlagType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flag type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="near-miss">Near Miss</SelectItem>
                      <SelectItem value="general-comment">General Comment</SelectItem>
                      <SelectItem value="safety-concern">Safety Concern</SelectItem>
                      <SelectItem value="equipment-issue">Equipment Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Service User</label>
                  <Select value={selectedServiceUser} onValueChange={setSelectedServiceUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service user" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Shift</label>
                  <Select value={selectedShift} onValueChange={setSelectedShift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Provide detailed description of the incident, near miss, or comment..."
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  rows={6}
                  className="border-gray-300"
                />
              </div>

              <Button
                onClick={handleSubmitFlag}
                className="w-full md:w-auto"
                disabled={!flagType || !flagDescription || !selectedServiceUser || !selectedShift}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Flag
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-flags">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Team Communication Flags</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flags.map((flag) => (
                    <div key={flag.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">{flag.type}</Badge>
                          <Badge variant={getPriorityColor(flag.priority)}>{flag.priority} Priority</Badge>
                          <Badge variant={getStatusColor(flag.status)}>{flag.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">#{flag.id}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            <strong>Service User:</strong> {flag.serviceUser}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            <strong>Shift:</strong> {flag.shift}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            <strong>Reported by:</strong> {flag.reportedBy}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <strong>Timestamp:</strong> {flag.timestamp}
                      </div>

                      <div className="text-sm">
                        <strong>Description:</strong>
                        <p className="mt-1 text-gray-700">{flag.description}</p>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button variant="default" size="sm">
                          Update Status
                        </Button>
                        <Button variant="default" size="sm">
                          Add Comment
                        </Button>
                        <Button variant="default" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-gray-600">Open Incidents</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Flag className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">7</div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-sm text-gray-600">Total This Month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
