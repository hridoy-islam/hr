import { Outlet } from 'react-router-dom';
import { PeoplePlannerSideNav } from '../shared/peoplePlanner-nav ';

export default function PeoplePlannerLayout() {
  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <aside className="lg:w-64  bg-gray-100 border-r">
        <PeoplePlannerSideNav />
      </aside>

      {/* Main content */}
  <main className="flex-1 overflow-x-auto p-4">        <Outlet />
      </main>
    </div>
  );
}
