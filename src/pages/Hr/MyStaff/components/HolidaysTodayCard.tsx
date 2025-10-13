// components/HolidaysTodayCard.tsx
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from 'moment';

interface BankHoliday {
  _id: string;
  title: string;
  date: string; // ISO date string from backend
  year: number;
}

const HolidaysTodayCard: React.FC = ({holidays,loading}) => {


 



  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-white mr-3" />
          <h2 className="text-xl font-semibold text-white">Holidays Today</h2>
          <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {holidays.length}
          </span>
        </div>
      </div>
      <div className="p-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="small" color="bg-green-600" />
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No holidays today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[300px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Holiday</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday) => (
                  <tr key={holiday._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-2 font-medium text-gray-900">{holiday.title}</td>
                    <td className="py-4 px-2 text-gray-600 text-right">
                      {moment(holiday.date).format('DD MMM, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaysTodayCard;