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
  BookUser,
  UserCheck,
  ClipboardCheck,
  FileJsonIcon,
  PenBox,
  FileBadge,
  CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
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
    icon: CalendarClock,
    label: 'Rota',
    href: 'rota',
    roles: ['company']
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
    badgeKey: 'rtw'
  },
  {
    icon: FileBadge,
    label: 'Required Document',
    href: 'required-employee-documents',
    roles: ['company'],
    badgeKey: 'employeeDocument'
  },
  {
    icon: ShieldCheck,
    label: 'DBS',
    href: 'expiry/dbs',
    roles: ['company'],
    badgeKey: 'dbs'
  },
  {
    icon: BarChart3,
    label: 'Appraisal',
    href: 'expiry/appraisal',
    roles: ['company'],
    badgeKey: 'appraisal'
  },
  {
    icon: BookUser,
    label: 'Passport',
    href: 'expiry/passport',
    roles: ['company'],
    badgeKey: 'passport'
  },
  {
    icon: BadgeCheck,
    label: 'Visa Status',
    href: 'expiry/visa',
    roles: ['company'],
    badgeKey: 'visa'
  },
  {
    icon: FileCheck,
    label: 'Immigration Status',
    href: 'expiry/immigration',
    roles: ['company'],
    badgeKey: 'immigration'
  },
  {
    icon: FileCheck,
    label: 'Induction',
    href: 'expiry/induction',
    roles: ['company'],
    badgeKey: 'induction'
  },
  {
    icon: FileCheck,
    label: 'Disciplinary',
    href: 'expiry/disciplinary',
    roles: ['company'],
    badgeKey: 'disciplinary'
  },

  {
    icon: GraduationCap,
    label: 'Training Status',
    href: 'expiry/training',
    roles: ['company'],
    badgeKey: 'training'
  },
  {
    icon: ClipboardCheck,
    label: 'Spot Check',
    href: 'expiry/spot-check',
    roles: ['company'],
    badgeKey: 'spot'
  },
  {
    icon: UserCheck,
    label: 'Supervision',
    href: 'expiry/supervision',
    roles: ['company'],
    badgeKey: 'supervision'
  },
  {
    icon: FileCheck,
    label: 'Quality Assurance',
    href: 'expiry/qa',
    roles: ['company'],
    badgeKey: 'qa'
  },
  // --- END UPDATED ITEMS ---
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
    icon: CircleDollarSign,
    label: 'Payroll',
    href: 'payroll',
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
        icon: FileJsonIcon,
        label: 'Upload Attendance',
        href: 'csv-attendance',
        roles: ['company']
      },
      {
        icon: PenBox,
        label: 'Manual Attendance',
        href: 'attendance-entry',
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
        label: 'Schedule',
        href: 'schedule-check',
        roles: ['company']
      },
      {
        icon: MapPin,
        label: 'Branches / Locations',
        href: 'company-branch',
        roles: ['company']
      }
    ]
  }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterNavItemsByRole = (items: any[], role: string) => {
  return items.filter((item) => item.roles?.includes(role));
};

