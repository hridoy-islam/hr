import React from 'react';
import { Notice } from '../types/notice';
import { Bell, BellOff, Pin, AlertCircle } from 'lucide-react';

interface NoticeStatsProps {
  notices: Notice[];
}

export function NoticeStats({ notices }: NoticeStatsProps) {
  const totalNotices = notices.length;
  const unreadNotices = notices.filter(n => !n.isRead).length;
  const pinnedNotices = notices.filter(n => n.isPinned).length;
  const urgentNotices = notices.filter(n => n.priority === 'urgent').length;

  const stats = [
    {
      label: 'Total Notices',
      value: totalNotices,
      icon: Bell,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Unread',
      value: unreadNotices,
      icon: BellOff,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      label: 'Pinned',
      value: pinnedNotices,
      icon: Pin,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      label: 'Urgent',
      value: urgentNotices,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}