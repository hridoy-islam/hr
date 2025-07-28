import React, { useState } from 'react';
import { Calendar, Clock, Users, TrendingUp, Check, X, Eye, User } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  image?: string;
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

interface Holiday {
  id: string;
  title: string;
  date: string;
  type: 'public' | 'company' | 'religious';
}

interface Appraisal {
  id: string;
  employee: Employee;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  approvedBy?: string;
  lastReview: string;
}

const MyStuff = () => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    request?: HolidayRequest;
  }>({ isOpen: false, type: 'approve' });

  // Mock data
  const holidayRequests: HolidayRequest[] = [
    {
      id: '1',
      employee: { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      startDate: '2025-01-15',
      endDate: '2025-01-19',
      hours: 40,
      reason: 'Family vacation',
      status: 'pending'
    },
    {
      id: '2',
      employee: { id: '2', name: 'Mike Chen', email: 'mike.chen@company.com' },
      startDate: '2025-01-22',
      endDate: '2025-01-24',
      hours: 24,
      reason: 'Personal time',
      status: 'pending'
    },
    {
      id: '3',
      employee: { id: '3', name: 'Emma Davis', email: 'emma.davis@company.com' },
      startDate: '2025-01-28',
      endDate: '2025-01-30',
      hours: 24,
      reason: 'Medical appointment',
      status: 'pending'
    },
    {
      id: '4',
      employee: { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      startDate: '2025-01-15',
      endDate: '2025-01-19',
      hours: 40,
      reason: 'Family vacation',
      status: 'pending'
    },
    {
      id: '5',
      employee: { id: '2', name: 'Mike Chen', email: 'mike.chen@company.com' },
      startDate: '2025-01-22',
      endDate: '2025-01-24',
      hours: 24,
      reason: 'Personal time',
      status: 'pending'
    },
    {
      id: '6',
      employee: { id: '3', name: 'Emma Davis', email: 'emma.davis@company.com' },
      startDate: '2025-01-28',
      endDate: '2025-01-30',
      hours: 24,
      reason: 'Medical appointment',
      status: 'pending'
    }
  ];

  const absentToday: AbsentEmployee[] = [
    {
      id: '1',
      employee: { id: '4', name: 'Alex Rodriguez', email: 'alex.rodriguez@company.com' },
      date: '2025-01-13',
      hours: 8,
      reason: 'Sick leave'
    },
    {
      id: '2',
      employee: { id: '5', name: 'Lisa Park', email: 'lisa.park@company.com' },
      date: '2025-01-13',
      hours: 4,
      reason: 'Doctor appointment'
    }
  ];

  const holidaysToday: Holiday[] = [
    {
      id: '1',
      title: 'Martin Luther King Jr. Day',
      date: '2025-01-20',
      type: 'public'
    },
    {
      id: '2',
      title: 'Company Foundation Day',
      date: '2025-01-25',
      type: 'company'
    }
  ];

  const upcomingAppraisals: Appraisal[] = [
    {
      id: '1',
      employee: { id: '6', name: 'John Smith', email: 'john.smith@company.com' },
      status: 'pending',
      dueDate: '2025-02-15',
      lastReview: '2024-08-15'
    },
    {
      id: '2',
      employee: { id: '7', name: 'Maria Garcia', email: 'maria.garcia@company.com' },
      status: 'in-progress',
      dueDate: '2025-02-20',
      approvedBy: 'HR Manager',
      lastReview: '2024-08-20'
    },
    {
      id: '3',
      employee: { id: '8', name: 'David Wilson', email: 'david.wilson@company.com' },
      status: 'pending',
      dueDate: '2025-03-01',
      lastReview: '2024-09-01'
    }
  ];

  const handleApproveReject = (type: 'approve' | 'reject', request: HolidayRequest) => {
    setConfirmModal({ isOpen: true, type, request });
  };

  const confirmAction = () => {
    // Handle the approve/reject action here
    console.log(`${confirmModal.type} request for ${confirmModal.request?.employee.name}`);
    setConfirmModal({ isOpen: false, type: 'approve' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-purple-100 text-purple-800';
      case 'religious': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Stuff</h1>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Card 1: Pending Holiday Requests */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Pending Holiday Requests</h2>
                <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {holidayRequests.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Employee</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Dates</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Hours</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidayRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {getInitials(request.employee.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-xs">{request.employee.name}</div>
                              <div className=" text-gray-500 text-xs">{request.employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-xs">
                            <div className="font-medium text-gray-900">{request.startDate}</div>
                            <div className="text-gray-500">to {request.endDate}</div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                            {request.hours}h
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveReject('approve', request)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {/* Approve */}
                            </button>
                            <button
                              onClick={() => handleApproveReject('reject', request)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              {/* Reject */}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Card 2: Absent Today */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Absent Today</h2>
                <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {absentToday.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Employee</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Hours</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentToday.map((absent) => (
                      <tr key={absent.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {getInitials(absent.employee.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{absent.employee.name}</div>
                              <div className="text-sm text-gray-500">{absent.employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-gray-900">{absent.date}</div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                            {absent.hours}h
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-sm text-gray-600">{absent.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Card 3: Holidays Today */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Holidays Today</h2>
                <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {holidaysToday.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {holidaysToday.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white mr-4">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{holiday.title}</h3>
                        <p className="text-sm text-gray-600">{holiday.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHolidayTypeColor(holiday.type)}`}>
                      {holiday.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Upcoming Appraisals */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-semibold text-white">Upcoming Appraisals in 60 Days</h2>
                <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {upcomingAppraisals.length}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Employee</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppraisals.map((appraisal) => (
                      <tr key={appraisal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {getInitials(appraisal.employee.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{appraisal.employee.name}</div>
                              <div className="text-sm text-gray-500">{appraisal.employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appraisal.status)}`}>
                            {appraisal.status}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-sm font-medium text-gray-900">{appraisal.dueDate}</div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-sm text-gray-600">
                            {appraisal.approvedBy || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

export default MyStuff;