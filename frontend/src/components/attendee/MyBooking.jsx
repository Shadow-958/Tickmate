// src/components/attendee/MyBookings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your bookings');
      navigate('/login');
      return;
    }

    if (user?.selectedRole !== 'event_attendee') {
      toast.error('Only attendees can view bookings');
      navigate('/role-selection');
      return;
    }

    fetchMyBookings();

    // Show success message if coming from confirmation page
    if (location.state?.newTicket) {
      toast.success('🎉 New ticket added to your bookings!');
      // Clear the state to prevent repeated messages
      window.history.replaceState(null, '');
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching bookings for user:', user?._id || user?.id);
      
      const response = await apiClient.get('/api/attendee/my-bookings');
      console.log('✅ Bookings response:', response);
      
      setBookings(response.bookings || response.tickets || []);
    } catch (err) {
      console.error('❌ Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (booking) => {
    const status = booking.status || 'active';
    const isCheckedIn = booking.checkInStatus?.isCheckedIn;
    
    if (status === 'cancelled') {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">❌ Cancelled</span>;
    }
    
    if (isCheckedIn) {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">✅ Checked In</span>;
    }
    
    return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">🎫 Active</span>;
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

  const formatPrice = (amount) => {
    const price = parseFloat(amount) || 0;
    return price === 0 ? 'FREE' : `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Bookings</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchMyBookings}
              className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/allevents"
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors inline-block"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const upcomingBookings = bookings.filter(b => 
    b.event?.startDateTime && 
    new Date(b.event.startDateTime) > new Date() &&
    b.status !== 'cancelled'
  );
  
  // ✅ FIXED: Calculate total spent using both possible field names
  const totalSpent = bookings.reduce((sum, booking) => {
    const amount = booking.pricePaid || booking.totalAmount || 0;
    return sum + parseFloat(amount);
  }, 0);

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">My Bookings</h1>
          <p className="text-gray-400">Manage your event tickets and bookings</p>
          
          {/* Quick refresh button */}
          <button
            onClick={fetchMyBookings}
            className="mt-4 text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            🔄 Refresh bookings
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-cyan-400 font-semibold text-sm">Total Bookings</h3>
                <p className="text-2xl font-bold text-white">{bookings.length}</p>
              </div>
              <span className="text-2xl">🎫</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-semibold text-sm">Active Tickets</h3>
                <p className="text-2xl font-bold text-white">{activeBookings.length}</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-400 font-semibold text-sm">Upcoming Events</h3>
                <p className="text-2xl font-bold text-white">{upcomingBookings.length}</p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-400 font-semibold text-sm">Total Spent</h3>
                <p className="text-2xl font-bold text-white">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎫</div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-4">No Bookings Yet</h3>
            <p className="text-gray-500 mb-8">You haven't booked any events yet. Start exploring!</p>
            <Link
              to="/allevents"
              className="bg-cyan-500 text-black px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Your Tickets</h2>
              <p className="text-gray-400 text-sm">
                {bookings.length} ticket{bookings.length !== 1 ? 's' : ''} total
              </p>
            </div>
            
            {bookings.map((booking) => {
              const eventStatus = getEventStatus(booking.event);
              
              return (
                <div 
                  key={booking._id || booking.ticketId} 
                  className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Event Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-1">
                              {booking.event?.title || 'Event Title'}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              {getStatusBadge(booking)}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                eventStatus === 'Live' ? 'bg-green-500/20 text-green-400' :
                                eventStatus === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {eventStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <p className="mb-2">
                              <span className="text-cyan-400">📅 Date:</span>{' '}
                              {formatDate(booking.event?.startDateTime)}
                            </p>
                            <p className="mb-2">
                              <span className="text-cyan-400">📍 Location:</span>{' '}
                              {booking.event?.location?.venue || booking.event?.location || 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2">
                              <span className="text-cyan-400">🎫 Ticket:</span>{' '}
                              <span className="font-mono text-white text-xs bg-gray-800 px-2 py-1 rounded">
                                {booking.ticketNumber}
                              </span>
                            </p>
                            <p className="mb-2">
                              <span className="text-cyan-400">💳 Amount:</span>{' '}
                              <span className="text-white font-semibold">
                                {formatPrice(booking.pricePaid || booking.totalAmount)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 lg:w-48">
                        {booking.event?._id && (
                          <Link
                            to={`/events/${booking.event._id}`}
                            className="bg-cyan-500 text-black px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors text-center font-medium"
                          >
                            View Event
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(booking.ticketNumber);
                            toast.success('Ticket number copied to clipboard!');
                          }}
                          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                          📋 Copy Ticket #
                        </button>
                        
                        {booking.status !== 'cancelled' && eventStatus === 'Live' && (
                          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-center">
                            <span className="text-green-400 text-sm font-semibold">
                              🎉 Event is Live!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Booked: {formatDate(booking.bookingDate || booking.createdAt || booking.bookedAt)}</span>
                      <span>Payment: {booking.paymentStatus || 'Completed'}</span>
                      <span>Quantity: {booking.quantity || 1} ticket{(booking.quantity || 1) !== 1 ? 's' : ''}</span>
                      {booking.checkInStatus?.checkInTime && (
                        <span className="text-green-400">
                          ✅ Checked in: {formatDate(booking.checkInStatus.checkInTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-12 space-x-4">
          <Link
            to="/allevents"
            className="bg-cyan-500 text-black px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
          >
            🎫 Book More Events
          </Link>
          <Link
            to="/"
            className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            🏠 Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
