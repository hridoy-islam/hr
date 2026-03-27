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
  CalendarClock,
  CalendarCheck2,
  CalendarRange,
  AlertCircle,
  User,
  Users2,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';
import { useScheduleStatus } from '@/context/scheduleStatusContext';
import { useCompanyAccess } from '@/hooks/use-company-access'; // IMPORT THE NEW HOOK

const navItems = [
  // --- Common ---
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '',
    roles: ['admin', 'company', 'companyAdmin', 'employee']
  },
  {
    icon: CalendarCheck2,
    label: 'Upcoming Shifts',
    href: 'upcoming-shifts',
    roles: ['employee']
  },
  {
    icon: CalendarClock,
    label: 'Holiday',
    href: 'holiday',
    roles: ['employee']
  },
  {
    icon: AlertCircle,
    label: 'Notice',
    href: 'notice',
    roles: ['employee']
  },
  {
    icon: FileSpreadsheet,
    label: 'Attendance',
    href: 'attendance',
    roles: ['employee']
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

  // --- Company / Company Admin Specific ---
  {
    icon: CalendarClock,
    label: 'Rota',
    href: 'rota',
    roles: ['company', 'companyAdmin'],
    accessKey: 'rota'
  },
  {
    icon: DoorOpen,
    label: 'Vacancy',
    href: 'vacancy',
    roles: ['company', 'companyAdmin'],
    accessKey: 'vacancy'
  },
  {
    icon: Users,
    label: 'Employees',
    href: 'employee',
    roles: ['company', 'companyAdmin'],
    accessKey: 'employee'
  },
  // --- BADGE ITEMS ---
  {
    icon: ShieldCheck,
    label: 'Right to Work',
    href: 'expiry/rtw',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'rtw',
    accessKey: 'employee'
  },
  {
    icon: FileBadge,
    label: 'Required Document',
    href: 'required-employee-documents',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'employeeDocument',
    accessKey: 'employee'
  },
  {
    icon: ShieldCheck,
    label: 'DBS',
    href: 'expiry/dbs',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'dbs',
    accessKey: 'employee'
  },
  {
    icon: BarChart3,
    label: 'Appraisal',
    href: 'expiry/appraisal',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'appraisal',
    accessKey: 'employee'
  },
  {
    icon: BookUser,
    label: 'Passport',
    href: 'expiry/passport',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'passport',
    accessKey: 'employee'
  },
  {
    icon: BadgeCheck,
    label: 'Visa Status',
    href: 'expiry/visa',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'visa',
    accessKey: 'employee'
  },
  {
    icon: FileCheck,
    label: 'Immigration Status',
    href: 'expiry/immigration',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'immigration',
    accessKey: 'employee'
  },
  {
    icon: FileCheck,
    label: 'Induction',
    href: 'expiry/induction',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'induction',
    accessKey: 'employee'
  },
  {
    icon: FileCheck,
    label: 'Disciplinary',
    href: 'expiry/disciplinary',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'disciplinary',
    accessKey: 'employee'
  },
  {
    icon: GraduationCap,
    label: 'Training Status',
    href: 'expiry/training',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'training',
    accessKey: 'employee'
  },
  {
    icon: ClipboardCheck,
    label: 'Spot Check',
    href: 'expiry/spot-check',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'spot',
    accessKey: 'employee'
  },
  {
    icon: UserCheck,
    label: 'Supervision',
    href: 'expiry/supervision',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'supervision',
    accessKey: 'employee'
  },
  {
    icon: FileCheck,
    label: 'Quality Assurance',
    href: 'expiry/qa',
    roles: ['company', 'companyAdmin'],
    badgeKey: 'qa',
    accessKey: 'employee'
  },
  // --- END UPDATED ITEMS ---
  {
    icon: Calendar,
    label: 'Leave Management',
    href: 'leave-approval',
    roles: ['company', 'companyAdmin'],
    accessKey: 'leave'
  },
  {
    icon: Users2,
    label: 'Service User',
    href: 'service-user',
    roles: ['company', 'companyAdmin'],
    accessKey: 'serviceUser'
  },
 
  // {
  //   icon: BarChart3,
  //   label: 'Reports',
  //   href: '#',
  //   roles: ['company', 'companyAdmin']
  // },
  // {
  //   icon: CreditCard,
  //   label: 'Subscription',
  //   href: '#',
  //   roles: ['company', 'companyAdmin']
  // },
  {
    icon: CircleDollarSign,
    label: 'Payroll',
    href: 'payroll',
    roles: ['company', 'companyAdmin'],
    accessKey: 'payroll'
  },
  {
    icon: Bell,
    label: 'Notice',
    href: 'notice',
    roles: ['company', 'companyAdmin'],
    accessKey: 'notice'
  },
  {
    icon: BarChart3,
    label: 'Attendance',
    roles: ['company', 'companyAdmin'],
    accessKey: 'attendance',
    subItems: [
      {
        icon: FileSpreadsheet,
        label: 'Visitor Attendance',
        href: 'visitor-attendance',
        roles: ['company', 'companyAdmin'],
        accessKey: 'attendance'
      },
      {
        icon: FileSpreadsheet,
        label: 'Service User Attendance',
        href: 'serviceuser-attendance',
        roles: ['company', 'companyAdmin'],
        accessKey: 'attendance'
      },
      {
        icon: BarChart3,
        label: 'Attendance List',
        href: 'attendance',
        roles: ['company', 'companyAdmin'],
        accessKey: 'attendance'
      }
    ]
  },
  {
    icon: Settings,
    label: 'Settings',
    roles: ['company', 'companyAdmin'],
    accessKey: 'setting',
    subItems: [
      {
        icon: ReceiptText,
        label: 'Company Details',
        href: 'company-details',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: Mails,
        label: 'Email Setup',
        href: 'email-setup',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: UserCog,
        label: 'Company Admin',
        href: 'company-admin',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: User,
        label: 'Attendance Account',
        href: 'attendance-account',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: Calendar,
        label: 'Bank Holiday',
        href: 'bank-holiday',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: Clock4,
        label: 'Shifts',
        href: 'shift',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: Building2,
        label: 'Department',
        href: 'department',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: Briefcase,
        label: 'Designation',
        href: 'designation',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: GraduationCap,
        label: 'Training',
        href: 'training',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: UsersIcon,
        label: 'Schedule',
        href: 'schedule-check',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      },
      {
        icon: MapPin,
        label: 'Branches / Locations',
        href: 'company-branch',
        roles: ['company', 'companyAdmin'],
        accessKey: 'setting'
      }
    ]
  }
];

