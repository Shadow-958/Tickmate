// src/Auth/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return; 
    }

    if (user) {
      if (user.selectedRole === 'event_host') {
        navigate('/organizer-dashboard', { replace: true });
      } else if (user.selectedRole === 'event_attendee') {
        navigate('/allevents', { replace: true });
      } else {
        // User hasn't selected a role yet
        navigate('/onboarding', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]); 

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <p className="text-white text-xl animate-pulse">Signing in, please wait...</p>
    </div>
  );
};

export default AuthCallback;