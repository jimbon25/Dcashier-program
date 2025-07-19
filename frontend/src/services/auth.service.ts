import api from './api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

interface AuthResponse {
  accessToken: string;
  role: string;
}

interface BackendAuthResponse {
  status: string;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    role: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<BackendAuthResponse>('/api/auth/login', credentials);
      
      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return {
        accessToken: response.data.data.accessToken,
        role: response.data.data.role
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<BackendAuthResponse>('/api/auth/register', credentials);
      
      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return {
        accessToken: response.data.data.accessToken,
        role: response.data.data.role
      };
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async checkAuth(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/api/check-auth');
    return response.data;
  }
};
