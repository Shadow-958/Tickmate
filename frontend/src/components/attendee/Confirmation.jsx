// src/components/attendee/ConfirmationPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import * as htmlToImage from 'html-to-image';
import Ticket from "./Ticket";
import { CalendarIcon, DashboardIcon, DownloadIcon } from '../../helper/Icons.jsx';
import toast from 'react-hot-toast';

// Helper function for valid image URLs
const getValidImageUrl = (imageUrl) => {
  const brokenUrls = [
    'via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner',
    'https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner',
    'placehold.co',
    'FFFFFF?text=Event+Banner'
  ];
  
  if (!imageUrl || typeof imageUrl !== 'string' || brokenUrls.some(broken => imageUrl.includes(broken))) {
    // Return a working placeholder or local image
    return '/placeholder-event.jpg'; // Make sure this exists in your public folder
  }
  
  return imageUrl;
};

const ConfirmationPage = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef(null);

  const { ticket, event, payment } = location.state || {};

  console.log('🎊 Confirmation page data:', { ticket, event, payment });

  // Enhanced validation with better error messages
  useEffect(() => {
    if (!ticket || !event) {
      console.warn('⚠️ Missing booking data:', { hasTicket: !!ticket, hasEvent: !!event });
      toast.error('No booking data found. Redirecting to your bookings...');
      
      // Delay redirect to show the error message
      setTimeout(() => {
        navigate('/my-bookings', { replace: true });
      }, 2000);
      return;
    }

    // Validate essential ticket data
    if (!ticket.ticketNumber && !ticket.id && !ticket._id) {
      console.warn('⚠️ Invalid ticket data - missing identifier');
      toast.error('Invalid ticket data. Please check your bookings.');
    }

    // Show success message
    toast.success('🎉 Booking confirmed successfully!');
    
    // Stop confetti after 8 seconds
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, [ticket, event, navigate]);

  // Redirect if no data (render nothing while redirecting)
  if (!ticket || !event) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!ticketRef.current) {
      toast.error("Unable to download ticket. Please try again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('📱 Generating ticket image...');
      
      // Ensure the ticket is fully rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#000000',
        width: ticketRef.current.offsetWidth || 800,
        height: ticketRef.current.offsetHeight || 400,
        quality: 1.0,
        skipFonts: false,
        useCORS: true
      });
      
      const link = document.createElement("a");
      const eventName = event.title ? event.title.replace(/[^a-zA-Z0-9]/g, '-') : 'event';
      const ticketId = ticket.ticketNumber || ticket.id || ticket._id || 'ticket';
      link.download = `${eventName}-ticket-${ticketId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✅ Ticket downloaded successfully!');
      console.log('✅ Ticket image downloaded');
    } catch (err) {
      console.error("❌ Failed to download ticket image:", err);
      toast.error('Failed to download ticket. Please try screenshot instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'TBD';
    }
  };

  const formatPrice = (amount) => {
    const price = parseFloat(amount) || 0;
    return price === 0 ? 'FREE' : `₹${price.toFixed(2)}`;
  };

  // Safely extract data with fallbacks
  const ticketNumber = ticket.ticketNumber || ticket.id || ticket._id || 'N/A';
  const eventTitle = event.title || 'Event';
  const eventLocation = event.location?.venue || event.location?.address || event.location || 'TBD';
  const totalAmount = ticket.totalAmount || ticket.pricePaid || payment?.amount || 0;

  // Create properly structured data for Ticket component
  const ticketData = {
    _id: ticket.id || ticket.ticketId || ticket._id || 'temp-id',
    id: ticket.id || ticket.ticketId || ticket._id || 'temp-id',
    ticketNumber: ticketNumber,
    eventId: event._id || event.id,
    attendeeId: ticket.attendeeInfo?.userId || ticket.attendeeId,
    createdAt: ticket.bookingDate || ticket.createdAt || new Date().toISOString(),
    bookedAt: ticket.bookingDate || ticket.bookedAt || new Date().toISOString(),
    status: ticket.status || 'active',
    paymentStatus: ticket.paymentStatus || 'completed',
    pricePaid: totalAmount,
    quantity: ticket.quantity || 1,
    qrCodeData: ticket.qrCodeData || ticket.orderId || ticketNumber,
    qrCodeUrl: ticket.qrCodeUrl || '',
    // Add attendee info if available
    attendeeInfo: ticket.attendeeInfo || {
      name: ticket.attendeeInfo?.name || 'Attendee',
      email: ticket.attendeeInfo?.email || ''
    }
  };

  const eventData = {
    _id: event._id || event.id,
    id: event._id || event.id,
    title: eventTitle,
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    location: event.location,
    // ✅ FIXED: Ensure valid image URL is passed
    bannerImageUrl: getValidImageUrl(event.bannerImageUrl || event.bannerImage),
    host: event.host,
    pricing: event.pricing,
    description: event.description || '',
    category: event.category || 'general',
    capacity: event.capacity || 0
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {showConfetti && (
        <Confetti 
          recycle={false} 
          numberOfPieces={300}
          colors={['#00FFFF', '#0080FF', '#8000FF', '#FF0080', '#FF8000', '#FFFF00']}
          gravity={0.2}
          wind={0.01}
          initialVelocityX={5}
          initialVelocityY={-10}
        />
      )}
      
      <div className="container mx-auto px-4 py-12 sm:py-16 relative z-10">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Booking Confirmed!
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Your ticket for <span className="text-cyan-400 font-semibold">{eventTitle}</span> is confirmed. 
            Get ready for an amazing experience!
          </p>
          
          {/* Booking Summary */}
          <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Booking Summary</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket Number:</span>
                <span className="text-cyan-400 font-mono text-xs bg-gray-800 px-2 py-1 rounded">
                  {ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Event Date:</span>
                <span className="text-white">{formatDate(event.startDateTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Location:</span>
                <span className="text-white text-right max-w-[150px] truncate" title={eventLocation}>
                  {eventLocation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-green-400 font-semibold">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">✅ Confirmed</span>
              </div>
              {payment?.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-gray-300 font-mono text-xs">
                    {payment.orderId.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Display */}
        <div className="flex flex-col items-center gap-8">
          <div ref={ticketRef} className="w-full max-w-4xl">
            <Ticket 
              event={eventData}
              ticket={ticketData}
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/allevents"
              className="group flex items-center justify-center w-full bg-gray-800/50 border border-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-500 hover:scale-105"
            >
              <CalendarIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              Browse More Events
            </Link>
            
            <Link
              to="/my-bookings"
              className="group flex items-center justify-center w-full bg-gray-800/50 border border-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-500 hover:scale-105"
            >
              <DashboardIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              My Bookings
            </Link>
            
            <button 
              onClick={handleDownload}
              disabled={isLoading}
              className="sm:col-span-2 group flex items-center justify-center w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold px-6 py-4 rounded-lg transition-all duration-300 hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <DownloadIcon className="h-5 w-5 mr-3 group-hover:animate-bounce" />
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Generating...
                </>
              ) : (
                'Download Ticket'
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-8 max-w-2xl">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Important Notes</h3>
              <ul className="text-sm text-gray-300 space-y-1 text-left">
                <li>📱 Save this ticket to your device or take a screenshot</li>
                <li>🎫 Present your QR code at the event for check-in</li>
                <li>📧 Check your email for ticket confirmation (if provided)</li>
                <li>⏰ Arrive 15-30 minutes before the event starts</li>
                <li>📋 Keep your ticket number handy: <code className="bg-gray-800 px-1 rounded text-cyan-400">{ticketNumber}</code></li>
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(ticketNumber).then(() => {
                    toast.success('📋 Ticket number copied to clipboard!');
                  }).catch(() => {
                    toast.error('Failed to copy ticket number');
                  });
                } else {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = ticketNumber;
                  document.body.appendChild(textArea);
                  textArea.select();
                  try {
                    document.execCommand('copy');
                    toast.success('📋 Ticket number copied to clipboard!');
                  } catch {
                    toast.error('Failed to copy ticket number');
                  }
                  document.body.removeChild(textArea);
                }
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              📋 Copy Ticket Number
            </button>
            
            <button
              onClick={() => {
                const eventDetails = `🎫 ${eventTitle}\n📅 ${formatDate(event.startDateTime)}\n📍 ${eventLocation}\n🎟️ Ticket: ${ticketNumber}`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(eventDetails).then(() => {
                    toast.success('📝 Event details copied!');
                  }).catch(() => {
                    toast.error('Failed to copy event details');
                  });
                } else {
                  // Fallback
                  const textArea = document.createElement('textarea');
                  textArea.value = eventDetails;
                  document.body.appendChild(textArea);
                  textArea.select();
                  try {
                    document.execCommand('copy');
                    toast.success('📝 Event details copied!');
                  } catch {
                    toast.error('Failed to copy event details');
                  }
                  document.body.removeChild(textArea);
                }
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              📝 Copy Event Details
            </button>

            <button
              onClick={() => {
                if (navigator.share && navigator.canShare) {
                  navigator.share({
                    title: `${eventTitle} - Ticket Confirmed`,
                    text: `I'm attending ${eventTitle} on ${formatDate(event.startDateTime)}!`,
                    url: window.location.origin
                  }).catch(() => {
                    // Fallback to clipboard
                    const shareText = `🎉 I'm attending ${eventTitle} on ${formatDate(event.startDateTime)}! 🎫`;
                    navigator.clipboard?.writeText(shareText);
                    toast.success('📤 Event info copied for sharing!');
                  });
                } else {
                  const shareText = `🎉 I'm attending ${eventTitle} on ${formatDate(event.startDateTime)}! 🎫`;
                  navigator.clipboard?.writeText(shareText);
                  toast.success('📤 Event info copied for sharing!');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📤 Share Event
            </button>
          </div>

          {/* Emergency Contact Info */}
          <div className="text-center mt-8 text-xs text-gray-500">
            <p>Need help? Contact event support with your ticket number: {ticketNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
