// src/pages/landingpage/EventList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../../components/attendee/EventCard';
import apiClient from '../../utils/apiClient';

// --- Simple Skeleton Loader Component ---
const SkeletonCard = () => (
  <div className="relative h-full overflow-hidden rounded-2xl bg-gray-900 p-6 animate-pulse">
    <div className="w-full h-48 bg-gray-800 rounded-lg"></div>
    <div className="mt-4 h-6 w-3/4 bg-gray-800 rounded"></div>
    <div className="mt-3 space-y-2">
      <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
    </div>
    <div className="mt-6 flex justify-between items-center">
      <div className="h-6 w-1/4 bg-gray-800 rounded"></div>
      <div className="h-10 w-1/3 bg-gray-800 rounded-md"></div>
    </div>
  </div>
);

// --- Main Upcoming Events Section Component ---
const UpcomingEventsSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        console.log('🎪 Fetching upcoming events...');
        
        const response = await apiClient.get('/api/events');

        // Filter for events that are in the future
        const upcoming = response.events
          ?.filter(event => new Date(event.startDateTime) > new Date())
          .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
          .slice(0, 8) || []; // Get first 8 events

        setEvents(upcoming);
        console.log('✅ Events loaded:', upcoming.length);
      } catch (err) {
        console.error('❌ Error fetching events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-400 text-lg mb-4">Error loading events</div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No upcoming events found.</div>
          <p className="text-gray-500 mt-2">Check back soon for new events!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {events.map(event => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    );
  };

  return (
    <section className="bg-black text-white py-16 sm:py-20">
      <div className="container mx-auto px-4">
        {/* Simple Header */}
        <header className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Upcoming Events
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-400">
            Don't miss out. Book your spot at our next big event.
          </p>
        </header>

        {/* Events Content */}
        {renderContent()}

        {/* Simple CTA */}
        {!loading && events.length > 0 && (
          <div className="text-center mt-12">
            <Link
              to="/events"
              className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-8 py-3 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              View All Events
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEventsSection;
