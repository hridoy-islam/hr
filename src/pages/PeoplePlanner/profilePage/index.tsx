import React, { useEffect, useState } from 'react';
import TabList from './TabList';
import TabContent from './TabContent';
import { TabType } from './types';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personalDetails');
  const { user } = useSelector((state: any) => state.auth);
  const [userData, setUserData] = useState<any>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);


  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${user._id}`);
      setUserData(response.data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
     
    }finally{
       setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user, refreshCounter]);

  const refreshData = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="min-h-full ">
      <div className=" mx-auto  px-4 ">
        {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1> */}

        <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md md:flex-row">
          <div className=" border-gray-200 bg-gray-50 md:border-r">
            <TabList activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="flex-1 p-6">
            <TabContent
              activeTab={activeTab}
              userData={userData}
              refreshData={refreshData}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
