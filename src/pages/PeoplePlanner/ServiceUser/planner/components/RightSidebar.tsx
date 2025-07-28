import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { ServiceUser, Employee, DayStats } from '@/types/planner';

interface RightSidebarProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  currentData: (ServiceUser | Employee)[];
  dayStats: DayStats[];
}

export function RightSidebar({
  isOpen,
  selectedDate,
  setSelectedDate,

  currentData,
  dayStats
}: RightSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="ml-2 flex flex-col  border-l border-gray-300 bg-white  items-center p-4 gap-8">
      {/* Inline Date Picker with reduced width */}

        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => setSelectedDate(date || undefined)}
          inline
          dateFormat="YYYY-MM-DD"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          className="text-xs " // Smaller text
          dayClassName={() => '!text-xs'} // Smaller day text
        />
  

      {/* Stats Table */}
     
        <div className="mb-4 min-w-[250px]">
          <h3 className="mb-2  font-medium text-gray-700">
            Daily Statistics
          </h3>
          <div className="overflow-x-auto">
            <Table className="border border-gray-100 text-xs">
              <TableHeader>
                <TableRow className="h-6">
                  <TableHead className="px-1 py-1 text-[10px]">Date</TableHead>
                  <TableHead className="px-1 py-1 text-[10px] text-red-600">
                    Unallocate
                  </TableHead>
                  <TableHead className="px-1 py-1 text-[10px] text-green-600">
                    Allocate
                  </TableHead>
                  <TableHead className="px-1 py-1 text-[10px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayStats?.map((stat) => (
                  <TableRow
                    key={stat.date}
                    className={`${stat.date === '07/07' ? 'bg-yellow-50' : ''} h-6`}
                  >
                    <TableCell className="whitespace-nowrap px-1 py-1 text-[10px] font-medium">
                      {stat.date} - {stat.day}
                    </TableCell>
                    <TableCell className="px-1 py-1 text-[10px] text-red-600">
                      {stat.unallocated}
                    </TableCell>
                    <TableCell className="px-1 py-1 text-[10px] text-green-600">
                      {stat.allocated}
                    </TableCell>
                    <TableCell className="px-1 py-1 text-[10px]">
                      {stat.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

    </div>
  );
}
