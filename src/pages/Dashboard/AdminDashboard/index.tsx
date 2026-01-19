import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/users', {
          params: {
            role: 'company',
            limit: 'all',
            fields: 'name'
          }
        });

        const companies = response.data.data?.result || response.data.data || [];
        setTotalCompanies(companies.length);
      } catch (error) {
        console.error('Failed to fetch company data:', error);
        setTotalCompanies(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="min-h-screen  ">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        
        {/* Total Company Card */}
        <div
          onClick={() => navigate('company')}
          className="cursor-pointer transform rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-white/20 p-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Total Company
              </h3>
              <p className="text-3xl font-bold mt-1">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  totalCompanies
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
