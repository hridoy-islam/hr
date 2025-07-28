import { Clock, FileText, Calendar, MessageSquare, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const QuickActions = () => {
  const actions = [
    { icon: Clock, label: 'Time Clock', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: FileText, label: 'Request Leave', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: Calendar, label: 'View Schedule', color: 'bg-green-500 hover:bg-green-600' },
    { icon: MessageSquare, label: 'Messages', color: 'bg-orange-500 hover:bg-orange-600' },
    { icon: Users, label: 'Team', color: 'bg-teal-500 hover:bg-teal-600' },
    { icon: Settings, label: 'Settings', color: 'bg-gray-500 hover:bg-gray-600' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className={`h-20 flex-col gap-2 hover:text-white transition-colors ${action.color}`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};