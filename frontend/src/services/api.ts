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
    ? 'https://dcashier-program-production.up.railway.app'
    : 'http://localhost:8000');

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
  (response: { data: any }) => {
    // Ensure data is always an array for list endpoints
    if (response.data?.status === 'success' && response.data?.data) {
      if (Array.isArray(response.data.data)) {
        return response;
      }
      // For non-array responses, keep as is
      return response;
    }
    return response;
  },
  async (error: ErrorType) => {
    console.error('API Error:', error);
    
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

// Create typed API wrapper with error handling
const api = {
  async get<T>(url: string, config?: RequestConfig): Promise<{ data: T }> {
    try {
      const response = await axiosInstance.get(url, config);
      // For auth endpoints, keep original structure
      if (url.includes('/auth/') || url.includes('/check-auth')) {
        return response;
      }
      // Extract data from response.data.data if it exists
      let data = response.data?.data || response.data;
      
      // Ensure array endpoints return arrays
      if (url.includes('/products') || url.includes('/categories') || 
          url.includes('/transactions') || url.includes('/users') ||
          url.includes('/reports')) {
        if (!Array.isArray(data)) {
          console.warn(`Expected array for ${url} but got:`, typeof data);
          data = [];
        }
      }
      
      return { data: data as T };
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      return { data: [] as unknown as T };
    }
  },
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<{ data: T }> {
    try {
      const response = await axiosInstance.post(url, data, config);
      // For auth endpoints, keep original structure
      if (url.includes('/auth/') || url.includes('/check-auth')) {
        return response;
      }
      return { data: response.data?.data || response.data };
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  },
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<{ data: T }> {
    try {
      const response = await axiosInstance.put(url, data, config);
      return { data: response.data?.data || response.data };
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  },
  async delete<T>(url: string, config?: RequestConfig): Promise<{ data: T }> {
    try {
      const response = await axiosInstance.delete(url, config);
      return { data: response.data?.data || response.data };
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }
};

export default api;
