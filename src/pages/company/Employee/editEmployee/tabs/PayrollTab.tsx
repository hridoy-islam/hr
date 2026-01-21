import React from 'react';
import { EditableField } from '../EditableField';
import { Loader2, CreditCard, Landmark } from 'lucide-react';

// --- Layout Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
    <Icon className="h-4 w-4 text-theme" />
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
      {title}
    </h3>
  </div>
);

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  isSaving?: boolean;
}

const FormRow = ({ label, children, className = '', required, isSaving }: FormRowProps) => (
  <div className={`group flex flex-col border-b border-gray-100 last:border-0 sm:flex-row ${className}`}>
    {/* Label Column */}
    <div className="flex items-center justify-between bg-gray-50/30 px-4 py-3 sm:w-1/3 lg:w-2/5 xl:w-1/3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900">
          {label}
        </span>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme" />}
    </div>
    {/* Input Column */}
    <div className="flex items-center bg-white px-4 py-2 sm:w-2/3 lg:w-3/5 xl:w-2/3">
      <div className="w-full">
        {children}
      </div>
    </div>
  </div>
);

// --- Main Component ---

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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Left Column: Payroll Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <SectionHeader icon={CreditCard} title="Payroll Configuration" />
          <div className="flex flex-col">
            <FormRow 
              label="Payroll Number" 
              isSaving={isFieldSaving['payroll.payrollNumber']}
            >
              <EditableField
                id="payroll.payrollNumber"
                label=""
                value={payroll.payrollNumber || ''}
                onUpdate={(value) => onNestedUpdate('payroll', 'payrollNumber', value)}
                isSaving={isFieldSaving['payroll.payrollNumber']}
              />
            </FormRow>

            <FormRow 
              label="Payment Method" 
              isSaving={isFieldSaving['payroll.paymentMethod']}
            >
              <EditableField
                id="payroll.paymentMethod"
                label=""
                value={paymentMethod}
                type="select"
                options={paymentMethodOptions}
                onUpdate={(value) => onNestedUpdate('payroll', 'paymentMethod', value)}
                isSaving={isFieldSaving['payroll.paymentMethod']}
              />
            </FormRow>
          </div>
        </div>

        {/* Right Column: Bank Details (Conditional) */}
        {paymentMethod === 'Bank Transfer' && (
          <div className=" rounded-lg border border-gray-200 bg-white shadow-sm h-fit animate-in slide-in-from-left-4 fade-in duration-300">
            <SectionHeader icon={Landmark} title="Bank Details" />
            <div className="flex flex-col">
              <FormRow 
                label="Bank Name" 
                isSaving={isFieldSaving['payroll.bankName']}
              >
                <EditableField
                  id="payroll.bankName"
                  label=""
                  value={payroll.bankName || ''}
                  onUpdate={(value) => onNestedUpdate('payroll', 'bankName', value)}
                  isSaving={isFieldSaving['payroll.bankName']}
                />
              </FormRow>

              <FormRow 
                label="Account Number" 
                isSaving={isFieldSaving['payroll.accountNumber']}
              >
                <EditableField
                  id="payroll.accountNumber"
                  label=""
                  value={payroll.accountNumber || ''}
                  onUpdate={(value) => onNestedUpdate('payroll', 'accountNumber', value)}
                  isSaving={isFieldSaving['payroll.accountNumber']}
                />
              </FormRow>

              <FormRow 
                label="Sort Code" 
                isSaving={isFieldSaving['payroll.sortCode']}
              >
                <EditableField
                  id="payroll.sortCode"
                  label=""
                  value={payroll.sortCode || ''}
                  onUpdate={(value) => onNestedUpdate('payroll', 'sortCode', value)}
                  isSaving={isFieldSaving['payroll.sortCode']}
                />
              </FormRow>

              <FormRow 
                label="Beneficiary Name" 
                isSaving={isFieldSaving['payroll.beneficiary']}
              >
                <EditableField
                  id="payroll.beneficiary"
                  label=""
                  value={payroll.beneficiary || ''}
                  onUpdate={(value) => onNestedUpdate('payroll', 'beneficiary', value)}
                  isSaving={isFieldSaving['payroll.beneficiary']}
                />
              </FormRow>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PayrollTab;