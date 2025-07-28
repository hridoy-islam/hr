import { HoursOverview } from "./components/HoursOverview";
import { HoursTable } from "./components/HoursTable";
import { ReportsSection } from "./components/ReportsSection";
import { WorkingHoursHeader } from "./components/WorkingHoursHeader";

export const ReportPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="">
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