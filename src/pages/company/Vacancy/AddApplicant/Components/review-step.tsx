import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import moment from 'moment';
import {
  User,
  Phone,
  FileText,
  Briefcase,
  Accessibility,
  FileCheck, // New icon for documents
  ExternalLink
} from 'lucide-react';

interface ReviewStepProps {
  formData: any;
  onSubmit: () => void;
  onBack: () => void;
}

// Helper for section headers within the table
const TableSectionHeader = ({
  icon: Icon,
  title
}: {
  icon: any;
  title: string;
}) => (
  <TableRow className="bg-gray-100 hover:bg-gray-100">
    <TableCell colSpan={2} className="py-3 pl-4">
      <div className="flex items-center gap-2 font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-gray-500" />
        {title}
      </div>
    </TableCell>
  </TableRow>
);

// Helper for data rows
const DataRow = ({
  label,
  value,
  className = ''
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <TableRow className={`hover:bg-transparent ${className}`}>
    <TableCell className="w-[30%] min-w-[150px] border-r bg-gray-50/40 py-3 align-top font-medium text-gray-500">
      {label}
    </TableCell>
    <TableCell className="py-3 align-top font-medium text-gray-900">
      {value || <span className="italic text-gray-300">Not provided</span>}
    </TableCell>
  </TableRow>
);

// ✅ New Helper to render file links
const FileLink = ({ url }: { url?: string }) => {
  if (!url) return <span className="italic text-gray-300">Not uploaded</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-blue-600 transition-colors hover:text-blue-800 hover:underline"
    >
      <FileText className="h-4 w-4" />
      <span>View File</span>
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
};

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onSubmit,
  onBack
}) => {
  const {
    personalDetails = {},
    contact = {},
    demography = {},
    documents = {} // ✅ Destructure documents
  } = formData || {};

  console.log(formData);

  return (
    <div className="mx-auto w-full duration-500 animate-in fade-in slide-in-from-bottom-4">
      <Card className="overflow-hidden rounded-none border-gray-200 shadow-none">
        {/* --- Header Section (Image & Name) --- */}
        <CardHeader className="flex flex-col items-center border-b bg-white py-8 text-center">
          <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-gray-100 shadow-sm">
            <img
              src={personalDetails?.image || '/user.png'}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {personalDetails.firstName} {personalDetails.lastName}
          </h1>
        </CardHeader>

        <CardContent className="p-0">
          <div className="">
            <Table>
              <TableBody>
                {/* --- 1. Personal Identity --- */}
                <TableSectionHeader icon={User} title="Personal Details" />
                <DataRow label="Title" value={personalDetails.title} />
                <DataRow label="First Name" value={personalDetails.firstName} />
                <DataRow label="Initial" value={personalDetails.initial} />
                <DataRow label="Last Name" value={personalDetails.lastName} />
                <DataRow
                  label="Date of Birth"
                  value={
                    personalDetails.dateOfBirth
                      ? moment(personalDetails.dateOfBirth).format(
                          'DD MMMM YYYY'
                        )
                      : null
                  }
                />
                <DataRow label="Gender" value={demography.gender} />
                <DataRow
                  label="Marital Status"
                  value={demography.maritalStatus}
                />
                <DataRow
                  label="Ethnic Origin"
                  value={demography.ethnicOrigin}
                />

                {/* --- 2. Contact Information --- */}
                <TableSectionHeader icon={Phone} title="Contact Information" />
                <DataRow label="Email Address" value={contact.email} />
                <DataRow label="Mobile Phone" value={contact.mobilePhone} />
                <DataRow label="Home Phone" value={contact.homePhone} />
                <DataRow label="Other Phone" value={contact.otherPhone} />
                <DataRow label="Street Address" value={contact.address} />
                <DataRow label="City / Town" value={contact.cityOrTown} />
                <DataRow
                  label="State / Province"
                  value={contact.stateOrProvince}
                />
                <DataRow label="Post Code" value={contact.postCode} />
                <DataRow label="Country" value={contact.country} />

                {/* --- 3. Official Documents (Numbers) --- */}
                <TableSectionHeader icon={FileText} title="Official IDs" />
                <DataRow
                  label="NI Number"
                  value={personalDetails.nationalInsuranceNumber}
                />
                <DataRow label="NHS Number" value={personalDetails.nhsNumber} />
                <DataRow
                  label="Passport Number"
                  value={personalDetails.passportNo}
                />
                {/* ✅ Added Passport Expiry */}
                <DataRow
                  label="Passport Expiry"
                  value={
                    personalDetails.passportExpiry
                      ? moment(personalDetails.passportExpiry).format(
                          'DD MMM YYYY'
                        )
                      : null
                  }
                />

                {/* --- 5. Application Details --- */}
                <TableSectionHeader
                  icon={Briefcase}
                  title="Application Context"
                />
                <DataRow
                  label="Position Applied"
                  value={personalDetails.position}
                />
                <DataRow
                  label="Employment Type"
                  value={personalDetails.employmentType}
                />
                <DataRow
                  label="Application Source"
                  value={personalDetails.source}
                />
                <DataRow label="Branch" value={personalDetails.branch} />
                <DataRow
                  label="Application Date"
                  value={
                    personalDetails.applicationDate
                      ? moment(personalDetails.applicationDate).format(
                          'DD MMM YYYY'
                        )
                      : null
                  }
                />
                <DataRow
                  label="Available From"
                  value={
                    personalDetails.availableFromDate
                      ? moment(personalDetails.availableFromDate).format(
                          'DD MMM YYYY'
                        )
                      : null
                  }
                />
                <DataRow
                  label="Is the applicant a British citizen?"
                  value={documents.isBritish ? 'Yes' : 'No'}
                />

                {/* --- 6. Health & Disability --- */}
                <TableSectionHeader
                  icon={Accessibility}
                  title="Health & Adjustments"
                />
                <DataRow
                  label="Has Disability?"
                  value={
                    demography.hasDisability ? (
                      <span className="inline-flex items-center gap-2 font-semibold">
                        Yes
                        <span className="text-xs font-normal text-gray-400">
                          |
                        </span>
                        <span className="font-normal text-gray-700">
                          {demography.disabilityDetails}
                        </span>
                      </span>
                    ) : (
                      'No'
                    )
                  }
                />
                <DataRow
                  label="Requires Adjustments?"
                  value={
                    demography.needsReasonableAdjustment ? (
                      <span className="inline-flex items-center gap-2 font-semibold">
                        Yes
                        <span className="text-xs font-normal text-gray-400">
                          |
                        </span>
                        <span className="font-normal text-gray-700">
                          {demography.reasonableAdjustmentDetails}
                        </span>
                      </span>
                    ) : (
                      'No'
                    )
                  }
                />

                {/* --- 4. Uploaded Files (New Section) --- */}
                <TableSectionHeader
                  icon={FileCheck}
                  title="Uploaded Documents"
                />
                <DataRow
                  label="Passport"
                  value={<FileLink url={documents.passport} />}
                />
                <DataRow
                  label="DBS Certificate"
                  value={<FileLink url={documents.dbs} />}
                />
                <DataRow
                  label="Right to Work"
                  value={<FileLink url={documents.rightToWork} />}
                />
                <DataRow
                  label="Immigration Status"
                  value={<FileLink url={documents.immigrationStatus} />}
                />
                <DataRow
                  label="Proof of Address"
                  value={<FileLink url={documents.proofOfAddress} />}
                />
                <DataRow
                  label="Ni number/Driving licence"
                  value={<FileLink url={documents.niDoc} />}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse justify-between gap-4 border-t p-0 pt-4 sm:flex-row">
          <Button onClick={onBack} variant={'outline'}>
            Back
          </Button>
          <Button onClick={onSubmit}>Confirm Applicant</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReviewStep;
