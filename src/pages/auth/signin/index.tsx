import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UserAuthForm from './components/user-auth-form';
import AuthLayout from '../components/auth-layout';
import signIn from '../../../assets/imges/home/signIn.png';

export default function SignInPage() {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'company') {
      navigate(`/company/${user?._id}`);
    } else if (user?.role === 'companyAdmin') {
      navigate(`/company/${user?.company}`);
    } else if (user?.role === 'employee') {
      navigate(`/company/${user?.company}/staff/${user?._id}`);
    } else if (user?.role === 'attendance') {
      navigate(`/company/${user?.company}/employee-attendance`);
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <AuthLayout
      title="Sign In"
      image={signIn}
      imageAlt="Desk illustration"
      heading="A few more clicks to sign in to your account."
    >
      <UserAuthForm />
    </AuthLayout>
  );
}
