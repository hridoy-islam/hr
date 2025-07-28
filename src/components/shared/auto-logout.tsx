import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/features/authSlice'; // Adjust the import path
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/redux/store';

const AutoLogout = ({ inactivityLimit = 10 * 60 * 1000 }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  let timeout;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login'); // Redirect to login after logout
  };

  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(handleLogout, inactivityLimit);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, []);

  return null;
};

export default AutoLogout;
