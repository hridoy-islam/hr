import { useState, useEffect } from 'react';
import {
  Users,
  FileCheck, // For RTW (Immigration)
  Globe, // For Visa
  Award, // For Appraisal
  ShieldCheck, // For DBS
  BookOpen // For Passport
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
// 1. Import the Context Hook
import { useScheduleStatus } from '@/context/scheduleStatusContext';

const CompanyDashboardPage = () => {
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);

  // 2. Consume the Schedule Status Context
  // This gives us the global stats (passport, visa, etc.) and the refresh function
  const { status, loading: loadingStats, refetchStatus } = useScheduleStatus();

  // Fetch Total Employees (Keep this local as it's specific to this page)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?._id) return;

      setLoadingEmployees(true);
      try {
        const response = await axiosInstance.get('/users', {
          params: {
            role: 'employee',
            company: user?._id,
            limit: '1' // Optimization: Only get count metadata
          }
        });

        // Handle different API response structures for count
        const total =
          response.data.data?.meta?.total ||
          response.data.data?.result?.length ||
          0;
        setTotalEmployees(total);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
        setTotalEmployees(0);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();

    // Optional: Refresh context stats when dashboard mounts to ensure data is fresh
    if (user?._id) {
      refetchStatus();
    }
  }, [user?._id, refetchStatus]);

  // Helper to generate sub-text based on count
  const getSubText = (count: number) =>
    count > 0 ? `${count} Pending Action(s)` : 'All Valid';

  // Card Configuration
  const dashboardCards = [
    {
      title: 'TOTAL EMPLOYEES',
      main: loadingEmployees ? '...' : totalEmployees,
      sub: 'View All',
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-blue-600 to-blue-800',
      onClick: () => navigate('/company/employee'),
      functional: true,
      isWarning: false
    },
    {
      title: 'PASSPORT CHECK',
      main: loadingStats ? '...' : status.passport,
      sub: getSubText(status.passport),
      icon: <BookOpen className="h-6 w-6" />,
      gradient: 'from-red-600 to-red-800',
      onClick: () => navigate('/company/expiry/passport'),
      functional: true,
      isWarning: status.passport > 0
    },
    {
      title: 'RTW',
      main: loadingStats ? '...' : status.rtw,
      sub: getSubText(status.rtw),
      icon: <FileCheck className="h-6 w-6" />,
      onClick: () => navigate('/company/expiry/rtw'),
      gradient: 'from-purple-600 to-purple-800',
      functional: true,
      isWarning: status.rtw > 0
    },
    {
      title: 'VISA CHECK',
      main: loadingStats ? '...' : status.visa,
      sub: getSubText(status.visa),
      icon: <Globe className="h-6 w-6" />,
      onClick: () => navigate('/company/expiry/visa'),
      gradient: 'from-emerald-600 to-emerald-800',
      functional: true,
      isWarning: status.visa > 0
    },
    {
      title: 'APPRAISAL',
      main: loadingStats ? '...' : status.appraisal,
      sub: getSubText(status.appraisal),
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-orange-600 to-orange-800',
      onClick: () => navigate('/company/expiry/appraisal'),
      functional: true,
      isWarning: status.appraisal > 0
    },
    {
      title: 'Immigration',
      main: loadingStats ? '...' : status.immigration,
      sub: getSubText(status.immigration),
      icon: <FileCheck className="h-6 w-6" />,
      onClick: () => navigate('/company/expiry/immigration'),
      gradient: 'from-purple-600 to-purple-800',
      functional: true,
      isWarning: status.immigration > 0
    },
    {
      title: 'DBS CHECK',
      main: loadingStats ? '...' : status.dbs,
      sub: getSubText(status.dbs),
      icon: <ShieldCheck className="h-6 w-6" />,
      onClick: () => navigate('/company/expiry/dbs'),
      gradient: 'from-indigo-600 to-indigo-800',
      functional: true,
      isWarning: status.dbs > 0
    }
  ];

  return (
    <div className="">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardCards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.functional ? card.onClick : undefined}
            className={`
              relative transform overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md transition-all 
              duration-300 ${card.gradient}
              ${card.functional ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : 'cursor-default opacity-95'}
            `}
          >
            <div className="relative z-10 flex items-center space-x-4">
              <div className="rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                {card.icon}
              </div>
              <div className="flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {card.title}
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {card.main}
                  </p>
                </div>
                <p
                  className={`mt-1 text-xs font-medium ${card.isWarning ? 'animate-pulse text-yellow-300' : 'text-white/70'}`}
                >
                  {card.sub}
                </p>
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