const NavItem = ({
  item,
  expandedItems,
  toggleExpanded,
  depth = 0,
  basePath,
  status,
  companyId
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expandedItems: any;
  toggleExpanded: (label: string) => void;
  depth?: number;
  basePath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status?: any;
  companyId?: string | null;
}) => {
  const location = useLocation();
  const isExpanded = expandedItems[item.label];

  // Build target path with companyId if it's a company route
  let targetPath = '#';
  
  // Check if href exists and is not '#'
  if (item.href !== undefined && item.href !== '#') {
    if (item.roles?.includes('company') && companyId) {
      // For company routes, include companyId
      if (item.href === '') {
        // Dashboard route for company: /company/:companyId
        targetPath = `/company/${companyId}`;
      } else {
        // Other company routes: /company/:companyId/:href
        targetPath = `/company/${companyId}/${item.href}`;
      }
    } else {
      // For admin routes or when no companyId
      if (item.href === '') {
        // Dashboard route for admin: /admin
        targetPath = basePath;
      } else {
        // Other admin routes: /admin/:href
        targetPath = `${basePath}/${item.href}`;
      }
    }
  }

  const isActiveLeaf =
    item.href !== undefined && item.href !== '#'
      ? depth === 0
        ? location.pathname === targetPath
        : location.pathname === targetPath ||
          location.pathname.startsWith(`${targetPath}/`)
      : false;

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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {item.subItems.map((subItem: any) => (
              <NavItem
                key={subItem.label}
                item={subItem}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                depth={depth + 1}
                basePath={basePath}
                status={status}
                companyId={companyId}
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
        depth > 0 && 'pl-3'
      )}
    >
      <item.icon className="h-4 w-4 text-theme group-hover:text-white" />
      <span className="flex-1 text-black group-hover:text-white">
        {item.label}
      </span>
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user) || null;
  const userRole = user?.role;
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyThemeColor, setCompanyThemeColor] = useState<string>('');
  const {id} = useParams();

  // Detect if admin is viewing company layout
  const isAdminViewingCompany =
    userRole === 'admin' && location.pathname.startsWith('/company/');

  // Get company ID from URL if admin is viewing company
  const getCompanyIdFromUrl = () => {
    if (isAdminViewingCompany) {
      const pathParts = location.pathname.split('/');
      return pathParts[2] || null;
    }
    return null;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeColor');
    if (savedTheme) {
      document.documentElement.style.setProperty('--theme', savedTheme);
      setCompanyThemeColor(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        try {
          let userId = user?._id;

          // If admin is viewing company layout, fetch that company's data
          if (isAdminViewingCompany) {
            const companyId = getCompanyIdFromUrl();
            if (companyId) {
              userId = companyId;
            }
          }

          const response = await axiosInstance.get(`/users/${userId}`);
          const themeColor = response.data.data.themeColor || '#38bdf8';
          setCompanyThemeColor(themeColor);
          setUserData(response.data.data);
          const storageKey = isAdminViewingCompany
            ? `themeColor_company_${userId}`
            : 'themeColor';
          localStorage.setItem(storageKey, themeColor);

          document.documentElement.style.setProperty('--theme', themeColor);
        } catch (error) {
          console.error('Error fetching company data:', error);
          const fallbackColor = '#38bdf8';
          setCompanyThemeColor(fallbackColor);
          localStorage.setItem('themeColor', fallbackColor);
          document.documentElement.style.setProperty('--theme', fallbackColor);
        }
      };
      fetchCompanyData();
    } else {
      const fallbackColor = '#38bdf8';
      setCompanyThemeColor(fallbackColor);
      localStorage.setItem('themeColor', fallbackColor);
      document.documentElement.style.setProperty('--theme', fallbackColor);
    }
  }, [user, isAdminViewingCompany, location.pathname]);

  // Use the Context Hook
  const { status } = useScheduleStatus();

  // Get company ID for building routes
  const companyId = isAdminViewingCompany
    ? getCompanyIdFromUrl()
    : userRole === 'company'
      ? user?._id
      : null;

  // Determine basePath - if admin is viewing company, use /company
  const basePath =
    userRole === 'company' || isAdminViewingCompany ? '/company' : '/admin';

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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expandParents = (items: any[]) => {
      for (const item of items) {
        if (item.subItems) {
          if (
            item.subItems.some(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (subItem: any) =>
                location.pathname.includes(subItem.href) ||
                (subItem.subItems &&
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  subItem.subItems.some((s: any) =>
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

  const toggleExpanded = (label: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setExpandedItems((prev: any) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Filter nav items - if admin is viewing company, show company items
  const effectiveRole = isAdminViewingCompany ? 'company' : userRole;
  const filteredNavItems = filterNavItemsByRole(navItems, effectiveRole);

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
          src={userData?.image || '/placeholder.jpg'}
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
            {userData ? userData?.name : 'User'}
          </div>
          {isAdminViewingCompany && (
            <div className="text-xs text-theme bg-theme/10 px-2 py-1 rounded">
              Viewing as Admin
            </div>
          )}
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
            status={status}
            companyId={companyId}
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