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
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 grid-cols-1 gap-12 items-center">
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
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4">
              404
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              PAGE NOT FOUND
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
     
           

            {/* Dashboard/Home Button */}
            <Button
              onClick={handleNavigateToDashboard}
              variant={'outline'}
            >
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