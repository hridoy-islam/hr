import { BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const TrainingDue = () => {
  const trainings = [
    {
      title: 'Customer Service Excellence',
      dueDate: '2 days',
      priority: 'high',
      progress: 75,
      status: 'in-progress'
    },
    {
      title: 'Safety Protocol Update',
      dueDate: '1 week',
      priority: 'medium',
      progress: 0,
      status: 'not-started'
    },
    {
      title: 'Product Knowledge: Electronics',
      dueDate: '2 weeks',
      priority: 'low',
      progress: 30,
      status: 'in-progress'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Training Due
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trainings.map((training, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-3">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-row justify-between">
                    <div className="flex flex-row gap-4 items-center">
                      <h4 className="font-medium text-gray-900">
                        {training.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {training.priority === 'high' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge className={getPriorityColor(training.priority)}>
                          {training.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline">
                        {training.status === 'not-started'
                          ? 'Start Training'
                          : 'Continue'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Due in {training.dueDate}
                  </div>
                </div>
              </div>

              {/* <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{training.progress}%</span>
                </div>
                <Progress value={training.progress} className="h-2" />
              </div> */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
