import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import moment from 'moment';

interface PayrollPDFProps {
  payroll: any;
  isDetailed?: boolean;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    textAlign: 'right',
  },
  invoiceType: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  invoiceInfo: {
    width: '45%',
  },
  billingInfo: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 8,
    color: '#6B7280',
    width: '50%',
  },
  detailValue: {
    fontSize: 8,
    color: '#1F2937',
    fontWeight: 'bold',
    width: '50%',
    textAlign: 'right',
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  clientDetails: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.2,
  },
  servicesTable: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 20,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 8,
    color: '#1F2937',
  },
  summary: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  holidayText: {
    color: '#DC2626',
    fontSize: 8,
    fontStyle: 'italic',
  }
});

const formatMinutesToHHmm = (totalMinutes: number) => {
  if (!totalMinutes) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const calculateDurationHHmm = (start: string, end: string) => {
    if (!start || !end) return "00:00";
    const s = moment(start, 'HH:mm');
    const e = moment(end, 'HH:mm');
    if (e.isBefore(s)) e.add(1, 'day');
    const duration = moment.duration(e.diff(s));
    const hours = Math.floor(duration.asHours());
    const mins = duration.minutes();
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const PayrollPDF: React.FC<PayrollPDFProps> = ({ payroll, isDetailed = false }) => {
  const user = payroll.userId;
  const attendanceList = payroll.attendanceList || [];

  const totalDurationDisplay = formatMinutesToHHmm(payroll.totalHour);
  const totalAmount = payroll.totalAmount || 0;

  const renderTableHeaders = () => {
    if (isDetailed) {
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '11%' }]}>Start Date</Text>
          <Text style={[styles.tableHeaderText, { width: '11%' }]}>End Date</Text>
          <Text style={[styles.tableHeaderText, { width: '8%' }]}>Start</Text>
          <Text style={[styles.tableHeaderText, { width: '8%' }]}>End</Text>
          <Text style={[styles.tableHeaderText, { width: '8%' }]}>Duration</Text>
          <Text style={[styles.tableHeaderText, { width: '18%' }]}>Note</Text>
          <Text style={[styles.tableHeaderText, { width: '16%' }]}>Holiday</Text>
          <Text style={[styles.tableHeaderText, { width: '10%' }]}>Rate</Text>
          <Text style={[styles.tableHeaderText, { width: '10%' }]}>Total</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Start Date</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>End Date</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Duration</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Rate</Text>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Total</Text>
        </View>
      );
    }
  };

  const renderTableRow = (item: any, index: number) => {
    const durationStr = calculateDurationHHmm(item.startTime, item.endTime);
    const [h, m] = durationStr.split(':').map(Number);
    const decimalHours = h + (m / 60);
    const lineTotal = decimalHours * item.payRate;

    const noteText = item.note || '-';
    const holidayText = item.bankHoliday ? (item.bankHolidayId?.title || 'Bank Holiday') : '-';
    const isHoliday = !!item.bankHoliday;

    if (isDetailed) {
      return (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.tableCellText, { width: '11%' }]}>
             {moment(item.startDate).format('DD/MM/YYYY')}
          </Text>
          <Text style={[styles.tableCellText, { width: '11%' }]}>
             {moment(item.endDate).format('DD/MM/YYYY')}
          </Text>
          <Text style={[styles.tableCellText, { width: '8%' }]}>
            {item.startTime}
          </Text>
          <Text style={[styles.tableCellText, { width: '8%' }]}>
            {item.endTime}
          </Text>
          <Text style={[styles.tableCellText, { width: '8%' }]}>
            {durationStr}
          </Text>
          <Text style={[styles.tableCellText, { width: '18%' }]}>
            {noteText}
          </Text>
          <Text style={[styles.tableCellText, { width: '16%', color: isHoliday ? '#DC2626' : '#1F2937', fontStyle: isHoliday ? 'italic' : 'normal' }]}>
            {holidayText}
          </Text>
          <Text style={[styles.tableCellText, { width: '10%' }]}>
            £{item.payRate?.toFixed(2)}
          </Text>
          <Text style={[styles.tableCellText, { width: '10%' }]}>
            £{lineTotal.toFixed(2)}
          </Text>
        </View>
      );
    } else {
      return (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.tableCellText, { width: '20%' }]}>
            {moment(item.startDate).format('DD/MM/YYYY')}
          </Text>
          <Text style={[styles.tableCellText, { width: '20%' }]}>
            {moment(item.endDate).format('DD/MM/YYYY')}
          </Text>
          <Text style={[styles.tableCellText, { width: '20%' }]}>
            {durationStr}
          </Text>
          <Text style={[styles.tableCellText, { width: '20%' }]}>
            £{item.payRate?.toFixed(2)}
          </Text>
          <Text style={[styles.tableCellText, { width: '20%' }]}>
            £{lineTotal.toFixed(2)}
          </Text>
        </View>
      );
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* <View>
            <Text style={styles.companyName}>Everycare Romford</Text>
            <Text style={styles.companyDetails}>
              37 High Street,{'\n'}
              Romford, RM1 1JL{'\n'}
              Phone: 01708 733101
            </Text>
          </View> */}
          <View>
            <Text style={styles.invoiceTitle}>PAYSLIP</Text>
            <Text style={styles.invoiceType}>
              {isDetailed ? 'Detailed Breakdown' : 'Standard Summary'}
            </Text>
            <Text style={[styles.invoiceType, {marginTop: 5, color: '#DC2626'}]}>
                Status: {payroll.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.sectionTitle}>Pay Period:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Slip ID:</Text>
              <Text style={styles.detailValue}>{payroll._id.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From Date:</Text>
              <Text style={styles.detailValue}>
                {moment(payroll.fromDate).format('DD MMM YYYY')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To Date:</Text>
              <Text style={styles.detailValue}>
                {moment(payroll.toDate).format('DD MMM YYYY')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Generated:</Text>
              <Text style={styles.detailValue}>{moment().format('DD/MM/YYYY')}</Text>
            </View>
          </View>

          <View style={styles.billingInfo}>
            <Text style={styles.sectionTitle}>Employee Details:</Text>
            <Text style={styles.clientName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.clientDetails}>
              {user.email}{'\n'}
              {user.mobilePhone || user.phone || 'No Phone'}{'\n'}
              {user.address || 'No Address Provided'}
            </Text>
            <Text style={[styles.clientDetails, { marginTop: 4 }]}>
               Dept: {user.departmentId?.departmentName || 'General'}
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            Pay Summary
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '33%' }]}>
              Total Shifts
            </Text>
            <Text style={[styles.tableHeaderText, { width: '33%' }]}>
              Total Duration
            </Text>
            <Text style={[styles.tableHeaderText, { width: '33%' }]}>
              Net Pay
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellText, { width: '33%' }]}>{attendanceList.length}</Text>
            <Text style={[styles.tableCellText, { width: '33%' }]}>{totalDurationDisplay}</Text>
            <Text style={[styles.tableCellText, { width: '33%', fontWeight: 'bold', color: '#DC2626' }]}>
              £{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.servicesTable}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 15 }}>
            Attendance Breakdown
          </Text>
          {renderTableHeaders()}
          {attendanceList.map((item: any, index: number) => renderTableRow(item, index))}
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellText, { 
              width: isDetailed ? '38%' : '40%', 
              fontWeight: 'bold',
              textAlign: 'right',
              paddingRight: 10
            }]}>
              Totals
            </Text>
            
            <Text style={[styles.tableCellText, { 
                width: isDetailed ? '8%' : '20%', 
                fontWeight: 'bold' 
            }]}>
                {totalDurationDisplay}
            </Text>
            
            {isDetailed && <Text style={{ width: '44%' }}></Text>} 
            
             <Text style={[styles.tableCellText, { 
                width: isDetailed ? '10%' : '20%', 
                fontWeight: 'bold' 
            }]}>
              £{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated document and does not require a signature.{'\n'}
            If you have any queries regarding this payslip, please contact HR.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const getPayrollPDFBlob = async (payroll: any, isDetailed: boolean) => {
  const blob = await pdf(<PayrollPDF payroll={payroll} isDetailed={isDetailed}  />).toBlob();

  return new Blob([blob], { type: 'application/pdf' });
};

export const downloadPayrollPDF = async (payroll: any, isDetailed: boolean) => {
  const blob = await getPayrollPDFBlob(payroll, isDetailed);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const suffix = isDetailed ? 'detailed' : 'summary';
  const fileName = `Payslip_${payroll.userId.firstName}_${payroll._id.slice(-4)}_${suffix}.pdf`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default PayrollPDF;