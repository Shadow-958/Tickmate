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
      navigate('/');
      return;
    }

    fetchMyBookings();

    // Show success message if coming from confirmation page
    if (location.state?.newTicket) {
      toast.success('🎉 New ticket added to your bookings!');
      window.history.replaceState(null, '');
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching bookings...');
      console.log('User:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      let response;
      try {
        response = await apiClient.get('/api/payments/my-tickets');
      } catch (firstErr) {
        console.warn('First endpoint failed, trying fallback:', firstErr.message);
        response = await apiClient.get('/api/attendee/my-bookings');
      }
      
      console.log('✅ Full API response:', response);
      
      const fetchedBookings = response.tickets || response.bookings || response.data?.bookings || response.data?.tickets || [];
      
      console.log(`📊 Found ${fetchedBookings.length} bookings:`, fetchedBookings);
      
      setBookings(fetchedBookings);
    } catch (err) {
      console.error('❌ Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      
      if (err.message.includes('403')) {
        setError('Access denied. Please ensure you have the correct role.');
      } else if (err.message.includes('401')) {
        setError('Authentication required. Please log in again.');
      } else if (err.message.includes('404')) {
        setError('Bookings endpoint not found. Please contact support.');
      }
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

  const getStatusBadge = (booking) => {
    const status = booking.status || 'active';
    const isCheckedIn = booking.checkInStatus?.isCheckedIn;
    
    if (status === 'cancelled') {
      return <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">CANCELLED</span>;
    }
    
    if (isCheckedIn) {
      return <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full shadow-lg">CHECKED IN</span>;
    }
    
    return <span className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">VALID</span>;
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
    return price === 0 ? 'FREE' : `₹${(price / 100).toFixed(0)}`;
  };

  const getQRCodeUrl = (booking) => {
    const ticketNumber = booking.ticketNumber || booking.id || booking._id;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketNumber}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300">Loading your tickets...</p>
          <p className="text-gray-500 text-sm mt-2">
            {user?.firstName} {user?.lastName}
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
          <h2 className="text-3xl font-bold text-red-400 mb-4">Unable to Load Tickets</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          
          <div className="space-y-4">
            <button
              onClick={fetchMyBookings}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold w-full"
            >
              Try Again
            </button>
            
            <Link
              to="/allevents"
              className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all inline-block w-full"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen">
      <div className="pt-24">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              My Tickets
            </h1>
            <p className="text-xl text-gray-300">Your event passes and entry tickets</p>
            
            <button
              onClick={fetchMyBookings}
              className="mt-6 text-cyan-400 hover:text-cyan-300 underline text-sm transition-colors"
            >
              🔄 Refresh tickets
            </button>
          </div>

          {/* Tickets Display */}
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-8 opacity-60">🎫</div>
              <h3 className="text-3xl font-bold text-gray-300 mb-4">No Tickets Found</h3>
              <p className="text-gray-500 mb-10 text-lg">You haven't booked any events yet. Discover amazing events!</p>
              <Link
                to="/allevents"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-10 py-4 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold text-lg shadow-xl"
              >
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {bookings.map((booking) => {
                const eventStatus = getEventStatus(booking.event);
                
                return (
                  <div 
                    key={booking._id || booking.ticketId || booking.id}
                    className="relative bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl overflow-hidden shadow-2xl border border-gray-600 hover:border-cyan-400 transition-all duration-300 group"
                  >
                    {/* Ticket Perforations Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-b from-gray-900 to-black opacity-20"></div>
                    <div className="absolute left-3 top-6 bottom-6 w-px border-l-2 border-dashed border-gray-600"></div>
                    
                    {/* Live Event Glow */}
                    {eventStatus === 'Live' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>
                    )}
                    
                    <div className="relative p-8 pl-12">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Ticket Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-2xl font-bold text-white">
                              {booking.event?.title || 'Event Title'}
                            </h2>
                            {getStatusBadge(booking)}
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                              eventStatus === 'Live' 
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                              eventStatus === 'Upcoming' 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {eventStatus === 'Live' && '🔴 '}
                              {eventStatus}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-cyan-400 text-lg">📅</span>
                                <div>
                                  <p className="text-sm text-gray-400">Date & Time</p>
                                  <p className="font-semibold">{formatDate(booking.event?.startDateTime)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-cyan-400 text-lg">📍</span>
                                <div>
                                  <p className="text-sm text-gray-400">Venue</p>
                                  <p className="font-semibold">{booking.event?.location?.venue || booking.event?.location || 'Venue TBD'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-cyan-400 text-lg">🎫</span>
                                <div>
                                  <p className="text-sm text-gray-400">Entry Method</p>
                                  <p className="font-semibold text-green-400">QR Code Entry</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-cyan-400 text-lg">💳</span>
                                <div>
                                  <p className="text-sm text-gray-400">Amount Paid</p>
                                  <p className="font-bold text-xl">{formatPrice(booking.pricePaid || booking.totalAmount)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 lg:w-52">
                          <button
                            onClick={() => {
                              const qrUrl = getQRCodeUrl(booking);
                              window.open(qrUrl, '_blank', 'width=350,height=350');
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all font-bold shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            📱 Show QR Code
                          </button>
                          
                          {booking.event?._id && (
                            <Link
                              to={`/events/${booking.event._id}`}
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold text-center shadow-lg transform hover:scale-105"
                            >
                              View Event Details
                            </Link>
                          )}
                          
                          <button
                            onClick={() => {
                              const ticketInfo = `Event: ${booking.event?.title}\nBooking ID: ${booking._id || booking.id}`;
                              navigator.clipboard.writeText(ticketInfo);
                              toast.success('Ticket info copied!');
                            }}
                            className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-500 transition-all font-medium"
                          >
                            📋 Copy Details
                          </button>
                        </div>
                      </div>

                      {/* Ticket Footer */}
                      <div className="mt-8 pt-6 border-t border-gray-600">
                        <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-400">
                          <div className="flex gap-6">
                            <span>Booked: {formatDate(booking.bookingDate || booking.createdAt)}</span>
                            <span>Qty: {booking.quantity || 1} ticket{(booking.quantity || 1) !== 1 ? 's' : ''}</span>
                            {booking.checkInStatus?.checkInTime && (
                              <span className="text-green-400 font-semibold">
                                ✅ Checked in: {formatDate(booking.checkInStatus.checkInTime)}
                              </span>
                            )}
                          </div>
                          
                          {eventStatus === 'Live' && booking.status !== 'cancelled' && (
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg px-4 py-2">
                              <span className="text-green-300 text-sm font-bold animate-pulse">
                                🎉 Event is Live!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center mt-16 flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/allevents"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-10 py-4 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold text-lg shadow-xl"
            >
              🎫 Book More Events
            </Link>
            <Link
              to="/"
              className="bg-gray-700 text-white px-10 py-4 rounded-xl hover:bg-gray-600 transition-all font-bold text-lg"
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
