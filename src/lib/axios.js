import axios from 'axios';
import { logout } from '../redux/features/authSlice';
import store from '../redux/store';


// Create Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // Allows cookies (for refresh token) to be sent
});

// Request interceptor: Attach access token to all outgoing requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem('hr')); // Access token
   
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token function
const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refreshToken`,
      {},
      { withCredentials: true } // Include refresh token from cookie
    );

    const accessToken = response?.data?.data?.accessToken;
    
    if (accessToken) {
      localStorage.setItem('hr', JSON.stringify(accessToken));
      return accessToken;
    
    }

    return null;
  } catch (error) {
    // Token refresh failed — clean up and logout
    localStorage.removeItem('hr');
    store.dispatch(logout());
    return null;
  }
};

// Response interceptor: Handle JWT expiration and retry request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once and only if JWT has expired
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === 'JWT Expired' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newToken = await refreshToken();

      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
