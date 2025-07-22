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
    const response = await api.post<BackendAuthResponse>('/api/auth/login', credentials);
    return {
      accessToken: response.data.data.accessToken,
      role: response.data.data.role
    };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<BackendAuthResponse>('/auth/register', credentials);
    return {
      accessToken: response.data.data.accessToken,
      role: response.data.data.role
    };
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async checkAuth(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/check-auth');
    return response.data;
  }
};
