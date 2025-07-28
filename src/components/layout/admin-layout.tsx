import { TopNav } from "@/components/shared/top-nav"
import { SideNav } from "@/components/shared/side-nav"
import AutoLogout from "../shared/auto-logout";
import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({
    children
  }: {
    children: React.ReactNode;
  })  {
  return (
    <div className="min-h-screen bg-gray-50">
      <AutoLogout inactivityLimit={30 * 60 * 1000} />
      <TopNav />
      {/* <SideNav /> */}

      <main>
      {children}
      </main>
      <Toaster />
    </div>
  )
}
