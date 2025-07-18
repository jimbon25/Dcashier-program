import axios from 'axios';
import { store } from '../store/store';

type RequestConfig = {
  headers?: Record<string, string>;
  [key: string]: any;
};

type ErrorType = {
  response?: {
    status: number;
  };
};

const baseURL = 'http://localhost:3001';

// Create axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    if (error.response?.status === 401) {
      // Handle token expiration
      store.dispatch({ type: 'auth/logout' });
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
