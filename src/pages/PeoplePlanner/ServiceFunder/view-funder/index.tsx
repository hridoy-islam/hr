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
import ContactTab from './tabs/ContactTab';
import TravelTab from './tabs/TravelTab';
import InvoiceTab from './tabs/InvoiceTab';
import InvoiceContactTab from './tabs/InvoiceContactTab';
import PurchaseOrderTab from './tabs/PurchaseOrderTab';
import TravelRateDetailTab from './tabs/TravelDetailsTab';
import AdhocInvoiceTab from './tabs/AdhocInvoiceTab';

const ServiceFunderDetailPage = () => {
  const [showNotification, setShowNotification] = useState(true);

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
    getTabValidation,
    getMissingFields
  } = useEditApplicant();

  const tabValidation = getTabValidation();

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
      label: 'Communication',
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
      id: 'travel',
      label: 'Travel Information',
      component: (
        <TravelTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'invoice',
      label: 'Invoice',
      component: (
        <InvoiceTab
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
      id: 'invoiceContact',
      label: 'Invoice Contact',
      component: (
        <InvoiceContactTab
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
      id: 'po',
      label: 'PO',
      component: (
        <PurchaseOrderTab
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
      id: 'travelDetails',
      label: 'Travel Details',
      component: (
        <TravelRateDetailTab
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
      id: 'adhocInvoice',
      label: 'Adhoc Invoice',
      component: (
        <AdhocInvoiceTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    }
  ];

  const handleTabNavigation = (tabId: string) => {
    setActiveTab(tabId);
    setShowNotification(false);
  };

  const incompleteTabsCount = Object.values(tabValidation).filter(
    (validation) => !validation.isValid
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-8 sm:px-2 lg:px-2">
        <div className="-mt-8 mb-4 flex items-center justify-between">
          <div>
            <p className="mt-2 text-3xl font-semibold text-gray-600">
              {formData.firstName && formData.lastName
                ? `${formData.title || ''} ${formData.firstName} ${formData.lastName}`.trim()
                : 'Service Funder'}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-supperagent bg-supperagent text-white  hover:bg-supperagent/90"
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

          {incompleteTabsCount > 0 && (
            <div className="">
              <ValidationNotification
                validation={tabValidation}
                onTabClick={handleTabNavigation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceFunderDetailPage;
