import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';

const CompanyDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const navigate = useNavigate();
  
  // Get the logged-in user (The Company) from Redux
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    const fetchEmployees = async () => {
      // Wait for user data to be available
      if (!user?._id) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get('/users', {
          params: {
            role: 'employee',
            company: user?._id, // Filter by this company's ID
            limit: 'all',
            fields: 'name' 
          }
        });

        const employees = response.data.data?.result || response.data.data || [];
        setTotalEmployees(employees.length);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
        setTotalEmployees(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [user?._id]); // Re-run if user ID changes/loads

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        
        {/* Total Employees Card */}
        <div
          onClick={() => navigate('/company/employee')}
          className="cursor-pointer transform rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-white/20 p-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Total Employees
              </h3>
              <p className="text-3xl font-bold mt-1">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  totalEmployees
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanyDashboardPage;