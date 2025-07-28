import { useState } from "react"
import { User, AlertTriangle, Calendar, Pill, Plus, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TaskLogging() {
  const [selectedServiceUser, setSelectedServiceUser] = useState("john-doe")
  const [shiftComment, setShiftComment] = useState("")

  const serviceUsers = [
    { id: "john-doe", name: "John Doe", riskLevel: "Medium" },
    { id: "jane-smith", name: "Jane Smith", riskLevel: "High" },
    { id: "bob-wilson", name: "Bob Wilson", riskLevel: "Low" },
  ]

  const tasks = [
    { id: 1, title: "Personal Care", status: "completed", time: "09:00", notes: "Assisted with morning routine" },
    {
      id: 2,
      title: "Medication Administration",
      status: "completed",
      time: "09:30",
      notes: "All medications taken as prescribed",
    },
    { id: 3, title: "Meal Preparation", status: "pending", time: "12:00", notes: "" },
    { id: 4, title: "Exercise/Mobility", status: "pending", time: "14:00", notes: "" },
  ]

  const appointments = [
    { id: 1, type: "GP Visit", date: "2025-07-15", time: "10:00", status: "scheduled" },
    { id: 2, type: "Physiotherapy", date: "2025-07-18", time: "14:30", status: "scheduled" },
    { id: 3, type: "Blood Test", date: "2025-07-20", time: "09:00", status: "pending" },
  ]

  const medications = [
    { id: 1, name: "Metformin", dosage: "500mg", frequency: "Twice daily", time: "08:00, 20:00", status: "given" },
    { id: 2, name: "Lisinopril", dosage: "10mg", frequency: "Once daily", time: "08:00", status: "given" },
    { id: 3, name: "Aspirin", dosage: "75mg", frequency: "Once daily", time: "08:00", status: "pending" },
  ]

  return (
    <div className="space-y-6">
      {/* Service User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Service User Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedServiceUser} onValueChange={setSelectedServiceUser}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Service User" />
              </SelectTrigger>
              <SelectContent>
                {serviceUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{user.name}</span>
                      <Badge
                        variant={
                          user.riskLevel === "High"
                            ? "destructive"
                            : user.riskLevel === "Medium"
                              ? "default"
                              : "secondary"
                        }
                        className="ml-2"
                      >
                        {user.riskLevel} Risk
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shift Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Add comments about this shift..."
              value={shiftComment}
              onChange={(e) => setShiftComment(e.target.value)}
              rows={3}
            />
            <Button>Save Shift Comment</Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Assigned Tasks</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="needs">Needs Assessment</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medication">MAR Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assigned Tasks</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${task.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`}
                      ></div>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500">Scheduled: {task.time}</div>
                        {task.notes && <div className="text-sm text-gray-600 mt-1">{task.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>{task.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobility Risk</label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fall Risk</label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Risk Notes</label>
                  <Textarea placeholder="Document any specific risks or concerns..." rows={4} />
                </div>
                <Button>Update Risk Assessment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs">
          <Card>
            <CardHeader>
              <CardTitle>Needs Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Personal Care Level</label>
                    <Select defaultValue="partial">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="independent">Independent</SelectItem>
                        <SelectItem value="partial">Partial Assistance</SelectItem>
                        <SelectItem value="full">Full Assistance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Communication Needs</label>
                    <Select defaultValue="verbal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verbal">Verbal</SelectItem>
                        <SelectItem value="non-verbal">Non-verbal</SelectItem>
                        <SelectItem value="assisted">Assisted Communication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Requirements</label>
                  <Textarea placeholder="Document special needs, preferences, or requirements..." rows={4} />
                </div>
                <Button>Update Needs Assessment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Medical Appointments</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{appointment.type}</div>
                      <div className="text-sm text-gray-500">
                        {appointment.date} at {appointment.time}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medication">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5" />
                  <span>Medication Administration Record (MAR)</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-500">
                        {med.dosage} - {med.frequency}
                      </div>
                      <div className="text-sm text-gray-500">Times: {med.time}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={med.status === "given" ? "default" : "secondary"}>{med.status}</Badge>
                      <Button variant="outline" size="sm">
                        Mark as Given
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
