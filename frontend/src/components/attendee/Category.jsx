import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EventCard from './EventCard.jsx';



const Category = () => {
  const { categoryId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/events?category=${categoryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [categoryId]);

  if (loading) {
    return <div className="bg-black text-white text-center p-20 pt-40">Loading events...</div>;
  }

  if (error) {
    return <div className="bg-black text-red-500 text-center p-20 pt-40">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-4xl font-bold text-white mb-2 capitalize">
          {categoryId.replace('-', ' ')}
        </h1>
        <p className="text-lg text-gray-400 mb-12">
          Browse our upcoming {categoryId.replace('-', ' ')} events.
        </p>
        
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center p-16 bg-gray-900 rounded-2xl">
            <p className="text-gray-400 text-lg">No events found for this category at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
