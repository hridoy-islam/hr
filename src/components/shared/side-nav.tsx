import {
  UsersIcon,
  FileTextIcon,
  ChevronDown,
  ChevronRight,
  Users,
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
  Clock4,
  Building2,
  BarChart3,
  Bell,
  CreditCard,
  MapPin,
  Receipt,
  ShieldCheck,
  DollarSign,
  History,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  FileCheck,
  BookUser
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
// IMPORT THE CONTEXT HOOK
import { useScheduleStatus } from '@/context/scheduleStatusContext';

const navItems = [
  // --- Common ---
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '',
    roles: ['admin', 'company']
  },

  // --- Admin Specific ---
  {
    icon: Building2,
    label: 'Company',
    href: 'company',
    roles: ['admin']
  },
  {
    icon: DollarSign,
    label: 'Subscription Plans',
    href: 'subscription-plan',
    roles: ['admin']
  },
  {
    icon: FileTextIcon,
    label: 'Notice',
    href: 'notice',
    roles: ['admin']
  },
  {
    icon: History,
    label: 'Report',
    href: 'report',
    roles: ['admin']
  },

  {
    icon: DoorOpen,
    label: 'Vacancy',
    href: 'vacancy',
    roles: ['company']
  },
  {
    icon: Users,
    label: 'Employees',
    href: 'employee',
    roles: ['company']
  },
  // --- BADGE ITEMS START HERE ---
  {
    icon: ShieldCheck,
    label: 'Right to Work',
    href: 'expiry/rtw',
    roles: ['company'],
    badgeKey: 'rtw' // Added Key
  },
  {
    icon: ShieldCheck,
    label: 'DBS',
    href: 'expiry/dbs',
    roles: ['company'],
    badgeKey: 'dbs' // Added Key
  },
  {
    icon: BarChart3,
    label: 'Appraisal',
    href: 'expiry/appraisal',
    roles: ['company'],
    badgeKey: 'appraisal' // Added Key
  },
  {
    icon: BookUser,
    label: 'Passport',
    href: 'expiry/passport',
    roles: ['company'],
    badgeKey: 'passport' // Added Key
  },
  {
    icon: BadgeCheck,
    label: 'Visa Status',
    href: 'expiry/visa',
    roles: ['company'],
    badgeKey: 'visa' // Added Key
  },
  {
    icon: FileCheck,
    label: 'Immigration Status',
    href: 'expiry/immigration',
    roles: ['company'],
    badgeKey: 'immigration' // Added Key
  },
  // --- BADGE ITEMS END ---
  {
    icon: GraduationCap,
    label: 'Training Status',
    href: '#',
    roles: ['company']
  },
  {
    icon: Calendar,
    label: 'Leave Management',
    href: '#',
    roles: ['company']
  },
  {
    icon: FileSpreadsheet,
    label: 'Documents',
    href: '#',
    roles: ['company']
  },

  {
    icon: BarChart3,
    label: 'Reports',
    href: '#',
    roles: ['company']
  },

  {
    icon: CreditCard,
    label: 'Subscription',
    href: '#',
    roles: ['company']
  },
  {
    icon: Receipt,
    label: 'Billing',
    href: '#',
    roles: ['company']
  },
  {
    icon: Bell,
    label: 'Notice',
    href: 'notice',
    roles: ['company']
  },
  {
    icon: FileCheck2,
    label: 'Attendance',
    roles: ['company'],
    subItems: [
      {
        icon: FileCheck2,
        label: 'Attendance List',
        href: 'attendance',
        roles: ['company']
      },
      {
        icon: CircleCheckBig,
        label: 'Attendance Approve',
        href: 'attendance-approve',
        roles: ['company']
      },
      {
        icon: BetweenVerticalStart,
        label: 'Attendance Entry',
        href: 'attendance/attendance-entry',
        roles: ['company']
      },
      {
        icon: Calendar,
        label: 'Attendance Report',
        href: 'attendance-report',
        roles: ['company']
      }
    ]
  },
  {
    icon: Settings,
    label: 'Settings',
    roles: ['company'],
    subItems: [
      {
        icon: ReceiptText,
        label: 'Company Details',
        href: 'company-details',
        roles: ['company']
      },
      {
        icon: Mails,
        label: 'Email Setup',
        href: 'email-setup',
        roles: ['company']
      },
      {
        icon: Calendar,
        label: 'Bank Holiday',
        href: 'bank-holiday',
        roles: ['company']
      },
      {
        icon: Clock4,
        label: 'Shifts',
        href: 'shift',
        roles: ['company']
      },
      {
        icon: Building2,
        label: 'Department',
        href: 'department',
        roles: ['company']
      },
      {
        icon: Briefcase,
        label: 'Designation',
        href: 'designation',
        roles: ['company']
      },
      {
        icon: GraduationCap,
        label: 'Training',
        href: 'training',
        roles: ['company']
      },

      {
        icon: UsersIcon,
        label: 'Users & Permissions',
        href: '#',
        roles: ['company']
      },
      {
        icon: UsersIcon,
        label: 'Schedule',
        href: 'schedule-check',
        roles: ['company']
      },
      {
        icon: MapPin,
        label: 'Branches / Locations',
        href: '#',
        roles: ['company']
      }
    ]
  },

  // --- Employee Specific ---
  {
    icon: Box,
    label: 'My Holidays',
    href: 'holiday',
    roles: ['employee']
  },
  {
    icon: PencilRuler,
    label: 'My Staff',
    href: 'my-staff',
    roles: []
  },
  {
    icon: FileTextIcon,
    label: 'Notice',
    href: 'notice',
    roles: ['employee']
  },
  {
    icon: DoorOpen,
    label: 'Vacancy',
    href: 'vacancy',
    roles: []
  },
  {
    icon: BookText,
    label: 'Training',
    href: 'training',
    roles: ['employee']
  },

  // --- Legacy / Admin Sub-menus ---
  {
    icon: UsersIcon,
    label: 'Employee Management',
    roles: [],
    subItems: [
      {
        icon: Users,
        label: 'Employee List',
        href: 'employee',
        roles: []
      },
      {
        icon: LayoutPanelTop,
        label: 'Department',
        href: 'department',
        roles: []
      },
      {
        icon: ArrowBigUp,
        label: 'Shift',
        href: 'shift',
        roles: []
      },
      {
        icon: Award,
        label: 'Designation',
        href: 'designation',
        roles: []
      },
      {
        icon: BookText,
        label: 'Training',
        href: 'training',
        roles: []
      }
    ]
  },
  {
    icon: FileCheck2,
    label: 'Attendance',
    roles: [],
    subItems: [
      {
        icon: FileCheck2,
        label: 'Attendance List',
        href: 'attendance',
        roles: []
      },
      {
        icon: CircleCheckBig,
        label: 'Attendance Approve',
        href: 'attendance-approve',
        roles: []
      },
      {
        icon: BetweenVerticalStart,
        label: 'Attendance Entry',
        href: 'attendance/attendance-entry',
        roles: []
      },
      {
        icon: Calendar,
        label: 'Attendance Report',
        href: 'attendance-report',
        roles: []
      }
    ]
  },
  {
    icon: Clock4,
    label: 'My Attendance',
    href: 'staff-attendance',
    roles: ['employee']
  },
  {
    icon: CircleDollarSign,
    label: 'Payroll',
    href: 'payroll',
    roles: ['employee']
  },
  {
    icon: CircleGauge,
    label: 'Leave',
    href: 'leave-approve',
    roles: []
  },
  {
    icon: FileSpreadsheet,
    label: 'My Documents',
    href: 'documents',
    roles: ['employee']
  },
  {
    icon: FileSpreadsheet,
    label: 'Document Requests',
    href: 'document-request',
    roles: []
  },

  // --- Settings ---

  {
    icon: Settings,
    label: 'System Settings',
    roles: [],
    subItems: [
      {
        icon: ReceiptText,
        label: 'Company Details',
        href: 'company-details',
        roles: []
      },
      {
        icon: Mails,
        label: 'Email Setup',
        href: 'email-setup',
        roles: []
      },
      {
        icon: Calendar,
        label: 'Bank Holiday',
        href: 'bank-holiday',
        roles: []
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

// 1. Updated NavItem to accept basePath AND status
const NavItem = ({
  item,
  expandedItems,
  toggleExpanded,
  depth = 0,
  basePath,
  status // Receive status prop
}) => {
  const location = useLocation();
  const isExpanded = expandedItems[item.label];

  // Construct the full path based on the dynamic basePath
  const targetPath = item.href ? `${basePath}/${item.href}` : basePath;

  const isActiveLeaf =
    !item.subItems &&
    (item.href === ''
      ? location.pathname === basePath || location.pathname === `${basePath}/`
      : location.pathname === targetPath ||
        location.pathname.startsWith(`${targetPath}/`));

  // Logic to determine badge count
  const badgeCount = item.badgeKey && status ? status[item.badgeKey] : 0;

  if (item.subItems) {
    return (
      <div className="space-y-1" key={item.label}>
        <button
          onClick={() => toggleExpanded(item.label)}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 hover:bg-theme hover:text-white',
            depth > 0 && 'pl-6'
          )}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-4 w-4 text-theme group-hover:text-white" />
            <span className="text-black group-hover:text-white">
              {item.label}
            </span>
            {/* Show Badge on Parent items if needed (optional, usually on leaf) */}
            {badgeCount > 0 && (
              <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {badgeCount}
              </span>
            )}
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
          <div className="ml-4 space-y-1 border-l-2 border-gray-300">
            {item.subItems.map((subItem) => (
              <NavItem
                key={subItem.label}
                item={subItem}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                depth={depth + 1}
                basePath={basePath}
                status={status} // Pass status recursively
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={targetPath}
      className={cn(
        'group flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-theme hover:text-white',
        isActiveLeaf && 'bg-blue-50 text-theme shadow-sm',
        depth > 0 && 'pl-6'
      )}
    >
      <item.icon className="h-4 w-4 text-theme group-hover:text-white" />
      <span className="flex-1 text-black group-hover:text-white">
        {item.label}
      </span>
      {/* RENDER BADGE HERE */}
      {badgeCount > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white group-hover:bg-red-400 group-hover:text-white">
          {badgeCount}
        </span>
      )}
    </Link>
  );
};

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: any) => state.auth?.user) || null;
  const userRole = user?.role;
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [companyThemeColor, setCompanyThemeColor] = useState<string>('');

   useEffect(() => {
    const savedTheme = localStorage.getItem("themeColor");
    if (savedTheme) {
      document.documentElement.style.setProperty("--theme", savedTheme);
      setCompanyThemeColor(savedTheme); // Set the theme color from localStorage
    }
  }, []);


  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        try {
          const response = await axiosInstance.get(`/users/${user?._id}`);
          const themeColor = response.data.data.themeColor || '#38bdf8'; // Fallback theme color
          setCompanyThemeColor(themeColor);
          localStorage.setItem("themeColor", themeColor); // Store it in localStorage
          document.documentElement.style.setProperty("--theme", themeColor); // Apply the new theme
        } catch (error) {
          console.error('Error fetching company data:', error);
          // Fallback theme color in case of an error
          const fallbackColor = '#38bdf8';
          setCompanyThemeColor(fallbackColor);
          localStorage.setItem("themeColor", fallbackColor); // Store fallback in localStorage
          document.documentElement.style.setProperty("--theme", fallbackColor); // Apply fallback theme
        }
      };
      fetchCompanyData();
    } else {
      // If id is undefined, apply default theme color
      const fallbackColor = '#38bdf8';
      setCompanyThemeColor(fallbackColor);
      localStorage.setItem("themeColor", fallbackColor); // Store fallback in localStorage
      document.documentElement.style.setProperty("--theme", fallbackColor); // Apply fallback theme
    }
  }, [user]);


  // Use the Context Hook
  const { status } = useScheduleStatus(); 

  const basePath = userRole === 'company' ? '/company' : '/admin';

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
                  subItem.subItems.some((s) =>
                    location.pathname.includes(s.href)
                  ))
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
      <div className="flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden"
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      {/* User Profile */}
      <div className="flex flex-col items-center px-4 ">
        <img
          src={user?.image || '/placeholder.jpg'}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover"
        />
        <div className="flex flex-col items-center space-y-1">
          <div
            onClick={() => {
              if (user?.role !== 'admin' && user?.role !== 'company') {
                navigate(`${basePath}/profile`);
              }
            }}
            className={`text-md font-medium text-gray-900
    ${
      user?.role === 'admin' || user?.role === 'company'
        ? 'cursor-default'
        : 'cursor-pointer underline'
    }`}
          >
            {user ? user.name : 'User'}
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
            basePath={basePath}
            status={status} // Pass status props down
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
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
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