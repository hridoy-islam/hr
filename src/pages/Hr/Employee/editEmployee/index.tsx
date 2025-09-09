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
import axiosInstance from "@/lib/axios"
import SettingsTab from './tabs/settings';
import TrainingTab from './tabs/TrainingTab';
import HolidayTab from './tabs/HolidayTab';
import { BlinkingDots } from '@/components/shared/blinking-dots';
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



  const{id} = useParams()
 
const [user, setUser] = useState(null);
  const fetchEmployee=async()=>{
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      
      setUser(response.data.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      throw error;
    }
  }
  
  
  useEffect(() => {
  if (location.state?.activeTab) {
    setActiveTab(location.state.activeTab);
  }
}, [location.state, setActiveTab]);


  useEffect(() => {
    fetchEmployee();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex justify-center py-6">
                <BlinkingDots size="large" color="bg-supperagent" />
              </div>
      </div>
    );
  }



 


  const tabs = [
    { id: 'personal', label: 'Personal', component: <PersonalInfoTab formData={formData} onUpdate={handleFieldUpdate} onDateChange={handleDateChange} onSelectChange={handleSelectChange} isFieldSaving={isFieldSaving} /> },
    { id: 'contact', label: 'Contact', component: <ContactInfoTab formData={formData} onUpdate={handleFieldUpdate} onSelectChange={handleSelectChange} isFieldSaving={isFieldSaving} /> },
    { id: 'employment', label: 'Employment', component: <EmploymentDetailsTab formData={formData} onUpdate={handleFieldUpdate} onDateChange={handleDateChange} onSelectChange={handleSelectChange} onCheckboxChange={handleCheckboxChange} isFieldSaving={isFieldSaving} /> },
    { id: 'identification', label: 'Identification', component: <IdentificationTab formData={formData} onUpdate={handleFieldUpdate} isFieldSaving={isFieldSaving} /> },
    { id: 'rightToWork', label: 'Right to Work', component: <RightToWorkTab formData={formData} onUpdate={handleNestedFieldUpdate} onCheckboxChange={handleCheckboxChange} onDateChange={handleDateChange} isFieldSaving={isFieldSaving} /> },
    { id: 'payroll', label: 'Payroll', component: <PayrollTab formData={formData} onUpdate={handleFieldUpdate} onNestedUpdate={handleNestedFieldUpdate} onSelectChange={handleSelectChange} isFieldSaving={isFieldSaving} /> },
    { id: 'equality', label: 'Equality', component: <EqualityInfoTab formData={formData} onUpdate={handleNestedFieldUpdate} onSelectChange={handleSelectChange} onCheckboxChange={handleCheckboxChange} isFieldSaving={isFieldSaving} /> },
    { id: 'disability', label: 'Disability', component: <DisabilityInfoTab formData={formData} onUpdate={handleFieldUpdate} onCheckboxChange={handleCheckboxChange} isFieldSaving={isFieldSaving} /> },
    { id: 'beneficiary', label: 'Beneficiary', component: <BeneficiaryTab formData={formData} onUpdate={handleNestedFieldUpdate} onSelectChange={handleSelectChange} onCheckboxChange={handleCheckboxChange} isFieldSaving={isFieldSaving} /> },
    // { id: 'notes', label: 'Notes', component: <NotesTab formData={formData} onUpdate={handleFieldUpdate} isFieldSaving={isFieldSaving} /> },
    { id: 'training', label: 'Training', component: <TrainingTab formData={formData} onUpdate={handleFieldUpdate} isFieldSaving={isFieldSaving} /> },
    { id: 'holiday', label: 'Holiday', component: <HolidayTab  /> },
    { id: 'settings', label: 'Settings', component: <SettingsTab formData={formData}  onDateChange={handleDateChange} onUpdate={handleNestedFieldUpdate} onSelectChange={handleSelectChange} onCheckboxChange={handleCheckboxChange} isFieldSaving={isFieldSaving} /> },
  ];

  return (
    <div className="mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{user?.title} {user?.firstName} {user?.initial} {user?.lastName}</h1>
        <Button
          variant="outline"
          className="border-none bg-supperagent text-white hover:bg-supperagent/90"
          onClick={() => navigate(-1)}
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
  );
};

export default EditEmployee;