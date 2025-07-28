import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertToLowerCase = (value) => {
  return value.toLowerCase();
};

export const isStudentDataComplete = (student, hasRequiredDocuments) => {
  if (!student) return false; // If student is null or undefined, return false

  const requiredFields = [
    'title',
    'firstName',
    'lastName',
    'dob',
    'phone',
    'email',
    'gender',
    'maritualStatus',
    'nationality',
    'countryResidence',
    'countryBirth',
    'nativeLanguage',
    'addressLine1',
    'townCity',
    'postCode',
    'country',
    'disabilities',
    'ethnicity',
    'genderIdentity',
    'sexualOrientation',
    'religion'
  ];

  // Check if all required fields have a value
  const allFieldsFilled = requiredFields.every((field) => {
    const value = field.includes('?') // Check if the field is nested
      ? field.split('.').reduce((obj, key) => obj?.[key], student)
      : student[field];

    return Boolean(value); // Returns false if any required field is empty/null/undefined
  });
  // Check if emergencyContact array is not empty
  const hasEmergencyContact =
    Array.isArray(student.emergencyContact) &&
    student.emergencyContact.length > 0;
  // Check if academicHistory is required and if it's present when required

  // Logic for academicHistory
  const hasAcademicHistory =
    student.academicHistoryRequired ||
    (Array.isArray(student.academicHistory) &&
      student.academicHistory.length > 0);

  // Logic for englishLanguageExam
  const hasEnglishLanguageExam =
    student.englishLanguageRequired ||
    (Array.isArray(student.englishLanguageExam) &&
      student.englishLanguageExam.length > 0);

  // Logic for workExperience
  const hasWorkExperience =
    student.workExperience ||
    (Array.isArray(student.workDetails) && student.workDetails.length > 0);

  // Return the final result, checking all conditions
  return (
    allFieldsFilled &&
    hasEmergencyContact &&
    hasAcademicHistory &&
    hasEnglishLanguageExam &&
    hasWorkExperience &&
    hasRequiredDocuments
  );
};

// Function to check if personal info is complete
export const isPersonalInfoComplete = (student) => {
  if (!student) return false; // Ensure student exists

  const requiredFields = [
    'title',
    'firstName',
    'lastName',
    'dob',
    'phone',
    'email',
    'gender',
    'maritualStatus',
    'nationality',
    'countryResidence',
    'countryBirth',
    'nativeLanguage',
    'addressLine1',
    'townCity',
    'postCode',
    'country',
    'disabilities',
    'ethnicity',
    'genderIdentity',
    'sexualOrientation',
    'religion'
  ];

  // Check if all required fields are filled
  const hasAllFields = requiredFields.every((field) => Boolean(student[field]));

  // Check if emergencyContact array exists and is not empty
  const hasEmergencyContact =
    Array.isArray(student.emergencyContact) &&
    student.emergencyContact.length > 0;

  return hasAllFields && hasEmergencyContact; // Ensure both conditions are met
};

// Function to check if academic history and English language exam requirements are met
export const isAcademicInfoComplete = (student) => {
  if (!student) return false; // Ensure student exists

  // Check if academic history is required or if there's valid data in the array
  const hasAcademicHistory =
    student.academicHistoryRequired ||
    (Array.isArray(student.academicHistory) &&
      student.academicHistory.length > 0);

  // Check if English language exam is required or if there's valid data in the array
  const hasEnglishLanguageExam =
    student.englishLanguageRequired ||
    (Array.isArray(student.englishLanguageExam) &&
      student.englishLanguageExam.length > 0);

  return hasAcademicHistory && hasEnglishLanguageExam; // Ensure both conditions are met
};

// Logic for workExperience
export const isWorkExperienceComplete = (student) => {
  if (!student) return false; // Ensure student exists

  // Check if workExperience or workDetails array is present and not empty
  const hasWorkExperience =
    student.workExperience ||
    (Array.isArray(student.workDetails) && student.workDetails.length > 0);

  return hasWorkExperience;
};

// Logic for checking if documents are complete
export const isDocumentComplete = (student) => {
  if (!student) return false; 

  const hasDocuments =
    Array.isArray(student.documents) &&
    student.documents.length > 0 &&
    student.documents.every(
      (doc) => doc.file_type && doc.fileUrl
    );

  return hasDocuments;
};

export interface StaffPrivilege {
  management: {
    course: boolean;
    term: boolean;
    institution: boolean;
    academicYear: boolean;
    courseRelation: boolean;
    emails: boolean;
    drafts: boolean;
    invoices: boolean;
    staffs: boolean;
    agent: boolean;
  };
  student: {
    assignStaff: boolean;
    account: boolean;
    agentChange: boolean;
    applicationStatus: boolean;
    search: { agent: boolean; staff: boolean };
    communication: boolean;
    notes: boolean;
  };
}
