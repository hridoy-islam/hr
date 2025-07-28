import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BulkInvoiceModal from './BlukInvoiceModal';
import PaymentModal from './PaymentModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';



interface Invoice {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status:
    | 'draft'
    | 'ready'
    | 'finalized'
    | 'paid'
    | 'partially_paid'
    | 'unpaid';
  createdDate: string;
  dueDate: string;
  serviceCount: number;
  period: string;
}

interface InvoicesPageProps {
  onCreateInvoice: () => void;
}

const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    userId: 'user1',
    userName: 'John Smith',
    amount: 1250.0,
    status: 'finalized',
    createdDate: '2025-01-15',
    dueDate: '2025-02-14',
    serviceCount: 8,
    period: 'Jan 1 - Jan 14, 2025'
  },
  {
    id: 'INV-002',
    userId: 'user2',
    userName: 'Sarah Johnson',
    amount: 875.5,
    status: 'paid',
    createdDate: '2025-01-14',
    dueDate: '2025-02-13',
    serviceCount: 6,
    period: 'Jan 1 - Jan 14, 2025'
  },
  {
    id: 'INV-003',
    userId: 'user3',
    userName: 'Michael Brown',
    amount: 2100.0,
    status: 'draft',
    createdDate: '2025-01-15',
    dueDate: '2025-02-14',
    serviceCount: 12,
    period: 'Jan 1 - Jan 14, 2025'
  }
];

export default function Invoice({ onCreateInvoice }: InvoicesPageProps) {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'finalized':
        return 'bg-purple-100 text-purple-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );
  const paidAmount = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice 
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowBulkModal(true)}
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            <Users className="mr-2 h-4 w-4" />
            Generate Invoice (Bulk)
          </Button>
          <Button onClick={onCreateInvoice} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Active Invoices in system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                Manage and track all generated Invoices
              </CardDescription>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:w-80"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
         <Table>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>User</TableHead>
      <TableHead>Services</TableHead>
      <TableHead>Period</TableHead>
      <TableHead>Created</TableHead>
      <TableHead>Due</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredInvoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell className="font-semibold">{invoice.id}</TableCell>
        <TableCell>
          <Badge className={getStatusColor(invoice.status)}>
            {getStatusText(invoice.status)}
          </Badge>
        </TableCell>
        <TableCell>{invoice.userName}</TableCell>
        <TableCell>{invoice.serviceCount}</TableCell>
        <TableCell>{invoice.period}</TableCell>
        <TableCell>
          {new Date(invoice.createdDate).toLocaleDateString()}
        </TableCell>
        <TableCell>
          {new Date(invoice.dueDate).toLocaleDateString()}
        </TableCell>
        <TableCell className="font-bold text-gray-900">
          ${invoice.amount.toLocaleString()}
        </TableCell>
        <TableCell className="flex justify-end gap-2">
          <Button
            size="sm"
            className="bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => {
              setSelectedUser({
                id: invoice.userId,
                name: invoice.userName
              });
              setShowPaymentModal(true);
            }}
          >
            Pay
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='bg-white border-gray-300 text-black '>
              <DropdownMenuItem>Download PDF</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 hover:text-red-600">
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

        </CardContent>
      </Card>

      {/* Modals */}
      <BulkInvoiceModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoiceAmount={totalAmount}
        userInfo={selectedUser}
      />
    </div>
  );
}