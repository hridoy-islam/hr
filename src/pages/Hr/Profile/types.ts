import { User } from '../../types/user.types';

export type TabType = 
  | 'personalDetails'
  | 'addressData'
  | 'emergencyContactData'
  | 'educationData'
  | 'employmentData'
  | 'complianceData'
  | 'documentData'
  | 'fundingData'
  | 'courseData'

export interface TabItemProps {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (tab: TabType) => void;
}

export interface TabListProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export interface TabContentProps {
  activeTab: TabType;
  userData: User;
  refreshData: any;
  loading: any;
}

