// src/components/staff/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching staff dashboard data...');
      
      // Use the correct endpoint from your staff routes
      const response = await apiClient.get('/api/staff/dashboard');
      
      console.log('✅ Dashboard data loaded:', response);
      
      setDashboardData(response.data || response);
      
      // Set first event as selected if available
      if (response.data?.assignedEvents?.length > 0 && !selectedEvent) {
        setSelectedEvent(response.data.assignedEvents[0]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'text-cyan-400' }) => (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        {Icon && <Icon className={`h-12 w-12 ${color} opacity-60`} />}
      </div>
    </div>
  );

  const ScanItem = ({ scan }) => (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${scan.isCheckedIn ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
          {scan.isCheckedIn ? 
            <CheckCircleIcon className="h-6 w-6 text-green-400" /> :
            <ClockIcon className="h-6 w-6 text-gray-400" />
          }
        </div>
        <div>
          <p className="font-semibold text-white">
            {scan.attendeeId?.firstName} {scan.attendeeId?.lastName}
          </p>
          <p className="text-sm text-gray-400">{scan.eventId?.title}</p>
          <p className="text-xs text-gray-500">{scan.ticketNumber}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-300">
          {scan.checkInStatus?.checkInTime ? 
            new Date(scan.checkInStatus.checkInTime).toLocaleTimeString() :
            'Pending'
          }
        </p>
        <p className={`text-xs ${scan.isCheckedIn ? 'text-green-400' : 'text-gray-400'}`}>
          {scan.isCheckedIn ? 'Checked In' : 'Not Scanned'}
        </p>
      </div>
    </div>
  );

  const handleOpenScanner = (eventId) => {
    if (eventId) {
      navigate(`/scanner/${eventId}`);
    }
  };

  const handleViewAttendees = (eventId) => {
    if (eventId) {
      navigate(`/attendee-list/${eventId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const assignedEvents = dashboardData?.assignedEvents || [];
  const todaysEvents = dashboardData?.todaysEvents || [];
  const recentScans = dashboardData?.recentScans || [];

  return (
    <div className="bg-black text-white min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Staff Dashboard
            </span>
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Welcome back, {user?.firstName}! Manage event check-ins and monitor activity.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Assigned Events" 
            value={stats.assignedEvents || 0}
            icon={UsersIcon}
          />
          <StatCard 
            title="Today's Events" 
            value={stats.todaysEvents || 0}
            icon={ClockIcon}
            color="text-blue-400"
          />
          <StatCard 
            title="Total Scans Today" 
            value={stats.totalScansToday || 0}
            icon={QrCodeIcon}
          />
          <StatCard 
            title="Recent Scans" 
            value={stats.recentScans || 0}
            icon={CheckCircleIcon}
            color="text-green-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Events */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Assigned Events</h2>

              {assignedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No events assigned.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact your administrator to get assigned to events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedEvents.map(event => (
                    <div 
                      key={event._id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedEvent?._id === event._id 
                          ? 'border-cyan-400 bg-cyan-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <h3 className="font-semibold text-white truncate">{event.title}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(event.startDateTime).toLocaleDateString()} at{' '}
                        {new Date(event.startDateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.location?.venue || event.location || 'Venue TBD'}
                      </p>
                      {event.statistics && (
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="text-green-400">
                            ✓ {event.statistics.scannedTickets || 0} scanned
                          </span>
                          <span className="text-gray-400">
                            📋 {event.statistics.totalTickets || 0} total
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                <button 
                  onClick={() => handleOpenScanner(selectedEvent?._id)}
                  disabled={!selectedEvent}
                  className="w-full bg-cyan-500 text-black font-bold rounded-lg px-4 py-3 transition-all hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCodeIcon className="h-5 w-5 inline mr-2" />
                  Open Scanner
                </button>
                
                <button 
                  onClick={() => handleViewAttendees(selectedEvent?._id)}
                  disabled={!selectedEvent}
                  className="w-full bg-gray-700 text-white font-medium rounded-lg px-4 py-3 transition-all hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UsersIcon className="h-5 w-5 inline mr-2" />
                  View Attendees
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Recent Scan Activity</h2>
                <button 
                  onClick={fetchDashboardData}
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <QrCodeIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent scan activity.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Scanned tickets will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentScans.map((scan, index) => (
                    <ScanItem key={scan._id || index} scan={scan} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Events */}
        {todaysEvents.length > 0 && (
          <div className="mt-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Today's Events</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysEvents.map(event => (
                  <div key={event._id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(event.startDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(event.endDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {event.location?.venue || event.location || 'Venue TBD'}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenScanner(event._id)}
                        className="flex-1 bg-cyan-500 text-black text-sm font-medium px-3 py-2 rounded hover:bg-cyan-600 transition-colors"
                      >
                        Scan
                      </button>
                      <button
                        onClick={() => handleViewAttendees(event._id)}
                        className="flex-1 bg-gray-700 text-white text-sm font-medium px-3 py-2 rounded hover:bg-gray-600 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="mt-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {selectedEvent.title} - Event Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">Event Information</h3>
                  <p className="text-sm text-gray-400">
                    <strong>Venue:</strong> {selectedEvent.location?.venue || selectedEvent.location || 'TBD'}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Date:</strong> {new Date(selectedEvent.startDateTime).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Time:</strong> {new Date(selectedEvent.startDateTime).toLocaleTimeString()} - {new Date(selectedEvent.endDateTime).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Host:</strong> {selectedEvent.host?.firstName} {selectedEvent.host?.lastName}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">Check-in Statistics</h3>
                  {selectedEvent.statistics ? (
                    <>
                      <p className="text-sm text-gray-400">
                        <strong>Total Tickets:</strong> {selectedEvent.statistics.totalTickets}
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>Scanned:</strong> {selectedEvent.statistics.scannedTickets}
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>Pending:</strong> {selectedEvent.statistics.pendingScans}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                        <div 
                          className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${selectedEvent.statistics.totalTickets ? 
                              (selectedEvent.statistics.scannedTickets / selectedEvent.statistics.totalTickets * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedEvent.statistics.totalTickets ? 
                          Math.round((selectedEvent.statistics.scannedTickets / selectedEvent.statistics.totalTickets * 100)) : 0}% complete
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Statistics not available</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleViewAttendees(selectedEvent._id)}
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      📋 View Attendee List
                    </button>
                    <button 
                      onClick={() => handleOpenScanner(selectedEvent._id)}
                      className="w-full bg-cyan-500 text-black text-sm px-3 py-2 rounded hover:bg-cyan-600 transition-colors"
                    >
                      📱 Open QR Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
