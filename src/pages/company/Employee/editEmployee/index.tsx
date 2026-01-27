import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import { Tabs } from './Tabs';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import ContactInfoTab from './tabs/ContactInfoTab';
import EmploymentDetailsTab from './tabs/EmploymentDetailsTab';
import IdentificationTab from './tabs/IdentificationTab';
import RightToWorkTab from './tabs/RightToWorkTab';
import PayrollTab from './tabs/PayrollTab';
import EqualityInfoTab from './tabs/EqualityInfoTab';
import DisabilityInfoTab from './tabs/DisabilityInfoTab';
import BeneficiaryTab from './tabs/BeneficiaryTab';
import NotesTab from './tabs/NotesTab';
import { useEditEmployee } from './useEditEmployee';
import axiosInstance from '@/lib/axios';
import SettingsTab from './tabs/settings';
import TrainingTab from './tabs/TrainingTab';
import HolidayTab from './tabs/HolidayTab';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import EmployeeDocumentTab from './tabs/DocumentTab';
import VisaTab from './tabs/VisaTab';
import DbsTab from './tabs/DbsTab';
import PassportTab from './tabs/passportTab';
import ImmigrationTab from './tabs/ImmigrationTab';
import AppraisalTab from './tabs/AppraisalTab';
import SpotCheckTab from './tabs/SpotCheckTab';
import InductionTab from './tabs/InductionTab';
import DisciplinaryTab from './tabs/DisciplinaryTab';
import QACheckTab from './tabs/QATab';
import SupervisionTab from './tabs/SuperVisionCheckTab';
const EditEmployee = () => {
  const navigate = useNavigate();
  const {
    loading,
    activeTab,
    setActiveTab,
    formData,
    handleFieldUpdate,
    handleNestedFieldUpdate,
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving
  } = useEditEmployee();

  const location = useLocation();

  const { id,eid } = useParams();

  const [user, setUser] = useState(null);
  const fetchEmployee = async () => {
    try {
      const response = await axiosInstance.get(`/users/${eid}`);

      setUser(response.data.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);

  useEffect(() => {
    fetchEmployee();
  }, [eid]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex justify-center py-6">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'personal',
      label: 'Personal',
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
    { id: 'document', label: 'Documents', component: <EmployeeDocumentTab /> },

    {
      id: 'rightToWork',
      label: 'Right To Work',
      component: (
        <RightToWorkTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'visa',
      label: 'Visa',
      component: (
        <VisaTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'dbs',
      label: 'DBS',
      component: (
        <DbsTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'passport',
      label: 'Passport',
      component: (
        <PassportTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'immigration',
      label: 'Immigration',
      component: (
        <ImmigrationTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'appraisal',
      label: 'Appraisal',
      component: (
        <AppraisalTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'spotcheck',
      label: 'Spot Check',
      component: (
        <SpotCheckTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'induction',
      label: 'Induction',
      component: (
        <InductionTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'qa',
      label: 'Quality Assurance',
      component: (
        <QACheckTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'disciplinary',
      label: 'Disciplinary',
      component: (
        <DisciplinaryTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'supervision',
      label: 'Super Vision Check',
      component: (
        <SupervisionTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          onDateChange={handleDateChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'training',
      label: 'Training',
      component: (
        <TrainingTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'holiday',
      label: 'Holiday',
      component: <HolidayTab formData={formData} />
    },
    {
      id: 'contact',
      label: 'Address',
      component: (
        <ContactInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'employment',
      label: 'Employment',
      component: (
        <EmploymentDetailsTab
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
      id: 'identification',
      label: 'Identification',
      component: (
        <IdentificationTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          isFieldSaving={isFieldSaving}
        />
      )
    },

    {
      id: 'payroll',
      label: 'Payroll',
      component: (
        <PayrollTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onNestedUpdate={handleNestedFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'equality',
      label: 'Equality',
      component: (
        <EqualityInfoTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onSelectChange={handleSelectChange}
          onCheckboxChange={handleCheckboxChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'disability',
      label: 'Disability',
      component: (
        <DisabilityInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onCheckboxChange={handleCheckboxChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'beneficiary',
      label: 'Next Of Kin',
      component: (
        <BeneficiaryTab
          formData={formData}
          onUpdate={handleNestedFieldUpdate}
          onSelectChange={handleSelectChange}
          onCheckboxChange={handleCheckboxChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },

    {
      id: 'settings',
      label: 'Settings',
      component: (
        <SettingsTab
          formData={formData}
          onDateChange={handleDateChange}
          onUpdate={handleNestedFieldUpdate}
          onSelectChange={handleSelectChange}
          onCheckboxChange={handleCheckboxChange}
          isFieldSaving={isFieldSaving}
        />
      )
    }
  ];

  return (
    <div className="mx-auto rounded-md bg-white p-4 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {user?.title} {user?.firstName} {user?.initial} {user?.lastName}
        </h1>
        <Button
          variant="outline"
          className="border-none bg-theme text-white hover:bg-theme/90"
          onClick={() => navigate(-1)}
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default EditEmployee;
