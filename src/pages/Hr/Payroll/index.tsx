import React, { useState } from 'react';
import { Calendar, Download, FileText, User, DollarSign, Calculator, CreditCard, Building, Clock, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { pdf } from '@react-pdf/renderer';
import 'react-datepicker/dist/react-datepicker.css';
import { PayrollPDF } from './components/PayrollPDF';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface PayrollData {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  employmentType: string;
  joiningDate: Date;
  workLocation: string;
  payPeriod: string;
  startDate: Date;
  endDate: Date;
  paymentDate: Date;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  bonus: number;
  taxDeduction: number;
  providentFund: number;
  professionalTax: number;
  healthInsurance: number;
  loanEmi: number;
  otherDeductions: number;
  reimbursements: number;
  specialBenefits: number;
  paymentMode: string;
  bankAccount: string;
  paymentStatus: string;
  notes: string;
  preparedBy: string;
}

// Demo payroll data
const demoPayrollData: PayrollData[] = [
  {
    employeeId: 'EMP001',
    fullName: 'John Doe',
    department: 'Information Technology',
    designation: 'Senior Developer',
    employmentType: 'Full-time',
    joiningDate: new Date('2022-01-15'),
    workLocation: 'Main Office',
    payPeriod: 'December 2024',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    paymentDate: new Date('2024-12-30'),
    basicSalary: 50000,
    hra: 15000,
    conveyanceAllowance: 3000,
    medicalAllowance: 2000,
    otherAllowances: 1000,
    overtimePay: 2500,
    bonus: 5000,
    taxDeduction: 8000,
    providentFund: 6000,
    professionalTax: 200,
    healthInsurance: 1500,
    loanEmi: 3000,
    otherDeductions: 500,
    reimbursements: 1200,
    specialBenefits: 800,
    paymentMode: 'Bank Transfer',
    bankAccount: '****1234',
    paymentStatus: 'Paid',
    notes: 'Regular monthly salary',
    preparedBy: 'HR Admin'
  },
  {
    employeeId: 'EMP002',
    fullName: 'Jane Smith',
    department: 'Human Resources',
    designation: 'HR Manager',
    employmentType: 'Full-time',
    joiningDate: new Date('2021-03-10'),
    workLocation: 'Main Office',
    payPeriod: 'December 2024',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    paymentDate: new Date('2024-12-30'),
    basicSalary: 45000,
    hra: 13500,
    conveyanceAllowance: 3000,
    medicalAllowance: 2000,
    otherAllowances: 1500,
    overtimePay: 0,
    bonus: 4000,
    taxDeduction: 7200,
    providentFund: 5400,
    professionalTax: 200,
    healthInsurance: 1500,
    loanEmi: 0,
    otherDeductions: 0,
    reimbursements: 800,
    specialBenefits: 600,
    paymentMode: 'Bank Transfer',
    bankAccount: '****5678',
    paymentStatus: 'Paid',
    notes: 'Performance bonus included',
    preparedBy: 'HR Admin'
  },
  {
    employeeId: 'EMP003',
    fullName: 'Mike Johnson',
    department: 'Finance',
    designation: 'Financial Analyst',
    employmentType: 'Full-time',
    joiningDate: new Date('2023-06-01'),
    workLocation: 'Branch Office',
    payPeriod: 'December 2024',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    paymentDate: new Date('2024-12-30'),
    basicSalary: 40000,
    hra: 12000,
    conveyanceAllowance: 2500,
    medicalAllowance: 1500,
    otherAllowances: 800,
    overtimePay: 1500,
    bonus: 3000,
    taxDeduction: 6000,
    providentFund: 4800,
    professionalTax: 200,
    healthInsurance: 1200,
    loanEmi: 2500,
    otherDeductions: 300,
    reimbursements: 600,
    specialBenefits: 400,
    paymentMode: 'Bank Transfer',
    bankAccount: '****9012',
    paymentStatus: 'Pending',
    notes: 'Overtime for year-end closing',
    preparedBy: 'HR Admin'
  }
];

const PayRoll = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
const [currentPage, setCurrentPage] = useState(1);

const filteredData = demoPayrollData.filter(employee =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
);
const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const calculateGrossEarnings = (employee: PayrollData) => {
    return employee.basicSalary + employee.hra + employee.conveyanceAllowance + 
           employee.medicalAllowance + employee.otherAllowances + employee.overtimePay + 
           employee.bonus + employee.reimbursements + employee.specialBenefits;
  };

  const calculateTotalDeductions = (employee: PayrollData) => {
    return employee.taxDeduction + employee.providentFund + employee.professionalTax + 
           employee.healthInsurance + employee.loanEmi + employee.otherDeductions;
  };

  const calculateNetPay = (employee: PayrollData) => {
    return calculateGrossEarnings(employee) - calculateTotalDeductions(employee);
  };

  const handleDownloadPDF = async (employee: PayrollData) => {
    setLoading(true);
    try {
      const blob = await pdf(<PayrollPDF employee={employee} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${employee.employeeId}_${employee.payPeriod.replace(' ', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = (employee: PayrollData) => {
    setSelectedEmployee(employee);
    setShowPayslip(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="space-y-6">
       

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Employees</p>
                <p className="text-2xl font-bold">{demoPayrollData.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Gross Pay</p>
                <p className="text-2xl font-bold">
                  £{demoPayrollData.reduce((sum, emp) => sum + calculateGrossEarnings(emp), 0).toLocaleString()}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Deductions</p>
                <p className="text-2xl font-bold">
                  £{demoPayrollData.reduce((sum, emp) => sum + calculateTotalDeductions(emp), 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Net Payable</p>
                <p className="text-2xl font-bold">
                  £{demoPayrollData.reduce((sum, emp) => sum + calculateNetPay(emp), 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-row justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or department..."
                className="w-80"
              />
              <Button className='bg-supperagent hover:bg-supperagent/90 text-white'><Search className='w-4 h-4'/> Search</Button>
            </div>
          </div>
           <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date) => setSelectedDate(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  showYearDropdown
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Employee Payroll</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <BlinkingDots size="large" color="bg-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Employee ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Department</TableHead>
                    <TableHead className="font-semibold text-gray-700">Designation</TableHead>
                    <TableHead className="font-semibold text-gray-700">Gross Earnings</TableHead>
                    <TableHead className="font-semibold text-gray-700">Deductions</TableHead>
                    <TableHead className="font-semibold text-gray-700">Net Pay</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((employee) => (
                    <TableRow key={employee.employeeId} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                          {employee.employeeId}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{employee.fullName}</TableCell>
                      <TableCell className="text-gray-600">{employee.department}</TableCell>
                      <TableCell className="text-gray-600">{employee.designation}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        £{calculateGrossEarnings(employee).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        £{calculateTotalDeductions(employee).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        £{calculateNetPay(employee).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.paymentStatus === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className='text-right flex justify-end'>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPayslip(employee)}
                            className="text-white bg-supperagent hover:bg-supperagent/90 border-none"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(employee)}
                            className="text-white "
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               <div className="mt-6">
                              <DynamicPagination
                                pageSize={entriesPerPage}
                                setPageSize={setEntriesPerPage}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                              />
                            </div>
            </div>
          )}
        </div>

        {/* Payslip Detail Modal */}
        {showPayslip && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payslip Details</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedEmployee)}
                      className="text-white hover:bg-supperagent/90 border-none bg-supperagent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPayslip(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>

                {/* Employee Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Employee Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedEmployee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">{selectedEmployee.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Designation:</span>
                        <span className="font-medium">{selectedEmployee.designation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employment Type:</span>
                        <span className="font-medium">{selectedEmployee.employmentType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Payroll Period
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pay Period:</span>
                        <span className="font-medium">{selectedEmployee.payPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{selectedEmployee.startDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date:</span>
                        <span className="font-medium">{selectedEmployee.endDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="font-medium">{selectedEmployee.paymentDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Mode:</span>
                        <span className="font-medium">{selectedEmployee.paymentMode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings and Deductions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Earnings</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-medium">£{selectedEmployee.basicSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRA:</span>
                        <span className="font-medium">£{selectedEmployee.hra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conveyance Allowance:</span>
                        <span className="font-medium">£{selectedEmployee.conveyanceAllowance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical Allowance:</span>
                        <span className="font-medium">£{selectedEmployee.medicalAllowance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Allowances:</span>
                        <span className="font-medium">£{selectedEmployee.otherAllowances.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime Pay:</span>
                        <span className="font-medium">£{selectedEmployee.overtimePay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span className="font-medium">£{selectedEmployee.bonus.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reimbursements:</span>
                        <span className="font-medium">£{selectedEmployee.reimbursements.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold text-green-700">
                        <span>Gross Earnings:</span>
                        <span>£{calculateGrossEarnings(selectedEmployee).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-4">Deductions</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tax Deduction:</span>
                        <span className="font-medium">£{selectedEmployee.taxDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provident Fund:</span>
                        <span className="font-medium">£{selectedEmployee.providentFund.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Tax:</span>
                        <span className="font-medium">£{selectedEmployee.professionalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Health Insurance:</span>
                        <span className="font-medium">£{selectedEmployee.healthInsurance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loan EMI:</span>
                        <span className="font-medium">£{selectedEmployee.loanEmi.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Deductions:</span>
                        <span className="font-medium">£{selectedEmployee.otherDeductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold text-red-700">
                        <span>Total Deductions:</span>
                        <span>£{calculateTotalDeductions(selectedEmployee).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Summary */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Net Pay Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Gross Earnings</p>
                      <p className="text-2xl font-bold text-green-600">£{calculateGrossEarnings(selectedEmployee).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">£{calculateTotalDeductions(selectedEmployee).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Pay</p>
                      <p className="text-3xl font-bold text-blue-600">£{calculateNetPay(selectedEmployee).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedEmployee.notes && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-sm text-gray-600">Notes:</p>
                      <p className="text-sm font-medium">{selectedEmployee.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayRoll;