import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon, LocationIcon, UserGroupIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

// --- Helper function to format dates ---
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// --- Helper function for valid image URLs ---
const getValidImageUrl = (imageUrl) => {
  const brokenUrls = [
    'via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner',
    'https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner',
    'placehold.co',
    'FFFFFF?text=Event+Banner'
  ];
  
  if (!imageUrl || brokenUrls.some(broken => imageUrl.includes(broken))) {
    // Use a reliable local placeholder or working external image
    return '/placeholder-event.jpg'; // Make sure this exists in your public folder
  }
  
  return imageUrl;
};

// --- Detail Item Component for reusability ---
const DetailItem = ({ icon: Icon, label, value }) => (
  <div>
    <div className="flex items-center">
      {Icon && <Icon className="h-6 w-6 text-cyan-400 mr-3" />}
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const EventDetailPage = () => {
  const { eventId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate(); 

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');
  const [hasExistingTicket, setHasExistingTicket] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log('📋 Fetching event details for ID:', eventId);
        
        const response = await apiClient.get(`/api/events/${eventId}`);
        console.log('✅ Event details loaded:', response);
        
        setEvent(response.event || response.data?.event || response);
        
        // Check if user already has a ticket (only if authenticated)
        if (isAuthenticated && user?.selectedRole === 'event_attendee') {
          checkExistingTicket();
        }
      } catch (err) {
        console.error('❌ Error fetching event details:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, isAuthenticated, user]);

  // Function to check if user already has a ticket
  const checkExistingTicket = async () => {
    try {
      const response = await apiClient.get('/api/attendee/my-bookings');
      const bookings = response.bookings || response.data?.bookings || [];
      
      const hasTicket = bookings.some(booking => {
        const bookingEventId = booking.event?.id || booking.event?._id || booking.eventId;
        return bookingEventId === eventId && 
               (booking.status === 'active' || booking.status === 'confirmed');
      });
      
      setHasExistingTicket(hasTicket);
      
      if (hasTicket) {
        console.log('✅ User already has a ticket for this event');
      }
    } catch (error) {
      console.warn('⚠️ Error checking existing tickets:', error.message);
      // Don't show error to user, just assume no existing ticket
    }
  };

  const handlePayment = async () => {
    // Validation checks
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    if (user.selectedRole !== 'event_attendee') {
      toast.error('Only attendees can book tickets');
      return;
    }

    if (!event || !event._id) {
      toast.error('Event data not loaded. Please refresh the page.');
      return;
    }

    if (hasExistingTicket) {
      toast.error('You already have a ticket for this event');
      return;
    }

    if (isProcessing) {
      return; // Prevent double submission
    }

    const ticketsSold = event.statistics?.totalTicketsSold || event.ticketsSold || 0;
    const seatsLeft = event.capacity - ticketsSold;
    
    if (seatsLeft <= 0) {
      toast.error('This event is sold out');
      return;
    }

    setIsProcessing(true);
    setBookingStatus('Processing...');

    try {
      console.log('🎫 Starting payment process for event:', event.title);
      
      // Generate unique payment identifiers
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      // ✅ FIXED: Complete payment data structure with all required fields
      const paymentData = {
        // Required payment identifiers
        orderId: `ORDER_${timestamp}_${randomId}`,
        paymentId: `PAY_${timestamp}_${randomId}`,
        eventId: event._id,
        
        // Payment details
        amount: event.pricing?.isFree ? 0 : (event.pricing?.price || 0),
        currency: 'INR',
        quantity: 1,
        
        // Attendee information
        attendeeInfo: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Demo User',
          email: user?.email || 'demo@example.com',
          phone: user?.phone || '9999999999',
          userId: user?._id || user?.id
        },
        
        // Event information for verification
        eventTitle: event.title,
        eventDate: event.startDateTime,
        
        // Booking metadata
        bookingDate: new Date().toISOString(),
        paymentMethod: 'demo',
        paymentType: event.pricing?.isFree ? 'free' : 'paid'
      };

      console.log('💳 Payment data prepared:', {
        ...paymentData,
        attendeeInfo: { ...paymentData.attendeeInfo, phone: '***masked***' }
      });

      // Simulate processing delay for better UX
      const processingDelay = event.pricing?.isFree ? 1000 : 2500;
      
      await new Promise(resolve => setTimeout(resolve, processingDelay));

      // ✅ FIXED: Call payment verification with complete data
      const response = await apiClient.post('/api/payments/verify-demo-payment', paymentData);
      
      console.log('✅ Payment verification response:', response);

      if (response.success || response.data?.success) {
        const ticketData = response.ticket || response.data?.ticket;
        const paymentInfo = response.payment || response.data?.payment;
        
        setBookingStatus('Booking successful!');
        
        const successMessage = event.pricing?.isFree 
          ? '🎉 Free ticket booked successfully!' 
          : `✅ Payment successful! Ticket booked for ₹${event.pricing?.price || '0'}.`;
        
        toast.success(successMessage);
        
        // Update state to reflect that user now has a ticket
        setHasExistingTicket(true);
        
        // ✅ FIXED: Navigate to confirmation with proper data structure
        console.log('🎊 Redirecting to confirmation page...');
        
        setTimeout(() => {
          navigate('/confirmation', {
            state: {
              ticket: {
                id: ticketData?.id || ticketData?._id || paymentData.orderId,
                _id: ticketData?.id || ticketData?._id || paymentData.orderId,
                ticketId: ticketData?.id || ticketData?._id || paymentData.orderId,
                ticketNumber: ticketData?.ticketNumber || `TICKET_${timestamp}`,
                qrCodeData: ticketData?.qrCodeData || paymentData.orderId,
                qrCodeUrl: ticketData?.qrCodeUrl || '',
                status: ticketData?.status || 'active',
                paymentStatus: paymentInfo?.status || 'completed',
                pricePaid: paymentData.amount,
                totalAmount: paymentData.amount,
                bookingDate: paymentData.bookingDate,
                createdAt: paymentData.bookingDate,
                bookedAt: paymentData.bookingDate,
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
                quantity: paymentData.quantity,
                attendeeInfo: paymentData.attendeeInfo
              },
              event: {
                _id: event._id,
                id: event._id,
                title: event.title,
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                location: event.location,
                bannerImageUrl: event.bannerImageUrl || event.bannerImage,
                host: event.host,
                pricing: event.pricing,
                description: event.description,
                category: event.category,
                capacity: event.capacity
              },
              payment: {
                orderId: paymentData.orderId,
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: 'completed',
                method: 'demo',
                timestamp: paymentData.bookingDate
              }
            }
          });
        }, 500);

      } else {
        const errorMsg = response.message || response.data?.message || 'Payment verification failed';
        setBookingStatus(`Error: ${errorMsg}`);
        toast.error(`❌ Booking failed: ${errorMsg}`);
      }

    } catch (err) {
      console.error('❌ Payment processing error:', err);
      const errorMsg = err.message || 'Payment processing failed';
      setBookingStatus(`Error: ${errorMsg}`);
      toast.error(`❌ Booking failed: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      // Clear status after a delay
      setTimeout(() => {
        if (!hasExistingTicket) {
          setBookingStatus('');
        }
      }, 5000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-black text-red-500 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Event</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Try Again
            </button>
            <Link 
              to="/allevents" 
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors inline-block"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Event not found state
  if (!event) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
          <Link 
            to="/allevents" 
            className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors inline-block"
          >
            Browse All Events
          </Link>
        </div>
      </div>
    );
  }

  const ticketsSold = event.statistics?.totalTicketsSold || event.ticketsSold || 0;
  const seatsLeft = event.capacity - ticketsSold;
  const isSoldOut = seatsLeft <= 0;

  return (
    <section className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Event Image */}
          <div className="lg:w-3/5">
            <img
              src={getValidImageUrl(event.bannerImageUrl)}
              alt={event.title}
              className="w-full h-auto object-cover rounded-2xl shadow-lg shadow-cyan-500/10"
              onError={(e) => {
                console.log('Image failed to load, using fallback');
                e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&crop=center';
              }}
            />
          </div>

          {/* Event Details */}
          <div className="lg:w-2/5 flex flex-col">
            <div>
              <span className="inline-block bg-gray-800 text-cyan-400 text-sm font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
                {event.category?.replace('-', ' ') || 'General'}
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight my-4">
                <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                  {event.title}
                </span>
              </h1>
            </div>

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 border-y border-gray-800 py-8">
              <DetailItem 
                icon={CalendarIcon} 
                label="Starts On" 
                value={formatDate(event.startDateTime)} 
              />
              <DetailItem 
                icon={LocationIcon} 
                label="Location" 
                value={event.location?.venue || event.location || 'TBD'} 
              />
              <DetailItem 
                icon={UserGroupIcon} 
                label="Capacity" 
                value={`${event.capacity} Attendees`} 
              />
              <DetailItem 
                icon={UserGroupIcon} 
                label="Available" 
                value={`${Math.max(0, seatsLeft)} seats left`} 
              />
            </div>

            {/* Event Description */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">About this event</h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                {event.description || 'No description available for this event.'}
              </p>
            </div>

            {/* Host Information */}
            {event.host && (
              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Event Host</h3>
                <p className="text-white">
                  {`${event.host.firstName || ''} ${event.host.lastName || ''}`.trim() || 'Event Organizer'}
                </p>
                {event.host.email && (
                  <p className="text-gray-400 text-sm">{event.host.email}</p>
                )}
              </div>
            )}

            {/* Booking Section */}
            <div className="mt-auto pt-8">
              {/* Seats Left Alert */}
              {!isSoldOut && !hasExistingTicket && seatsLeft <= 10 && (
                <div className="relative text-center mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 opacity-75 blur-lg animate-pulse"></div>
                  <p className="relative z-10 font-bold text-lg text-white">
                    Only <span className="text-cyan-400">{seatsLeft}</span> seats left!
                  </p>
                </div>
              )}

              {/* Booking Button Logic */}
              {hasExistingTicket ? (
                <div className="text-center">
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
                    <p className="text-green-400 font-semibold">✅ You already have a ticket for this event!</p>
                  </div>
                  <button 
                    onClick={() => navigate('/my-bookings')}
                    className="w-full bg-green-500 text-white font-bold rounded-full px-8 py-4 text-lg transition-all duration-300 ease-in-out hover:bg-green-600 transform hover:scale-105"
                  >
                    🎫 View My Tickets
                  </button>
                </div>
              ) : isSoldOut ? (
                <div className="text-center">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                    <p className="text-red-400 font-semibold">❌ This event is sold out</p>
                  </div>
                  <button 
                    disabled
                    className="w-full bg-gray-600 text-gray-400 font-bold rounded-full px-8 py-4 text-lg cursor-not-allowed"
                  >
                    🚫 Sold Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? (
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `🎫 ${event.pricing?.isFree ? 'Get Free Ticket' : `Buy Ticket for ₹${event.pricing?.price || '0'}`}`
                  )}
                </button>
              )}

              {/* Status Messages */}
              {bookingStatus && bookingStatus !== 'Processing...' && !hasExistingTicket && (
                <div className="mt-4 text-center">
                  <p className={`font-semibold ${
                    bookingStatus.startsWith('Error:') 
                      ? 'text-red-500' 
                      : bookingStatus.includes('successful') 
                        ? 'text-green-500' 
                        : 'text-yellow-500'
                  }`}>
                    {bookingStatus}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-6 text-center text-sm text-gray-400">
                <p>💳 Secure demo payment • 📧 Instant confirmation</p>
                {event.pricing?.isFree && !hasExistingTicket && (
                  <p className="mt-2 text-cyan-400">🎉 This is a free event!</p>
                )}
              </div>

              {/* Login prompt for unauthenticated users */}
              {!isAuthenticated && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    Need to book a ticket?
                  </p>
                  <Link 
                    to="/login" 
                    className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                  >
                    Login to continue
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventDetailPage;
