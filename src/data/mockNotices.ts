import { Notice } from '../types/notice';

export const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'System Maintenance Scheduled',
    content: 'The IT department will be performing scheduled maintenance on our main servers this Saturday from 2:00 AM to 6:00 AM EST. During this time, all systems will be temporarily unavailable. Please plan accordingly and complete any urgent tasks before the maintenance window.',
    author: 'John Smith',
    department: 'IT Department',
    priority: 'high',
    category: 'it',
    createdAt: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isPinned: true
  },
  {
    id: '2',
    title: 'New Employee Orientation - Welcome Session',
    content: 'Join us in welcoming our new team members! The orientation session will be held in Conference Room A on Friday at 2:00 PM. All department heads are requested to attend and briefly introduce their teams.',
    author: 'Sarah Johnson',
    department: 'Human Resources',
    priority: 'medium',
    category: 'hr',
    createdAt: new Date('2024-01-14T14:15:00'),
    isRead: true,
    isPinned: false
  },
  {
    id: '3',
    title: 'Q1 Budget Review Meeting',
    content: 'All department managers are required to attend the Q1 budget review meeting on Monday, January 22nd at 10:00 AM in the main conference room. Please bring your quarterly reports and projected expenses for Q2.',
    author: 'Michael Chen',
    department: 'Finance',
    priority: 'urgent',
    category: 'finance',
    createdAt: new Date('2024-01-13T09:00:00'),
    isRead: false,
    isPinned: true
  },
  {
    id: '4',
    title: 'Office Safety Reminder',
    content: 'Please ensure all emergency exits remain clear and unobstructed. The safety committee has noticed some areas where personal items are blocking walkways. Let\'s keep our workplace safe for everyone.',
    author: 'Lisa Wilson',
    department: 'Safety Committee',
    priority: 'medium',
    category: 'safety',
    createdAt: new Date('2024-01-12T16:45:00'),
    isRead: true,
    isPinned: false
  },
  {
    id: '5',
    title: 'New Coffee Machine in Break Room',
    content: 'We\'ve installed a new coffee machine in the main break room! The machine accepts both cash and card payments. Instructions for use are posted next to the machine. Enjoy your coffee!',
    author: 'Operations Team',
    department: 'Operations',
    priority: 'low',
    category: 'general',
    createdAt: new Date('2024-01-11T11:20:00'),
    isRead: false,
    isPinned: false
  },
  {
    id: '6',
    title: 'Remote Work Policy Update',
    content: 'We\'ve updated our remote work policy to provide more flexibility. The new policy allows for up to 3 remote work days per week with manager approval. Please review the updated guidelines on the HR portal.',
    author: 'David Brown',
    department: 'Human Resources',
    priority: 'high',
    category: 'hr',
    createdAt: new Date('2024-01-10T13:30:00'),
    isRead: true,
    isPinned: false
  },
  {
    id: '7',
    title: 'Quarterly All-Hands Meeting',
    content: 'Our quarterly all-hands meeting will be held on Friday, January 26th at 3:00 PM in the auditorium. We\'ll be discussing company performance, upcoming projects, and celebrating team achievements.',
    author: 'Executive Team',
    department: 'Executive',
    priority: 'medium',
    category: 'general',
    createdAt: new Date('2024-01-09T08:15:00'),
    isRead: false,
    isPinned: false
  },
  {
    id: '8',
    title: 'Parking Lot Resurfacing',
    content: 'The north parking lot will be resurfaced next week from Monday to Wednesday. Please use the south parking lot or street parking during this time. Thank you for your patience.',
    author: 'Facilities Management',
    department: 'Operations',
    priority: 'medium',
    category: 'operations',
    createdAt: new Date('2024-01-08T12:00:00'),
    isRead: true,
    isPinned: false
  }
];