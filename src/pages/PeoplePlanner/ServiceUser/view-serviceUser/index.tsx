import React, { useState } from 'react';
import { MoveLeft, AlertCircle } from 'lucide-react';
import { Tabs } from './components/Tabs';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import AddressTab from './tabs/ContactTab';
import MiscellaneousTab from './tabs/MiscellaneousTab';
import EqualityTab from './tabs/EqualityTab';
import { ValidationNotification } from './components/ValidationNotification';
import { useEditApplicant } from './hooks/useEditApplicant';
import { Button } from '@/components/ui/button';
import EmergencyContactTab from './tabs/EmergencyContacTab';
import CriticalInfoTab from './tabs/CriticalInformation';
import EquipmentTab from './tabs/EquipmentTab';

import NoteTab from './tabs/NoteTab';
import PrimaryBranchTab from './tabs/PrimaryBranchTab';
import ContactTab from './tabs/ContactTab';
import { useParams } from 'react-router-dom';

const ServiceuserDetailPage = () => {
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
    getMissingFields,
    getTabValidation
  } = useEditApplicant();

  const tabValidation = getTabValidation();
  const { id } = useParams();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 font-medium text-gray-600">
            Loading applicant data...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      component: (
        <PersonalInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'contact',
      label: 'Contact',
      component: (
        <ContactTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'equality',
      label: 'Equality',
      component: (
        <EqualityTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'other',
      label: 'Other',
      component: (
        <MiscellaneousTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'emergency',
      label: 'Emergency Contact',
      component: (
        <EmergencyContactTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'criticalInfo',
      label: 'Critical Information',
      component: (
        <CriticalInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'equipment',
      label: 'Required Equipment',
      component: (
        <EquipmentTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'primaryBranch',
      label: 'Branch & Area',
      component: (
        <PrimaryBranchTab
          formData={formData}
          onDateChange={handleDateChange}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'note',
      label: 'Note',
      component: (
        <NoteTab
          formData={formData}
          onDateChange={handleDateChange}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    }
  ];

  const handleTabNavigation = (tabId: string) => {
    setActiveTab(tabId);
  };

  const incompleteTabsCount = Object.values(tabValidation).filter(
    (validation) => !validation.isValid
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-8 sm:px-2 lg:px-2">
        <div className="-mt-8 mb-4 flex items-center justify-between">
          <p className="mt-2 text-3xl font-semibold text-gray-600">
            {formData.firstName && formData.lastName
              ? `${formData.title || ''} ${formData.firstName} ${formData.lastName}`.trim()
              : 'Service User'}
          </p>

          <Button
            variant="outline"
            className="border-none bg-supperagent text-white  hover:bg-supperagent/90"
            onClick={() => window.history.back()}
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              validation={tabValidation}
            />
          </div>

          <div className="">
            <ValidationNotification
              validation={tabValidation}
              onTabClick={handleTabNavigation}
              userId={id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceuserDetailPage;
