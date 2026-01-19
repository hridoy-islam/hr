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
  Book,
  BookUser
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';
import axiosInstance from '@/lib/axios';
import { AppDispatch } from '@/redux/store';

// ... [navItems array remains exactly the same as your code] ...
// const navItems = [
//   {
//     icon: LayoutDashboard,
//     label: 'Dashboard',
//     href: '',
//     roles: ['admin', 'company']
//   },
//   {
//     icon: Building2,
//     label: 'Company',
//     href: 'company',
//     roles: ['admin']
//   },
//   {
//     icon: Box,
//     label: 'My Holidays',
//     href: 'holiday',
//     roles: [, 'employee']
//   },
//   {
//     icon: PencilRuler,
//     label: 'My Staff',
//     href: 'my-staff',
//     roles: []
//   },
//   {
//     icon: FileTextIcon,
//     label: 'Notice',
//     href: 'notice',
//     roles: [, 'employee']
//   },
//   {
//     icon: DoorOpen,
//     label: 'Vacancy',
//     href: 'vacancy',
//     roles: []
//   },
//   {
//     icon: BookText,
//     label: 'Training',
//     href: 'training',
//     roles: ['employee']
//   },
//   {
//     icon: UsersIcon,
//     label: 'Employee',
//     roles: [],
//     subItems: [
//       {
//         icon: Users,
//         label: 'Employee List',
//         href: 'employee',
//         roles: []
//       },
//       {
//         icon: LayoutPanelTop,
//         label: 'Department',
//         href: 'department',
//         roles: []
//       },
//       {
//         icon: ArrowBigUp,
//         label: 'Shift',
//         href: 'shift',
//         roles: []
//       },
//       {
//         icon: Award,
//         label: 'Designation',
//         href: 'designation',
//         roles: []
//       },
//       {
//         icon: BookText,
//         label: 'Training',
//         href: 'training',
//         roles: []
//       }
//     ]
//   },
//   {
//     icon: FileCheck2,
//     label: 'Attendance',
//     roles: [],
//     subItems: [
//       {
//         icon: FileCheck2,
//         label: 'Attendance List',
//         href: 'attendance',
//         roles: []
//       },
//       {
//         icon: CircleCheckBig,
//         label: 'Attendance Approve',
//         href: 'attendance-approve',
//         roles: []
//       },
//       {
//         icon: BetweenVerticalStart,
//         label: 'Attendance Entry',
//         href: 'attendance/attendance-entry',
//         roles: []
//       },
//       {
//         icon: Calendar,
//         label: 'Attendance Report',
//         href: 'attendance-report',
//         roles: []
//       }
//     ]
//   },
//   {
//     icon: Clock4,
//     label: 'Attendance',
//     href: 'staff-attendance',
//     roles: ['employee']
//   },
//   {
//     icon: CircleDollarSign,
//     label: 'Payroll',
//     href: 'payroll',
//     roles: [, 'employee']
//   },
//   {
//     icon: CircleGauge,
//     label: 'Leave',
//     href: 'leave-approve',
//     roles: []
//   },
//   {
//     icon: FileSpreadsheet,
//     label: 'Documents',
//     href: 'documents',
//     roles: ['employee']
//   },
//   {
//     icon: FileSpreadsheet,
//     label: 'Document Requests',
//     href: 'document-request',
//     roles: []
//   },
//   {
//     icon: Settings,
//     label: 'Settings',
//     roles: [],
//     subItems: [
//       {
//         icon: ReceiptText,
//         label: 'Company Details',
//         href: 'company-details',
//         roles: []
//       },
//       {
//         icon: Mails,
//         label: 'Email Setup',
//         href: 'email-setup',
//         roles: []
//       },
//       {
//         icon: Calendar,
//         label: 'Bank Holiday',
//         href: 'bank-holiday',
//         roles: []
//       }
//     ]
//   }
// ];

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

  // --- Company Specific Routes (Requested) ---
  {
    icon: DoorOpen,
    label: 'Vacancy',
    href: 'vacancy',
    roles: ['company'] // Assuming vacancy management is admin
  },
  {
    icon: Users,
    label: 'Employees',
    href: 'employee', // Using existing employee list route or new one 'employees'
    roles: ['company']
  },
  {
    icon: ShieldCheck,
    label: 'Right to Work',
    href: '#',
    roles: ['company']
  },
  {
    icon: ShieldCheck,
    label: 'DBS',
    href: '#',
    roles: ['company']
  },
  {
    icon: BarChart3,
    label: 'Appraisal',
    href: '#',
    roles: ['company']
  },
  {
    icon: BookUser,
    label: 'Passport',
    href: '#',
    roles: ['company']
  },
  {
    icon: BadgeCheck,
    label: 'Visa Status',
    href: '#',
    roles: ['company']
  },
  {
    icon: FileCheck,
    label: 'Immigration Status',
    href: '#',
    roles: ['company']
  },
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
    roles: [] // Explicitly empty or specific roles? Keeping as per previous code
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
    roles: [] // Assuming vacancy management is admin
  },
  {
    icon: BookText,
    label: 'Training',
    href: 'training',
    roles: ['employee'] // Employee view of training
  },

  // --- Legacy / Admin Sub-menus (Preserved for Admin) ---
  {
    icon: UsersIcon,
    label: 'Employee Management',
    roles: [], // Restricted to admin now since Company has flat structure above
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

  // --- Settings (Shared but likely different views) ---

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

// 1. Updated NavItem to accept basePath
const NavItem = ({
  item,
  expandedItems,
  toggleExpanded,
  depth = 0,
  basePath
}) => {
  const location = useLocation();
  const isExpanded = expandedItems[item.label];

  // Construct the full path based on the dynamic basePath
  // If item.href is empty (Dashboard), path is just basePath
  // Otherwise it is basePath/href
  const targetPath = item.href ? `${basePath}/${item.href}` : basePath;

  const isActiveLeaf =
    !item.subItems &&
    (item.href === ''
      ? location.pathname === basePath || location.pathname === `${basePath}/`
      : location.pathname === targetPath ||
        location.pathname.startsWith(`${targetPath}/`));

  const isActiveParent =
    item.subItems && location.pathname.startsWith(targetPath);

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
            <span className="text-black group-hover:text-white">
              {item.label}
            </span>
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
                basePath={basePath} // Pass basePath recursively
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
  const userRole = user?.role || 'staff';
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);

  // 2. Define the Base Path based on the role
  const basePath = userRole === 'company' ? '/company' : '/admin';

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
      <div className="flex flex-col items-center  px-4 ">
        <img
          src={user?.image || '/placeholder.jpg'}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover"
        />
        <div className="flex flex-col items-center space-y-1">
          {/* <p className="text-xl font-semibold text-gray-900">Welcome!</p> */}
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
        {/* <div className="flex items-center justify-start space-x-3 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-supperagent">
            <span className="text-sm font-bold text-white">HR</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">HR System</h1>
          </div>
        </div> */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            basePath={basePath} // 3. Pass the base path here
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
