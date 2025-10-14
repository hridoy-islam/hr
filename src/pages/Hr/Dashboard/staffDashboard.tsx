import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee
} from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';

// === Interfaces ===
interface HolidayAllowance {
  openingThisYear: number;
  holidayAccured: number;
  taken: number;
  booked: number;
  requested: number;
  leftThisYear: number;
  remainingHours: number;
  requestedHours: number;
  unpaidLeaveRequest: number;
  unpaidLeaveTaken: number;
}

interface LeaveRequest {
  _id: string;
  holidayYear: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  totalHours: number;
  createdAt: string;
}

interface HolidayRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'completed';
  days: number;
  requestDate: string;
}

interface HolidayBalance {
  totalEntitlement: number;
  used: number;
  pending: number;
  remaining: number;
}

interface HolidayData {
  requests: HolidayRequest[];
  taken: HolidayRequest[];
  balance: HolidayBalance;
}

interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: string;
  status: string;
  noticeSetting: "all" | "department" | "designation" | "individual";
  department: any[];
  designation: any[];
  users: any[];
}

const StaffDashboardPage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysPresent, setDaysPresent] = useState<number>(0);
  const [holidayData, setHolidayData] = useState<HolidayData>({
    requests: [],
    taken: [],
    balance: {
      totalEntitlement: 0,
      used: 0,
      pending: 0,
      remaining: 0
    }
  });
  const [holidayAllowance, setHolidayAllowance] =
    useState<HolidayAllowance | null>(null);

  const { user } = useSelector((state: any) => state.auth);

  // Format date safely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Invalid Date'
      : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // === Fetch: Days Present (from /hr/attendance) ===
  const fetchDaysPresent = async () => {
    try {
      const response = await axiosInstance.get('/hr/attendance', {
        params: { userId: user._id }
      });

      const logs =
        response.data?.data?.result ||
        response.data?.data ||
        response.data ||
        [];
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const presentDays = new Set<string>();

      logs.forEach((log: any) => {
        if (!log.clockIn) return;

        const clockInDate = new Date(log.clockIn);
        const logMonth = clockInDate.getMonth();
        const logYear = clockInDate.getFullYear();

        if (logYear === currentYear && logMonth === currentMonth) {
          const dateKey = clockInDate.toISOString().split('T')[0];
          presentDays.add(dateKey);
        }
      });

      setDaysPresent(presentDays.size);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setDaysPresent(0); // Default to 0 on error
    }
  };

  // === Fetch: Holiday Allowance (from /hr/holidays) ===
  const fetchHolidayAllowance = async () => {
    try {
      const year = new Date().getFullYear().toString();
      const response = await axiosInstance.get(`/hr/holidays`, {
        params: { userId: user._id, year }
      });

      const data =
        response.data?.data?.result ||
        response.data?.data ||
        response.data ||
        [];
      let record = null;

      if (Array.isArray(data)) {
        record = data.find((item: any) => item.year === year);
      } else if (data?.year === year) {
        record = data;
      }

      if (record) {
        const allowance = record.holidayAllowance || 0;
        const used = record.usedHours || 0;
        const requested = record.requestedHours || 0;
        const leftThisYear = allowance - used;

        setHolidayAllowance({
          openingThisYear: allowance,
          holidayAccured: record.holidayAccured || 0,
          taken: used,
          booked: used,
          requested,
          leftThisYear,
          remainingHours: leftThisYear,
          requestedHours: requested,
          unpaidLeaveRequest: record.unpaidLeaveRequest || 0,
          unpaidLeaveTaken: record.unpaidLeaveTaken || 0
        });

        // Update holiday balance in holidayData
        const hoursPerDay = record.hoursPerDay || 8;
        setHolidayData((prev) => ({
          ...prev,
          balance: {
            totalEntitlement: allowance / hoursPerDay,
            used: used / hoursPerDay,
            pending: requested / hoursPerDay,
            remaining: leftThisYear / hoursPerDay
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching holiday allowance:', error);
    }
  };

  // === Fetch: Leave Requests (from /hr/leave) ===
  const fetchLeaveRequests = async () => {
    try {
      const response = await axiosInstance.get('/hr/leave', {
        params: { userId: user._id, limit: 'all' }
      });

      const rawData =
        response.data?.data?.result ||
        response.data?.data ||
        response.data ||
        [];
      const currentYear = new Date().getFullYear().toString();

      const filtered = rawData.filter((item: any) =>
        item.holidayYear?.includes(currentYear)
      );

      const hoursPerDay = 8; // fallback

      const mapped = filtered.map((item: any) => ({
        id: item._id,
        startDate: item.startDate,
        endDate: item.endDate,
        reason: item.reason || 'Leave',
        status: item.status,
        days: Math.ceil((item.totalHours || 0) / hoursPerDay),
        requestDate: item.createdAt
      }));

      const pendingRequests = mapped
        .filter((r) => r.status === 'pending')
        .map((r) => ({ ...r, status: 'pending' as const }));

      const approvedRequests = mapped
        .filter((r) => r.status === 'approved')
        .map((r) => ({ ...r, status: 'completed' as const }));

      setHolidayData((prev) => ({
        ...prev,
        requests: pendingRequests,
        taken: approvedRequests
      }));
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  // === Fetch: Notices (with filtering like StaffNoticeBoard) ===
  const fetchNotices = async () => {
    try {
      const res = await axiosInstance.get("/hr/notice", {
        params: {
          status: "active",
          sort: "-noticeDate",
          limit: 3,
        },
      });

      const fetched: Notice[] =
        res.data?.data?.result || res.data?.data || res.data || [];

      // --- Filter notices for current user ---
      const filtered = fetched.filter((notice) => {
        switch (notice.noticeSetting) {
          case "all":
            return true;
          case "department":
            return notice.department.some((d: any) => d._id === user.department);
          case "designation":
            return notice.designation.some((des: any) => des._id === user.designation);
          case "individual":
            return notice.users.some((u: any) =>
              typeof u === "string" ? u === user._id : u._id === user._id
            );
          default:
            return false;
        }
      });

      // Map into display format
      const mapped = filtered.map((n) => ({
        _id: n._id,
        title: capitalize(n.noticeType),
        content: n.noticeDescription,
        date: n.noticeDate,
      }));

      setNotices(mapped);
    } catch (error) {
      console.error("Failed to fetch notices:", error);
      setNotices([]);
    }
  };

  // === Load All Data ===
  useEffect(() => {
    if (!user?._id) return;

    setLoading(true);
    Promise.all([
      fetchDaysPresent(),
      fetchHolidayAllowance(),
      fetchLeaveRequests(),
      fetchNotices()
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?._id]);

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
    <div className="min-h-screen bg-gray-50 ">
      <div className="">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Staff'}!
          </h1>
        </div>
        {/* Notices */}
        <div className="rounded-xl border border-gray-200 bg-white mb-4 shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Bell className="mr-2 h-5 w-5 text-blue-600" />
              Latest Notices
            </h3>
          </div>
          <div className="p-6">
            {notices.length === 0 ? (
              <p className="text-sm text-gray-500">No notices available.</p>
            ) : (
              <div className="space-y-2">
                {notices.map((notice) => (
                  <div
                    key={notice._id}
                    className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notice.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatDate(notice.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Attendance */}
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
                  {daysPresent}
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
                  {holidayData.requests.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-medium text-green-600">
                  {holidayData.taken.length}
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
                  {holidayData.balance.totalEntitlement.toFixed(1)} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="font-medium text-green-600">
                  {holidayData.balance.remaining.toFixed(1)} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests & Taken */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Holiday Requests */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Recent Holiday Requests
              </h3>
            </div>
            <div className="p-6">
              {holidayData.requests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {holidayData.requests
                    .sort(
                      (a, b) =>
                        new Date(b.requestDate).getTime() -
                        new Date(a.requestDate).getTime()
                    )
                    .slice(0, 4)
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                      >
                        <div>
                          <div className="mb-1 flex items-center space-x-2">
                            {getStatusIcon(req.status)}
                            <span className="font-medium text-gray-900">
                              {formatDate(req.startDate)} -{' '}
                              {formatDate(req.endDate)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{req.reason}</p>
                          <p className="text-xs text-gray-500">
                            Requested on {formatDate(req.requestDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {req.days} day{req.days > 1 ? 's' : ''}
                          </span>
                          <p
                            className={`mt-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${req.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {req.status}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Holidays Taken */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Holidays Taken
              </h3>
            </div>
            <div className="p-6">
              {holidayData.taken.length === 0 ? (
                <p className="text-sm text-gray-500">No holidays taken yet.</p>
              ) : (
                <div className="space-y-4">
                  {holidayData.taken
                    .sort(
                      (a, b) =>
                        new Date(b.startDate).getTime() -
                        new Date(a.startDate).getTime()
                    )
                    .slice(0, 4)
                    .map((holiday) => (
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
                          <p className="text-sm text-gray-600">
                            {holiday.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {holiday.days} day{holiday.days > 1 ? 's' : ''}
                          </span>
                          <p className="mt-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Completed
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
