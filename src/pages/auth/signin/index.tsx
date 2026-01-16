import { Layers } from 'lucide-react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import UserAuthForm from './components/user-auth-form';
import signIn from '../../../assets/imges/home/signIn.png';

export default function SignInPage() {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
  if (!user) return;

  if (user?.role === 'admin') {
    navigate('/admin');
  } else if (user?.role === 'company') {
    navigate('/company');  
  } else {
    navigate('/'); 
  }
}, [user, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-supperagent">Sign In</h2>
          </div>

          <UserAuthForm />
        </div>
      </div>

      {/* Right Section */}
      <div className="relative hidden w-1/2 bg-supperagent lg:block">
        <div className="flex h-full flex-col justify-around gap-4 p-8">
          <div className="flex items-start justify-start gap-2 text-white">
            <Layers className="h-8 w-8" />
            <span className="text-2xl font-semibold">HR</span>
          </div>
          {/* Logo */}

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 ">
              <img
                src={signIn}
                alt="Desk illustration"
                width={350}
                height={200}
              />
            </div>
            <div className="w-full">
              <h1 className="mb-3 text-3xl font-bold text-white text-center">
                A few more clicks to sign in to your account.
              </h1>
            </div>
            <p className="text-lg font-medium text-white">
              Manage all your recruitment and employee accounts in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
