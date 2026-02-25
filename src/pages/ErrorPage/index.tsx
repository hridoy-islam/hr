import React from 'react';
import errorPage from '../../assets/imges/home/errorpage.png';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';

const ErrorPage = () => {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();

  // ✅ FIX: Remove automatic navigation - let user choose where to go

  // Navigate back to previous page
  const handleGoBack = () => {
    navigate(-1); // Go back to previous page in history
  };

  // Navigate based on user role
  const handleNavigateToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'company') {
      navigate(`/company/${user?._id}`);
    } else if (user?.role === 'employee') {
      navigate(`/company/${user?.company}/staff/${user?._id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Error Image */}
        <div className="flex justify-center">
          <img
            src={errorPage}
            alt="Page Not Found"
            className="w-full max-w-md object-contain"
          />
        </div>

        {/* Error Content */}
        <div className="space-y-8">
          <div>
            <h1 className="mb-4 text-6xl font-bold text-gray-900 md:text-7xl">
              404
            </h1>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              PAGE NOT FOUND
            </h2>
            <p className="mb-6 text-lg text-gray-600">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Dashboard/Home Button */}
            <Button onClick={handleNavigateToDashboard} variant={'outline'}>
              {user?.role === 'admin' || user?.role === 'company'
                ? 'Go to Dashboard'
                : 'Back to Home'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
