import { MessageSquare, Pin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Announcements = () => {
  const announcements = [
    {
      id: 1,
      title: 'Holiday Schedule Update',
      content: 'Please note the updated holiday schedule for December. All staff please check your assigned shifts.',
      date: '2 hours ago',
      priority: 'high',
      pinned: true
    },
    {
      id: 2,
      title: 'New Safety Protocols',
      content: 'Updated safety protocols are now in effect. Please complete the mandatory training by next week.',
      date: '1 day ago',
      priority: 'medium',
      pinned: false
    },
    {
      id: 3,
      title: 'Team Building Event',
      content: 'Join us for our annual team building event on January 15th. RSVP by December 30th.',
      date: '2 days ago',
      priority: 'low',
      pinned: false
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                  {announcement.pinned && (
                    <Pin className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <Badge className={getPriorityColor(announcement.priority)}>
                  {announcement.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{announcement.content}</p>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {announcement.date}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};