import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu,
  X,
  UserCog2,
  LucideUserPlus,
  UserSquare2Icon,
  LucideUserSquare2,
  Calendar,
  BriefcaseIcon,
  File,
  User,
  Newspaper,
  Layers,
  Clock,
  FileBadge,
  FolderPlus,
  Wallet,
  User2,
  UsersIcon,
  Users,
  LayoutPanelTop,
  ArrowBigUp,
  Award,
  BookText,
  BetweenVerticalStart,
  CircleCheckBig,
  FileCheck2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/people-planner' },
  { icon: Calendar, label: 'Planner', href: 'planner' },
  { icon: Newspaper, label: 'Notice', href: 'notice' },
  { icon: Clock, label: 'Schedule', href: 'schedule' },
  { icon: FileBadge, label: 'Payslip', href: 'payslip' },
  { icon: Wallet, label: 'Invoice', href: 'invoice' },
  {
    icon: UsersIcon,
    label: 'HR',
    subItems: [
      { icon: User2, label: 'My Stuff', href: 'my-stuff' },
      {
        icon: UsersIcon,
        label: 'Employee',
        subItems: [
          { icon: Users, label: 'Employee List', href: 'employee' },
          { icon: LayoutPanelTop, label: 'Department', href: 'departments' },
          { icon: ArrowBigUp, label: 'Shift', href: 'shifts' },
          { icon: Award, label: 'Designation', href: 'designations' },
          { icon: BookText, label: 'Training', href: 'training' }
        ]
      },
      {
        icon: FileCheck2,
        label: 'Attendance',
        subItems: [
          { icon: FileCheck2, label: 'Attendance List', href: 'attendance' },
          { icon: CircleCheckBig, label: 'Attendance Approve', href: 'attendance-approve' },
          {
            icon: BetweenVerticalStart,
            label: 'Attendance Entry',
            href: '/admin/people-planner/attendance/attendance-entry'
          },
          { icon: Calendar, label: 'Attendance Report', href: 'attendance-report' }
        ]
      }
    ]
  },
  {
    icon: UserCog2,
    label: 'Service User',
    subItems: [
      { icon: LucideUserPlus, label: 'New User', href: 'service-user/new' },
      { icon: UserSquare2Icon, label: 'Service user List', href: 'service-user' }
    ]
  },
  { icon: File, label: 'Report', href: 'report' },
  {
    icon: LucideUserPlus,
    label: 'Document Requests',
    href: 'request/document'
  },
  {
    icon: LucideUserSquare2,
    label: 'Service Funder',
    subItems: [
      { icon: LucideUserPlus, label: 'New Funder', href: 'service-funder/new' },
      { icon: UserSquare2Icon, label: 'Service Funder List', href: 'service-funder' }
    ]
  },
  { icon: User, label: 'Profile', href: 'profile' },
];

const NavItem = ({ item, expandedItems, toggleExpanded, depth = 0 }) => {
  const location = useLocation();

  const isActiveLeaf = !item.subItems && location.pathname.startsWith('/' + item.href);
  const isExpanded = expandedItems[item.label];

  if (item.subItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleExpanded(item.label)}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 hover:bg-theme hover:text-white',
            depth > 0 && 'pl-6'
          )}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-4 w-4 text-theme group-hover:text-white" />
            <span className="text-black group-hover:text-white">{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-theme group-hover:text-white" />
          ) : (
            <ChevronRight className="h-4 w-4 text-theme group-hover:text-white" />
          )}
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-1 border-l-2 border-gray-300 ml-4">
            {item.subItems.map((subItem) => (
              <NavItem
                key={subItem.label}
                item={subItem}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'group flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-theme hover:text-white',
        isActiveLeaf && 'bg-blue-50 text-theme shadow-sm',
        depth > 0 && 'pl-6'
      )}
    >
      <item.icon className="h-4 w-4 text-theme group-hover:text-white" />
      <span className="text-black group-hover:text-white">{item.label}</span>
    </Link>
  );
};

export function PeoplePlannerSideNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user) || null;
  const [expandedItems, setExpandedItems] = useState({}); // Object-based state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(logout());
      navigate('/');
    }
  }, [user, dispatch, navigate]);

  // Auto-expand parents based on pathname
  useEffect(() => {
    const expandParents = (items) => {
      for (let item of items) {
        if (item.subItems) {
          if (
            item.subItems.some(
              (subItem) =>
                location.pathname.includes(subItem.href) ||
                (subItem.subItems &&
                  subItem.subItems.some((s) => location.pathname.includes(s.href)))
            )
          ) {
            setExpandedItems((prev) => ({ ...prev, [item.label]: true }));
            expandParents(item.subItems);
          }
        }
      }
    };
    expandParents(navItems);
  }, [location.pathname]);

  const toggleExpanded = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const filteredNavItems = navItems; // You can add role-based filtering here if needed

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme">
            <span className="text-sm font-bold text-white">PP</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">People Planner</h1>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden">
          <X className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm transition-transform duration-300 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-sm">
        {sidebarContent}
      </aside>
    </>
  );
}
