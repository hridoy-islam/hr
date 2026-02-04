import { useState, useEffect } from 'react';
import {
  Users,
  FileCheck,
  Globe,
  Award,
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  GraduationCap,
  UserPlus,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useScheduleStatus } from '@/context/scheduleStatusContext';

const CompanyDashboardPage = () => {
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth.user);
  const { id } = useParams();

  // Consume the Schedule Status Context
  const { status, loading: loadingStats, refetchStatus } = useScheduleStatus();

  // Fetch Total Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!id) return;

      setLoadingEmployees(true);
      try {
        const response = await axiosInstance.get('/users', {
          params: {
            role: 'employee',
            company: id,
            limit: '1' // Optimization: Only get count metadata
          }
        });

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

    if (id) {
      refetchStatus();
    }
  }, [id, refetchStatus]);

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
      onClick: () => navigate(`/company/${id}/employee`),
      functional: true,
      isWarning: false
    },
    {
      title: 'PASSPORT CHECK',
      main: loadingStats ? '...' : status.passport,
      sub: getSubText(status.passport),
      icon: <BookOpen className="h-6 w-6" />,
      gradient: 'from-red-600 to-red-800',
      onClick: () => navigate(`/company/${id}/expiry/passport`),
      functional: true,
      isWarning: status.passport > 0
    },
    {
      title: 'RTW',
      main: loadingStats ? '...' : status.rtw,
      sub: getSubText(status.rtw),
      icon: <FileCheck className="h-6 w-6" />,
      onClick: () => navigate(`/company/${id}/expiry/rtw`),
      gradient: 'from-purple-600 to-purple-800',
      functional: true,
      isWarning: status.rtw > 0
    },
    {
      title: 'VISA CHECK',
      main: loadingStats ? '...' : status.visa,
      sub: getSubText(status.visa),
      icon: <Globe className="h-6 w-6" />,
      onClick: () => navigate(`/company/${id}/expiry/visa`),
      gradient: 'from-emerald-600 to-emerald-800',
      functional: true,
      isWarning: status.visa > 0
    },
    {
      title: 'DBS CHECK',
      main: loadingStats ? '...' : status.dbs,
      sub: getSubText(status.dbs),
      icon: <ShieldCheck className="h-6 w-6" />,
      onClick: () => navigate(`/company/${id}/expiry/dbs`),
      gradient: 'from-indigo-600 to-indigo-800',
      functional: true,
      isWarning: status.dbs > 0
    },
    {
      title: 'IMMIGRATION',
      main: loadingStats ? '...' : status.immigration,
      sub: getSubText(status.immigration),
      icon: <FileCheck className="h-6 w-6" />,
      onClick: () => navigate(`/company/${id}/expiry/immigration`),
      gradient: 'from-pink-600 to-pink-800',
      functional: true,
      isWarning: status.immigration > 0
    },
    {
      title: 'APPRAISAL',
      main: loadingStats ? '...' : status.appraisal,
      sub: getSubText(status.appraisal),
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-orange-600 to-orange-800',
      onClick: () => navigate(`/company/${id}/expiry/appraisal`),
      functional: true,
      isWarning: status.appraisal > 0
    },
    {
      title: 'SPOT CHECKS',
      main: loadingStats ? '...' : status.spot,
      sub: getSubText(status.spot),
      icon: <ClipboardCheck className="h-6 w-6" />,
      gradient: 'from-teal-600 to-teal-800',
      onClick: () => navigate(`/company/${id}/expiry/spot-check`),
      functional: true,
      isWarning: status.spot > 0
    },
    {
      title: 'SUPERVISION',
      main: loadingStats ? '...' : status.supervision,
      sub: getSubText(status.supervision),
      icon: <UserCheck className="h-6 w-6" />,
      gradient: 'from-cyan-600 to-cyan-800',
      onClick: () => navigate(`/company/${id}/expiry/supervision`),
      functional: true,
      isWarning: status.supervision > 0
    },
    {
      title: 'TRAINING',
      main: loadingStats ? '...' : status.training,
      sub: getSubText(status.training),
      icon: <GraduationCap className="h-6 w-6" />,
      gradient: 'from-rose-600 to-rose-800',
      onClick: () => navigate(`/company/${id}/expiry/training`),
      functional: true,
      isWarning: status.training > 0
    },
    {
      title: 'INDUCTION',
      main: loadingStats ? '...' : status.induction,
      sub: getSubText(status.induction),
      icon: <UserPlus className="h-6 w-6" />,
      gradient: 'from-lime-600 to-lime-800',
      onClick: () => navigate(`/company/${id}/expiry/induction`),
      functional: true,
      isWarning: status.induction > 0
    },
    {
      title: 'DISCIPLINARY',
      main: loadingStats ? '...' : status.disciplinary,
      sub: getSubText(status.disciplinary),
      icon: <AlertTriangle className="h-6 w-6" />,
      gradient: 'from-red-500 to-red-700',
      onClick: () => navigate(`/company/${id}/expiry/disciplinary`),
      functional: true,
      isWarning: status.disciplinary > 0
    },
    {
      title: 'QUALITY ASSURANCE',
      main: loadingStats ? '...' : status.qa,
      sub: getSubText(status.qa),
      icon: <ClipboardCheck className="h-6 w-6" />,
      gradient: 'from-violet-600 to-violet-800',
      onClick: () => navigate(`/company/${id}/expiry/qa`),
      functional: true,
      isWarning: status.qa > 0
    },
    // --- NEW CARD: EMPLOYEE DOCUMENTS ---
    {
      title: 'REQUIRED EMPLOYEE DOCUMENTS',
      main: loadingStats ? '...' : status.employeeDocument,
      sub: getSubText(status.employeeDocument),
      icon: <FolderOpen className="h-6 w-6" />,
      gradient: 'from-sky-600 to-sky-800', // Distinct Sky Blue
      onClick: () => navigate(`/company/${id}/required-employee-documents`),
      functional: true,
      isWarning: status.employeeDocument > 0
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
