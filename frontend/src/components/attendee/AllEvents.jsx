// src/components/attendee/AllEvents.jsx
import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { SearchIcon, FilterIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';

// --- Main AllEvents Page Component ---
const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/events?search=${searchTerm}`);
      console.log(response)
      
      // If apiClient is axios → use response.data.events
      const allEvents = response.events || response.data?.events || [];
      const now = new Date();
      
      const upcomingEvents = allEvents.filter(event => {
        if (!event.startDateTime) return true;
        const eventStartTime = new Date(event.startDateTime);
        return eventStartTime > now;
      });

      setEvents(upcomingEvents);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const delayDebounceFn = setTimeout(fetchAllEvents, 500);
  return () => clearTimeout(delayDebounceFn);
}, [searchTerm]);


  const groupedEvents = events.reduce((acc, event) => {
    const category = event.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {});

  // ✅ Helper function to get event status for debugging
  const getEventStats = () => {
    const now = new Date();
    return events.reduce((stats, event) => {
      if (!event.startDateTime) {
        stats.noDate++;
        return stats;
      }
      
      const startTime = new Date(event.startDateTime);
      const endTime = new Date(event.endDateTime);
      
      if (endTime < now) {
        stats.past++;
      } else if (startTime <= now && endTime >= now) {
        stats.live++;
      } else {
        stats.upcoming++;
      }
      
      return stats;
    }, { upcoming: 0, live: 0, past: 0, noDate: 0 });
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading upcoming events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Events</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const eventStats = getEventStats();

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Upcoming Events
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Discover exciting events you can still join. Book your tickets now!
          </p>
          
          {/* ✅ Event count info */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gray-900/50 rounded-full px-6 py-2 border border-gray-800">
            <span className="text-cyan-400 font-semibold">{events.length}</span>
            <span className="text-gray-400">upcoming events available</span>
          </div>
        </header>

        <div className="mb-12 sticky top-24 z-20 backdrop-blur-lg bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search upcoming events..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3 font-semibold hover:bg-gray-800 transition-colors">
              <FilterIcon className="h-5 w-5 mr-2 text-gray-400" />
              Filters
            </button>
          </div>
        </div>

        <section>
          {Object.keys(groupedEvents).length > 0 ? (
            Object.entries(groupedEvents).map(([category, eventsInCategory]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4 capitalize">
                  {category.replace('-', ' ')} 
                  <span className="text-sm text-gray-400 font-normal ml-3">
                    ({eventsInCategory.length} event{eventsInCategory.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {eventsInCategory.map(event => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📅</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                {searchTerm ? 'No Results Found' : 'No Upcoming Events'}
              </h3>
              <p className="text-gray-500 mb-8">
                {searchTerm 
                  ? `No upcoming events found for "${searchTerm}". Try a different search term.`
                  : 'There are no upcoming events at the moment. Check back later for new events!'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </section>

        {/* ✅ Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg p-4 text-xs text-gray-400">
            <div>📊 Events: {eventStats.upcoming} upcoming, {eventStats.live} live, {eventStats.past} past</div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AllEvents;
