import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEventRoom, useSocket } from '../../contexts/socketContext.jsx';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  ClockIcon,
} from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

// Utility: Enhanced scan status detection with debugging
const isTicketScanned = (ticket) => {
  const checkInScanned = ticket.checkInStatus?.isCheckedIn === true;
  const verificationScanned = ticket.verification?.isScanned === true;
  const legacyScanned = ticket.scanned === true;
  
  // Debug logging for each ticket scan check
  if (ticket.ticketNumber) {
    console.log(`Ticket ${ticket.ticketNumber} scan check:`, {
      checkInScanned,
      verificationScanned,
      legacyScanned,
      checkInStatus: ticket.checkInStatus,
      verification: ticket.verification
    });
  }
  
  return checkInScanned || verificationScanned || legacyScanned || false;
};

const StaffAttendance = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { isInRoom } = useEventRoom(eventId); // Auto-joins event room for real-time updates
  
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized fetch function to prevent infinite loops
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📋 Fetching attendance data for event: ${eventId}`);
      const response = await apiClient.get(`/api/staff/events/${eventId}/attendance`);
      console.log('✅ Attendance data loaded:', response);
      
      // Enhanced debugging: Log ticket scan status
      if (response?.allTickets) {
        console.log('🎫 Ticket scan status breakdown:');
        response.allTickets.forEach((ticket, index) => {
          const scanned = isTicketScanned(ticket);
          console.log(`  ${index + 1}. ${ticket.ticketNumber}: ${scanned ? '✅ SCANNED' : '❌ PENDING'}`, {
            verification: ticket.verification,
            checkInStatus: ticket.checkInStatus
          });
        });
      }
      
      setAttendanceData(response);
    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      setError(error.response?.data?.message || 'Failed to load attendance data');
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!user || user.selectedRole !== 'event_staff') {
      navigate('/staff/dashboard');
      return;
    }
    fetchAttendanceData();
  }, [user, navigate, fetchAttendanceData]);

  // SOCKET.IO: Listen for real-time check-in updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAttendeeCheckedIn = (data) => {
      console.log('✅ Real-time check-in update received:', data);
      if (data.eventId === eventId) {
        console.log('🔄 Refreshing attendance data due to new check-in');
        
        // Show notification for check-ins by other staff/hosts
        if (data.scannedBy !== user._id) {
          const scannerInfo = data.scannerRole === 'event_host' ? 'Host' : 'Staff';
          toast.success(`📱 ${data.attendeeName} checked in by ${scannerInfo}`, {
            duration: 4000,
            icon: '✅'
          });
        }
        
        // Refresh the attendance data
        fetchAttendanceData();
      }
    };

    socket.on('attendee_checked_in', handleAttendeeCheckedIn);
    return () => {
      socket.off('attendee_checked_in', handleAttendeeCheckedIn);
    };
  }, [socket, isConnected, eventId, fetchAttendanceData, user._id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300">Loading attendance data...</p>
          <p className="text-sm text-gray-500 mt-2">
            {isConnected ? '🟢 Live updates connected' : '🔴 Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">Error Loading Attendance</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          <div className="space-y-4">
            <button
              onClick={fetchAttendanceData}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold w-full"
            >
              Try Again
            </button>
            <Link
              to="/staff/my-events"
              className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all inline-block w-full text-center"
            >
              Back to My Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { event, statistics, allTickets } = attendanceData || {};

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen">
      <div className="pt-24">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/staff/my-events"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to My Events
              </Link>
              {/* Live Connection Indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected && isInRoom ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}
                ></div>
                <span className="text-sm text-gray-400">
                  {isConnected && isInRoom ? 'Live Updates' : 'Offline'}
                </span>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Event Attendance
            </h1>

            {event && (
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                <div className="flex flex-wrap gap-4 text-gray-300">
                  <span>📅 {formatDate(event.startDateTime)}</span>
                  <span>📍 {event.location?.venue || 'Venue TBD'}</span>
                  <span>
                    👤 {event.host?.firstName} {event.host?.lastName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-cyan-800/50 rounded-xl p-6 border border-cyan-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-cyan-300 font-semibold text-sm uppercase tracking-wider">
                    Total Tickets
                  </h3>
                  <p className="text-3xl font-bold text-white mt-2">{statistics?.totalTickets || 0}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-cyan-400 opacity-60" />
              </div>
            </div>

            <div className="bg-green-800/50 rounded-xl p-6 border border-green-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-green-300 font-semibold text-sm uppercase tracking-wider">Scanned</h3>
                  <p className="text-3xl font-bold text-white mt-2">{statistics?.scannedTickets || 0}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-400 opacity-60" />
              </div>
            </div>

            <div className="bg-yellow-800/50 rounded-xl p-6 border border-yellow-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-300 font-semibold text-sm uppercase tracking-wider">Pending</h3>
                  <p className="text-3xl font-bold text-white mt-2">{statistics?.unscannedTickets || 0}</p>
                </div>
                <XCircleIcon className="h-12 w-12 text-yellow-400 opacity-60" />
              </div>
            </div>

            <div className="bg-purple-800/50 rounded-xl p-6 border border-purple-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wider">Attendance Rate</h3>
                  <p className="text-3xl font-bold text-white mt-2">{statistics?.attendanceRate || 0}%</p>
                </div>
                <div className="text-2xl opacity-60">📊</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {statistics && statistics.totalTickets > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white">Check-in Progress</h3>
                <span className="text-cyan-400 font-bold">{statistics.attendanceRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-400 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(statistics.attendanceRate) || 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>{statistics.scannedTickets || 0} checked in</span>
                <span>{statistics.unscannedTickets || 0} remaining</span>
              </div>
            </div>
          )}

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && allTickets && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-8">
              <h3 className="text-red-400 font-semibold mb-2">🐛 Debug Info (Dev Mode Only)</h3>
              <p className="text-sm text-gray-300">
                Total tickets in state: {allTickets.length} | 
                Scanned count: {allTickets.filter(t => isTicketScanned(t)).length} | 
                Socket connected: {isConnected ? '✅' : '❌'} | 
                In room: {isInRoom ? '✅' : '❌'}
              </p>
            </div>
          )}

          {/* Attendee List */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Attendee List</h3>
                <p className="text-gray-400 mt-1">{allTickets?.length || 0} total attendees</p>
              </div>
              <button
                onClick={fetchAttendanceData}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {allTickets && allTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-semibold">Attendee</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Ticket #</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Scan Time</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTickets.map((ticket) => {
                      const scanned = isTicketScanned(ticket);
                      const scanTime = ticket.verification?.scannedAt || ticket.checkInStatus?.checkInTime;
                      
                      return (
                        <tr
                          key={ticket._id}
                          className="border-b border-gray-700 hover:bg-gray-900/30 transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-white">{ticket.attendee?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-400">{ticket.attendee?.email || 'No email'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-cyan-400 text-sm bg-cyan-900/30 px-2 py-1 rounded">
                              {ticket.ticketNumber}
                            </span>
                          </td>
                          <td className="p-4">
                            {scanned ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                                <CheckCircleIcon className="h-4 w-4" />
                                Scanned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30">
                                <XCircleIcon className="h-4 w-4" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-gray-300 text-sm">
                              {scanTime
                                ? new Date(scanTime).toLocaleTimeString()
                                : 'Not scanned'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-white">
                              ₹{ticket.pricePaid ? (ticket.pricePaid / 100).toFixed(0) : '0'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No attendees found</p>
                <p className="text-sm text-gray-500 mt-2">Tickets will appear here once sold</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to={`/staff/scanner/${eventId}`}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all font-bold shadow-lg transform hover:scale-105"
            >
              📱 Open Scanner
            </Link>
            <Link
              to="/staff/my-events"
              className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all font-bold shadow-lg"
            >
              Back to Events
            </Link>
            <Link
              to="/staff/dashboard"
              className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-500 transition-all font-bold shadow-lg"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;
