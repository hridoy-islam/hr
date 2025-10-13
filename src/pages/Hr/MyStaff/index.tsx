// MyStaff.tsx
import React, { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import UpcomingAppraisalsCard from './components/UpcomingAppraisalsCard';
import AbsentTodayCard from './components/AbsentTodayCard';
import HolidayRequestsCard from './components/HolidayRequestsCard';
import HolidaysTodayCard from './components/HolidaysTodayCard';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

// ===== Interfaces =====
interface Employee {
  id: string;
  name: string;
  email: string;
}

interface HolidayRequest {
  id: string;
  employee: Employee;
  startDate: string;
  endDate: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AbsentEmployee {
  id: string;
  employee: Employee;
  date: string;
  hours: number;
  reason: string;
}

interface BankHoliday {
  _id: string;
  title: string;
  date: string;
  year: number;
}

interface Appraisal {
  id: string;
  employee: Employee;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  approvedBy?: string;
  lastReview: string;
}

// ===== MyStaff Component =====
const MyStaff = () => {
  const { toast } = useToast();

  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<BankHoliday[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    request?: HolidayRequest;
  }>({ isOpen: false, type: 'approve' });



  const fetchAll = async () => {
    setLoading(true); // shared loading for both
    try {
      const currentYear = moment().year();

      // Run both requests in parallel
      const [leaveRes, holidaysRes] = await Promise.all([
        axiosInstance.get('/hr/leave?status=pending&limit=all'),
        axiosInstance.get(`/hr/bank-holiday?year=${currentYear}&limit=all`)
      ]);

      // ---- Holiday Requests ----
      const requestsData = leaveRes.data?.data?.result || [];
      setHolidayRequests(requestsData);

      // ---- Today's Holidays ----
      const holidaysData = holidaysRes.data?.data?.result || [];
      const todayFormatted = moment().format('YYYY-MM-DD');
      const todayHolidays = holidaysData.filter((h: BankHoliday) =>
        moment(h.date).format('YYYY-MM-DD') === todayFormatted
      );
      setHolidays(todayHolidays);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again later.',
        variant: 'destructive'
      });
      console.error('Error fetching staff data:', error);
      setHolidayRequests([]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };


useEffect(() => {
  

  fetchAll();
}, []);


  const absentToday: AbsentEmployee[] = [
    {
      id: '1',
      employee: { id: '4', name: 'Alex Rodriguez', email: 'alex.rodriguez@company.com' },
      date: '2025-10-13',
      hours: 8,
      reason: 'Sick leave'
    },
    {
      id: '2',
      employee: { id: '5', name: 'Lisa Park', email: 'lisa.park@company.com' },
      date: '2025-10-13',
      hours: 4,
      reason: 'Doctor appointment'
    }
  ];

  const upcomingAppraisals: Appraisal[] = [
    {
      id: '1',
      employee: { id: '6', name: 'John Smith', email: 'john.smith@company.com' },
      status: 'pending',
      dueDate: '2025-11-15',
      lastReview: '2025-05-15'
    },
    {
      id: '2',
      employee: { id: '7', name: 'Maria Garcia', email: 'maria.garcia@company.com' },
      status: 'in-progress',
      dueDate: '2025-11-20',
      approvedBy: 'HR Manager',
      lastReview: '2025-05-20'
    },
    {
      id: '3',
      employee: { id: '8', name: 'David Wilson', email: 'david.wilson@company.com' },
      status: 'pending',
      dueDate: '2025-12-01',
      lastReview: '2025-06-01'
    }
  ];

  const handleApproveReject = (type: 'approve' | 'reject', request: HolidayRequest) => {
    setConfirmModal({ isOpen: true, type, request });
  };

  const confirmAction = () => {
    console.log(`${confirmModal.type} request for ${confirmModal.request?.employee.name}`);
    setConfirmModal({ isOpen: false, type: 'approve' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ">
      <div className="mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Users2 className="h-5 w-5" />
            My Staff
          </h2>

          <div className="grid grid-cols-1 gap-6">
            <HolidayRequestsCard
              requests={holidayRequests}
              onRefresh={fetchAll}
            />
            {/* ✅ Pass holidays and loading as props */}
            <HolidaysTodayCard holidays={holidays} loading={loading} />
            <AbsentTodayCard absentees={absentToday} />
            <UpcomingAppraisalsCard appraisals={upcomingAppraisals} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmModal.type === 'approve' ? 'Approve' : 'Reject'} Holiday Request
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmModal.type} the holiday request for{' '}
              <span className="font-semibold">{confirmModal.request?.employee.name}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: 'approve' })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  confirmModal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStaff;
