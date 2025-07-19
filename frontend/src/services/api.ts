import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

type RequestConfig = {
  headers?: Record<string, string>;
  [key: string]: any;
};

type ErrorType = {
  response?: {
    status: number;
  };
};

const baseURL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://dcashier-program-kg12zt5vk-j1mbs-projects.vercel.app'
    : 'http://localhost:3001');

// Create axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config: RequestConfig) => {
    const token = store.getState().auth.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: ErrorType) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response: { data: any }) => response,
  async (error: ErrorType) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle token expiration or unauthorized access
      store.dispatch(logout());
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create typed API wrapper
const api = {
  async get<T>(url: string, config?: RequestConfig): Promise<{ data: T }> {
    const response = await axiosInstance.get(url, config);
    return { data: response.data };
  },
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<{ data: T }> {
    const response = await axiosInstance.post(url, data, config);
    return { data: response.data };
  },
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<{ data: T }> {
    const response = await axiosInstance.put(url, data, config);
    return { data: response.data };
  },
  async delete<T>(url: string, config?: RequestConfig): Promise<{ data: T }> {
    const response = await axiosInstance.delete(url, config);
    return { data: response.data };
  }
};

export default api;
