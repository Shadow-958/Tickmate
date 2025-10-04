import React, { useEffect, useState } from 'react';
import EventCard from './EventCard';

const EventList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Example: if you’re fetching from API
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events"); // your backend endpoint
        const data = await res.json();
        setEvents(data.events);  // since your data has { events: [...] }
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {events.length > 0 ? (
        events.map(event => (
          <EventCard key={event._id} event={event} />
        ))
      ) : (
        <p className="text-white">No events found</p>
      )}
    </div>
  );
};

export default EventList;
