import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  type ReactNode 
} from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';

// 1. Define the shape of the data
export interface ScheduleStatus {
  passport: number;
  visa: number;
  dbs: number;
  immigration: number;
  appraisal: number;
  rtw: number;
  spot: number;
  supervision: number;
  training: number;
  induction: number;
  disciplinary: number;
  qa: number;
}

interface ScheduleStatusContextType {
  status: ScheduleStatus;
  loading: boolean;
  refetchStatus: () => Promise<void>;
}

// Default state
const defaultStatus: ScheduleStatus = {
  passport: 0,
  visa: 0,
  dbs: 0,
  immigration: 0,
  appraisal: 0,
  rtw: 0,
  spot: 0,
  supervision: 0,
  training: 0,
  induction: 0,
  disciplinary: 0,
  qa: 0,


};

// 3. Create the Context
const ScheduleStatusContext = createContext<ScheduleStatusContextType | undefined>(undefined);

// 4. Create the Provider Component
export const ScheduleStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSelector((state: any) => state.auth); // Get logged-in company
  const [status, setStatus] = useState<ScheduleStatus>(defaultStatus);
  const [loading, setLoading] = useState<boolean>(true);
  const{id} = useParams()
  const fetchStatus = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axiosInstance.get(`/schedule-status/${id}`);
      
      if (response.data?.data) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch schedule status:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial Fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const value = {
    status,
    loading,
    refetchStatus: fetchStatus
  };

  return (
    <ScheduleStatusContext.Provider value={value}>
      {children}
    </ScheduleStatusContext.Provider>
  );
};

// 5. Custom Hook for easy usage
export const useScheduleStatus = () => {
  const context = useContext(ScheduleStatusContext);
  if (context === undefined) {
    throw new Error('useScheduleStatus must be used within a ScheduleStatusProvider');
  }
  return context;
};