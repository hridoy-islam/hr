import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface PayrollTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  onNestedUpdate: (parentField: string, fieldName: string, value: any) => void;
  onSelectChange: (fieldName: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const PayrollTab: React.FC<PayrollTabProps> = ({
  formData,
  onUpdate,
  onNestedUpdate,
  onSelectChange,
  isFieldSaving
}) => {
  const paymentMethodOptions = [
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Cash', label: 'Cash' }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EditableField
            id="payroll.payrollNumber"
            label="Payroll Number"
            value={formData.payroll.payrollNumber}
            onUpdate={(value) => onNestedUpdate('payroll', 'payrollNumber', value)}
            isSaving={isFieldSaving['payroll.payrollNumber']}
          />

          <EditableField
            id="payroll.paymentMethod"
            label="Payment Method"
            value={formData.payroll.paymentMethod}
            type="select"
            options={paymentMethodOptions}
            onUpdate={(value) => onNestedUpdate('payroll', 'paymentMethod', value)}
            isSaving={isFieldSaving['payroll.paymentMethod']}
          />

          <EditableField
            id="accountNo"
            label="Account Number"
            value={formData.accountNo}
            onUpdate={(value) => onUpdate('accountNo', value)}
            isSaving={isFieldSaving['accountNo']}
          />

          <EditableField
            id="sortCode"
            label="Sort Code"
            value={formData.sortCode}
            onUpdate={(value) => onUpdate('sortCode', value)}
            isSaving={isFieldSaving['sortCode']}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollTab;