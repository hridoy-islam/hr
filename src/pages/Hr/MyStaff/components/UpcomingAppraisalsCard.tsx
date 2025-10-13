import React from 'react';
import { TrendingUp } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Appraisal {
  id: string;
  employee: Employee;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  approvedBy?: string;
  lastReview: string;
}

interface UpcomingAppraisalsCardProps {
  appraisals: Appraisal[];
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved':
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const UpcomingAppraisalsCard: React.FC<UpcomingAppraisalsCardProps> = ({ appraisals }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-purple-400 to-purple-500 px-6 py-4">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 text-white mr-3" />
          <h2 className="text-xl font-semibold text-white">Upcoming Appraisals in 60 Days</h2>
          <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {appraisals.length}
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
              {appraisals.map((appraisal) => (
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
  );
};

export default UpcomingAppraisalsCard;