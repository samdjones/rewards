import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setUser(data.user);
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register(email, password, name);
    setUser(data.user);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
