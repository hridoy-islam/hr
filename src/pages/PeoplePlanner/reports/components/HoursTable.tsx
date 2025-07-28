import { useState } from 'react';
import moment from 'moment';
import { Clock, MapPin, CheckCircle, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
export const HoursTable = () => {
  const [filter, setFilter] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('weekly');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [year, setYear] = useState<number>(moment().year());
  const [month, setMonth] = useState<number>(moment().month());
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(moment().endOf('week').toDate());

  const handleWeeklyChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start) {
      setDate(start);
    }
  };
 const serviceUsers = ['Hasan', 'Amina', 'Khalid', 'Sara', 'Yusuf'];

const rawHoursData = [
  {
    date: 'Mon, Dec 18, 2025',
    clockIn: '9:00 AM',
    clockOut: '5:30 PM',
    breakTime: '30 min',
    totalHours: '8.0',
    location: 'Main Store',
    status: 'approved',
    timestamp: moment('2025-12-18').valueOf()
  },
  {
    date: 'Tue, Dec 19, 2025',
    clockIn: '9:15 AM',
    clockOut: '5:45 PM',
    breakTime: '45 min',
    totalHours: '7.75',
    location: 'Main Store',
    status: 'approved',
    timestamp: moment('2025-12-19').valueOf()
  },
  {
    date: 'Wed, Dec 20, 2025',
    clockIn: '8:45 AM',
    clockOut: '5:15 PM',
    breakTime: '30 min',
    totalHours: '8.0',
    location: 'Warehouse',
    status: 'pending',
    timestamp: moment('2025-12-20').valueOf()
  },
  {
    date: 'Thu, Dec 21, 2023',
    clockIn: '9:00 AM',
    clockOut: '6:00 PM',
    breakTime: '60 min',
    totalHours: '8.0',
    location: 'Main Store',
    status: 'approved',
    timestamp: moment('2023-12-21').valueOf()
  },
  {
    date: 'Fri, Dec 22, 2023',
    clockIn: '9:30 AM',
    clockOut: '2:30 PM',
    breakTime: '30 min',
    totalHours: '4.5',
    location: 'Main Store',
    status: 'pending',
    timestamp: moment('2023-12-22').valueOf()
  },
  {
    date: 'Mon, Jan 1, 2024',
    clockIn: '9:00 AM',
    clockOut: '5:00 PM',
    breakTime: '60 min',
    totalHours: '7.0',
    location: 'Main Store',
    status: 'approved',
    timestamp: moment('2024-01-01').valueOf()
  },
  {
    date: 'Tue, Jan 2, 2024',
    clockIn: '8:30 AM',
    clockOut: '5:30 PM',
    breakTime: '30 min',
    totalHours: '8.5',
    location: 'Warehouse',
    status: 'approved',
    timestamp: moment('2024-01-02').valueOf()
  }
];

const hoursData = rawHoursData.map((entry, index) => ({
  ...entry,
  serviceUser: serviceUsers[index % serviceUsers.length]
}));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = hoursData.filter((day) => {
    const dayMoment = moment(day.timestamp);

    switch (filter) {
      case 'daily':
        return dayMoment.isSame(date, 'day');
      case 'weekly':
        return dayMoment.isSame(date, 'week');
      case 'monthly':
        return dayMoment.month() === month && dayMoment.year() === year;
      case 'yearly':
        return dayMoment.year() === year;
      default:
        return true;
    }
  });

  const totalHours = filteredData.reduce(
    (sum, day) => sum + parseFloat(day.totalHours),
    0
  );

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setYear(moment(newDate).year());
      setMonth(moment(newDate).month());
    }
  };
const getRangeLabel = () => {
  switch (filter) {
    case 'daily':
      return date ? moment(date).format('MMM D, YYYY') : '';
    case 'weekly':
      return startDate && endDate
        ? `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`
        : '';
    case 'monthly':
      return `${moment().month(month).format('MMMM')} ${year}`;
    case 'yearly':
      return `${year}`;
    default:
      return '';
  }
};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
  <Clock className="h-5 w-5 text-gray-500" />
  <span>View Work Report</span>
  <span className="ml-2  text-muted-foreground font-medium">
    {getRangeLabel()}
  </span>
</CardTitle>


          <div className="flex items-center gap-4">
            <Select
              value={filter}
              onValueChange={(
                value: 'daily' | 'weekly' | 'monthly' | 'yearly'
              ) => setFilter(value)}
            >
              <SelectTrigger className="w-[120px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Day</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

           {filter === 'daily' ? (
              <div className="relative">
                <DatePicker
                  selected={date}
                  onChange={handleDateChange}
                  selectsSingle
                  locale="en"
                  dateFormat="MMM d, yyyy"
                  calendarClassName="bg-white rounded-md shadow-lg"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  customInput={
                    <Button variant="outline" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {moment(date).format('MMM D, YYYY')}
                    </Button>
                  }
                />
              </div>
            ) : filter === 'weekly' ? (
              <div className="relative">
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleWeeklyChange}
                  selectsStart
                  locale="en"
                  showWeekNumbers
                  dateFormat="MMM d, yyyy"
                  calendarClassName="bg-white rounded-md shadow-lg"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  customInput={
                    <Button variant="outline" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {startDate && endDate 
                        ? `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`
                        : 'Select a date range'}
                    </Button>
                  }
                />
              </div>
            ) : filter === 'monthly' ? (
              <div className="flex gap-2">
                <Select
                  value={month.toString()}
                  onValueChange={(value) => setMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    {moment().month(month).format('MMMM')}
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {moment().month(i).format('MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">{year}</SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: 5 },
                      (_, i) => moment().year() - 2 + i
                    ).map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">{year}</SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 5 },
                    (_, i) => moment().year() - 2 + i
                  ).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Service User</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>{day.clockIn}</TableCell>
                    <TableCell>{day.clockOut}</TableCell>
                    <TableCell>{day.breakTime}</TableCell>
                    <TableCell className="font-semibold">
                      {day.totalHours}h
                    </TableCell>
                    <TableCell>{day.serviceUser}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {day.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(day.status)}>
                        <div className="flex items-center gap-1">
                          {day.status === 'approved' && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          <span className="capitalize">{day.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">
              {filter === 'daily'
                ? 'Daily Total'
                : filter === 'weekly'
                  ? 'Weekly Total'
                  : filter === 'monthly'
                    ? 'Monthly Total'
                    : 'Yearly Total'}
            </span>
            <span className="text-xl font-bold text-gray-900">
              {totalHours.toFixed(2)} hours
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
