import React from 'react';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import { Tabs } from './components/Tabs';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import AddressTab from './tabs/AddressTab';
import MiscellaneousTab from './tabs/MiscellaneousTab';
import NotesTab from './tabs/NotesTab';
import { useEditApplicant } from './hooks/useEditApplicant';

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
    isFieldSaving
  } = useEditApplicant();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-supperagent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading applicant data...</p>
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
      id: 'notes', 
      label: 'Notes', 
      component: (
        <NotesTab 
          formData={formData} 
          onUpdate={handleFieldUpdate} 
          isFieldSaving={isFieldSaving} 
        />
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applicant</h1>
            <p className="mt-2 text-gray-600">
              {formData.firstName && formData.lastName 
                ? `${formData.title || ''} ${formData.firstName} ${formData.lastName}`.trim()
                : 'Manage applicant information'
              }
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-supperagent text-white border-supperagent hover:bg-supperagent/90 hover:border-supperagent"
            onClick={() => window.history.back()}
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
};

export default ApplicantDetailPage;