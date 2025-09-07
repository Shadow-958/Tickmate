import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppUser } from '../hooks/useAppUser'; 

const AuthCallback = () => {
  const { user, isLoading } = useAppUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (user) {
      if (user.role === 'organizer') {
        navigate('/organizer-dashboard', { replace: true });
      } else {
        navigate('/allevents', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]); 

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <p className="text-white text-xl animate-pulse">Signing in, please wait...</p>
    </div>
  );
};

export default AuthCallback;
