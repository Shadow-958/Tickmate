// src/components/organizer/ManageEvent.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { UsersIcon, CalendarIcon, LocationIcon, TicketIcon, UserGroupIcon } from "../../helper/Icons.jsx";
import apiClient from '../../utils/apiClient';
import { getBestImageUrl, isSupabaseUrl, loadImage } from '../../utils/imageUtils';

// Helper function to format dates safely
const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

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

const EventPreview = ({ event, eventId }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);

  // Safe access to event properties with fallbacks
  const eventTitle = event?.title || 'Untitled Event';
  const eventCategory = event?.category || 'general';
  const eventDescription = event?.description || 'No description available';

  // Handle image loading
  useEffect(() => {
    const loadEventImage = async () => {
      const bestUrl = getBestImageUrl(event?.bannerImageUrl, event?.bannerImage, eventCategory);
      
      if (isSupabaseUrl(bestUrl)) {
        try {
          await loadImage(bestUrl);
          setImageSrc(bestUrl);
        } catch (error) {
          console.warn('Supabase image failed to load, using fallback');
          setImageSrc(getBestImageUrl(null, null, eventCategory));
          setImageError(true);
        }
      } else {
        setImageSrc(bestUrl);
      }
    };

    if (event) {
      loadEventImage();
    }
  }, [event?.bannerImageUrl, event?.bannerImage, eventCategory]);
  
  // Safe location handling
  const getLocationText = () => {
    if (!event?.location) return 'Location TBD';
    
    if (typeof event.location === 'string') {
      return event.location;
    }
    
    if (typeof event.location === 'object') {
      return event.location.venue || event.location.address || 'Location TBD';
    }
    
    return 'Location TBD';
  };

  // Safe pricing handling
  const getPricingText = () => {
    if (!event?.pricing) return 'Price TBD';
    
    if (event.pricing.isFree) {
      return 'Free';
    }
    
    const price = event.pricing.price;
    if (typeof price === 'number') {
      return `$${(price / 100).toFixed(2)}`;
    }
    
    return 'Price TBD';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
      <div className="lg:w-3/5">
        <img
          src={imageSrc || getBestImageUrl(null, null, eventCategory)}
          alt={eventTitle}
          className="w-full h-auto object-cover rounded-2xl shadow-lg shadow-cyan-500/10"
          onError={(e) => {
            if (!imageError) {
              setImageError(true);
              setImageSrc(getBestImageUrl(null, null, eventCategory));
            }
          }}
        />
      </div>

      <div className="lg:w-2/5 flex flex-col">
        <div>
          <span className="inline-block bg-gray-800 text-cyan-400 text-sm font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
            {eventCategory.replace('-', ' ')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight my-4">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {eventTitle}
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 border-y border-gray-800 py-8">
          <DetailItem
            icon={CalendarIcon}
            label="Start Date & Time"
            value={formatDate(event?.startDateTime)}
          />
          <DetailItem
            icon={CalendarIcon}
            label="End Date & Time"
            value={formatDate(event?.endDateTime)}
          />
          <DetailItem
            icon={LocationIcon}
            label="Location"
            value={getLocationText()}
          />
          <DetailItem 
            icon={TicketIcon} 
            label="Pricing" 
            value={getPricingText()}
          />
        </div>

        {/* Event Description */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">About this event</h2>
          <p className="text-gray-300 leading-relaxed">
            {eventDescription}
          </p>
        </div>

        {/* View Attendee List button */}
        <Link
          to={`/attendee-list/${eventId}`}
          className="inline-flex items-center justify-center w-full bg-cyan-500 text-black font-bold rounded-full px-8 py-4 text-lg transition-all hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105"
        >
          <UsersIcon className="h-6 w-6 mr-3" />
          View Attendee List
        </Link>

        {/* Additional Management Actions */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link
            to={`/scanner/${eventId}`}
            className="inline-flex items-center justify-center bg-green-500 text-white font-bold rounded-lg px-6 py-3 transition-all hover:bg-green-600"
          >
            <TicketIcon className="h-5 w-5 mr-2" />
            QR Scanner
          </Link>
          <Link
            to={`/edit-event/${eventId}`}
            className="inline-flex items-center justify-center bg-blue-500 text-white font-bold rounded-lg px-6 py-3 transition-all hover:bg-blue-600"
          >
            ✏️ Edit Event
          </Link>
        </div>

        {/* Event Stats */}
        {event && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">Event Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Capacity</p>
                <p className="text-cyan-400 font-semibold">{event.capacity || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Tickets Sold</p>
                <p className="text-green-400 font-semibold">{event.ticketsSold || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Available</p>
                <p className="text-blue-400 font-semibold">{(event.capacity || 0) - (event.ticketsSold || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className={`font-semibold capitalize ${
                  event.status === 'published' ? 'text-green-400' :
                  event.status === 'draft' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {event.status || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ManageEventPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 Fetching event details for ID:', eventId);
        
        // Try different endpoints to get event data
        let response;
        try {
          // First try the general events endpoint
          response = await apiClient.get(`/api/events/${eventId}`);
          console.log('✅ Event data from /api/events:', response);
        } catch (generalError) {
          console.log('❌ /api/events failed, trying /api/host/events...');
          // If that fails, try the host-specific endpoint
          try {
            response = await apiClient.get(`/api/host/events/${eventId}`);
            console.log('✅ Event data from /api/host/events:', response);
          } catch (hostError) {
            console.log('❌ Both endpoints failed');
            throw new Error('Event not found or you do not have permission to view it');
          }
        }

        // Handle different response structures
        const eventData = response.event || response.data || response;
        
        if (!eventData) {
          throw new Error('No event data received');
        }

        setEvent(eventData);
        console.log('📋 Final event data:', eventData);
        
      } catch (err) {
        console.error('❌ Error fetching event:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Loading state
  if (loading) {
    return (
      <main className="bg-black text-white py-12 sm:py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Event Details...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="bg-black text-white py-12 sm:py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Event</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Try Again
              </button>
              <Link 
                to="/organizer-dashboard" 
                className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors inline-block"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Event not found state
  if (!event) {
    return (
      <main className="bg-black text-white py-12 sm:py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">Event Not Found</h2>
            <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link 
              to="/organizer-dashboard" 
              className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white py-12 sm:py-16 min-h-screen">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Link 
              to="/organizer-dashboard"
              className="mr-4 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Manage Event
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Here's a preview of your event page. Use the tools below to manage your attendees.
          </p>
        </header>

        <section className="mb-12">
          <EventPreview event={event} eventId={eventId} />
        </section>

        {/* Additional Management Section */}
        <section className="bg-gray-900/30 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Event Management Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to={`/attendee-list/${eventId}`}
              className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6 hover:bg-blue-500/20 transition-all group"
            >
              <UsersIcon className="h-12 w-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-white mb-2">Attendee Management</h3>
              <p className="text-gray-400 text-sm">View and manage registered attendees</p>
            </Link>

            <Link
              to={`/scanner/${eventId}`}
              className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 hover:bg-green-500/20 transition-all group"
            >
              <TicketIcon className="h-12 w-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-white mb-2">QR Code Scanner</h3>
              <p className="text-gray-400 text-sm">Scan tickets for event check-in</p>
            </Link>

            <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-6">
              <UserGroupIcon className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm">View attendance and revenue analytics</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ManageEventPage;
