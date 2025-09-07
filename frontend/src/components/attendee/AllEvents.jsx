import React, { useState, useEffect } from 'react';
import EventCard from './EventCard'; // <-- Import the new component
import { SearchIcon, FilterIcon } from '../../helper/Icons.jsx';


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
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/events?search=${searchTerm}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Could not fetch events.');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchAllEvents();
    }, 500);

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

  if (loading) return <div className="bg-black text-white text-center p-20 pt-40">Loading Events...</div>;
  if (error) return <div className="bg-black text-red-500 text-center p-20 pt-40">Error: {error}</div>;

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Explore Events
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Find your next experience. Discover what's happening near you.
          </p>
        </header>

        <div className="mb-12 sticky top-24 z-20 backdrop-blur-lg bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by event name, location..."
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
              <p className="text-gray-400">No events found{searchTerm && ` for "${searchTerm}"`}. Please check back later!</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AllEvents;
