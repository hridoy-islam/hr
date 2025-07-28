import { Button } from "@/components/ui/button";
import moment from "moment";

const ReviewStep = ({ formData, onSubmit,onBack }) => {
  // Destructuring with optional chaining to prevent errors when data is missing
  const {
    personalDetails = {},
    
    contact= {},
    demography = {},
  
  } = formData || {}; // Optional chaining for formData

  console.log("ReviewStep", formData);
  return (
    <div>
      <div className="w-full mx-auto px-6 py-10 bg-white shadow-lg rounded-xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Review Application</h1>

        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <img
            src={formData?.profilePictureUrl || "https://via.placeholder.com/150"} // Optional chaining to avoid undefined errors
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div className="text-gray-700 text-lg font-semibold">
            {personalDetails.firstName} {personalDetails.lastName}
          </div>
        </div>

        {/* Personal Details */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>Title: <span className="font-medium">{personalDetails.title}</span></p>
            <p>Name: <span className="font-medium">{personalDetails.firstName} {personalDetails.lastName}</span></p>
            <p>Date of Birth: <span className="font-medium">{moment(personalDetails.dateOfBirth).format("DD MMM YYYY")}</span></p>
            <p>NI Number: <span className="font-medium">{personalDetails.nationalInsuranceNumber}</span></p>
            <p>NHS Number: <span className="font-medium">{personalDetails.nhsNumber}</span></p>
          </div>
        </section>

        {/* Application Details */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>Applied On: <span className="font-medium">{personalDetails.applicationDate ? moment(personalDetails.applicationDate).format("DD MMM YYYY") : "N/A"}</span></p>
            <p>Available From: <span className="font-medium">{personalDetails.availableFromDate ? moment(personalDetails.availableFromDate).format("DD MMM YYYY") : "N/A"}</span></p>
            <p>Employment Type: <span className="font-medium">{personalDetails.employmentType || "N/A"}</span></p>
            <p>Position: <span className="font-medium">{personalDetails.position || "N/A"}</span></p>
            <p>Source: <span className="font-medium">{personalDetails.source || "N/A"}</span></p>
            <p>Branch: <span className="font-medium">{personalDetails.branch || "N/A"}</span></p>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>Email: <span className="font-medium">{contact.email || "N/A"}</span></p>
            <p>Mobile Phone: <span className="font-medium">{contact.mobilePhone || "N/A"}</span></p>
            <p>Home Phone: <span className="font-medium">{contact.homePhone || "N/A"}</span></p>
            <p>Other Phone: <span className="font-medium">{contact.otherPhone || "N/A"}</span></p>
            <p>
              Address:
              <span className="font-medium">
                {contact.address || "N/A"}, {contact.cityOrTown || "N/A"}, {contact.stateOrProvince || "N/A"}, {contact.postCode || "N/A"}, {contact.country || "N/A"}
              </span>
            </p>
          </div>
        </section>

        {/* Demographic Information */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Demographic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>Gender: <span className="font-medium">{demography.gender || "N/A"}</span></p>
            <p>Marital Status: <span className="font-medium">{demography.maritalStatus || "N/A"}</span></p>
            <p>Ethnic Origin: <span className="font-medium">{demography.ethnicOrigin || "N/A"}</span></p>
          </div>
        </section>

        {/* Disability Information */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Disability Information</h2>
          <div className="space-y-2 text-gray-700">
            <p>Has Disability: <span className="font-medium">{demography.hasDisability ? "Yes" : "No"}</span></p>
            <p>Details: <span className="font-medium">{demography.disabilityDetails || ""}</span></p>
            <p>Needs Adjustment: <span className="font-medium">{demography.needsReasonableAdjustment ? "Yes" : "No"}</span></p>
            <p>Adjustment Details: <span className="font-medium">{demography.reasonableAdjustmentDetails || ""}</span></p>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 pt-6">
          <Button className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90" onClick={()=> onBack()}>
            Back
          </Button>
          <Button onClick={onSubmit} className="px-4 py-2 bg-supperagent text-white rounded-md hover:bg-supperagent/90">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
