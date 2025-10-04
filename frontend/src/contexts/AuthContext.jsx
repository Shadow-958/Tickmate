// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.user);
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        return { success: true, user: response.user };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const selectRole = async (role, profileData = {}) => {
    try {
      const response = await apiClient.post('/api/auth/select-role', { role, profileData });

      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Role selection failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    selectRole,
    logout,
    isAuthenticated: !!user,
    isHost: user?.selectedRole === 'event_host',
    isAttendee: user?.selectedRole === 'event_attendee',
    isStaff: user?.selectedRole === 'event_staff'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;