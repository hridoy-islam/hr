import { WorkingHoursHeader } from './WorkingHoursHeader';
import { HoursOverview } from './HoursOverview';
import { HoursTable } from './HoursTable';
import { ReportsSection } from './ReportsSection';

export const WorkingHoursPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <WorkingHoursHeader />
      
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Hours Overview Stats */}
        <div className="mb-8">
          <HoursOverview />
        </div>
        
        {/* Hours Breakdown Table */}
        <div className="mb-8">
          <HoursTable />
        </div>
        
        {/* Reports Section */}
        <ReportsSection />
      </main>
    </div>
  );
};