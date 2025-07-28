import DashboardNav from '@/components/shared/dashboard-nav';
import { navItems } from '@/constants/data';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { ChevronsLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import UserList from './user-list';
import { Input } from '../ui/input';
import { useSelector } from 'react-redux';
import axiosInstance from '../../lib/axios';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const [status, setStatus] = useState(false);
  const [team, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector((state: any) => state.auth);

  const handleToggle = () => {
    setStatus(true);
    toggle();
    setTimeout(() => setStatus(false), 500);
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`/users/company/${user?._id}`);

      setTeams(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers(); // Fetch users on component mount
  }, []);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const filteredUsers = team?.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav
      className={cn(
        `relative z-10 hidden h-screen flex-none  px-3 md:block`,
        status && 'duration-500',
        !isMinimized ? 'w-72' : 'w-[80px]',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center px-0 py-5 md:px-2',
          isMinimized ? 'justify-center ' : 'justify-between'
        )}
      >
        {!isMinimized && <h1 className="text-2xl font-bold">Task Planner</h1>}
        <ChevronsLeft
          className={cn(
            'size-8 cursor-pointer rounded-full border bg-background text-foreground',
            isMinimized && 'rotate-180'
          )}
          onClick={handleToggle}
        />
      </div>
      <div className="space-y-4">
        <div className="px-2 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={filteredNavItems} />
            <Input
              type="text"
              placeholder="Search users"
              className="mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <UserList user={user} filteredUsers={filteredUsers} />
          </div>
        </div>
      </div>
    </nav>
  );
}
