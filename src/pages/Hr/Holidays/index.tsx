import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Holiday {
  id: number;
  status: 'Bank Holiday Auto Booked' | 'Approved' | 'Pending' | 'Taken';
  startDate: string;
  endDate: string;
  title: string;
  hours: string;
}

interface LeaveAllowance {
  openingThisYear: number;
  bankHolidayAutoBooked: number;
  taken: number;
  booked: number;
  requested: number;
  leftThisYear: number;
}

const mockHolidayData: Holiday[] = [
  {
    id: 1,
    status: 'Bank Holiday Auto Booked',
    startDate: '2025-12-26',
    endDate: '2025-12-26',
    title: 'Boxing Day',
    hours: '07:30'
  },
  {
    id: 2,
    status: 'Bank Holiday Auto Booked',
    startDate: '2025-12-25',
    endDate: '2025-12-25',
    title: 'Christmas Day',
    hours: '07:30'
  },
  {
    id: 3,
    status: 'Bank Holiday Auto Booked',
    startDate: '2025-08-25',
    endDate: '2025-08-25',
    title: 'Summer Bank Holiday',
    hours: '07:30'
  },
  {
    id: 4,
    status: 'Approved',
    startDate: '2025-07-14',
    endDate: '2025-07-18',
    title: 'Summer Vacation',
    hours: '37:30'
  },
  {
    id: 5,
    status: 'Pending',
    startDate: '2025-06-02',
    endDate: '2025-06-02',
    title: 'Personal Day',
    hours: '07:30'
  },
  {
    id: 6,
    status: 'Taken',
    startDate: '2025-04-18',
    endDate: '2025-04-21',
    title: 'Easter Break',
    hours: '30:00'
  }
];

const mockLeaveAllowance: LeaveAllowance = {
  openingThisYear: 210.0,
  bankHolidayAutoBooked: 52.3,
  taken: 30.0,
  booked: 37.5,
  requested: 7.5,
  leftThisYear: 157.3
};

const Holiday: React.FC = () => {
  const [isHolidayYearOpen, setIsHolidayYearOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Bank Holiday Auto Booked':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Auto Booked
          </Badge>
        );
      case 'Approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'Taken':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Taken
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSubmitRequest = () => {
    console.log('Holiday request submitted:', {
      year: selectedYear,
      type: selectedType,
      startDate,
      endDate,
      title
    });
    // Reset form
    setSelectedType('');
    setStartDate(undefined);
    setEndDate(undefined);
    setTitle('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* My Holidays Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  My Holidays
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Dropdown Year Selector */}
                <div className="mb-4 flex items-center justify-start gap-4">
                  <span className="font-semibold text-gray-700">
                    Holiday Year:
                  </span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Leave Allowance Summary */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {mockLeaveAllowance.bankHolidayAutoBooked}
                      </div>
                      <div className="text-sm text-gray-600">Bank Holiday</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {mockLeaveAllowance.taken}
                      </div>
                      <div className="text-sm text-gray-600">Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {mockLeaveAllowance.booked}
                      </div>
                      <div className="text-sm text-gray-600">Booked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {mockLeaveAllowance.leftThisYear}
                      </div>
                      <div className="text-sm text-gray-600">Balance</div>
                    </div>
                  </div>

                  {/* Holiday Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockHolidayData.map((holiday) => (
                          <TableRow key={holiday.id}>
                            <TableCell>
                              {getStatusBadge(holiday.status)}
                            </TableCell>
                            <TableCell>
                              {formatDate(holiday.startDate)}
                            </TableCell>
                            <TableCell>{formatDate(holiday.endDate)}</TableCell>
                            <TableCell className="font-medium">
                              {holiday.title}
                            </TableCell>
                            <TableCell>{holiday.hours}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Leave Allowances */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  My Leave Allowance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-300 py-2">
                    <span className="text-gray-600">Opening This Year</span>
                    <span className="font-semibold">
                      {mockLeaveAllowance.openingThisYear.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b  border-gray-300 py-2">
                    <span className="text-gray-600">
                      Bank Holiday Auto Booked
                    </span>
                    <span className="font-semibold">
                      {mockLeaveAllowance.bankHolidayAutoBooked.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b  border-gray-300 py-2">
                    <span className="text-gray-600">Taken</span>
                    <span className="font-semibold text-green-600">
                      {mockLeaveAllowance.taken.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b  border-gray-300 py-2">
                    <span className="text-gray-600">Booked</span>
                    <span className="font-semibold text-orange-600">
                      {mockLeaveAllowance.booked.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b  border-gray-300 py-2">
                    <span className="text-gray-600">Requested</span>
                    <span className="font-semibold text-yellow-600">
                      {mockLeaveAllowance.requested.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <span className="font-semibold text-blue-900">
                      Left This Year
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {mockLeaveAllowance.leftThisYear.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Holiday Request */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-supperagent" />
                  Submit Holiday Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="holiday-year">Holiday Year</Label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter holiday title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holiday">
                          Holiday / Vacation
                        </SelectItem>
                        <SelectItem value="personal">Personal Day</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="family">Family Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="date-range">Select Date</Label>
                    <DatePicker
                      id="date-range"
                      selectsRange
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setStartDate(start ?? undefined);
                        setEndDate(end ?? undefined);
                      }}
                      dropdownMode="select"
                      showMonthDropdown
                      showYearDropdown
                      isClearable
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitRequest}
                    className="w-full bg-supperagent text-white hover:bg-supperagent/90"
                    disabled={!selectedType || !startDate || !endDate || !title}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holiday;
