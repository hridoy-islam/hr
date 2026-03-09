import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { SideNav } from '../shared/side-nav';

export default function AttendanceLayout() {
  return (
    <div className="flex ">
    
  <aside className="hidden bg-gray-100 ">
         <SideNav />
       </aside>
 
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
       <Toaster />
    </div>
  );
}
