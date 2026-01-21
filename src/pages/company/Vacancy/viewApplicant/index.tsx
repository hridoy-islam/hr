import React from 'react';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import { Tabs } from './components/Tabs';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import AddressTab from './tabs/AddressTab';
import MiscellaneousTab from './tabs/MiscellaneousTab';
import { useEditApplicant } from './hooks/useEditApplicant';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useParams } from 'react-router-dom';
import DocumentsTab from './tabs/DocumentTab';

const ApplicantDetailPage = () => {
  const {
    loading,
    activeTab,
    setActiveTab,
    formData,
    handleFieldUpdate,
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving,
    fetchApplicant
  } = useEditApplicant();
  const { id } = useParams();
  if (loading) {
    return (
      <div className="flex  items-center justify-center ">
        <div className="text-center">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'personal',
      label: 'Personal Info',
      component: (
        <PersonalInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'address',
      label: 'Address & Contact',
      component: (
        <AddressTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'miscellaneous',
      label: 'Application Details',
      component: (
        <MiscellaneousTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          onCheckboxChange={handleCheckboxChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'documents',
      label: 'Documents',
      component: (
        <DocumentsTab
          formData={formData}
          applicantId={id || ''}
          onRefresh={fetchApplicant}
        />
      )
    }
  ];

  return (
    <div className=" rounded-md bg-white p-4 shadow-sm">
      <div className=" mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-row items-center gap-2 text-xl font-bold">
            <h1 className="">Applicant:</h1>
            <p className=" ">
              {formData.firstName && formData.lastName
                ? `${formData.title || ''} ${formData.firstName} ${formData.lastName}`.trim()
                : 'Manage applicant information'}
            </p>
          </div>
          <Button
            variant="outline"
            size={'sm'}
            className="border-theme bg-theme text-white hover:border-theme hover:bg-theme/90"
            onClick={() => window.history.back()}
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default ApplicantDetailPage;
