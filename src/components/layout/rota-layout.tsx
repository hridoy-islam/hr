import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { SideNav } from '../shared/side-nav';

export default function RotaLayout() {
  return (
    <div className="flex ">
    
  <aside className="hidden bg-gray-100 ">
         <SideNav />
       </aside>
 
      {/* Main content */}
      <main className="flex-1 p-2 overflow-hidden">
        <Outlet />
      </main>
       <Toaster />
    </div>
  );
}
