import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, LocationIcon } from '../../helper/Icons.jsx';

// --- The Reusable Event Card Component ---
const EventCard = ({ event }) => {
  const eventPrice = event.pricing.isFree ? 'Free' : `₹${event.pricing.price / 100}`;
  const eventDate = new Date(event.startDateTime).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/events/${event._id}`} className="group relative block h-full transform transition-transform duration-500 ease-in-out hover:scale-105">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition duration-500 group-hover:opacity-75"></div>
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black">
        <img
          src={event.bannerImageUrl || 'https://placehold.co/600x400/000000/FFFFFF?text=Event'}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2 truncate">
            {event.title}
          </h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center">
              {/* Added size classes to the icon */}
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center">
              {/* Added size classes to the icon */}
              <LocationIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{event.location}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <p className="text-lg font-semibold text-cyan-400">{eventPrice}</p>
            <div className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 group-hover:bg-cyan-500">
              View Details
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
