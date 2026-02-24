import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Briefcase,
  HeartHandshake,
  CreditCard,
  Users,
  CheckCircle2,
  Loader2 // Imported Loader2
} from 'lucide-react';

// --- Reusable "Individual Table" Components ---

const TableContainer = ({ title, icon: Icon, children, className = '' }) => (
  <div
    className={`h-fit overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
  >
    {/* Table Header - Compacted */}
    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-theme" />}
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
        {title}
      </h3>
    </div>
    {/* Table Body */}
    <div className="flex flex-col">{children}</div>
  </div>
);

const TableRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 last:border-0 hover:bg-gray-50/50">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span className="max-w-[200px] truncate pl-2 text-right text-xs font-semibold text-gray-900">
      {value || <span className="text-gray-300">-</span>}
    </span>
  </div>
);

// --- Main Component ---

const ReviewStep = ({ formData, onSubmit, onBack, applicantData }) => {
  const navigate = useNavigate();
  // ✅ 1. Add local state for loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (!isSubmitting) {
      onBack();
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Submission failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) =>
    date ? moment(date).format('DD MMM YYYY') : '-';

  return (
    <div className="mx-auto w-full space-y-4 p-4">
      {/* Grid Layout: 2 Columns to reduce vertical space */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. Personal Information Table */}
        <TableContainer title="Personal Details" icon={User}>
          {/* Split Name Fields */}
          <TableRow label="Title" value={applicantData?.title} />
          <TableRow label="First Name" value={applicantData?.firstName} />
          <TableRow label="Initial" value={applicantData?.initial} />
          <TableRow label="Last Name" value={applicantData?.lastName} />
          <TableRow label="Email" value={applicantData?.email} />
          <TableRow label="Mobile" value={applicantData?.mobilePhone} />
          <TableRow
            label="DOB"
            value={formatDate(applicantData?.dateOfBirth)}
          />
          <TableRow label="Gender" value={applicantData?.gender} />
          <TableRow
            label="Marital Status"
            value={applicantData?.maritalStatus}
          />
          <TableRow
            label="NI Number"
            value={applicantData?.nationalInsuranceNumber}
          />
          <TableRow label="NHS Number" value={applicantData?.nhsNumber} />
          <TableRow
            label="No Need to Check RTW"
            value={
              typeof formData?.GeneralInformation?.noRtwCheck === 'boolean'
                ? formData.GeneralInformation.noRtwCheck
                  ? 'Yes'
                  : 'No'
                : '-'
            }
          />{' '}
          <TableRow
            label="RTW Check Date"
            value={formatDate(formData?.GeneralInformation?.rtwCheckDate)}
          />
          <TableRow
            label="Contract Hours"
            value={formData.GeneralInformation?.contractHours}
          />
        </TableContainer>

        {/* Grouping Address and Application in Column 2 (or sequential depending on height) */}
        <div className="flex flex-col gap-4">
          {/* 2. Address Table */}
          <TableContainer title="Address History" icon={MapPin}>
            <TableRow label="Street" value={applicantData?.address} />
            <TableRow label="City / Town" value={applicantData?.cityOrTown} />
            <TableRow
              label="State / County"
              value={applicantData?.stateOrProvince}
            />
            <TableRow label="Post Code" value={applicantData?.postCode} />
            <TableRow label="Country" value={applicantData?.country} />
          </TableContainer>

          {/* 3. Application Context Table */}
          <TableContainer title="Application Details" icon={Briefcase}>
            <TableRow label="Position" value={applicantData?.position} />
            <TableRow label="Type" value={applicantData?.employmentType} />
            <TableRow
              label="Start Date"
              value={formatDate(applicantData?.availableFromDate)}
            />
            <TableRow
              label="App Date"
              value={formatDate(applicantData?.applicationDate)}
            />
            <TableRow
              label="Status"
              value={
                <span className="capitalize">{applicantData?.status}</span>
              }
            />
          </TableContainer>
        </div>

        {/* 4. Equality Table */}
        <TableContainer title="Equality & Diversity" icon={HeartHandshake}>
          <TableRow label="Ethnic Origin" value={applicantData?.ethnicOrigin} />
          <TableRow
            label="Has Disability"
            value={applicantData?.hasDisability ? 'Yes' : 'No'}
          />
          {applicantData?.hasDisability && (
            <TableRow
              label="Disability Details"
              value={applicantData?.disabilityDetails}
            />
          )}
          <TableRow
            label="Needs Adjustments"
            value={applicantData?.needsReasonableAdjustment ? 'Yes' : 'No'}
          />
          {applicantData?.needsReasonableAdjustment && (
            <TableRow
              label="Adj. Details"
              value={applicantData?.reasonableAdjustmentDetails}
            />
          )}
        </TableContainer>
        {/* 6. Beneficiary Table (Conditional) */}
        {formData?.EqualityInformation?.beneficiary && (
          <TableContainer title="Next of Kin" icon={Users}>
            <TableRow
              label="Full Name"
              value={formData.EqualityInformation.beneficiary.fullName}
            />
            <TableRow
              label="Relationship"
              value={formData.EqualityInformation.beneficiary.relationship}
            />
            <TableRow
              label="Email"
              value={formData.EqualityInformation.beneficiary.email}
            />
            <TableRow
              label="Mobile"
              value={formData.EqualityInformation.beneficiary.mobile}
            />
          </TableContainer>
        )}

        {/* 5. Payroll Table (Conditional) */}
        {formData?.GeneralInformation?.payroll && (
          <TableContainer title="Payroll Information" icon={CreditCard}>
            <TableRow
              label="Method"
              value={formData.GeneralInformation.payroll.paymentMethod}
            />
            <TableRow
              label="Payroll No"
              value={formData.GeneralInformation.payroll.payrollNumber}
            />

            {/* Bank Details logic */}
            {formData.GeneralInformation.payroll.paymentMethod ===
              'Bank Transfer' && (
              <>
                <div className="mt-1 border-y border-gray-100 bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase text-gray-400">
                  Bank Details
                </div>
                <TableRow
                  label="Bank"
                  value={formData.GeneralInformation.payroll.bankName}
                />
                <TableRow
                  label="Account No"
                  value={formData.GeneralInformation.payroll.accountNumber}
                />
                <TableRow
                  label="Sort Code"
                  value={formData.GeneralInformation.payroll.sortCode}
                />
                <TableRow
                  label="Beneficiary"
                  value={formData.GeneralInformation.payroll.beneficiary}
                />
              </>
            )}
          </TableContainer>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between ">
        <Button
          type="button"
          size={'sm'}
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting} // Disable back button too
          className="h-9 w-full text-xs sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          size={'sm'}
          onClick={handleConfirm} // ✅ 3. Use wrapper handler
          disabled={isSubmitting} // ✅ 4. Disable when submitting
          className="h-9 w-full bg-theme text-xs hover:bg-theme/90 sm:w-auto sm:px-6"
        >
          {/* ✅ 5. Show Loading State */}
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Confirm Recruitment
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
