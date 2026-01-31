import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";
import { familiesAPI } from "../api/families";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
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
    // Fetch full user info including family
    const meData = await authAPI.getMe();
    setUser(meData.user);
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register(email, password, name);
    // New users don't have a family yet
    setUser({ ...data.user, family: null });
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  // Create a new family
  const createFamily = async (name) => {
    const data = await familiesAPI.create(name);
    setUser((prev) => ({
      ...prev,
      family: {
        id: data.family.id,
        name: data.family.name,
        role: data.role,
      },
    }));
    return data;
  };

  // Join a family via invite code
  const joinFamily = async (inviteCode) => {
    const data = await familiesAPI.join(inviteCode);
    setUser((prev) => ({
      ...prev,
      family: {
        id: data.family.id,
        name: data.family.name,
        role: data.role,
      },
    }));
    return data;
  };

  // Leave the current family
  const leaveFamily = async () => {
    await familiesAPI.leave();
    setUser((prev) => ({
      ...prev,
      family: null,
    }));
  };

  // Refresh user data (e.g., after family changes)
  const refreshUser = async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      // User might be logged out
      setUser(null);
    }
  };

  // Computed properties
  const hasFamily = user?.family != null;
  const isAdmin = user?.family?.role === "admin";

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    createFamily,
    joinFamily,
    leaveFamily,
    refreshUser,
    hasFamily,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
