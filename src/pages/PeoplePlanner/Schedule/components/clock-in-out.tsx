import { useState } from "react"
import { Clock, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ClockInOut() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [comments, setComments] = useState("")
  const [clockInTime, setClockInTime] = useState<Date | null>(null)

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`)
        },
        (error) => {
          setCurrentLocation("Location unavailable")
        },
      )
    } else {
      setCurrentLocation("Geolocation not supported")
    }
  }

  const handleClockIn = () => {
    getCurrentLocation()
    setIsClockedIn(true)
    setClockInTime(new Date())
  }

  const handleClockOut = () => {
    setIsClockedIn(false)
    setClockInTime(null)
    setComments("")
  }

  const clockInPrompt = "Service user has high anxiety – remain calm and speak softly. Follow established routine."
  const clockOutPrompt =
    "Before leaving: Confirm stove is turned off, doors are locked, medication is secured, and service user is comfortable."

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Clock In / Clock Out</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isClockedIn ? "bg-green-500" : "bg-gray-400"}`}></div>
              <span className="font-medium">Status: {isClockedIn ? "Clocked In" : "Clocked Out"}</span>
            </div>
            {clockInTime && <Badge variant="secondary">Started: {clockInTime.toLocaleTimeString()}</Badge>}
          </div>

          {/* Clock In Section */}
          {!isClockedIn && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Shift Instructions:</strong> {clockInPrompt}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-4">
                <Button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700 text-white" size="lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Clock In
                </Button>
              </div>
            </div>
          )}

          {/* Clock Out Section */}
          {isClockedIn && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>End of Shift Checklist:</strong> {clockOutPrompt}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Shift Notes/Comments (Optional)</label>
                  <Textarea
                    placeholder="Add any notes about the shift, service user status, or important observations..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleClockOut} className="bg-red-600 hover:bg-red-700 text-white" size="lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Clock Out
                </Button>
              </div>
            </div>
          )}

          {/* Location Info */}
          {currentLocation && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-4 w-4" />
              <span>Location: {currentLocation}</span>
            </div>
          )}

          {/* Recent Clock Events */}
          <div className="space-y-3">
            <h3 className="font-medium">Recent Activity</h3>
            <div className="space-y-2">
              {[
                { time: "09:00 AM", action: "Clocked In", location: "Service User Home", date: "Today" },
                { time: "05:00 PM", action: "Clocked Out", location: "Service User Home", date: "Yesterday" },
                { time: "09:00 AM", action: "Clocked In", location: "Service User Home", date: "Yesterday" },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${event.action === "Clocked In" ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <div>
                      <div className="font-medium text-sm">{event.action}</div>
                      <div className="text-xs text-gray-500">{event.location}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{event.time}</div>
                    <div className="text-xs text-gray-500">{event.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
