import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Calendar, DollarSign, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceAmount: number;
  userInfo?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  date: string;
  reference: string;
  notes: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  invoiceAmount,
  userInfo 
}) => {
  const [paymentAmount, setPaymentAmount] = useState<string>(invoiceAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [existingPayments] = useState<PaymentRecord[]>([]);
  const { toast } = useToast();

  const paymentMethodOptions = [
    { value: 'bank', label: 'Bank Transfer', icon: Banknote },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'digital', label: 'Digital Wallet', icon: Smartphone }
  ];

  const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = invoiceAmount - totalPaid;
  const currentPaymentAmount = parseFloat(paymentAmount) || 0;
  const isFullPayment = currentPaymentAmount >= remainingAmount;
  const isPartialPayment = currentPaymentAmount > 0 && currentPaymentAmount < remainingAmount;

  const handleSubmit = () => {
    if (!paymentAmount || !paymentMethod || !paymentDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const paymentStatus = isFullPayment ? 'Fully Paid' : isPartialPayment ? 'Partially Paid' : 'Unpaid';
    
    toast({
      title: "Payment Recorded",
      description: `Payment of $${currentPaymentAmount.toLocaleString()} recorded successfully. Status: ${paymentStatus}`,
    });

    onClose();
    // Reset form
    setPaymentAmount(invoiceAmount.toString());
    setPaymentMethod('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
  };

  const getPaymentStatusColor = () => {
    if (isFullPayment) return 'bg-green-100 text-green-800';
    if (isPartialPayment) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPaymentStatusText = () => {
    if (isFullPayment) return 'Full Payment';
    if (isPartialPayment) return 'Partial Payment';
    return 'No Payment';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
             Payment
          </DialogTitle>
          <DialogDescription>
            Record payment information for the payslip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
          {/* payslip Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
              {userInfo && (
                <CardDescription>
                  Payment for {userInfo.name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2  gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-800 font-bold">payslip Total</div>
                  <div className="text-lg font-bold text-blue-600">
                    ${invoiceAmount.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-800 mt-1 font-bold">Status</div>
                  <Badge className={getPaymentStatusColor()}>
                    {getPaymentStatusText()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="text-xs text-gray-500">
                    Max: ${remainingAmount.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Payment Date *</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

             

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment notes"
                  rows={3}
                />
              </div>

              {/* Payment Preview */}
              {currentPaymentAmount > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <h4 className="font-medium">Payment Preview</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Payment Amount:</span>
                      <span className="font-medium">${currentPaymentAmount.toLocaleString()}</span>
                    </div>
                    
                    
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Payments (if any) */}
          {existingPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <div className="font-medium">${payment.amount.toLocaleString()}</div>
                        <div className="text-gray-600">{payment.method} • {payment.date}</div>
                      </div>
                      <Badge variant="default" className='bg-supperagent text-white hover:bg-supperagent/90'>Recorded</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className='bg-supperagent text-white hover:bg-supperagent/90'>
            Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;