// Extracted Filter logic utilizing the hook
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterNavItemsByRole = (items: any[], role: string, hasAccess: (key?: string) => boolean) => {
  return items
    .filter((item) => item.roles?.includes(role) && hasAccess(item.accessKey))
    .map((item) => {
      if (item.subItems) {
        return {
          ...item,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subItems: item.subItems.filter((subItem: any) => 
            subItem.roles?.includes(role) && hasAccess(subItem.accessKey)
          )
        };
      }
      return item;
    })
    // Hide parent items if all their subItems were restricted
    .filter((item) => !item.subItems || item.subItems.length > 0);
};

const NavItem = ({
  item,
  expandedItems,
  toggleExpanded,
  depth = 0,
  basePath,
  status,
  companyId,
  effectiveRole,
  onNavClick
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
  effectiveRole?: string;
  onNavClick?: () => void;
}) => {
  const location = useLocation();
  const isExpanded = expandedItems[item.label];

  let targetPath = '#';

  if (item.href !== undefined && item.href !== '#') {
    // UPDATED logic handles both company and companyAdmin seamlessly 
    if ((effectiveRole === 'company' || effectiveRole === 'companyAdmin') && companyId) {
      if (item.href === '') {
        targetPath = `/company/${companyId}`;
      } else {
        targetPath = `/company/${companyId}/${item.href}`;
      }
    } else {
      if (item.href === '') {
        targetPath = basePath;
      } else {
        targetPath = `${basePath}/${item.href}`;
      }
    }
  }

  // Determine badge count
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
                onNavClick={onNavClick}
                effectiveRole={effectiveRole}
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
      onClick={onNavClick}
      className={cn(
        'group flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-theme hover:text-white',
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
  const { id } = useParams();

  const { hasAccess } = useCompanyAccess(); // Fetch access utility for filtering

  const isAdminViewingCompany =
    userRole === 'admin' && location.pathname.startsWith('/company/');

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
          let fetchId = user?._id;

          if (isAdminViewingCompany) {
            const companyIdFromUrl = getCompanyIdFromUrl();
            if (companyIdFromUrl) {
              fetchId = companyIdFromUrl;
            }
          }
          // Now handles both employee and companyAdmin for parent company
          else if ((userRole === 'employee' || userRole === 'companyAdmin') && user?.company) {
            fetchId = user.company;
          }

          const response = await axiosInstance.get(`/users/${fetchId}`);
          const themeColor = response.data.data.themeColor || '#38bdf8';
          setCompanyThemeColor(themeColor);

          if (userRole !== 'employee' || fetchId === user._id) {
            setUserData(response.data.data);
          } else {
            const selfResponse = await axiosInstance.get(`/users/${user._id}`);
            setUserData(selfResponse.data.data);
          }

          const storageKey = isAdminViewingCompany
            ? `themeColor_company_${fetchId}`
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
  }, [user, isAdminViewingCompany, location.pathname, userRole]);

  const { status } = useScheduleStatus();

  // Route URL Construction Updates
  const companyId = isAdminViewingCompany
    ? getCompanyIdFromUrl()
    : userRole === 'company'
      ? user?._id
      : (userRole === 'employee' || userRole === 'companyAdmin')
        ? user?.company
        : null;

  const basePath =
    userRole === 'employee'
      ? `/company/${user?.company}/staff/${user?._id}`
      : (userRole === 'company' || userRole === 'companyAdmin' || isAdminViewingCompany)
        ? '/company'
        : '/admin';

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item.subItems.some((subItem: any) =>
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

  const effectiveRole = isAdminViewingCompany ? 'company' : userRole;
  
  // Use updated filter using the hasAccess validation 
  const filteredNavItems = filterNavItemsByRole(navItems, effectiveRole, hasAccess);

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
        : 'cursor-pointer '
    }`}
          >
            {userData
              ? userData?.firstName || userData?.lastName
                ? `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`.trim()
                : userData?.name ?? 'User'
              : 'User'}
          </div>
          {isAdminViewingCompany && (
            <div className="rounded bg-theme/10 px-2 py-1 text-xs text-theme">
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
            effectiveRole={effectiveRole}
            onNavClick={() => setIsMobileMenuOpen(false)}
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
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-sm">
        {sidebarContent}
      </aside>
    </>
  );
}