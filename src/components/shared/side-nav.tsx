import {
  UsersIcon,
  FileTextIcon,
  UserIcon,
  ChevronDown,
  ChevronRight,
  Users,
  UserRoundCheck,
  LayoutDashboard,
  Box,
  PencilRuler,
  FileCheck2,
  Settings,
  LayoutPanelTop,
  ArrowBigUp,
  Award,
  BookText,
  Calendar,
  CircleDollarSign,
  CircleGauge,
  DoorOpen,
  ReceiptText,
  Mails,
  CircleCheckBig,
  BetweenVerticalStart,
  Menu,
  X,
  FileSpreadsheet,

} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';

// Define navigation items with role-based access
const navItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '',
    roles: ['admin','employee' ] 
  },
  {
    icon: Box,
    label: 'Holidays',
    href: 'holiday',
    roles: ['admin','employee' ]
  },
  {
    icon: PencilRuler,
    label: 'MyStuff',
    href: 'my-stuff',
    roles: ['admin',]
  },
  { 
    icon: FileTextIcon, 
    label: 'Notice', 
    href: 'notice',
    roles: ['admin',  'employee'] 
  },
  { 
    icon: DoorOpen, 
    label: 'Vacancy', 
    href: 'vacancy',
    roles: ['admin', ] 
  },
  {
    icon: UsersIcon,
    label: 'Employee',
    roles: ['admin', ],
    subItems: [
      { 
        icon: Users, 
        label: 'Employee List', 
        href: 'employee',
        roles: ['admin', ] 
      },
      { 
        icon: LayoutPanelTop, 
        label: 'Department', 
        href: 'department',
        roles: ['admin', ] 
      },
      { 
        icon: ArrowBigUp, 
        label: 'Shift', 
        href: 'shift',
        roles: ['admin', ] 
      },
      { 
        icon: Award, 
        label: 'Designation', 
        href: 'designation',
        roles: ['admin', ] 
      },
      { 
        icon: BookText, 
        label: 'Training', 
        href: 'training',
        roles: ['admin', ] 
      }
    ]
  },
  {
    icon: FileCheck2,
    label: 'Attendance',
    roles: ['admin', ],
    subItems: [
      { 
        icon: FileCheck2, 
        label: 'Attendance List', 
        href: 'attendance',
        roles: ['admin', ] 
      },
      {
        icon: CircleCheckBig,
        label: 'Attendance Approve',
        href: 'attendance-approve',
        roles: ['admin', ]
      },
      {
        icon: BetweenVerticalStart,
        label: 'Attendance Entry',
        href: 'attendance/attendance-entry',
        roles: ['admin', ]
      },
      { 
        icon: Calendar, 
        label: 'Attendance Report', 
        href: 'attendance-report',
        roles: ['admin', ] 
      }
    ]
  },
  { 
    icon: CircleDollarSign, 
    label: 'Payroll', 
    href: 'payroll',
    roles: ['admin', 'employee'] 
  },
  { 
    icon: CircleGauge, 
    label: 'Leave', 
    href: 'leave-approve',
    roles: ['admin', ] 
  },
 
  { 
    icon: FileSpreadsheet  , 
    label: 'Report', 
    href: 'report',
    roles: ['employee', ] 
  },
 
  { 
    icon: FileSpreadsheet  , 
    label: 'Document Requests', 
    href: 'document-request',
    roles: ['admin', ] 
  },
 


  {
    icon: Settings,
    label: 'Settings',
    roles: ['admin', ],
    subItems: [
      { 
        icon: ReceiptText, 
        label: 'Company Details', 
        href: 'company-details',
        roles: ['admin'] 
      },
      { 
        icon: Mails, 
        label: 'Email Setup', 
        href: 'email-setup',
        roles: ['admin', ] 
      },
      { 
        icon: Calendar, 
        label: 'Bank Holiday', 
        href: 'bank-holiday',
        roles: ['admin', ] 
      }
    ]
  }
];

// Filter navigation items based on user role
const filterNavItemsByRole = (items, userRole) => {
  return items
    .filter((item) => !item.roles || item.roles.includes(userRole))
    .map((item) => {
      if (item.subItems) {
        return {
          ...item,
          subItems: filterNavItemsByRole(item.subItems, userRole)
        };
      }
      return item;
    })
    .filter((item) => {
      if (item.subItems && item.subItems.length === 0) {
        return false;
      }
      return true;
    });
};

const NavItem = ({ item, expandedItems, toggleExpanded, depth = 0 }) => {
  const location = useLocation();
  const isActiveLeaf = !item.subItems &&
  (item.href === ''
    ? location.pathname === '/admin/hr/'
    : location.pathname.startsWith('/admin/hr/' + item.href)
  );

  const isExpanded = expandedItems[item.label];

  if (item.subItems) {
    return (
      <div className="space-y-1" key={item.label}>
        <button
          onClick={() => toggleExpanded(item.label)}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 hover:bg-supperagent hover:text-white',
            depth > 0 && 'pl-6'
          )}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-4 w-4 text-supperagent group-hover:text-white" />
            <span className="text-black group-hover:text-white">{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-supperagent group-hover:text-white" />
          ) : (
            <ChevronRight className="h-4 w-4 text-supperagent group-hover:text-white" />
          )}
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="ml-4 space-y-1 border-l-2 border-gray-300">
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
      to={`/admin/hr/${item.href}`}
      className={cn(
        'group flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-supperagent hover:text-white',
        isActiveLeaf && 'bg-blue-50 text-supperagent shadow-sm',
        depth > 0 && 'pl-6'
      )}
    >
      <item.icon className="h-4 w-4 text-supperagent group-hover:text-white" />
      <span className="text-black group-hover:text-white">{item.label}</span>
    </Link>
  );
};

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: any) => state.auth?.user) || null;
  const userRole = user?.role || 'employee';
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (user?._id) {
          const res = await axiosInstance.get(`/users/${user._id}`);
          setFetchedUser(res.data?.data);
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };

    fetchUserInfo();
  }, [user?._id]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

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

  const filteredNavItems = filterNavItemsByRole(navItems, userRole);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-supperagent">
            <span className="text-sm font-bold text-white">HR</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">HR System</h1>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden"
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      {/* User Profile */}
      <div className="flex flex-col items-center space-y-3 px-4 py-6">
        <img
          src={user?.image || '/placeholder.jpg'}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover"
        />
        <div className="flex flex-col items-center space-y-1">
          <p className="text-xl font-semibold text-gray-900">Welcome!</p>
          <div
            onClick={() => navigate('/admin/hr/profile')}
            className="cursor-pointer text-md font-medium text-gray-900 underline"
          >
            {fetchedUser
              ? `${fetchedUser?.firstName} ${fetchedUser?.lastName}`
              : 'User'}
          </div>
        </div>
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

      {/* Logout Button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
        >
          <DoorOpen className="h-4 w-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
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