import React, { useState } from 'react';
import { TabContentProps } from './types';
import PersonalDetails from './tabs/PersonalDetails';
import AddressData from './tabs/AddressData';
import EmergencyContactData from './tabs/EmergencyContactData';
import EducationData from './tabs/EducationData';
import EmploymentData from './tabs/EmploymentData';
import ComplianceData from './tabs/ComplianceData';
import CourseDetails from './tabs/CourseDetails';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { useSelector } from 'react-redux';
import DocumentData from './tabs/DocumentData';
import FundingData from './tabs/FundingData';
import CourseData from './tabs/CourseData';


const TabContent: React.FC<TabContentProps> = ({ activeTab, userData,refreshData,loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useSelector((state: any) => state.auth);

 const { toast } = useToast();

  const handleSave = async (updatedUserData) => {
    try {
      await axiosInstance.patch(`/users/${user._id}`, updatedUserData);

      setIsEditing(false);
      toast({ title: 'Changes saved successfully!' });

    } catch (error) {
      console.error('Error updating user data:', error);
      toast({title:'Failed to save changes. Please try again.', className:"destructive"});
    }
  };
  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Render the appropriate tab content based on the active tab
  const renderTabContent = () => {
    const commonProps = {
      userData,
      isEditing,
      onSave: handleSave,
      onCancel: handleCancel,
      onEdit: handleEdit,
       refreshData,
       loading
    };

    switch (activeTab) {
      case 'personalDetails':
        return <PersonalDetails {...commonProps} />;
      case 'addressData':
        return <AddressData {...commonProps} />;
      case 'emergencyContactData':
        return <EmergencyContactData {...commonProps} />;
      case 'educationData':
        return <EducationData {...commonProps} />;
      case 'employmentData':
        return <EmploymentData {...commonProps} />;
      case 'complianceData':
        return <ComplianceData {...commonProps} />;
      case 'fundingData':
        return <FundingData {...commonProps} />;
      case 'documentData':
        return <DocumentData {...commonProps} />;
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return <div className="animate-fadeIn">{renderTabContent()}</div>;
};

export default TabContent;
