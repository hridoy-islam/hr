import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import { Tabs } from './Tabs';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import EmployeeDocumentTab from './tabs/DocumentTab'; // Assuming you still want this
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useToast } from '@/components/ui/use-toast';

const ServiceUserDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sid } = useParams(); 
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState<any>({});
  const [isFieldSaving, setIsFieldSaving] = useState<Record<string, boolean>>({});

  const fetchServiceUser = async () => {
    try {
      // Adjusted to match your GET route
      const response = await axiosInstance.get(`/serviceuser/${sid}`);
      setUser(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching service user data:', error);
      toast({ title: "Error fetching data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (sid) {
      fetchServiceUser();
    }
  }, [sid]);

  // Generic Update Handler that hits your PATCH /:id route
  const handleFieldUpdate = async (fieldName: string, value: any) => {
    setIsFieldSaving((prev) => ({ ...prev, [fieldName]: true }));
    try {
      await axiosInstance.patch(`/serviceuser/${sid}`, {
        [fieldName]: value
      });
      
      setFormData((prev: any) => ({ ...prev, [fieldName]: value }));
      setUser((prev: any) => ({ ...prev, [fieldName]: value }));
      
      toast({ title: "Service User Data Updated successfully" });
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      toast({ title: "Failed to update field", variant: "destructive" });
      // Revert form data on failure
      setFormData((prev: any) => ({ ...prev, [fieldName]: user[fieldName] }));
    } finally {
      setIsFieldSaving((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

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
      label: 'Personal Info',
      component: (
        <PersonalInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    { id: 'document', label: 'Documents', component: <EmployeeDocumentTab /> },
  ];

  return (
    <div className="mx-auto rounded-md bg-white p-4 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {user?.name || 'Unknown Service User'}
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

export default ServiceUserDetailsPage;