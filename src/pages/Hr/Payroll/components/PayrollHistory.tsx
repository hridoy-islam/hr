import React from 'react';
import moment from 'moment';
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
  TableRow
} from '@/components/ui/table';

interface PayrollHistoryProps {
  records: PayrollRecord[];
  onViewPayslip: (record: PayrollRecord) => void;
  onDownloadPayslip: (record: PayrollRecord) => void;
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({
  records,
  onViewPayslip,
  onDownloadPayslip
}) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'pending':
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
              <Eye className="mr-2 h-5 w-5" />
              Payroll History
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-gray-500">
            No payroll records found.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDateSafe = (date: Date | string | null | undefined) =>
    date
      ? moment(date).isValid()
        ? moment(date).format('MMM DD, YYYY')
        : 'Invalid Date'
      : 'N/A';

  return (
    <Card className='border-none shadow-none'>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Payroll History
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Pay Period</TableHead>
              <TableHead className="w-[20%]">Net Pay</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record?._id}
                className="transition-colors hover:bg-gray-50"
              >
                <TableCell className="font-medium">
                  {`${formatDateSafe(record.fromDate)} - ${formatDateSafe(record?.toDate)}`}
                </TableCell>
                <TableCell className="font-semibold">
                  £
                  {typeof record.netAmount === 'number'
                    ? record.netAmount.toLocaleString()
                    : '0'}
                </TableCell>{' '}
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(record.status)}>
                    {record.status
                      ? record.status.charAt(0).toUpperCase() +
                        record.status.slice(1)
                      : 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  {/* <Button
                    size="sm"
                    variant="default"
                    onClick={() => onViewPayslip(record)}
                    className="bg-supperagent text-white hover:bg-supperagent"
                  >
                    <Eye className="h-4 w-4" />
                  </Button> */}
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
