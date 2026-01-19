import { useState, useEffect } from 'react';
import { 
  Users, 
  FileCheck,     // For RTW
  Globe,         // For Visa
  Award,         // For Appraisal
  ShieldCheck,   // For DBS
  BookOpen       // For Passport
} from 'lucide-react';
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
  }, [user?._id]);

  // Card Configuration
  const dashboardCards = [
    {
      title: 'TOTAL EMPLOYEES',
      main: loading ? '...' : totalEmployees,
      sub: 'View All',
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-blue-600 to-blue-800',
      onClick: () => navigate('/company/employee'),
      functional: true
    },
    {
      title: 'PASSPORT CHECK',
      main: '0', 
      sub: 'All Valid',
      icon: <BookOpen className="h-6 w-6" />,
      gradient: 'from-red-600 to-red-800',
      functional: false
    },
    {
      title: 'RTW CHECK',
      main: '0', 
      sub: '0',
      icon: <FileCheck className="h-6 w-6" />,
      gradient: 'from-purple-600 to-purple-800',
      functional: false
    },
    {
      title: 'VISA CHECK',
      main: '0', 
  
      icon: <Globe className="h-6 w-6" />,
      gradient: 'from-emerald-600 to-emerald-800',
      functional: false
    },
    {
      title: 'APPRAISAL',
      main: '0',
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-orange-600 to-orange-800',
      functional: false
    },
    {
      title: 'DBS CHECK',
      main: '0',
      icon: <ShieldCheck className="h-6 w-6" />,
      gradient: 'from-indigo-600 to-indigo-800',
      functional: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardCards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.functional ? card.onClick : undefined}
            className={`transform rounded-xl bg-gradient-to-br ${card.gradient} p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              card.functional ? 'cursor-pointer' : 'cursor-default opacity-90'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="rounded-lg bg-white/20 p-4">
                {card.icon}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold mt-1">
                    {card.main}
                </p>
              
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyDashboardPage;