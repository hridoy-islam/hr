import { Calendar, Clock, Users, FileText, MessageSquare, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScheduleView } from "./components/schedule-view"
import { ClockInOut } from "./components/clock-in-out"
import { TaskLogging } from "./components/task-logging"
import { TeamCommunication } from "./components/team-communication"
import { ShiftRequests } from "./components/shift-request"

export default function SchedulePage() {
  return (
    <div className="min-h-screen">
      

      <main className="  ">
      
      <ScheduleView />
      </main>
    </div>
  )
}
