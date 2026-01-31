import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FamilyGuard = ({ children }) => {
  const { user, loading, hasFamily } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasFamily) {
    return <Navigate to="/family/setup" replace />;
  }

  return children;
};

export default FamilyGuard;
