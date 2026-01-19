import { SideNav } from '@/components/shared/side-nav';
import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";

export default function HrLayout() {
  return (
    <div className="flex gap-2 ">
      {/* Sidebar */}
      <aside className="lg:w-64  bg-gray-100 ">
        <SideNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 py-2 ">
        <Outlet />
      </main>
       <Toaster />
    </div>
  );
}
