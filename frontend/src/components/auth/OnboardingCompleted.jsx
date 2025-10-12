// src/components/auth/OnboardingCompleted.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, ArrowRight, Home, Calendar, Users, BarChart3 } from 'lucide-react';

const OnboardingCompleted = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleInfo = (role) => {
    switch (role) {
      case 'event_host':
        return {
          title: 'Event Host',
          description: 'Create and manage your events',
          icon: <Calendar className="w-8 h-8" />,
          dashboardPath: '/organizer-dashboard',
          features: ['Create Events', 'Manage Attendees', 'View Analytics', 'Scan Tickets']
        };
      case 'event_staff':
        return {
          title: 'Event Staff',
          description: 'Help manage events and check-in attendees',
          icon: <Users className="w-8 h-8" />,
          dashboardPath: '/staff-dashboard',
          features: ['Scan Tickets', 'Check-in Attendees', 'View Event Details', 'Manage Attendance']
        };
      case 'event_attendee':
        return {
          title: 'Event Attendee',
          description: 'Discover and attend amazing events',
          icon: <BarChart3 className="w-8 h-8" />,
          dashboardPath: '/allevents',
          features: ['Browse Events', 'Book Tickets', 'View Bookings', 'Get Notifications']
        };
      default:
        return {
          title: 'User',
          description: 'Welcome to TickMate',
          icon: <Home className="w-8 h-8" />,
          dashboardPath: '/',
          features: []
        };
    }
  };

  const roleInfo = getRoleInfo(user?.selectedRole);

  const handleGoToDashboard = () => {
    navigate(roleInfo.dashboardPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Onboarding Completed!</h1>
          <p className="text-gray-400">You have successfully set up your TickMate account</p>
        </div>

        {/* Role Information Card */}
        <div className="backdrop-blur-xl bg-gray-900/50 border border-white/10 rounded-2xl p-8 shadow-2xl mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-4">
              {roleInfo.icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{roleInfo.title}</h2>
            <p className="text-gray-400">{roleInfo.description}</p>
          </div>

          {roleInfo.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">What you can do:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm text-center">
              <strong>Note:</strong> Your role selection is permanent and cannot be changed. You can always contact support if you need assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGoToDashboard}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="flex-1 bg-gray-800/50 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700/50 text-center flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Welcome to TickMate! 🎉</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompleted;
