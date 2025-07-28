
import AdminDashboardPage from './Dashboard/adminDhasboard';
import StaffDashboardPage from './Dashboard/serviceUserDashboard';
import ServiceUserDashboardPage from './Dashboard/serviceUserDashboard';
import { useSelector } from 'react-redux';

const PeoplePlannerPage = () => {
  const { user } = useSelector((state: any) => state.auth);
console.log(user)
  if (user.role === 'staff') {
    return (
      <div className="min-h-screen">
        <StaffDashboardPage  />
      </div>
    );
  }
  if (user.role === 'serviceUser') {
    return (
      <div className="min-h-screen ">
        <ServiceUserDashboardPage  />
      </div>
    );
  }
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen ">
        <AdminDashboardPage  />
      </div>
    );
  }
};

export default PeoplePlannerPage;
