import { Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BellIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserNav } from './user-nav';

export function TopNav() {
  return (
    <div className="flex h-16 items-center justify-between bg-supperagent px-4">
      <div className="flex items-center space-x-4">
        {/* <Link to="/" className="flex items-center space-x-2 text-white">
          <Layers className="h-6 w-6" />
          <span className="text-lg font-semibold">Multi Purpose</span>
        </Link> */}
        {/* <nav className="flex space-x-2 text-sm text-white/60">
          <Link to="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </nav> */}
      </div>
      <div className="flex items-center space-x-4">
        {/* <div className="relative">
          <Input
            placeholder="Search..."
            className="w-64 border-white bg-white/10 text-white placeholder:text-white/60"
          />
        </div> */}
        <Button variant="ghost" size="icon" className="text-white">
          <BellIcon className="h-5 w-5" />
        </Button>

        <UserNav />
      </div>
    </div>
  );
}
