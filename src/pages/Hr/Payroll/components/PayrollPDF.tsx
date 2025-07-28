import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingVertical: 2,
  },
  label: {
    fontSize: 10,
    color: '#333333',
    width: '60%',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTop: 1,
    borderTopColor: '#000000',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '60%',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'right',
  },
  netPaySection: {
    backgroundColor: '#e6f3ff',
    padding: 10,
    marginTop: 15,
    borderRadius: 5,
  },
  netPayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#0066cc',
  },
  netPayAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0066cc',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: 1,
    borderTopColor: '#cccccc',
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
});

interface PayrollPDFProps {
  employee: {
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
  };
}

export const PayrollPDF: React.FC<PayrollPDFProps> = ({ employee }) => {
  const calculateGrossEarnings = () => {
    return employee.basicSalary + employee.hra + employee.conveyanceAllowance + 
           employee.medicalAllowance + employee.otherAllowances + employee.overtimePay + 
           employee.bonus + employee.reimbursements + employee.specialBenefits;
  };

  const calculateTotalDeductions = () => {
    return employee.taxDeduction + employee.providentFund + employee.professionalTax + 
           employee.healthInsurance + employee.loanEmi + employee.otherDeductions;
  };

  const calculateNetPay = () => {
    return calculateGrossEarnings() - calculateTotalDeductions();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PAYSLIP</Text>
          <Text style={styles.subtitle}>Pay Period: {employee.payPeriod}</Text>
        </View>

        {/* Employee Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.twoColumnContainer}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Employee ID:</Text>
                <Text style={styles.value}>{employee.employeeId}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{employee.fullName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Department:</Text>
                <Text style={styles.value}>{employee.department}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Designation:</Text>
                <Text style={styles.value}>{employee.designation}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Employment Type:</Text>
                <Text style={styles.value}>{employee.employmentType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Work Location:</Text>
                <Text style={styles.value}>{employee.workLocation}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Payment Date:</Text>
                <Text style={styles.value}>{employee.paymentDate.toLocaleDateString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Payment Mode:</Text>
                <Text style={styles.value}>{employee.paymentMode}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings and Deductions */}
        <View style={styles.twoColumnContainer}>
          {/* Earnings */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earnings</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Basic Salary</Text>
                <Text style={styles.value}>{formatCurrency(employee.basicSalary)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>House Rent Allowance</Text>
                <Text style={styles.value}>{formatCurrency(employee.hra)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Conveyance Allowance</Text>
                <Text style={styles.value}>{formatCurrency(employee.conveyanceAllowance)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Medical Allowance</Text>
                <Text style={styles.value}>{formatCurrency(employee.medicalAllowance)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Other Allowances</Text>
                <Text style={styles.value}>{formatCurrency(employee.otherAllowances)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Overtime Pay</Text>
                <Text style={styles.value}>{formatCurrency(employee.overtimePay)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Bonus</Text>
                <Text style={styles.value}>{formatCurrency(employee.bonus)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Reimbursements</Text>
                <Text style={styles.value}>{formatCurrency(employee.reimbursements)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Special Benefits</Text>
                <Text style={styles.value}>{formatCurrency(employee.specialBenefits)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Gross Earnings</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculateGrossEarnings())}</Text>
              </View>
            </View>
          </View>

          {/* Deductions */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deductions</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Tax Deduction</Text>
                <Text style={styles.value}>{formatCurrency(employee.taxDeduction)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Provident Fund</Text>
                <Text style={styles.value}>{formatCurrency(employee.providentFund)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Professional Tax</Text>
                <Text style={styles.value}>{formatCurrency(employee.professionalTax)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Health Insurance</Text>
                <Text style={styles.value}>{formatCurrency(employee.healthInsurance)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Loan EMI</Text>
                <Text style={styles.value}>{formatCurrency(employee.loanEmi)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Other Deductions</Text>
                <Text style={styles.value}>{formatCurrency(employee.otherDeductions)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Deductions</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculateTotalDeductions())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPaySection}>
          <Text style={styles.netPayTitle}>NET PAY</Text>
          <Text style={styles.netPayAmount}>{formatCurrency(calculateNetPay())}</Text>
        </View>

        {/* Notes */}
        {employee.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.label}>{employee.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated payslip and does not require a signature.</Text>
          <Text>Prepared by: {employee.preparedBy} | Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};