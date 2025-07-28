import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import moment from 'moment';
import { DocumentRequest } from '../types/DocumentTypes';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #CCCCCC',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    fontSize: 10,
    width: '60%',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  table: {
    border: '1 solid #CCCCCC',
    borderRadius: 4,
    padding: 15,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 5,
  },
  tableRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottom: '1 solid #EEEEEE',
  },
  tableRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #000000',
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottom: '1 solid #000000',
    marginTop: 20,
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 20,
  },
});

interface PDFDocumentProps {
  request: DocumentRequest;
}

export const PayslipPDF: React.FC<PDFDocumentProps> = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyName}>Healthcare Services Ltd.</Text>
        <Text style={styles.companyInfo}>123 Healthcare Avenue, Medical District, City, Postal Code</Text>
        <Text style={styles.companyInfo}>Phone: +44 20 1234 5678 | Email: hr@healthcareservices.com</Text>
      </View>

      <Text style={styles.title}>Payslip</Text>
      <Text style={styles.subtitle}>For the month of {moment().format('MMMM YYYY')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{request.staffName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Staff ID:</Text>
          <Text style={styles.value}>{request.staffId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{request.department}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{request.staffEmail}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Details</Text>
        <View style={styles.table}>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>Basic Salary:</Text>
            <Text style={styles.text}>£2,500.00</Text>
          </View>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>Allowances:</Text>
            <Text style={styles.text}>£300.00</Text>
          </View>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>Overtime:</Text>
            <Text style={styles.text}>£150.00</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>Gross Pay:</Text>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>£2,950.00</Text>
          </View>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>Income Tax:</Text>
            <Text style={styles.text}>£295.00</Text>
          </View>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>National Insurance:</Text>
            <Text style={styles.text}>£177.00</Text>
          </View>
          <View style={styles.tableRowBorder}>
            <Text style={styles.text}>Pension:</Text>
            <Text style={styles.text}>£118.00</Text>
          </View>
          <View style={styles.tableRowTotal}>
            <Text style={[styles.text, { fontWeight: 'bold', fontSize: 12 }]}>Net Pay:</Text>
            <Text style={[styles.text, { fontWeight: 'bold', fontSize: 12 }]}>£2,360.00</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export const ExperienceLetterPDF: React.FC<PDFDocumentProps> = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyName}>Healthcare Services Ltd.</Text>
        <Text style={styles.companyInfo}>123 Healthcare Avenue, Medical District, City, Postal Code</Text>
        <Text style={styles.companyInfo}>Phone: +44 20 1234 5678 | Email: hr@healthcareservices.com</Text>
      </View>

      <Text style={styles.title}>Experience Certificate</Text>
      <Text style={styles.date}>Date: {moment().format('MMMM Do, YYYY')}</Text>

      <View style={styles.section}>
        <Text style={styles.text}>To Whom It May Concern,</Text>
        <Text style={styles.text}>
          This is to certify that {request.staffName} (Staff ID: {request.staffId}) has been employed 
          with Healthcare Services Ltd. in the capacity of Care Assistant in the {request.department} department.
        </Text>
        <Text style={styles.text}>
          During the employment period from January 1, 2022 to present, {request.staffName} has 
          demonstrated excellent professional skills, dedication, and commitment to providing 
          quality care services.
        </Text>
        <Text style={styles.text}>
          The employee has shown remarkable abilities in patient care, team collaboration, 
          and adherence to healthcare protocols and safety standards.
        </Text>
        <Text style={styles.text}>
          We wish {request.staffName} all the best for future endeavors.
        </Text>
      </View>

      <View style={styles.signature}>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Sincerely,</Text>
          <View style={styles.signatureLine}></View>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>Sarah Johnson</Text>
          <Text style={styles.text}>HR Manager</Text>
          <Text style={styles.text}>Healthcare Services Ltd.</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export const AppointmentLetterPDF: React.FC<PDFDocumentProps> = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyName}>Healthcare Services Ltd.</Text>
        <Text style={styles.companyInfo}>123 Healthcare Avenue, Medical District, City, Postal Code</Text>
        <Text style={styles.companyInfo}>Phone: +44 20 1234 5678 | Email: hr@healthcareservices.com</Text>
      </View>

      <Text style={styles.title}>Appointment Letter</Text>
      <Text style={styles.date}>Date: January 1, 2022</Text>

      <View style={styles.section}>
        <Text style={styles.text}>Dear {request.staffName},</Text>
        <Text style={styles.text}>
          We are pleased to offer you the position of Care Assistant in our {request.department} 
          department at Healthcare Services Ltd.
        </Text>
        <Text style={styles.text}>
          Your employment will commence on January 1, 2022, subject to the following terms and conditions:
        </Text>
        
        <View style={{ marginLeft: 20, marginTop: 10, marginBottom: 10 }}>
          <Text style={styles.text}>• Position: Care Assistant</Text>
          <Text style={styles.text}>• Department: {request.department}</Text>
          <Text style={styles.text}>• Reporting to: Department Supervisor</Text>
          <Text style={styles.text}>• Probation Period: 6 months</Text>
          <Text style={styles.text}>• Working Hours: 40 hours per week</Text>
          <Text style={styles.text}>• Starting Salary: £25,000 per annum</Text>
        </View>

        <Text style={styles.text}>
          Please confirm your acceptance of this offer by signing and returning a copy of this letter.
        </Text>
        <Text style={styles.text}>We look forward to welcoming you to our team.</Text>
      </View>

      <View style={styles.signature}>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Yours sincerely,</Text>
          <View style={styles.signatureLine}></View>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>Michael Brown</Text>
          <Text style={styles.text}>Director of Human Resources</Text>
          <Text style={styles.text}>Healthcare Services Ltd.</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export const JobContractPDF: React.FC<PDFDocumentProps> = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyName}>Healthcare Services Ltd.</Text>
        <Text style={styles.companyInfo}>123 Healthcare Avenue, Medical District, City, Postal Code</Text>
        <Text style={styles.companyInfo}>Phone: +44 20 1234 5678 | Email: hr@healthcareservices.com</Text>
      </View>

      <Text style={styles.title}>Employment Contract</Text>
      <Text style={styles.date}>Contract Date: January 1, 2022</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{request.staffName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Staff ID:</Text>
          <Text style={styles.value}>{request.staffId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{request.department}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{request.staffEmail}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Terms and Conditions of Employment</Text>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>1. Position and Duties</Text>
          <Text style={styles.text}>
            The Employee is appointed as Care Assistant and will perform duties as assigned by the supervisor.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>2. Salary and Benefits</Text>
          <Text style={styles.text}>
            Annual salary of £25,000, paid monthly. Benefits include health insurance, pension scheme, and 25 days annual leave.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>3. Working Hours</Text>
          <Text style={styles.text}>
            40 hours per week, Monday to Friday, with occasional weekend shifts as required.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>4. Notice Period</Text>
          <Text style={styles.text}>
            Either party may terminate this contract with 4 weeks written notice after probation period.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>5. Confidentiality</Text>
          <Text style={styles.text}>
            Employee agrees to maintain confidentiality of all patient and company information.
          </Text>
        </View>
      </View>

      <View style={styles.signature}>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Employee Signature:</Text>
          <View style={styles.signatureLine}></View>
          <Text style={styles.text}>{request.staffName}</Text>
          <Text style={styles.text}>Date: ___________</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.text}>Company Representative:</Text>
          <View style={styles.signatureLine}></View>
          <Text style={styles.text}>Michael Brown, HR Director</Text>
          <Text style={styles.text}>Date: January 1, 2022</Text>
        </View>
      </View>
    </Page>
  </Document>
);