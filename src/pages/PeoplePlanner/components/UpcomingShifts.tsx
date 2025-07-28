import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const UpcomingShifts = () => {
  const shifts = [
    {
      date: 'Today',
      time: '9:00 AM - 5:00 PM',
      location: 'Main Store',
      status: 'current',
      department: 'Sales Floor'
    },
    {
      date: 'Tomorrow',
      time: '2:00 PM - 10:00 PM',
      location: 'Main Store',
      status: 'upcoming',
      department: 'Customer Service'
    },
    {
      date: 'Wednesday',
      time: '9:00 AM - 5:00 PM',
      location: 'Warehouse',
      status: 'upcoming',
      department: 'Inventory'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Shifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shifts.map((shift, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{shift.date}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {shift.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {shift.location}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusColor(shift.status)}>
                  {shift.status === 'current' ? 'In Progress' : 'Scheduled'}
                </Badge>
                <span className="text-sm text-gray-600">{shift.department}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};