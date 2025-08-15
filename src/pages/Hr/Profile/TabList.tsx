import React from 'react';
import {
  User,
  MapPin,
  Phone,
  BookOpen,
  Briefcase,
  FileCheck,
  GraduationCap,
  ChevronRight,
  File,
  BadgePoundSterling,
  BookCheck
} from 'lucide-react';
import { TabListProps, TabItemProps, TabType } from './types';

// Individual tab item component
const TabItem: React.FC<TabItemProps> = ({
  id,
  label,
  icon,
  isActive,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`text-md flex w-full items-center px-4 py-3 text-left ${
        isActive
          ? 'border-l-4 border-watney/60 bg-indigo-50 font-medium text-watney'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } transition-all duration-200`}
    >
      <span className="mr-3">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight
        size={16}
        className={`ml-2 transition-transform duration-200 ${isActive ? 'rotate-90 text-watney' : ''}`}
      />
    </button>
  );
};

const TabList: React.FC<TabListProps> = ({ activeTab, setActiveTab }) => {
  // Define tab data
  const tabs = [
    {
      id: 'personalDetails' as TabType,
      label: 'Personal Details',
      icon: <User size={20} />
    },
    {
      id: 'addressData' as TabType,
      label: 'Address',
      icon: <MapPin size={20} />
    },
    {
      id: 'emergencyContactData' as TabType,
      label: 'Emergency Contact',
      icon: <Phone size={20} />
    },
    {
      id: 'educationData' as TabType,
      label: 'Education',
      icon: <BookOpen size={20} />
    },
    {
      id: 'employmentData' as TabType,
      label: 'Employment',
      icon: <Briefcase size={20} />
    },
    {
      id: 'complianceData' as TabType,
      label: 'Miscellaneous',
      icon: <FileCheck size={20} />
    },
    {
      id: 'fundingData' as TabType,
      label: 'Funding Information',
      icon: <BadgePoundSterling size={20} />
    },
    {
      id: 'courseData' as TabType,
      label: 'Applied Courses',
      icon: <BookCheck size={20} />
    },

    {
      id: 'documentData' as TabType,
      label: 'Documents',
      icon: <File size={20} />
    }
  ];

  return (
    <div className="py-2">
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="text-lg font-medium text-gray-800">Profile Sections</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile information
        </p>
      </div>
      <nav className="mt-2">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={setActiveTab}
          />
        ))}
      </nav>
    </div>
  );
};

export default TabList;
