import { SideNav } from '@/components/shared/side-nav';
import { Outlet } from 'react-router-dom';

export default function HrLayout() {
  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <aside className="lg:w-64  bg-gray-100 border-r">
        <SideNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 py-4 mr-4">
        <Outlet />
      </main>
    </div>
  );
}
