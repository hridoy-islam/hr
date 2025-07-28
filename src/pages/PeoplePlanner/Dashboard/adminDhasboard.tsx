import { useState, useMemo } from 'react';
import { Calendar, Clock, Filter } from 'lucide-react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock data for services
const mockServices = [
  {
    id: 1,
    carerName: 'Sarah Johnson',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Personal Care',
    date: moment().format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '11:00',
    duration: 2,
    status: 'confirmed',
    notes: 'Morning routine assistance'
  },
  {
    id: 2,
    carerName: 'Michael Brown',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Medication Support',
    date: moment().format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '14:30',
    duration: 0.5,
    status: 'confirmed',
    notes: 'Afternoon medication reminder'
  },
  {
    id: 3,
    carerName: 'Emma Wilson',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Companionship',
    date: moment().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '12:00',
    duration: 2,
    status: 'scheduled',
    notes: 'Social visit and light activities'
  },
  {
    id: 4,
    carerName: 'David Lee',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Household Tasks',
    date: moment().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '15:00',
    endTime: '17:00',
    duration: 2,
    status: 'scheduled',
    notes: 'Cleaning and meal preparation'
  },
  {
    id: 5,
    carerName: 'Lisa Garcia',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Personal Care',
    date: moment().add(2, 'days').format('YYYY-MM-DD'),
    startTime: '08:30',
    endTime: '10:30',
    duration: 2,
    status: 'scheduled',
    notes: 'Morning care routine'
  },
  {
    id: 6,
    carerName: 'James Taylor',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Transportation',
    date: moment().add(3, 'days').format('YYYY-MM-DD'),
    startTime: '13:00',
    endTime: '15:00',
    duration: 2,
    status: 'scheduled',
    notes: 'Medical appointment transport'
  },
  {
    id: 7,
    carerName: 'Olivia Martinez',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Personal Care',
    date: moment().subtract(1, 'week').format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '11:00',
    duration: 2,
    status: 'completed',
    notes: 'Morning routine assistance'
  },
  {
    id: 8,
    carerName: 'Robert Wilson',
    carerImage: '/placeholder.svg?height=40&width=40',
    serviceType: 'Companionship',
    date: moment().add(1, 'month').format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '16:00',
    duration: 2,
    status: 'scheduled',
    notes: 'Social visit'
  }
];

