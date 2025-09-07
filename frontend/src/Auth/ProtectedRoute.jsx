import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppUser } from '../hooks/useAppUser';
import { toast } from 'react-hot-toast';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAppUser();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      toast.error("You do not have permission to view this page.");
    }
  }, [isLoading, user, allowedRoles]);

  if (isLoading) {
    return <div className="bg-black text-white text-center p-20 min-h-screen">Verifying Access...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
