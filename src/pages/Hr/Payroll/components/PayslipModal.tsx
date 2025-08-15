import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, User, Building, Calendar } from 'lucide-react';
import { PayrollRecord } from '@/types/payroll';

interface PayslipModalProps {
  record: PayrollRecord;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (record: PayrollRecord) => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  record,
  isOpen,
  onClose,
  onDownload
}) => {
  if (!isOpen) return null;

  const grossPay = record.basicSalary + 
    Object.values(record.allowances).reduce((sum, allowance) => sum + allowance, 0) +
    (record.overtime || 0) + (record.bonus || 0);

  const totalDeductions = Object.values(record.deductions).reduce((sum, deduction) => sum + deduction, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Payslip - {record.payPeriod}</h2>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => onDownload(record)}
              className="bg-supperagent hover:bg-supperagent/90 text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Employee Details</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-600">ID:</span> {record.employeeId}</div>
                  <div><span className="text-gray-600">Name:</span> {record.employeeName}</div>
                  <div><span className="text-gray-600">Department:</span> {record.department}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Pay Period</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-600">Period:</span> {record.payPeriod}</div>
                  <div><span className="text-gray-600">Pay Date:</span> {format(record.payDate, 'MMM dd, yyyy')}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Building className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-800">Net Pay</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  £{record.netPay.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Earnings</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-medium">£{record.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA</span>
                    <span className="font-medium">£{record.allowances.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Allowance</span>
                    <span className="font-medium">£{record.allowances.transport.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical Allowance</span>
                    <span className="font-medium">£{record.allowances.medical.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Allowances</span>
                    <span className="font-medium">£{record.allowances.other.toLocaleString()}</span>
                  </div>
                  {record.overtime && (
                    <div className="flex justify-between">
                      <span>Overtime</span>
                      <span className="font-medium">£{record.overtime.toLocaleString()}</span>
                    </div>
                  )}
                  {record.bonus && (
                    <div className="flex justify-between">
                      <span>Bonus</span>
                      <span className="font-medium">£{record.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-green-700">
                    <span>Gross Pay</span>
                    <span>£{grossPay.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800">Deductions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Income Tax</span>
                    <span className="font-medium">£{record.deductions.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance</span>
                    <span className="font-medium">£{record.deductions.insurance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pension Contribution</span>
                    <span className="font-medium">£{record.deductions.pension.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions</span>
                    <span className="font-medium">£{record.deductions.other.toLocaleString()}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-red-700">
                    <span>Total Deductions</span>
                    <span>£{totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Pay Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Gross Pay</p>
                  <p className="text-xl font-bold text-green-600">£{grossPay.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="text-xl font-bold text-red-600">£{totalDeductions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Pay</p>
                  <p className="text-2xl font-bold text-blue-600">£{record.netPay.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};