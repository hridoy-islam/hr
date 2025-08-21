import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666666'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingVertical: 2
  },
  label: {
    fontSize: 10,
    color: '#333333',
    width: '60%'
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'right'
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000000'
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold'
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderColor: '#000000'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 5,
    borderTop: 1,
    borderTopColor: '#000000'
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '60%'
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'right'
  },
  netPaySection: {
    backgroundColor: '#e6f3ff',
    padding: 15,
    marginTop: 20,
    borderRadius: 5,
    alignItems: 'center'
  },
  netPayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0066cc'
  },
  netPayAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc'
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: 1,
    borderTopColor: '#cccccc',
    fontSize: 8,
    color: '#666666',
    textAlign: 'center'
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  column: {
    width: '48%'
  }
});

// Define the expected props
interface PayrollDetail {
  date: string;
  day: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  hourlyRate: number;
  dailyEarnings: number;
}

interface PayrollPDFProps {
  employee: {
    firstName: string;
    lastName: string;
    name: string;
    employeeId: string;
    department: string;
    designation: string;
    payPeriod: string;
    payrollDetails: PayrollDetail[];
    totalAmount: number;
  };
}

export const PayrollPDF: React.FC<PayrollPDFProps> = ({ employee }) => {
  const fullName =
    employee.name || `${employee.firstName} ${employee.lastName}`;

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`; // Assuming GBP
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payslip</Text>
          <Text style={styles.subtitle}>Pay Period: {employee.payPeriod}</Text>
        </View>

        {/* Employee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.twoColumnContainer}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{fullName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Department:</Text>
                <Text style={styles.value}>{employee.department}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Designation:</Text>
                <Text style={styles.value}>{employee.designation}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Breakdown Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Earnings Breakdown</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Date</Text>
              <Text style={styles.tableCell}>Day</Text>
              <Text style={styles.tableCell}>Clock In</Text>
              <Text style={styles.tableCell}>Clock Out</Text>
              <Text style={styles.tableCell}>Duration (hrs)</Text>
              <Text style={styles.tableCell}>Rate (£)</Text>
              <Text style={styles.tableCell}>Earnings (£)</Text>
            </View>

            {/* Table Rows */}
            {employee.payrollDetails.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.date}</Text>
                <Text style={styles.tableCell}>{item.day}</Text>
                <Text style={styles.tableCell}>{item.clockIn}</Text>
                <Text style={styles.tableCell}>{item.clockOut}</Text>
                <Text style={styles.tableCell}>{item.duration}</Text>
                <Text style={styles.tableCell}>
                  {item.hourlyRate.toFixed(2)}
                </Text>
                <Text style={styles.tableCell}>
                  {item.dailyEarnings.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(employee.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Net Pay Section */}
        <View style={styles.netPaySection}>
          <Text style={styles.netPayTitle}>NET PAY</Text>
          <Text style={styles.netPayAmount}>
            {formatCurrency(employee.totalAmount)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated payslip and does not require a
            signature.
          </Text>
          <Text>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};
