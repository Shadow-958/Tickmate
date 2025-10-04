// src/Auth/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.selectedRole)) {
      toast.error("You do not have permission to view this page.");
    }
  }, [loading, user, allowedRoles]);

  if (loading) {
    return (
      <div className="bg-black text-white text-center p-20 min-h-screen">
        Verifying Access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.selectedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;