import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const HoursOverview = () => {
  const stats = [
    {
      title: 'Total Hours This Week',
      value: '32.5',
      subtext: 'of 40 scheduled',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+2.5 from last week'
    },
    // {
    //   title: 'Average Daily Hours',
    //   value: '8.1',
    //   subtext: 'this week',
    //   icon: TrendingUp,
    //   color: 'text-green-600',
    //   bgColor: 'bg-green-50',
    //   trend: 'On target'
    // },
    // {
    //   title: 'Days Worked',
    //   value: '4',
    //   subtext: 'out of 5 days',
    //   icon: Calendar,
    //   color: 'text-purple-600',
    //   bgColor: 'bg-purple-50',
    //   trend: '1 day remaining'
    // },
    // {
    //   title: 'Monthly Progress',
    //   value: '87%',
    //   subtext: 'of monthly target',
    //   icon: Target,
    //   color: 'text-orange-600',
    //   bgColor: 'bg-orange-50',
    //   trend: '130/150 hours'
    // }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mb-1">{stat.subtext}</p>
            <p className="text-xs text-gray-400">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};