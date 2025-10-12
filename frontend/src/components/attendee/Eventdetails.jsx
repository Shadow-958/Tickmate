// src/components/attendee/EventDetailPage.jsx - COMPLETE WITH ENHANCED IMAGE HANDLING

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon, LocationIcon, UserGroupIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import { processPayment } from '../../utils/razorpay';
import toast from 'react-hot-toast';

// ✅ IMAGE CACHE CLASS FOR BETTER PERFORMANCE
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50; // Maximum cached images
  }

  async validate(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const isValid = await new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), 5000); // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = url;
    });

    // Add to cache
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(url, isValid);
    return isValid;
  }

  clear() {
    this.cache.clear();
  }
}

// Create global image cache instance
const imageCache = new ImageCache();

// ✅ ENHANCED: Dynamic fallback images based on event category
const getFallbackImage = (category = 'general') => {
  const fallbackImages = {
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop&q=80',
    'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop&q=80',
    'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop&q=80',
    'business': 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=600&fit=crop&q=80',
    'art': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop&q=80',
    'food': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop&q=80',
    'education': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=600&fit=crop&q=80',
    'entertainment': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=600&fit=crop&q=80',
    'conference': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=600&fit=crop&q=80',
    'general': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80'
  };
  
  return fallbackImages[category?.toLowerCase()] || fallbackImages.general;
};

// ✅ ENHANCED: More robust image URL validation
const getValidImageUrl = (imageUrl) => {
  const brokenUrls = [
    'via.placeholder.com',
    'placehold.co',
    'FFFFFF?text=Event+Banner',
    'placeholder',
    'example.com',
    'localhost',
    'undefined',
    'null',
    '127.0.0.1'
  ];
  
  // Check if URL is invalid or contains broken patterns
  if (!imageUrl || 
      typeof imageUrl !== 'string' || 
      imageUrl.trim() === '' ||
      imageUrl === 'undefined' ||
      imageUrl === 'null' ||
      brokenUrls.some(broken => imageUrl.includes(broken))) {
    
    return null; // Return null for invalid URLs
  }
  
  // Validate URL format
  try {
    const url = new URL(imageUrl);
    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return imageUrl;
  } catch (error) {
    console.warn('⚠️ Invalid image URL format:', imageUrl);
    return null;
  }
};

// ✅ ENHANCED: Image validation with cache
const validateImageUrl = async (url) => {
  try {
    return await imageCache.validate(url);
  } catch (error) {
    console.warn('Image validation error:', error);
    return false;
  }
};

// ✅ NEW: Loading skeleton component
const ImageSkeleton = ({ className }) => (
  <div className={`${className} bg-gray-800 rounded-2xl border border-gray-700 animate-pulse relative overflow-hidden`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
    <div className="flex items-center justify-center h-full relative z-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Loading image...</p>
      </div>
    </div>
  </div>
);

// ✅ NEW: Progressive Image Component with enhanced loading
const ProgressiveImage = ({ src, alt, className, fallbackCategory, onLoad, onError }) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    loaded: false,
    currentSrc: null
  });

  useEffect(() => {
    let mounted = true;
    
    const loadImage = async () => {
      if (!src) {
        if (mounted) {
          setImageState({
            loading: false,
            error: true,
            loaded: true,
            currentSrc: getFallbackImage(fallbackCategory)
          });
        }
        return;
      }

      const validUrl = getValidImageUrl(src);
      
      if (!validUrl) {
        if (mounted) {
          setImageState({
            loading: false,
            error: true,
            loaded: true,
            currentSrc: getFallbackImage(fallbackCategory)
          });
        }
        return;
      }

      try {
        const isValid = await validateImageUrl(validUrl);
        
        if (!mounted) return;

        if (isValid) {
          setImageState({
            loading: false,
            error: false,
            loaded: true,
            currentSrc: validUrl
          });
          onLoad?.();
        } else {
          console.warn('⚠️ Image validation failed, using fallback for:', validUrl);
          setImageState({
            loading: false,
            error: true,
            loaded: true,
            currentSrc: getFallbackImage(fallbackCategory)
          });
          onError?.();
        }
      } catch (error) {
        if (mounted) {
          setImageState({
            loading: false,
            error: true,
            loaded: true,
            currentSrc: getFallbackImage(fallbackCategory)
          });
          onError?.(error);
        }
      }
    };

    loadImage();
    
    return () => {
      mounted = false;
    };
  }, [src, fallbackCategory, onLoad, onError]);

  if (imageState.loading) {
    return <ImageSkeleton className={className} />;
  }

  return (
    <div className="relative">
      {imageState.error && (
        <div className="absolute top-2 left-2 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs z-20 backdrop-blur-sm border border-orange-500/30">
          📷 Fallback Image
        </div>
      )}
      
      <img
        src={imageState.currentSrc}
        alt={alt}
        className={className}
        onError={(e) => {
          // Last resort fallback
          const generalFallback = getFallbackImage('general');
          if (e.target.src !== generalFallback) {
            console.warn('⚠️ Final fallback triggered for image');
            e.target.src = generalFallback;
          }
        }}
      />
    </div>
  );
};

