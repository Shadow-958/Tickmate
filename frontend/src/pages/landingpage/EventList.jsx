import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../../components/attendee/EventCard';

// --- ICONS ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


// --- Skeleton Loader Component ---
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
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Could not fetch events.');
        }
        const allEvents = await response.json();
        
        // Filter for events that are in the future
        const upcoming = allEvents
          .filter(event => new Date(event.startDateTime) > new Date())
          .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
          .slice(0, 4); // Get only the first 4

        setEvents(upcoming);
      } catch (err) {
        setError(err.message);
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
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500">Error: {error}</div>;
    }

    if (events.length === 0) {
        return <div className="text-center text-gray-400">No upcoming events found.</div>;
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
    <section className="bg-black text-white py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                    Upcoming Events
                </span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                Don't miss out. Book your spot at our next big event.
            </p>
        </header>
        {renderContent()}
      </div>
    </section>
  );
};

export default UpcomingEventsSection;
