import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface PayrollTabProps {
  formData: {
    payroll?: {
      payrollNumber?: string;
      paymentMethod?: string;
      bankName?: string;
      accountNumber?: string;
      sortCode?: string;
      beneficiary?: string;
    };
  };
  onNestedUpdate: (parentField: string, fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const PayrollTab: React.FC<PayrollTabProps> = ({
  formData,
  onNestedUpdate,
  isFieldSaving
}) => {
  const payroll = formData?.payroll || {};

  const paymentMethodOptions = [
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Cash', label: 'Cash' }
  ];

  const paymentMethod = payroll.paymentMethod || '';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Payroll Number */}
          <EditableField
            id="payroll.payrollNumber"
            label="Payroll Number"
            value={payroll.payrollNumber || ''}
            onUpdate={(value) => onNestedUpdate('payroll', 'payrollNumber', value)}
            isSaving={isFieldSaving['payroll.payrollNumber']}
          />

          {/* Payment Method */}
          <EditableField
            id="payroll.paymentMethod"
            label="Payment Method"
            value={paymentMethod}
            type="select"
            options={paymentMethodOptions}
            onUpdate={(value) => onNestedUpdate('payroll', 'paymentMethod', value)}
            isSaving={isFieldSaving['payroll.paymentMethod']}
          />

          {/* Conditional Bank Fields */}
          {paymentMethod === 'Bank Transfer' && (
            <>
              {/* Bank Name */}
              <EditableField
                id="payroll.bankName"
                label="Bank Name"
                value={payroll.bankName || ''}
                onUpdate={(value) => onNestedUpdate('payroll', 'bankName', value)}
                isSaving={isFieldSaving['payroll.bankName']}
              />

              {/* Account Number */}
              <EditableField
                id="payroll.accountNumber"
                label="Account Number"
                value={payroll.accountNumber || ''}
                onUpdate={(value) => onNestedUpdate('payroll', 'accountNumber', value)}
                isSaving={isFieldSaving['payroll.accountNumber']}
              />

              {/* Sort Code */}
              <EditableField
                id="payroll.sortCode"
                label="Sort Code"
                value={payroll.sortCode || ''}
                onUpdate={(value) => onNestedUpdate('payroll', 'sortCode', value)}
                isSaving={isFieldSaving['payroll.sortCode']}
              />

              {/* Beneficiary */}
              <EditableField
                id="payroll.beneficiary"
                label="Beneficiary Name"
                value={payroll.beneficiary || ''}
                onUpdate={(value) => onNestedUpdate('payroll', 'beneficiary', value)}
                isSaving={isFieldSaving['payroll.beneficiary']}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollTab;
