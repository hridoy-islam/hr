import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChevronRight } from 'lucide-react';
import { RightSidebar } from './components/RightSidebar';
import { TopControls } from './components/TopControls';
import { Timeline } from './components/Timeline';
import { serviceUsers, employees, schedules } from '@/data/plannerData';
import type { SidebarState, schedule } from '@/types/planner';
import moment from 'moment';
import { ScheduleDetailComponent } from './components/ScheduleDetail';

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterBy, setFilterBy] = useState('Service User');
  const [designation, setDesignation] = useState('All');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>({
    left: true,
    right: true
  });
  const [selectedSchedule, setSelectedSchedule] = useState<schedule | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isDateSelected, setIsDateSelected] = useState(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 1, 8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 1, 2));
  const handleSearch = () => {};

  const handleScheduleClick = (schedule: schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleCloseScheduleModal = () => {
    setSelectedSchedule(null);
  };

  const filteredSchedules = useMemo(() => {
    if (!isDateSelected) {
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      return schedules.filter((schedule) =>
        moment(schedule.date).isBetween(startOfWeek, endOfWeek, 'day', '[]')
      );
    } else {
      return schedules.filter((schedule) =>
        moment(schedule.date).isSame(moment(selectedDate), 'day')
      );
    }
  }, [selectedDate, isDateSelected]);

  const currentData = useMemo(() => {
    let result = [...serviceUsers, ...employees];

    if (filterBy === 'Service User') result = serviceUsers;
    else if (filterBy === 'Employee') result = employees;

    if (designation !== 'All') {
      result = result.filter((user) =>
        'role' in user ? user.role === designation : false
      );
    }

    if (department !== 'All') {
      result = result.filter((user) =>
        'department' in user ? user.department === department : false
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((user) =>
        user.name.toLowerCase().includes(term) ||
        ('email' in user && user.email.toLowerCase().includes(term))
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [filterBy, designation, department, searchTerm]);

  const selectedDateString = useMemo(() => {
    return moment(selectedDate).format('YYYY-MM-DD');
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsDateSelected(true);
  };

  const dayStats = useMemo(() => {
    const selectedMoment = moment(selectedDate);
    const startOfWeek = selectedMoment.clone().startOf('week');

    return Array.from({ length: 7 }).map((_, i) => {
      const currentDay = startOfWeek.clone().add(i, 'days');
      const dayString = currentDay.format('YYYY-MM-DD');
      const dayschedules = schedules.filter((schedule) => schedule.date === dayString);

      return {
        date: currentDay.format('DD/MM'),
        day: currentDay.format('dddd'),
        allocated: dayschedules.filter((t) => t.status === 'allocated').length,
        unallocated: dayschedules.filter((t) => t.status === 'unallocated').length,
        total: dayschedules.length
      };
    });
  }, [selectedDate]);

  return (
    <div className="h-full">
      <div className="py-1">
        <h1 className="text-3xl font-semibold">Planner</h1>
      </div>
      <TooltipProvider>
        <div className="flex flex-col justify-between bg-white p-2 lg:flex-row">
          <div className="flex h-[calc(100vh-14vh)] w-full flex-col overflow-hidden lg:w-[86%]">
            <TopControls
              filterBy={filterBy}
              setFilterBy={setFilterBy}
              zoomLevel={zoomLevel}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              designation={designation}
              setDesignation={setDesignation}
              department={department}
              setDepartment={setDepartment}
              status={status}
              setStatus={setStatus}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
            />

            <Timeline
              currentData={currentData}
              filterBy={filterBy}
              schedules={filteredSchedules}
              zoomLevel={zoomLevel}
              selectedDate={selectedDateString}
              contentRef={contentRef}
              onScheduleClick={handleScheduleClick}
            />
          </div>

          <RightSidebar
            isOpen={sidebarOpen.right}
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            currentData={currentData}
            dayStats={dayStats}
          />

          {/* schedule Detail Modal */}
          <ScheduleDetailComponent
            schedule={selectedSchedule}
            isOpen={!!selectedSchedule}
            onClose={handleCloseScheduleModal}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}
