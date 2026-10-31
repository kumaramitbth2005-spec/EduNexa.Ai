import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('edunexa_token');
      const savedUser = localStorage.getItem('edunexa_user');
      const savedDark = localStorage.getItem('edunexa_dark') === 'true';

      setDarkMode(savedDark);
      if (savedDark) document.documentElement.classList.add('dark');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const { data } = await authService.getMe();
          setUser(data.user);
          localStorage.setItem('edunexa_user', JSON.stringify(data.user));
        } catch {
          localStorage.removeItem('edunexa_token');
          localStorage.removeItem('edunexa_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('edunexa_token', data.token);
    localStorage.setItem('edunexa_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    localStorage.setItem('edunexa_token', data.token);
    localStorage.setItem('edunexa_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('edunexa_token');
    localStorage.removeItem('edunexa_user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('edunexa_user', JSON.stringify(updatedUser));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('edunexa_dark', String(next));
      return next;
    });
  }, []);

  const isAuthenticated = !!user;
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isStudent, isTeacher, isAdmin, login, register, logout, updateUser, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

