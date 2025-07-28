import React from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Button } from '@/components/ui/button';

const ReviewStep = ({ formData, onSubmit, onBack, applicantData }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    onBack();
  };

  const formatDate = (date) =>
    date ? moment(date).format('DD MMM YYYY') : '-';

  return (
    <div className="w-full mx-auto px-6 py-10 bg-white  rounded-xl space-y-8">
      {/* Personal Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p className="text-lg text-gray-500">Full Name</p>
            <p className="font-medium">{applicantData?.title} {applicantData?.firstName} {applicantData?.lastName}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Date of Birth</p>
            <p className="font-medium">{formatDate(applicantData?.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Gender</p>
            <p className="font-medium">{applicantData?.gender}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Marital Status</p>
            <p className="font-medium">{applicantData?.maritalStatus}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Email</p>
            <p className="font-medium">{applicantData?.email}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Mobile Phone</p>
            <p className="font-medium">{applicantData?.mobilePhone}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">National Insurance Number</p>
            <p className="font-medium">{applicantData?.nationalInsuranceNumber || '-'}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">NHS Number</p>
            <p className="font-medium">{applicantData?.nhsNumber || '-'}</p>
          </div>
        </div>
      </section>

      {/* Address Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p className="text-lg text-gray-500">Address</p>
            <p className="font-medium">{applicantData?.address}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">City/Town</p>
            <p className="font-medium">{applicantData?.cityOrTown}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">State/Province</p>
            <p className="font-medium">{applicantData?.stateOrProvince}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Postal Code</p>
            <p className="font-medium">{applicantData?.postCode}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Country</p>
            <p className="font-medium">{applicantData?.country}</p>
          </div>
        </div>
      </section>

      {/* Application Details */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Application Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p className="text-lg text-gray-500">Position</p>
            <p className="font-medium">{applicantData?.position}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Employment Type</p>
            <p className="font-medium">{applicantData?.employmentType}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Available From</p>
            <p className="font-medium">{formatDate(applicantData?.availableFromDate)}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Application Date</p>
            <p className="font-medium">{formatDate(applicantData?.applicationDate)}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Status</p>
            <p className="font-medium capitalize">{applicantData?.status}</p>
          </div>
        </div>
      </section>

      {/* Equality Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Equality Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <p className="text-lg text-gray-500">Ethnic Origin</p>
            <p className="font-medium">{applicantData?.ethnicOrigin}</p>
          </div>
          <div>
            <p className="text-lg text-gray-500">Has Disability</p>
            <p className="font-medium">{applicantData?.hasDisability ? 'Yes' : 'No'}</p>
          </div>
          {applicantData?.hasDisability && (
            <div>
              <p className="text-lg text-gray-500">Disability Details</p>
              <p className="font-medium">{applicantData?.disabilityDetails || '-'}</p>
            </div>
          )}
          <div>
            <p className="text-lg text-gray-500">Needs Adjustment</p>
            <p className="font-medium">{applicantData?.needsReasonableAdjustment ? 'Yes' : 'No'}</p>
          </div>
          {applicantData?.needsReasonableAdjustment && (
            <div>
              <p className="text-lg text-gray-500">Adjustment Details</p>
              <p className="font-medium">{applicantData?.reasonableAdjustmentDetails || '-'}</p>
            </div>
          )}
        </div>
      </section>

      {/* Form Data Sections */}
      {formData && (
        <>
          {/* Payroll Information */}
          {formData.GeneralInformation?.payroll && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Payroll Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="text-lg text-gray-500">Payment Method</p>
                  <p className="font-medium">{formData.GeneralInformation.payroll.paymentMethod || '-'}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-500">Payroll Number</p>
                  <p className="font-medium">{formData.GeneralInformation.payroll.payrollNumber || '-'}</p>
                </div>
              </div>
            </section>
          )}

          {/* Right to Work */}
          {formData.GeneralInformation?.rightToWork && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Right to Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="text-lg text-gray-500">Has Expiry</p>
                  <p className="font-medium">{formData.GeneralInformation.rightToWork.hasExpiry ? 'Yes' : 'No'}</p>
                </div>
                {formData.GeneralInformation.rightToWork.hasExpiry && (
                  <div>
                    <p className="text-lg text-gray-500">Expiry Date</p>
                    <p className="font-medium">{formatDate(formData.GeneralInformation.rightToWork.expiryDate)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Beneficiary Information */}
          {formData.EqualityInformation?.beneficiary && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Beneficiary Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="text-lg text-gray-500">Full Name</p>
                  <p className="font-medium">{formData.EqualityInformation.beneficiary.fullName || '-'}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-500">Relationship</p>
                  <p className="font-medium">{formData.EqualityInformation.beneficiary.relationship || '-'}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-500">Email</p>
                  <p className="font-medium">{formData.EqualityInformation.beneficiary.email || '-'}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-500">Mobile</p>
                  <p className="font-medium">{formData.EqualityInformation.beneficiary.mobile || '-'}</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-4 pt-6">
        <Button
          type="button"
          onClick={handleBack}
          className="bg-black text-white rounded-md hover:bg-black/90 transition"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          className="bg-supperagent text-white rounded-md hover:bg-supperagent/90 transition"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;