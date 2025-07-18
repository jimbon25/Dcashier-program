import { createSlice } from '@reduxjs/toolkit';

type PayloadActionType<P> = {
  payload: P;
  type: string;
};

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state: AuthState,
      action: PayloadActionType<{ token: string; role: string }>
    ) => {
      const { token, role } = action.payload;
      state.token = token;
      state.role = role;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
    },
    logout: (state: AuthState) => {
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