// ✅ FIXED: Move formatPrice function outside to be reusable
const formatPrice = (pricing) => {
  if (!pricing || pricing.isFree) return 'FREE';
  
  const price = pricing.price || 0;
  const currency = pricing.currency || 'INR';
  const displayPrice = price > 1000 ? (price / 100).toFixed(0) : price.toFixed(0);
  
  return currency === 'INR' ? `₹${displayPrice}` : `${currency} ${displayPrice}`;
};

// --- Helper function to format dates with better styling ---
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// ✅ Enhanced Detail Item Component with SMALLER ICONS
const DetailItem = ({ icon: Icon, label, value, highlight = false }) => (
  <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
    highlight 
      ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/40' 
      : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
  }`}>
    <div className="flex items-center">
      {Icon && (
        <div className="p-2 rounded-lg bg-cyan-500/20 mr-3">
          <Icon className="h-4 w-4 text-cyan-400" />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">
          {label}
        </p>
        <p className={`font-bold text-lg ${highlight ? 'text-cyan-400' : 'text-white'}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

// ✅ FIXED: Price Display Component using the external formatPrice function
const PriceDisplay = ({ pricing, large = false }) => {
  const priceText = formatPrice(pricing);
  const isFree = !pricing || pricing.isFree;

  return (
    <div className={`inline-flex items-center gap-2 ${large ? 'text-3xl' : 'text-xl'}`}>
      <span className={`font-black ${
        large ? 'text-4xl' : 'text-2xl'
      } ${isFree ? 'text-green-400' : 'text-cyan-400'}`}>
        {priceText}
      </span>
      {!isFree && (
        <span className="text-sm text-gray-400">
          per ticket
        </span>
      )}
    </div>
  );
};

