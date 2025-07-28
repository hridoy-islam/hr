import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Announcements } from '../components/Announcements';
import { PendingRequests } from '../components/PendingRequests';
import { QuickActions } from './components/QuickActions';
import { StatCards } from '../components/StatCards';
import { TrainingDue } from '../components/TrainingDue';
import { UpcomingShifts } from '../components/UpcomingShifts';

const StaffDashboardPage = (user) => {
  return (
    <div className="min-h-screen ">
      <div className=" ">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
           
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, John
              </h1>
              <p className="text-gray-600">Senior Sales Associate</p>
            </div>
          </div>
        </div>
      </div>

      <main className=" py-4">
        {/* Stats Overview */}
        <div className="mb-8">
          <StatCards />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            <UpcomingShifts />
            <TrainingDue />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* <QuickActions /> */}
            <Announcements />
            <PendingRequests />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboardPage;
