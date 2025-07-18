import api from './api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

interface AuthResponse {
  token: string;
  role: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/logout');
  },

  async checkAuth(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/check-auth');
    return response.data;
  }
};
