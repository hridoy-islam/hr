import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';
import { PayrollRecord } from '@/types/payroll';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PayrollHistoryProps {
  records: PayrollRecord[];
  onViewPayslip: (record: PayrollRecord) => void;
  onDownloadPayslip: (record: PayrollRecord) => void;
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({
  records,
  onViewPayslip,
  onDownloadPayslip,
}) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'default';
      case 'processing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Payroll History
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No payroll records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Payroll History
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Pay Period</TableHead>
              <TableHead className="w-[20%]">Net Pay</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium">
                  { `${format(record.startDate, 'MMM dd, yyyy')} - ${format(record.endDate, 'MMM dd, yyyy')}`
                    }
                </TableCell>
                <TableCell>£{record.netPay.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onViewPayslip(record)}
                    className="bg-supperagent text-white hover:bg-supperagent"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {record.status === 'paid' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onDownloadPayslip(record)}
                      className="bg-supperagent text-white hover:bg-supperagent"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PayrollHistory;
