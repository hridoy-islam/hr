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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logout } from '@/redux/features/authSlice';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/hr' },
  {
    icon: UserRoundCheck,
    label: 'Profile',
    href: 'profile'
  },
  {
    icon: Box,
    label: 'Holidays',
    href: 'holiday'
  },
  {
    icon: PencilRuler,
    label: 'MyStuff',
    href: 'my-stuff'
  },
  {
    icon: UsersIcon,
    label: 'Employee',
    href: 'employee',
    subItems: [
      { icon: Users, label: 'Employee List', href: 'employee' },
      { icon: LayoutPanelTop, label: 'Department', href: 'department' },
      { icon: ArrowBigUp, label: 'Shift', href: 'shift' },
      { icon: Award, label: 'Designation', href: 'designation' },
      { icon: BookText, label: 'Training', href: 'training' }
    ]
  },
  {
    icon: FileCheck2,
    label: 'Attendance',
    href: 'attendance',
    subItems: [
      { icon: FileCheck2, label: 'Attendance List', href: 'attendance' },
      {
        icon: CircleCheckBig,
        label: 'Attendance Approve',
        href: 'attendance-approve'
      },
      {
        icon: BetweenVerticalStart,
        label: 'Attendance Entry',
        href: '/admin/hr/attendance/attendance-entry'
      },
      { icon: Calendar, label: 'Attendance Report', href: 'attendance-report' }
    ]
  },
  { icon: CircleDollarSign, label: 'Payroll', href: 'payroll' },
  { icon: CircleGauge, label: 'Leave',subItems: [
      { icon: ReceiptText, label: 'Leave Approval', href: 'leave-approve'},
    ] },
  { icon: FileTextIcon, label: 'Notice', href: 'notice' },
  { icon: DoorOpen, label: 'Vacancy', href: 'vacancy' },
  {
    icon: Settings,
    label: 'Settings',
    href: 'settings',
    subItems: [
      { icon: ReceiptText, label: 'Company Details', href: 'company-details' },
      { icon: Mails, label: 'Email Setup', href: 'email-setup' }
    ]
  }
];

const NavItem = ({ item, isExpanded, onToggle, depth = 0 }) => {
  const location = useLocation();

  const isActiveLeaf =
    !item.subItems && location.pathname.startsWith('/' + item.href);
  const isActiveParent =
    item.subItems && location.pathname === '/' + item.href;

  const isActive = isActiveLeaf || isActiveParent;

  if (item.subItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={onToggle}
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
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-1 border-l-2 border-gray-300">
            {item.subItems.map((subItem) => (
              <NavItem key={subItem.href} item={subItem} depth={depth + 1} />
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
        'group flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-supperagent hover:text-white',
        isActive && 'bg-blue-50 text-supperagent shadow-sm',
        depth > 0 && 'pl-6'
      )}
    >
      <item.icon className="h-4 w-4 text-supperagent group-hover:text-white" />
      <span className="text-black group-hover:text-white">{item.label}</span>
    </Link>
  );
};


export function SideNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user) || null;
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto logout if user is null
  useEffect(() => {
    if (!user) {
      dispatch(logout());
      navigate('/');
    }
  }, [user, dispatch, navigate]);

  // Auto-expand parent menu if current route is a submenu item
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (subItem) =>
            location.pathname === subItem.href ||
            location.pathname.includes(subItem.href)
        );
        if (hasActiveSubItem) {
          setExpandedItems((prev) => new Set([...prev, item.label]));
        }
      }
    });
  }, [location.pathname]);

  if (!user) return null;

  const toggleExpanded = (label) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const filterForAgent = (navItems) =>
    navItems.filter(
      (item) => !['Management', 'Settings', 'Invoices'].includes(item.label)
    );

  const filterForStaff = (navItems, user) => {
    if (!user?.privileges?.management) return navItems;

    const management = user.privileges.management;

    return navItems
      .map((item) => {
        if (item.label === 'Management' && item.subItems) {
          const allowedSubItems = item.subItems.filter(
            (subItem) =>
              (subItem.label === 'Agents' && management.agent) ||
              (subItem.label === 'Course Relation' && management.courseRelation)
          );

          return allowedSubItems.length > 0
            ? { ...item, subItems: allowedSubItems }
            : null;
        }

        if (item.label === 'Settings' && item.subItems) {
          const allowedSubItems = item.subItems
            .map((subItem) => {
              if (subItem.label === 'Parameters' && subItem.subItems) {
                const allowedParameters = subItem.subItems.filter(
                  (param) =>
                    (param.label === 'Institution' && management.institution) ||
                    (param.label === 'Courses' && management.course) ||
                    (param.label === 'Terms' && management.term) ||
                    (param.label === 'Academic Year' &&
                      management.academicYear) ||
                    (param.label === 'Bank List' && management.bank)
                );

                return allowedParameters.length > 0
                  ? { ...subItem, subItems: allowedParameters }
                  : null;
              }

              return ['Staffs', 'Emails', 'Drafts'].includes(subItem.label) &&
                management[subItem.label.toLowerCase()]
                ? subItem
                : null;
            })
            .filter(Boolean);

          return allowedSubItems.length > 0
            ? { ...item, subItems: allowedSubItems }
            : null;
        }

        return item.label === 'Invoices' && !management.invoices ? null : item;
      })
      .filter(Boolean);
  };

  const filteredNavItems =
    user.role === 'agent'
      ? filterForAgent(navItems)
      : user.role === 'staff'
        ? filterForStaff(navItems, user)
        : navItems;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between   px-4">
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

      <div className="flex  flex-col items-center space-x-3">
        <img
          src={user.image || '/placeholder.jpg'}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover"
        />
        <div className="flec flex-col items-center justify-center space-y-1">
          <p className="text-xl font-semibold text-gray-900">
            Welcome!
          </p>
          <p className="text-md font-medium text-gray-900">
            {user.name || 'User'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isExpanded={expandedItems.has(item.label)}
            onToggle={() => toggleExpanded(item.label)}
            isActive={
              location.pathname === item.href ||
              location.pathname.includes(item.href)
            }
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
