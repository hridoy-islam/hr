import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react';

interface PayrollSummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  trend?: number;
  period: string;
  className?: string;
}

export const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({
  title,
  amount,
  icon,
  trend,
  period,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="h-4 w-4 text-gray-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          £{amount.toLocaleString()}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{period}</p>
         
        </div>
      </CardContent>
    </Card>
  );
};