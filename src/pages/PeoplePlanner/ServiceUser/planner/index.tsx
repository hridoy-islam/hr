import React, { useMemo, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RightSidebar } from './components/RightSidebar';
import { TopControls } from './components/TopControls';
import { Timeline } from './components/Timeline';
import type { SidebarState } from '@/types/planner';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Static service user (single)
const serviceUser = {
  id: '1',
  name: 'Avis, Louise',
  initials: 'LA',
  type: 'Individual',
  care: 'Everycare Romford, Care',
  address: '123 Care Lane, Romford, RM1 4AB',
  contact: '01234 567890',
  carePlan: 'Standard care package with daily visits'
};

// Tasks
const tasks = [
  {
    id: '1',
    title: 'Morning Care',
    startTime: '08:00',
    endTime: '09:00',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Personal Care',
    status: 'allocated',
    color: 'bg-blue-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Assist with morning routine and medication'
  },
  {
    id: '2',
    title: 'Care-Lunch',
    startTime: '12:00',
    endTime: '13:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Meal Assistance',
    status: 'allocated',
    color: 'bg-green-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Prepare lunch and ensure hydration'
  },
  {
    id: '3',
    title: 'Evening Care',
    startTime: '18:00',
    endTime: '19:30',
    type: 'service-user',
    assigneeId: '1',
    serviceType: 'Personal Care',
    status: 'unallocated',
    color: 'bg-red-400',
    date: moment().format('YYYY-MM-DD'),
    notes: 'Assist with evening routine and bedtime preparation'
  }
];

export default function ServiceUserPlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [status, setStatus] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>({
    left: true,
    right: true
  });
  const [isDateSelected, setIsDateSelected] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const selectedDateString = useMemo(() => {
    return moment(selectedDate).format('YYYY-MM-DD');
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
      setIsDateSelected(true);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 1, 8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 1, 2));
  const filteredTasks = useMemo(() => {
    if (!isDateSelected) {
      // Show all tasks of the current week (Sunday to Saturday)
      const startOfWeek = moment().startOf('week'); // Sunday
      const endOfWeek = moment().endOf('week'); // Saturday

      return tasks.filter((task) => {
        const taskDate = moment(task.date);
        return taskDate.isBetween(startOfWeek, endOfWeek, 'day', '[]'); // inclusive
      });
    } else {
      return tasks.filter((task) =>
        moment(task.date).isSame(moment(selectedDate), 'day')
      );
    }
  }, [tasks, selectedDate, isDateSelected]);

  
// Updated dayStats calculation in ServiceUserPlannerPage component
const dayStats = useMemo(() => {
  // Get the week containing the selected date for sidebar stats
  const selectedMoment = moment(selectedDate);
  const startOfWeek = selectedMoment.clone().startOf('week'); // Sunday
  
  // Generate stats for each day of the week containing the selected date
  const weekStats = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = startOfWeek.clone().add(i, 'days');
    const dayString = currentDay.format('YYYY-MM-DD');
    const dayTasks = tasks.filter((task) => task.date === dayString);
    
    weekStats.push({
      date: currentDay.format('DD/MM'),
      day: currentDay.format('dddd'),
      allocated: dayTasks.filter((t) => t.status === 'allocated').length,
      unallocated: dayTasks.filter((t) => t.status === 'unallocated').length,
      total: dayTasks.length
    });
  }
  
  return weekStats;
}, [selectedDate, tasks]);
const navigate = useNavigate()

  return (
    <div className="h-full">
      <div className="py-1 flex flex-row items-center justify-between gap-2">
        <h1 className="text-3xl font-semibold">{serviceUser.name}'s Planner</h1>
        <Button size='sm' className='bg-supperagent text-white hover:bg-supper-agent/90' onClick={()=> navigate(-1)}>
          <MoveLeft/>
          Back
        </Button>
      </div>
      <TooltipProvider>
        <div className="flex flex-col justify-between bg-white p-2 lg:flex-row">
          <div className="flex h-[calc(100vh-14vh)] w-full flex-col overflow-hidden lg:w-[86%]">
            <TopControls
              zoomLevel={zoomLevel}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              status={status}
              setStatus={setStatus}
            />
            <Timeline
              selectedUser={serviceUser}
              tasks={filteredTasks}
              zoomLevel={zoomLevel}
              selectedDate={selectedDateString}
              contentRef={contentRef}
            />
          </div>
          <RightSidebar
            isOpen={sidebarOpen.right}
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            dayStats={dayStats}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}
