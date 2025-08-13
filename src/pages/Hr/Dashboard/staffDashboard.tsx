import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// Mock data for staff dashboard
const mockAttendanceData = {
  thisMonth: {
    totalWorkingDays: 22,
    daysPresent: 18,
    daysAbsent: 2,
    pendingDays: 2,
    totalHours: 144,
    averageHours: 8,
    punctualityScore: 85
  }
};

const mockHolidayData = {
  requests: [
    {
      id: 1,
      startDate: '2025-02-15',
      endDate: '2025-02-17',
      days: 3,
      reason: 'Family vacation',
      status: 'pending',
      requestDate: '2025-01-10'
    },
    {
      id: 2,
      startDate: '2025-01-28',
      endDate: '2025-01-28',
      days: 1,
      reason: 'Medical appointment',
      status: 'approved',
      requestDate: '2025-01-05'
    }
  ],
  taken: [
    {
      id: 1,
      startDate: '2025-01-03',
      endDate: '2025-01-05',
      days: 3,
      reason: 'Personal leave',
      status: 'completed'
    },
    {
      id: 2,
      startDate: '2024-12-23',
      endDate: '2024-12-30',
      days: 6,
      reason: 'Christmas holiday',
      status: 'completed'
    }
  ],
  balance: {
    totalEntitlement: 25,
    used: 9,
    pending: 3,
    remaining: 13
  }
};

const mockNotices = [
  {
    id: 1,
    title: 'New Health & Safety Guidelines',
    content:
      'Please review the updated health and safety protocols effective from February 1st, 2025. All staff must complete the online training module by February 15th.',
    date: '2025-01-22',
    priority: 'high',
    category: 'Safety',
    isRead: false
  },
  {
    id: 2,
    title: 'Annual Performance Reviews',
    content:
      'Annual performance review meetings will be scheduled for all employees during March 2025. Please prepare your self-assessment forms and submit them to HR by February 28th.',
    date: '2025-01-20',
    priority: 'medium',
    category: 'HR',
    isRead: false
  },
  {
    id: 3,
    title: 'Office Maintenance Schedule',
    content:
      'The office building will undergo routine maintenance on Saturday, February 8th, 2025. The building will be closed, and no access will be available during this time.',
    date: '2025-01-18',
    priority: 'low',
    category: 'Facilities',
    isRead: true
  },
  {
    id: 4,
    title: 'Team Building Event - Save the Date',
    content:
      'Join us for our quarterly team building event on March 15th, 2025, at the Riverside Conference Center. More details and RSVP information will follow soon.',
    date: '2025-01-15',
    priority: 'low',
    category: 'Events',
    isRead: true
  }
];

const StaffDashboardPage = () => {
  const [notices, setNotices] = useState(mockNotices);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const markNoticeAsRead = (noticeId: number) => {
    setNotices((prev) =>
      prev.map((notice) =>
        notice.id === noticeId ? { ...notice, isRead: true } : notice
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex justify-center py-6">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        </div>

        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Attendance Overview */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Attendance
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Present</span>
                <span className="font-medium text-green-600">
                  {mockAttendanceData.thisMonth.daysPresent}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Absent</span>
                <span className="font-medium text-red-600">
                  {mockAttendanceData.thisMonth.daysAbsent}
                </span>
              </div>
            </div>
          </div>

          {/* Holiday Requests */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-yellow-100 p-3">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Holiday Requests
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {
                    mockHolidayData.requests.filter(
                      (r) => r.status === 'pending'
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-medium text-green-600">
                  {
                    mockHolidayData.requests.filter(
                      (r) => r.status === 'approved'
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Holiday Balance */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-green-100 p-3">
                <Coffee className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Balance</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Holiday Balance
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Entitlement</span>
                <span className="font-medium text-gray-900">
                  {mockHolidayData.balance.totalEntitlement}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="font-medium text-green-600">
                  {mockHolidayData.balance.remaining}
                </span>
              </div>
            </div>
          </div>

          {/* Total Hours */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-purple-100 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Work Hours
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Hours</span>
                <span className="font-medium text-gray-900">
                  {mockAttendanceData.thisMonth.totalHours}h
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Working Days</span>
                <span className="font-medium text-green-600">
                  {mockAttendanceData.thisMonth.totalWorkingDays}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Holiday Requests */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Recent Holiday Requests
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockHolidayData.requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div>
                      <div className="mb-1 flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium text-gray-900">
                          {formatDate(request.startDate)} -{' '}
                          {formatDate(request.endDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                      <p className="text-xs text-gray-500">
                        Requested on {formatDate(request.requestDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {request.days} day{request.days > 1 ? 's' : ''}
                      </span>
                      <p
                        className={`rounded-full px-2 py-1 text-xs capitalize ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Recent Holidays Taken
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockHolidayData.taken.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div>
                      <div className="mb-1 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-900">
                          {formatDate(holiday.startDate)} -{' '}
                          {formatDate(holiday.endDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{holiday.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {holiday.days} day{holiday.days > 1 ? 's' : ''}
                      </span>
                      <p className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Latest Notices */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Bell className="mr-2 h-5 w-5 text-blue-600" />
              Latest Notices
              <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                {notices.filter((n) => !n.isRead).length} New
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`rounded-r-lg border-l-4 py-4 pl-4 pr-4 transition-all duration-200  ${
                    !notice.isRead ? 'border-l-4' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <h4
                          className={`font-semibold ${!notice.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                        >
                          {notice.title}
                        </h4>
                        
                      </div>
                      <p className="mb-3 text-sm leading-relaxed text-gray-600">
                        {notice.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(notice.date)}
                        </span>
                       
                        
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
