// src/Auth/OnboardingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OnboardingPage = () => {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelection = async (role) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const result = await selectRole(role);

      if (result.success) {
        toast.success(`Role updated to ${role.replace('_', ' ')}`);

        // Navigate based on role
        if (role === 'event_host') {
          navigate('/organizer-dashboard');
        } else if (role === 'event_staff') {
          navigate('/staff-dashboard');
        } else {
          navigate('/allevents');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome, {user?.firstName || 'to TapIn'}!
        </h1>
        <p className="text-lg text-gray-400">
          To get started, please tell us how you'll be using the platform.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        
        {/* Attendee Option */}
        <button
          onClick={() => handleRoleSelection('event_attendee')}
          disabled={loading}
          className="group p-6 bg-gray-800 rounded-xl border border-gray-700 text-left hover:border-cyan-400 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 hover:scale-105"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-4 group-hover:bg-blue-500/30 transition-colors">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">I'm an Attendee</h2>
          <p className="text-gray-400 text-sm">I want to discover, book, and attend amazing events in my area.</p>
        </button>

        {/* Host Option */}
        <button
          onClick={() => handleRoleSelection('event_host')}
          disabled={loading}
          className="group p-6 bg-gray-800 rounded-xl border border-gray-700 text-left hover:border-cyan-400 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 hover:scale-105"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4 group-hover:bg-green-500/30 transition-colors">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">I'm a Host</h2>
          <p className="text-gray-400 text-sm">I want to create, manage, and host my own events for others.</p>
        </button>

        {/* Staff Option */}
        <button
          onClick={() => handleRoleSelection('event_staff')}
          disabled={loading}
          className="group p-6 bg-gray-800 rounded-xl border border-gray-700 text-left hover:border-cyan-400 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 hover:scale-105"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-4 group-hover:bg-purple-500/30 transition-colors">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">I'm Event Staff</h2>
          <p className="text-gray-400 text-sm">I help manage events, check-in attendees, and provide support.</p>
        </button>

      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="mt-8 flex items-center text-cyan-400">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg">Saving your choice...</span>
        </div>
      )}
      
      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Don't worry, you can change your role later in your profile settings.
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
