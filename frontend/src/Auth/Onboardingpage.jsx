import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const OnboardingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelection = async (role) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/set-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, role: role }),
      });

      if (!response.ok) {
        throw new Error('Failed to set role. Please try again.');
      }

      if (role === 'organizer') {
        navigate('/organizer-dashboard');
      } else {
        navigate('/allevents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Welcome, {user?.firstName || 'to Eventzilla'}!</h1>
      <p className="text-lg text-gray-400 mb-12 text-center">To get started, please tell us how you'll be using the platform.</p>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
        <button
          onClick={() => handleRoleSelection('attendee')}
          disabled={loading}
          className="flex-1 p-8 bg-gray-800 rounded-lg border border-gray-700 text-left hover:border-cyan-400 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50"
        >
          <h2 className="text-2xl font-bold text-white mb-2">I'm an Attendee</h2>
          <p className="text-gray-400">I want to discover, book, and attend amazing events.</p>
        </button>

        <button
          onClick={() => handleRoleSelection('organizer')}
          disabled={loading}
          className="flex-1 p-8 bg-gray-800 rounded-lg border border-gray-700 text-left hover:border-cyan-400 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50"
        >
          <h2 className="text-2xl font-bold text-white mb-2">I'm an Organizer</h2>
          <p className="text-gray-400">I want to create, manage, and host my own events.</p>
        </button>
      </div>

      {loading && <p className="mt-8 text-lg">Saving your choice...</p>}
      {error && <p className="mt-8 text-lg text-red-500">{error}</p>}
    </div>
  );
};

export default OnboardingPage;
