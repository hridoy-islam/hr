import { useSelector } from 'react-redux';
import AdminDashboardPage from './Dashboard/adminDashboard';
import StaffDashboardPage from './Dashboard/staffDashboard';
import { BlinkingDots } from '@/components/shared/blinking-dots';

const HrPage = () => {
  const user = useSelector((state: any) => state.auth?.user) || null;

  if (!user) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return user.role === 'admin' ? (
    <AdminDashboardPage />
  ) : (
    <StaffDashboardPage />
  );
};

export default HrPage;
