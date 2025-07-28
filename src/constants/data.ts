import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    label: 'Dashboard',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'Today',
    href: '/dashboard/today',
    icon: 'today',
    label: 'Today',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'Groups',
    href: '/dashboard/group',
    icon: 'group',
    label: 'Groups',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'Notes',
    href: '/dashboard/notes',
    icon: 'notes',
    label: 'Notes',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'Important',
    href: '/dashboard/important',
    icon: 'important',
    label: 'Important',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'Planner',
    href: '/dashboard/planner',
    icon: 'planner',
    label: 'Planner',
    roles: ['admin', 'director', 'user', 'company', 'creator']
  },
  {
    title: 'TP Admin',
    href: '/dashboard/director',
    icon: 'director',
    label: 'director',
    roles: ['admin']
  },
  {
    title: 'Company Admin',
    href: '/dashboard/company',
    icon: 'company',
    label: 'Company',
    roles: ['admin', 'director']
  },
  {
    title: 'Creator / Manager',
    href: '/dashboard/creator',
    icon: 'creator',
    label: 'Creator / Manager',
    roles: ['admin', 'director', 'company']
  },
  {
    title: 'Users / Stuff',
    href: '/dashboard/users',
    icon: 'user',
    label: 'Users / Stuff',
    roles: ['admin', 'director', 'company', 'creator']
  }
];

export const dashboardCard = [
  {
    date: 'Today',
    total: 2000,
    role: 'Students',
    color: 'bg-[#EC4D61] bg-opacity-40'
  },
  {
    date: 'Today',
    total: 2000,
    role: 'Teachers',
    color: 'bg-[#FFEB95] bg-opacity-100'
  },
  {
    date: 'Today',
    total: 2000,
    role: 'Parents',
    color: 'bg-[#84BD47] bg-opacity-30'
  },
  {
    date: 'Today',
    total: 2000,
    role: 'Schools',
    color: 'bg-[#D289FF] bg-opacity-30'
  }
];

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};