export default function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  >('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<string>(
    moment().year().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Months array for month selection
  const months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const currentDate = moment();
  const todayFormatted = currentDate.format('dddd, MMMM Do YYYY');

  // Generate years from 30 years ago to 50 years in the future
  const years = Array.from({ length: 81 }, (_, i) =>
    (currentDate.year() - 30 + i).toString()
  );

  // Filter services based on selected filters
  const filteredServices = useMemo(() => {
    return mockServices.filter((service) => {
      const serviceDate = moment(service.date);
      const serviceYear = serviceDate.year().toString();

      // First filter by year if selected
      if (selectedYear !== 'all' && serviceYear !== selectedYear) return false;

      // Then filter by view mode
      switch (viewMode) {
        case 'daily':
          return serviceDate.isSame(selectedDate, 'day');
        case 'weekly':
          return serviceDate.isSame(selectedDate, 'week');
        case 'monthly':
          return serviceDate.isSame(selectedDate, 'month');
        case 'yearly':
          return serviceDate.isSame(selectedDate, 'year');
        default:
          return true;
      }
    });
  }, [viewMode, selectedDate, selectedYear]);

  // Calculate statistics
  const todaysServices = mockServices.filter((service) =>
    moment(service.date).isSame(currentDate, 'day')
  );
  const upcomingServices = mockServices.filter((service) =>
    moment(service.date).isAfter(currentDate, 'day')
  );
  const completedServices = mockServices.filter((service) =>
    moment(service.date).isBefore(currentDate, 'day')
  );

  const totalHoursToday = todaysServices.reduce(
    (sum, service) => sum + service.duration,
    0
  );
  const totalHoursUpcoming = upcomingServices.reduce(
    (sum, service) => sum + service.duration,
    0
  );
  const totalHoursCompleted = completedServices.reduce(
    (sum, service) => sum + service.duration,
    0
  );
  const totalHoursFiltered = filteredServices.reduce(
    (sum, service) => sum + service.duration,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'Personal Care':
        return '👤';
      case 'Medication Support':
        return '💊';
      case 'Companionship':
        return '🤝';
      case 'Household Tasks':
        return '🏠';
      case 'Transportation':
        return '🚗';
      default:
        return '📋';
    }
  };

  const formatDateRange = () => {
    switch (viewMode) {
      case 'daily':
        return moment(selectedDate).format('MMMM D, YYYY');
      case 'weekly':
        return `${moment(selectedDate).startOf('week').format('MMM D')} - ${moment(selectedDate).endOf('week').format('MMM D, YYYY')}`;
      case 'monthly':
        return moment(selectedDate).format('MMMM YYYY');
      case 'yearly':
        return moment(selectedDate).format('YYYY');
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Welcome back, Hasan
              </h1>
              <p className="mt-1 flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {todayFormatted}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-50 text-blue-700">
                {filteredServices.length} services
              </Badge>
              <Badge variant="default" className="bg-green-50 text-green-700">
                {totalHoursFiltered} hours
              </Badge>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {todaysServices.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {totalHoursToday} hours total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {upcomingServices.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {totalHoursUpcoming} hours total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {completedServices.length}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {totalHoursCompleted} hours total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Carers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(mockServices.map((s) => s.carerName)).size}
              </div>
              <p className="mt-1 text-xs text-gray-500">Assigned to you</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  View Mode
                </label>
                <Select
                  value={viewMode}
                  onValueChange={(
                    value: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
                  ) => {
                    setViewMode(value);
                    if (value !== 'custom') {
                      setSelectedDate(new Date());
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select view mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {viewMode === 'custom' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Year
                    </label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Month
                    </label>
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                      disabled={selectedYear === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedYear === 'all'
                              ? 'Select year first'
                              : 'Select month'
                          }
                        >
                          {selectedMonth === 'all'
                            ? 'All Months'
                            : months.find((m) => m.value === selectedMonth)
                                ?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {viewMode === 'yearly'
                      ? 'Select Year'
                      : `Select ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}`}
                  </label>

                  {viewMode === 'yearly' ? (
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date) => setSelectedDate(date)}
                        selectsStart
                        startDate={selectedDate}
                        dateFormat={
                          viewMode === 'daily'
                            ? 'MMMM d, yyyy'
                            : viewMode === 'weekly'
                              ? 'MMMM d, yyyy'
                              : 'MMMM yyyy'
                        }
                        showWeekPicker={viewMode === 'weekly'}
                        showMonthYearPicker={viewMode === 'monthly'}
                        className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode('daily');
                    setSelectedDate(new Date());
                    setSelectedYear(moment().year().toString());
                    setSelectedMonth('all');
                  }}
                  className="w-full"
                >
                  Reset to Today
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  Showing services for:{' '}
                  <span className="text-blue-600">
                    {viewMode === 'custom' ? (
                      <>
                        {selectedYear === 'all' ? 'All years' : selectedYear}
                        {selectedMonth !== 'all' &&
                          selectedYear !== 'all' &&
                          `, ${months.find((m) => m.value === selectedMonth)?.name}`}
                        {selectedYear === 'all' && selectedMonth !== 'all'
                          ? ' (Select year first)'
                          : ''}
                      </>
                    ) : (
                      formatDateRange()
                    )}
                  </span>
                </h3>
              </div>
              <Badge variant="default" className="bg-gray-50">
                {filteredServices.length} services found
              </Badge>
            </div>
          </CardContent>
        </Card>
        {/* Services List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Your Care Services</CardTitle>
                <p className="text-sm text-gray-600">
                  {filteredServices.length} service
                  {filteredServices.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-50 text-blue-700">
                  {totalHoursFiltered} total hours
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-700">
                    No services found
                  </h3>
                  <p className="mt-1">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div key={service.id}>
                    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md md:flex-row md:items-center">
                      <div className="flex min-w-[200px] items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={service.carerImage || '/placeholder.svg'}
                            alt={service.carerName}
                          />
                          <AvatarFallback>
                            {service.carerName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {service.carerName}
                          </h3>
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <span>
                              {getServiceTypeIcon(service.serviceType)}
                            </span>
                            {service.serviceType}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Date & Time
                          </p>
                          <p className="text-sm text-gray-600">
                            {moment(service.date).format('MMM DD, YYYY')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {service.startTime} - {service.endTime}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Duration
                          </p>
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {service.duration} hour
                            {service.duration !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Status
                          </p>
                          <Badge
                            className={`${getStatusColor(service.status)} capitalize`}
                          >
                            {service.status}
                          </Badge>
                        </div>
                      </div>

                      {service.notes && (
                        <div className="md:w-64">
                          <p className="text-sm font-medium text-gray-700">
                            Notes
                          </p>
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {service.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Services Card */}
<Card>
  <CardHeader>
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle>Upcoming Services</CardTitle>
        <p className="text-sm text-gray-600">
          {
            mockServices.filter((s) =>
              moment(s.date).isSameOrAfter(moment(), 'day')
            ).length
          }{' '}
          upcoming service
          {
            mockServices.filter((s) =>
              moment(s.date).isSameOrAfter(moment(), 'day')
            ).length !== 1
              ? 's'
              : ''
          }
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-50 text-green-700">
           {
            mockServices
              .filter((s) => moment(s.date).isAfter(moment(), 'day'))
              .reduce((sum, s) => sum + s.duration, 0)
          }{' '}
          upcoming hours
        </Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
     {mockServices.filter((s) =>
        moment(s.date).isAfter(moment(), 'day')
      ).length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <h3 className="text-lg font-medium text-gray-700">
            No upcoming services found
          </h3>
        </div>
      ) : (
           mockServices
          .filter((service) => moment(service.date).isAfter(moment(), 'day'))
          .map((service) => (
            <div key={service.id}>
              <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md md:flex-row md:items-center">
                <div className="flex min-w-[200px] items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={service.carerImage || '/placeholder.svg'}
                      alt={service.carerName}
                    />
                    <AvatarFallback>
                      {service.carerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {service.carerName}
                    </h3>
                    <p className="flex items-center gap-1 text-sm text-gray-600">
                      <span>{getServiceTypeIcon(service.serviceType)}</span>
                      {service.serviceType}
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Date & Time
                    </p>
                    <p className="text-sm text-gray-600">
                      {moment(service.date).format('MMM DD, YYYY')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {service.startTime} - {service.endTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Duration
                    </p>
                    <p className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {service.duration} hour
                      {service.duration !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <Badge
                      className={`${getStatusColor(service.status)} capitalize`}
                    >
                      {service.status}
                    </Badge>
                  </div>
                </div>

                {service.notes && (
                  <div className="md:w-64">
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {service.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  </CardContent>
</Card>

      </div>
    </div>
  );
}
