import React from 'react';
import { Users } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface AbsentEmployee {
  id: string;
  employee: Employee;
  date: string;
  hours: number;
  reason: string;
}

interface AbsentTodayCardProps {
  absentees: AbsentEmployee[];
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const AbsentTodayCard: React.FC<AbsentTodayCardProps> = ({ absentees }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-orange-300 to-red-400 px-6 py-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-white mr-3" />
          <h2 className="text-xl font-semibold text-white">Absent Today</h2>
          <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {absentees.length}
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
              {absentees.map((absent) => (
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
  );
};

export default AbsentTodayCard;