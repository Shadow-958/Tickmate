import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { QrCodeIcon, UsersIcon, CalendarIcon, ClockIcon, ChartBarIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

const MyEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.selectedRole !== 'event_staff') {
      toast.error('Access denied. Staff role required.');
      navigate('/role-selection');
      return;
    }
    
    fetchMyEvents();
  }, [user, navigate]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching staff assigned events...');
      
      const response = await apiClient.get('/api/staff/my-events');
      console.log('✅ Events response:', response);
      
      const eventsData = response.events || response.data || [];
      setEvents(eventsData);
      
      console.log(`✅ Loaded ${eventsData.length} assigned events`);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setError(error.message || 'Failed to fetch assigned events');
      toast.error('Failed to load assigned events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event) => {
    if (!event?.startDateTime) return 'TBD';
    
    const now = new Date();
    const startTime = new Date(event.startDateTime);
    const endTime = new Date(event.endDateTime);
    
    if (endTime < now) return 'Past';
    if (startTime <= now && endTime >= now) return 'Live';
    return 'Upcoming';
  };

  const handleOpenScanner = (eventId) => {
    navigate(`/staff/scanner/${eventId}`);
  };

  const handleViewAttendance = (eventId) => {
    navigate(`/staff/attendance/${eventId}`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300">Loading your assigned events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">Error Loading Events</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          
          <div className="space-y-4">
            <button
              onClick={fetchMyEvents}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold w-full"
            >
              Try Again
            </button>
            
            <Link
              to="/staff/dashboard"
              className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all inline-block w-full"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const liveEvents = events.filter(e => getEventStatus(e) === 'Live');
  const upcomingEvents = events.filter(e => getEventStatus(e) === 'Upcoming');
  const pastEvents = events.filter(e => getEventStatus(e) === 'Past');

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen">
      <div className="pt-24">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              My Assigned Events
            </h1>
            <p className="text-xl text-gray-300 mb-6">Events where you're assigned as staff</p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={fetchMyEvents}
                className="text-cyan-400 hover:text-cyan-300 underline text-sm transition-colors"
              >
                🔄 Refresh events
              </button>
              <Link
                to="/staff/dashboard"
                className="text-gray-400 hover:text-gray-300 underline text-sm transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-cyan-800/50 to-blue-800/50 rounded-xl p-6 border border-cyan-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-cyan-300 font-semibold text-sm uppercase tracking-wider">Total Events</h3>
                  <p className="text-3xl font-bold text-white mt-2">{events.length}</p>
                </div>
                <CalendarIcon className="h-12 w-12 text-cyan-400 opacity-60" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-800/50 to-emerald-800/50 rounded-xl p-6 border border-green-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-green-300 font-semibold text-sm uppercase tracking-wider">Live Events</h3>
                  <p className="text-3xl font-bold text-white mt-2">{liveEvents.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <div className="h-6 w-6 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-800/50 to-purple-800/50 rounded-xl p-6 border border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">Upcoming</h3>
                  <p className="text-3xl font-bold text-white mt-2">{upcomingEvents.length}</p>
                </div>
                <ClockIcon className="h-12 w-12 text-blue-400 opacity-60" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Past Events</h3>
                  <p className="text-3xl font-bold text-white mt-2">{pastEvents.length}</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-gray-400 opacity-60" />
              </div>
            </div>
          </div>

          {/* Events Display */}
          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-8 opacity-60">📋</div>
              <h3 className="text-3xl font-bold text-gray-300 mb-4">No Events Assigned</h3>
              <p className="text-gray-500 mb-10 text-lg">You haven't been assigned to any events yet. Contact your event organizer.</p>
              <Link
                to="/staff/dashboard"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-10 py-4 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold text-lg shadow-xl"
              >
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Live Events Section */}
              {liveEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-3">
                    <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                    Live Events
                  </h2>
                  <div className="grid gap-6">
                    {liveEvents.map((event) => (
                      <EventCard key={event._id} event={event} status="Live" onOpenScanner={handleOpenScanner} onViewAttendance={handleViewAttendance} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events Section */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-3">
                    <ClockIcon className="h-6 w-6" />
                    Upcoming Events
                  </h2>
                  <div className="grid gap-6">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event._id} event={event} status="Upcoming" onOpenScanner={handleOpenScanner} onViewAttendance={handleViewAttendance} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Events Section */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-400 mb-6 flex items-center gap-3">
                    <ChartBarIcon className="h-6 w-6" />
                    Past Events
                  </h2>
                  <div className="grid gap-6">
                    {pastEvents.map((event) => (
                      <EventCard key={event._id} event={event} status="Past" onOpenScanner={handleOpenScanner} onViewAttendance={handleViewAttendance} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, status, onOpenScanner, onViewAttendance }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live':
        return 'from-green-500 to-emerald-500';
      case 'Upcoming':
        return 'from-blue-500 to-cyan-500';
      case 'Past':
        return 'from-gray-500 to-slate-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case 'Live':
        return 'border-green-500/50 bg-green-500/10';
      case 'Upcoming':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'Past':
        return 'border-gray-500/50 bg-gray-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div className={`relative rounded-2xl border ${getStatusBorder(status)} overflow-hidden shadow-2xl hover:border-cyan-400/70 transition-all duration-300 group`}>
      {/* Live Event Pulse Effect */}
      {status === 'Live' && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>
      )}
      
      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Event Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-2xl font-bold text-white">
                {event.title}
              </h3>
              <span className={`px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r ${getStatusColor(status)} text-white shadow-lg`}>
                {status === 'Live' && '🔴 '}
                {status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-lg">📅</span>
                  <div>
                    <p className="text-sm text-gray-400">Start Time</p>
                    <p className="font-semibold">{formatDate(event.startDateTime)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-lg">📍</span>
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="font-semibold">{event.location?.venue || event.location || 'Venue TBD'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-lg">👥</span>
                  <div>
                    <p className="text-sm text-gray-400">Host</p>
                    <p className="font-semibold">{event.host?.firstName} {event.host?.lastName}</p>
                  </div>
                </div>
                
                {event.stats && (
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 text-lg">🎫</span>
                    <div>
                      <p className="text-sm text-gray-400">Tickets</p>
                      <p className="font-semibold">
                        {event.stats.scannedTickets}/{event.stats.totalTickets} scanned ({event.stats.scanPercentage}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 lg:w-52">
            <button
              onClick={() => onOpenScanner(event._id)}
              disabled={status === 'Past'}
              className={`px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 ${
                status === 'Past' 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400'
              }`}
            >
              <QrCodeIcon className="h-5 w-5" />
              {status === 'Past' ? 'Event Ended' : 'Open Scanner'}
            </button>
            
            <button
              onClick={() => onViewAttendance(event._id)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <UsersIcon className="h-5 w-5" />
              View Attendance
            </button>
          </div>
        </div>

        {/* Progress Bar for Live/Upcoming Events */}
        {event.stats && status !== 'Past' && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Scan Progress</span>
              <span className="text-sm font-semibold text-cyan-400">{event.stats.scanPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  status === 'Live' ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-blue-400'
                }`}
                style={{ width: `${Math.min(parseFloat(event.stats.scanPercentage) || 0, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{event.stats.scannedTickets} scanned</span>
              <span>{event.stats.unscannedTickets} remaining</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
