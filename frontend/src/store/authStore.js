import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', userData);
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      toast.success("Registration successful!");
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || "Registration failed");
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      toast.success("Successfully logged in!");
      return res.data;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || "Login failed");
      return null;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      set({ isLoading: false });
      toast.success("Password changed successfully!");
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || "Failed to change password");
      return false;
    }
  }
}));

export default useAuthStore;
