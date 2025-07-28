import axios from 'axios';
import store from '../redux/store';

// Create an instance of axios with custom configurations
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Add a request interceptor to attach the bearer token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Fetch the token from wherever you have stored it (e.g., localStorage, Redux store)
    // const token = localStorage.getItem('garirmela'); // Example using localStorage

    const { auth } = store.getState();
    const token = auth.token;

    // If a token exists, set the Authorization header with the token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
