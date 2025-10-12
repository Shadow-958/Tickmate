// src/Auth/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles, requireOnboarding = true }) => {
  const { user, loading, isOnboardingCompleted } = useAuth();

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

  // Check if onboarding is required and not completed
  if (requireOnboarding && !isOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!allowedRoles.includes(user.selectedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;