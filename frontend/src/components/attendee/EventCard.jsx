import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, LocationIcon } from '../../helper/Icons.jsx';
import { getBestImageUrl, isSupabaseUrl, loadImage } from '../../utils/imageUtils';

// --- The Reusable Event Card Component ---
const EventCard = ({ event }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);

  const eventPrice = event.pricing.isFree ? 'Free' : `₹${event.pricing.price / 100}`;
  const eventDate = new Date(event.startDateTime).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format location: supports both string and object
  let locationText = '';
  if (event.location) {
    if (typeof event.location === 'object') {
      const { venue, address, city } = event.location;
      locationText = [venue, address, city].filter(Boolean).join(', ');
    } else if (typeof event.location === 'string') {
      locationText = event.location;
    }
  }

  // Handle image loading
  useEffect(() => {
    const loadEventImage = async () => {
      const bestUrl = getBestImageUrl(event.bannerImageUrl, event.bannerImage, event.category);
      
      if (isSupabaseUrl(bestUrl)) {
        // For Supabase URLs, try to load and fallback if it fails
        try {
          await loadImage(bestUrl);
          setImageSrc(bestUrl);
        } catch (error) {
          console.warn('Supabase image failed to load, using fallback');
          setImageSrc(getBestImageUrl(null, null, event.category));
          setImageError(true);
        }
      } else {
        setImageSrc(bestUrl);
      }
    };

    loadEventImage();
  }, [event.bannerImageUrl, event.bannerImage, event.category]);

  return (
    <Link
      to={`/events/${event._id}`}
      className="group relative block h-full transform transition-transform duration-500 ease-in-out hover:scale-105"
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition duration-500 group-hover:opacity-75"></div>
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black">
        <img
          src={imageSrc || getBestImageUrl(null, null, event.category)}
          alt={event.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            if (!imageError) {
              setImageError(true);
              setImageSrc(getBestImageUrl(null, null, event.category));
            }
          }}
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
              <span>{locationText}</span>
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
