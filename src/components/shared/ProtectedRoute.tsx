import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state: any) => state.auth.user); // Get user from Redux state

  if (!user) {
    // If there's no user, redirect to the login page
    return <Navigate to="/" replace />;
  }

  return children; // If user exists, render the children (dashboard)
};

export default ProtectedRoute;
