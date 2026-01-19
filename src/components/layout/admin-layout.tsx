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
    <aside className="lg:w-64  bg-gray-100 border-r">
        <SideNav />
      </aside>

      <main>
      {children}
      </main>
      <Toaster />
    </div>
  )
}