// ✅ Availability Badge Component with SMALLER ICONS
const AvailabilityBadge = ({ available, total }) => {
  const percentage = total ? (available / total) * 100 : 0;
  
  let status, color, bgColor, icon;
  
  if (available <= 0) {
    status = 'SOLD OUT';
    color = 'text-red-400';
    bgColor = 'bg-red-500/20 border-red-500/50';
    icon = '🚫';
  } else if (percentage <= 10) {
    status = 'ALMOST SOLD OUT';
    color = 'text-orange-400';
    bgColor = 'bg-orange-500/20 border-orange-500/50';
    icon = '⚡';
  } else if (percentage <= 25) {
    status = 'SELLING FAST';
    color = 'text-yellow-400';
    bgColor = 'bg-yellow-500/20 border-yellow-500/50';
    icon = '🔥';
  } else {
    status = 'AVAILABLE';
    color = 'text-green-400';
    bgColor = 'bg-green-500/20 border-green-500/50';
    icon = '✅';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 backdrop-blur-sm ${bgColor} animate-pulse`}>
      <span className="text-sm">{icon}</span>
      <span className={`font-bold text-sm ${color}`}>
        {status}
      </span>
    </div>
  );
};

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
        
        // ✅ Try both endpoints for better compatibility
        let response;
        try {
          response = await apiClient.get(`/api/events/${eventId}`);
        } catch (firstErr) {
          console.warn('First endpoint failed, trying alternative:', firstErr.message);
          response = await apiClient.get(`/api/attendee/events/${eventId}`);
        }
        
        console.log('✅ Event details loaded:', response);
        
        const eventData = response.event || response.data?.event || response;
        setEvent(eventData);
        
        // Check if user already has a ticket
        if (isAuthenticated && user?.selectedRole === 'event_attendee') {
          await checkExistingTicket();
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
      const response = await apiClient.get('/api/payments/my-tickets');
      const tickets = response.tickets || response.data?.tickets || [];
      
      const hasTicket = tickets.some(ticket => {
        const ticketEventId = ticket.event?.id || ticket.event?._id || ticket.eventId;
        return ticketEventId === eventId && 
               (ticket.status === 'active' || ticket.status === 'confirmed');
      });
      
      setHasExistingTicket(hasTicket);
      console.log('🎫 Existing ticket check:', hasTicket);
    } catch (error) {
      console.warn('⚠️ Error checking existing tickets:', error.message);
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

    if (isProcessing) return;

    const ticketsSold = event.statistics?.totalTicketsSold || event.ticketsSold || 0;
    const seatsLeft = event.capacity - ticketsSold;
    
    if (seatsLeft <= 0) {
      toast.error('This event is sold out');
      return;
    }

    setIsProcessing(true);
    setBookingStatus('Processing...');

    try {
      console.log('🎫 Starting Razorpay payment process for event:', event.title);
      
      // Prepare user info for payment
      const userInfo = {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Guest User',
        email: user?.email || 'guest@example.com',
        phone: user?.phone || '9999999999',
        userId: user?._id || user?.id
      };

      // Process payment using Razorpay
      const result = await processPayment(event._id, userInfo, 1);
      
      console.log('✅ Payment successful:', result);

      if (result.success) {
        const ticketData = result.ticket;
        const paymentInfo = result.payment;
        
        setBookingStatus('Booking successful!');
        
        const successMessage = event.pricing?.isFree 
          ? '🎉 Free ticket booked successfully!' 
          : `✅ Payment successful! Ticket booked.`;
        
        toast.success(successMessage);
        setHasExistingTicket(true);
        
        console.log('🎊 Redirecting to confirmation page...');
        
        setTimeout(() => {
          navigate('/confirmation', {
            state: {
              ticket: {
                id: ticketData?.id || ticketData?._id,
                _id: ticketData?.id || ticketData?._id,
                ticketId: ticketData?.id || ticketData?._id,
                ticketNumber: ticketData?.ticketNumber,
                qrCodeData: ticketData?.qrCodeData,
                qrCodeUrl: ticketData?.qrCodeUrl,
                paymentId: ticketData?.paymentId,
                status: ticketData?.status || 'active',
                paymentStatus: paymentInfo?.status || 'completed',
                pricePaid: paymentInfo?.amount || 0,
                totalAmount: paymentInfo?.amount || 0,
                bookingDate: ticketData?.bookingDate,
                createdAt: ticketData?.createdAt,
                bookedAt: ticketData?.bookingDate,
                orderId: paymentInfo?.orderId,
                quantity: 1,
                attendeeInfo: ticketData?.attendeeInfo
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
                orderId: paymentInfo?.orderId,
                paymentId: paymentInfo?.paymentId,
                amount: paymentInfo?.amount,
                currency: paymentInfo?.currency,
                status: paymentInfo?.status,
                method: 'razorpay',
                timestamp: paymentInfo?.completedAt
              }
            }
          });
        }, 500);

      } else {
        const errorMsg = result.message || 'Payment verification failed';
        setBookingStatus(`Error: ${errorMsg}`);
        toast.error(`❌ Booking failed: ${errorMsg}`);
      }

    } catch (err) {
      console.error('❌ Payment processing error:', err);
      const errorMsg = err.message || 'Payment processing failed';
      setBookingStatus(`Error: ${errorMsg}`);
      
      // Handle specific error cases
      if (errorMsg.includes('cancelled')) {
        toast.error('Payment was cancelled. Please try again.');
      } else if (errorMsg.includes('failed')) {
        toast.error('Payment failed. Please check your payment details and try again.');
      } else {
        toast.error(`❌ Booking failed: ${errorMsg}`);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (!hasExistingTicket) {
          setBookingStatus('');
        }
      }, 5000);
    }
  };

  // ✅ Enhanced Loading state
  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse delay-1000"></div>
        
        <div className="text-center z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-cyan-400 mx-auto mb-6"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-ping rounded-full h-16 w-16 border-4 border-cyan-400 opacity-20"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Event Details</h3>
          <p className="text-gray-400 animate-pulse">Preparing an amazing experience for you...</p>
        </div>
      </div>
    );
  }

  // ✅ Enhanced Error state
  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-gray-900"></div>
        
        <div className="text-center z-10 max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">😵</div>
          <h2 className="text-3xl font-bold mb-4 text-red-400">Oops! Something went wrong</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              🔄 Try Again
            </button>
            <Link 
              to="/allevents" 
              className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition-all duration-300 font-semibold border border-gray-700 hover:border-gray-600 transform hover:scale-105"
            >
              ← Back to Events
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
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold mb-4">Event Not Found</h2>
          <p className="text-gray-400 mb-8">The event you're looking for doesn't exist or may have been removed.</p>
          <Link 
            to="/allevents" 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 font-semibold transform hover:scale-105"
          >
            🎫 Browse All Events
          </Link>
        </div>
      </div>
    );
  }

  const ticketsSold = event.statistics?.totalTicketsSold || event.ticketsSold || 0;
  const seatsLeft = event.capacity - ticketsSold;
  const isSoldOut = seatsLeft <= 0;

  return (
    <div className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* ✅ Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="relative z-10">
        {/* ✅ Enhanced Navigation Bar with SMALLER ICONS */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/allevents" 
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Events</span>
              </Link>

              {/* Category Badge */}
              <div className="flex items-center gap-3">
                <span className="inline-block bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 text-sm font-semibold px-4 py-2 rounded-full border border-cyan-500/30 backdrop-blur-sm uppercase tracking-wider">
                  {event.category?.replace('-', ' ') || 'General'}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* ✅ MAIN CARD CONTAINER WITH PROPER BORDERS & PADDING */}
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl border-2 border-gray-700/50 rounded-3xl shadow-2xl shadow-cyan-500/10 p-8 lg:p-12 relative overflow-hidden">
            
            {/* ✅ Card Inner Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(6,182,212,0.1),transparent_40%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.1),transparent_40%)]"></div>

            {/* ✅ Card Content */}
            <div className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                
                {/* ✅ ENHANCED EVENT IMAGE SECTION WITH PROGRESSIVE LOADING */}
                <div className="space-y-8">
                  <div className="relative group">
                    <ProgressiveImage
                      src={event.bannerImageUrl}
                      alt={event.title}
                      fallbackCategory={event.category}
                      className="w-full h-auto max-h-96 object-cover rounded-2xl shadow-2xl shadow-cyan-500/20 transition-all duration-500 border-2 border-gray-700/50 group-hover:shadow-cyan-500/30 transform group-hover:scale-[1.02] hover:border-cyan-500/30"
                      onLoad={() => console.log('✅ Event image loaded successfully')}
                      onError={() => console.warn('⚠️ Event image failed to load')}
                    />
                    
                    {/* Image overlay with gradient */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Availability badge overlay */}
                    <div className="absolute top-4 right-4">
                      <AvailabilityBadge available={seatsLeft} total={event.capacity} />
                    </div>
                  </div>

                  {/* ✅ Event Info Cards */}
                  <div className="grid grid-cols-2 gap-6">
                    <DetailItem 
                      icon={CalendarIcon} 
                      label="Event Date" 
                      value={formatDateShort(event.startDateTime)}
                      highlight={true}
                    />
                    <DetailItem 
                      icon={() => (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      label="Start Time" 
                      value={formatTime(event.startDateTime)}
                    />
                    <DetailItem 
                      icon={LocationIcon} 
                      label="Venue" 
                      value={event.location?.venue || event.location?.address || 'TBD'} 
                    />
                    <DetailItem 
                      icon={UserGroupIcon} 
                      label="Capacity" 
                      value={`${event.capacity} seats`} 
                    />
                  </div>
                </div>

                {/* ✅ Enhanced Event Details Section */}
                <div className="space-y-10">
                  {/* Title and Price */}
                  <div className="space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                      <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                        {event.title}
                      </span>
                    </h1>
                    
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border-2 border-gray-600/50 backdrop-blur-sm">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Event Price</p>
                        <PriceDisplay pricing={event.pricing} large={true} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400 mb-2">Available Seats</p>
                        <p className="text-3xl font-bold text-cyan-400">{Math.max(0, seatsLeft)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Enhanced Description with SMALLER ICON */}
                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-600/50">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      About This Event
                    </h2>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {event.description || 'Join us for an amazing event experience! More details will be shared soon.'}
                    </p>
                  </div>

                  {/* ✅ Enhanced Host Information with SMALLER ICON */}
                  {event.host && (
                    <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-500/30">
                      <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                        <span className="text-lg">👨‍💼</span>
                        Event Host
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-400/50">
                          {`${event.host.firstName || ''} ${event.host.lastName || ''}`.trim().charAt(0) || 'H'}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-xl mb-1">
                            {`${event.host.firstName || ''} ${event.host.lastName || ''}`.trim() || 'Event Organizer'}
                          </p>
                          {event.host.email && (
                            <p className="text-gray-300 text-base">{event.host.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ Enhanced Booking Section */}
                  <div className="space-y-8">
                    {/* Urgency Message with SMALLER ICON */}
                    {!isSoldOut && !hasExistingTicket && seatsLeft <= 20 && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 animate-pulse"></div>
                        <div className="relative z-10 text-center">
                          <div className="text-3xl mb-3">🔥</div>
                          <h3 className="text-2xl font-bold text-orange-400 mb-3">
                            Only {seatsLeft} Seats Remaining!
                          </h3>
                          <p className="text-gray-300 text-lg">
                            This event is filling up fast. Secure your spot now!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ✅ Enhanced Booking Button */}
                    <div className="space-y-6">
                      {hasExistingTicket ? (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/60 rounded-2xl p-8 text-center backdrop-blur-sm">
                            <div className="text-4xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold text-green-400 mb-3">You're All Set!</h3>
                            <p className="text-gray-300 text-lg">You already have a ticket for this event.</p>
                          </div>
                          <button 
                            onClick={() => navigate('/my-bookings')}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl px-8 py-6 text-xl transition-all duration-300 hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 border-2 border-green-400/50"
                          >
                            <span className="flex items-center justify-center gap-3">
                              <span className="text-xl">🎫</span>
                              View My Tickets
                            </span>
                          </button>
                        </div>
                      ) : isSoldOut ? (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/60 rounded-2xl p-8 text-center backdrop-blur-sm">
                            <div className="text-4xl mb-4">😔</div>
                            <h3 className="text-2xl font-bold text-red-400 mb-3">Event Sold Out</h3>
                            <p className="text-gray-300 text-lg">Unfortunately, all tickets for this event have been sold.</p>
                          </div>
                          <button 
                            disabled
                            className="w-full bg-gray-700 text-gray-400 font-bold rounded-2xl px-8 py-6 text-xl cursor-not-allowed border-2 border-gray-600"
                          >
                            <span className="flex items-center justify-center gap-3">
                              <span className="text-xl">🚫</span>
                              Sold Out
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <button 
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-2xl px-8 py-8 text-2xl transition-all duration-300 hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group border-2 border-cyan-400/50"
                          >
                            {/* Button background effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <span className="relative z-10 flex items-center justify-center gap-4">
                              {isProcessing ? (
                                <>
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-white"></div>
                                  <span>Processing Payment...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl">🎫</span>
                                  <span>
                                    {event.pricing?.isFree ? 'Get Your Free Ticket' : `Book Now for ${formatPrice(event.pricing)}`}
                                  </span>
                                </>
                              )}
                            </span>
                          </button>

                          {/* Status Messages */}
                          {bookingStatus && bookingStatus !== 'Processing...' && !hasExistingTicket && (
                            <div className={`text-center p-6 rounded-xl border-2 backdrop-blur-sm ${
                              bookingStatus.startsWith('Error:') 
                                ? 'bg-red-500/20 border-red-500/60 text-red-400' 
                                : bookingStatus.includes('successful') 
                                  ? 'bg-green-500/20 border-green-500/60 text-green-400' 
                                  : 'bg-yellow-500/20 border-yellow-500/60 text-yellow-400'
                            }`}>
                              <p className="font-semibold text-xl">{bookingStatus}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ✅ Enhanced Additional Info with SMALLER ICONS */}
                      <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600/50">
                        <div className="flex items-center justify-center gap-8 text-base text-gray-400">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔒</span>
                            <span>Secure Payment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📧</span>
                            <span>Instant Confirmation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📱</span>
                            <span>Mobile Ticket</span>
                          </div>
                        </div>
                        
                        {event.pricing?.isFree && !hasExistingTicket && (
                          <div className="text-center mt-4 pt-4 border-t border-gray-600">
                            <p className="text-cyan-400 font-semibold text-lg">🎉 This is a FREE event!</p>
                          </div>
                        )}
                      </div>

                      {/* Login prompt for unauthenticated users with SMALLER ICON */}
                      {!isAuthenticated && (
                        <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-600/50">
                          <h4 className="text-2xl font-semibold text-white mb-4">
                            Ready to join this event?
                          </h4>
                          <p className="text-gray-400 mb-6 text-lg">
                            Sign in to book your ticket and get instant confirmation.
                          </p>
                          <Link 
                            to="/login" 
                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-lg"
                          >
                            <span>Sign In to Continue</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
