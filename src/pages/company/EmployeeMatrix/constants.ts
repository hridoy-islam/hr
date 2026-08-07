export interface OptionType {
  value: string;
  label: string;
}

export const MODULES: OptionType[] = [
  { value: 'passport', label: 'Passport Check' },
  { value: 'rtw', label: 'Right to Work (RTW)' },
  { value: 'visa', label: 'Visa Check' },
  { value: 'dbs', label: 'DBS Check' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'spot', label: 'Spot Checks' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'training', label: 'Training' },
  { value: 'induction', label: 'Induction' },
  { value: 'disciplinary', label: 'Disciplinary' },
  { value: 'qa', label: 'Quality Assurance' },
  { value: 'required-documents', label: 'Required Documents' },
];

export const TRAINING_STATUSES: OptionType[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'missing', label: 'Not Assigned' }
];

// Add RTW specific statuses
export const RTW_STATUSES: OptionType[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'missing', label: 'Not Set' }
];