import { FileText, Eye, Download, Calendar, Star, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ReportsSection = () => {
  const reports = [
    {
      category: 'Supervision Reports',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      reports: [
        {
          title: 'Weekly Performance Review',
          date: 'Dec 15, 2023',
          supervisor: 'Sarah Johnson',
          status: 'completed',
          score: '4.2/5'
        },
        {
          title: 'Monthly Check-in',
          date: 'Dec 1, 2023',
          supervisor: 'Mike Chen',
          status: 'completed',
          score: '4.5/5'
        }
      ]
    },
    {
      category: 'Spot Checks',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      reports: [
        {
          title: 'Customer Service Observation',
          date: 'Dec 20, 2023',
          supervisor: 'Lisa Wong',
          status: 'pending',
          score: 'Pending'
        },
        {
          title: 'Sales Floor Check',
          date: 'Dec 18, 2023',
          supervisor: 'Sarah Johnson',
          status: 'completed',
          score: '4.0/5'
        }
      ]
    },
    {
      category: 'Appraisals',
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      reports: [
        {
          title: 'Annual Performance Appraisal',
          date: 'Nov 30, 2023',
          supervisor: 'David Smith',
          status: 'completed',
          score: '4.3/5'
        },
        {
          title: 'Mid-Year Review',
          date: 'Jun 15, 2023',
          supervisor: 'David Smith',
          status: 'completed',
          score: '4.1/5'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Performance Reports</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-supperagent hover:bg-supperagent/90 text-white border-none">
          <Download className="h-4 w-4" />
          Export All Reports
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reports.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${category.bgColor}`}>
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                </div>
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.reports.map((report, reportIndex) => (
                  <div key={reportIndex} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{report.title}</h4>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </div>
                      <p>Supervisor: {report.supervisor}</p>
                      <p className="font-medium">Score: {report.score}</p>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className=' flex-1 bg-supperagent hover:bg-supperagent/90 text-white border-none'>
                        <Eye className="h-3 w-3 mr-1 " />
                        View
                      </Button>
                      <Button size="sm" variant="outline" >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};