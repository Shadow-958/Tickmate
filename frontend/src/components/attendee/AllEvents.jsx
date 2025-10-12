// src/components/attendee/AllEvents.jsx - COMPLETE VERSION WITH LIVE PRICING

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, FilterIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import { getBestImageUrl, isSupabaseUrl, loadImage } from '../../utils/imageUtils';

// --- Enhanced Event Card Component with Live Price Display ---
const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // ✅ UPDATED PRICE FORMATTING - HANDLES MULTIPLE FORMATS
  const formatPrice = (pricing) => {
    if (!pricing) return 'TBD';
    
    // Handle free events
    if (pricing.isFree === true || pricing.price === 0) {
      return 'FREE';
    }

    const price = pricing.price;
    const currency = pricing.currency || 'INR';

    // Handle different price storage formats
    let displayPrice;
    if (typeof price === 'number') {
      // If price is stored in cents (> 1000 suggests cents)
      if (price > 1000) {
        displayPrice = (price / 100).toFixed(0);
      } else {
        displayPrice = price.toFixed(0);
      }
    } else if (typeof price === 'string') {
      displayPrice = parseFloat(price).toFixed(0);
    } else {
      return 'TBD';
    }

    // Format based on currency
    switch (currency.toLowerCase()) {
      case 'inr':
        return `₹${displayPrice}`;
      case 'usd':
        return `$${displayPrice}`;
      case 'eur':
        return `€${displayPrice}`;
      case 'gbp':
        return `£${displayPrice}`;
      default:
        return `${currency} ${displayPrice}`;
    }
  };

  // ✅ GET PRICE COLOR BASED ON VALUE
  const getPriceColor = (pricing) => {
    if (!pricing || pricing.isFree || pricing.price === 0) {
      return 'bg-green-500'; // Free events - green
    }
    
    const price = typeof pricing.price === 'number' ? pricing.price : parseFloat(pricing.price) || 0;
    const actualPrice = price > 1000 ? price / 100 : price; // Handle cents conversion
    
    if (actualPrice < 500) return 'bg-blue-500';      // Low price - blue
    if (actualPrice < 1500) return 'bg-yellow-500';   // Medium price - yellow  
    if (actualPrice < 5000) return 'bg-orange-500';   // High price - orange
    return 'bg-red-500';                               // Premium price - red
  };

  // ✅ GET DYNAMIC PRICE BADGE TEXT
  const getPriceBadgeText = (pricing) => {
    if (!pricing || pricing.isFree || pricing.price === 0) {
      return 'FREE EVENT';
    }

    const price = typeof pricing.price === 'number' ? pricing.price : parseFloat(pricing.price) || 0;
    const actualPrice = price > 1000 ? price / 100 : price;
    
    if (actualPrice < 500) return 'BUDGET FRIENDLY';
    if (actualPrice < 1500) return 'REASONABLY PRICED';
    if (actualPrice < 5000) return 'PREMIUM EVENT';
    return 'EXCLUSIVE EVENT';
  };

  const handleImageError = () => setImageError(true);

  const getImageUrl = () => {
    if (imageError) {
      return getBestImageUrl(null, null, event.category);
    }
    return getBestImageUrl(event.bannerImageUrl, event.bannerImage, event.category);
  };

  // ✅ CALCULATE AVAILABILITY STATUS
  const getAvailabilityStatus = () => {
    const available = (event.capacity || 0) - (event.ticketsSold || 0);
    const percentage = event.capacity ? (available / event.capacity) * 100 : 0;

    if (available <= 0) return { status: 'SOLD OUT', color: 'text-red-400', bgColor: 'bg-red-500' };
    if (percentage <= 10) return { status: 'ALMOST SOLD OUT', color: 'text-orange-400', bgColor: 'bg-orange-500' };
    if (percentage <= 25) return { status: 'SELLING FAST', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
    return { status: 'AVAILABLE', color: 'text-green-400', bgColor: 'bg-green-500' };
  };

  const availabilityStatus = getAvailabilityStatus();

  // ✅ CHECK IF EVENT HAS ENDED
  const isEventExpired = () => {
    if (!event.endDateTime && !event.startDateTime) return false;
    const now = new Date();
    const eventEndTime = event.endDateTime ? new Date(event.endDateTime) : new Date(event.startDateTime);
    return eventEndTime < now;
  };

  const expired = isEventExpired();

  // Don't render expired events
  if (expired) return null;

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition-all duration-300 cursor-pointer hover:transform hover:scale-105 shadow-lg hover:shadow-cyan-500/20"
    >
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden bg-gray-800">
        <img
          src={getImageUrl()}
          alt={event.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            {event.category?.replace('-', ' ') || 'EVENT'}
          </span>
        </div>

        {/* ✅ ENHANCED PRICE BADGE WITH LIVE FORMATTING */}
        <div className="absolute top-3 right-3">
          <div className="flex flex-col items-end gap-2">
            {/* Main Price Badge */}
            <span
              className={`${getPriceColor(event.pricing)} text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg`}
            >
              {formatPrice(event.pricing)}
            </span>
            
            {/* Price Category Badge */}
            {event.pricing && !event.pricing?.isFree && (
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {getPriceBadgeText(event.pricing)}
              </span>
            )}
          </div>
        </div>

        {/* ✅ DYNAMIC AVAILABILITY BADGE */}
        <div className="absolute bottom-3 left-3">
          {availabilityStatus.status === 'SOLD OUT' ? (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              🚫 SOLD OUT
            </span>
          ) : availabilityStatus.status === 'ALMOST SOLD OUT' ? (
            <span className="bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              ⚡ ALMOST SOLD OUT
            </span>
          ) : availabilityStatus.status === 'SELLING FAST' ? (
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              🔥 SELLING FAST
            </span>
          ) : null}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {event.title}
        </h3>

        {/* ✅ LIVE PRICE DISPLAY IN DETAILS SECTION */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Price:</span>
            <span className={`font-bold text-lg ${event.pricing?.isFree ? 'text-green-400' : 'text-cyan-400'}`}>
              {formatPrice(event.pricing)}
            </span>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center text-gray-400 text-sm mb-2">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatDate(event.startDateTime)}</span>
        </div>

        <div className="flex items-center text-gray-400 text-sm mb-3">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatTime(event.startDateTime)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-400 text-sm mb-3">
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="line-clamp-1">
            {event.location?.city || event.location?.venue || 'Location TBD'}
          </span>
        </div>

        {/* ✅ ENHANCED TICKETS REMAINING WITH LIVE UPDATES */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="text-xs">
            {availabilityStatus.status === 'SOLD OUT' ? (
              <span className="text-red-400 font-bold">❌ Sold Out</span>
            ) : (
              <div>
                <span className={`${availabilityStatus.color} font-semibold`}>
                  {(event.capacity || 0) - (event.ticketsSold || 0)}
                </span>
                <span className="text-gray-400"> / {event.capacity || 0} tickets</span>
                <div className="text-gray-500 text-xs mt-1">
                  {event.ticketsSold || 0} sold
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Price in footer */}
            <div className="text-right">
              <div className={`text-sm font-bold ${event.pricing?.isFree ? 'text-green-400' : 'text-cyan-400'}`}>
                {formatPrice(event.pricing)}
              </div>
              {event.pricing && !event.pricing?.isFree && (
                <div className="text-xs text-gray-500">
                  {event.pricing.currency || 'INR'}
                </div>
              )}
            </div>

            <button className="text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main AllEvents Page Component ---
const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ✅ PRICE RANGE OPTIONS
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'free', label: 'Free Events' },
    { value: '0-500', label: 'Under ₹500' },
    { value: '500-1500', label: '₹500 - ₹1500' },
    { value: '1500-5000', label: '₹1500 - ₹5000' },
    { value: '5000+', label: 'Above ₹5000' }
  ];

  // ✅ CHECK IF EVENT HAS ENDED
  const isEventExpired = (event) => {
    if (!event.endDateTime && !event.startDateTime) return false;
    const now = new Date();
    const eventEndTime = event.endDateTime ? new Date(event.endDateTime) : new Date(event.startDateTime);
    return eventEndTime < now;
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching events with search:', searchTerm);
        
        const response = await apiClient.get(`/api/events?search=${searchTerm}`, {
          signal: controller.signal
        });
        
        console.log('📊 Events response:', response);

        const allEvents = response.events || response.data?.events || [];

        // ✅ Filter out expired events
        const activeEvents = allEvents.filter(event => !isEventExpired(event));

        setEvents(activeEvents);
        setLastUpdated(new Date());
        
        console.log(`✅ Loaded ${activeEvents.length} active events (${allEvents.length - activeEvents.length} expired filtered out)`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('❌ Error fetching events:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(fetchAllEvents, 500);
    return () => {
      controller.abort();
      clearTimeout(delayDebounceFn);
    };
  }, [searchTerm]);

  // ✅ AUTO-REFRESH EVERY 30 SECONDS FOR LIVE UPDATES
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && events.length > 0) {
        console.log('🔄 Auto-refreshing events...');
        setLastUpdated(new Date());
        // Trigger a silent refresh without showing loading
        apiClient.get(`/api/events?search=${searchTerm}`)
          .then(response => {
            const allEvents = response.events || response.data?.events || [];
            const activeEvents = allEvents.filter(event => !isEventExpired(event));
            setEvents(activeEvents);
          })
          .catch(err => console.log('Silent refresh failed:', err.message));
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loading, events.length, searchTerm]);

  // ✅ FILTER EVENTS BY CATEGORY AND PRICE
  const filteredEvents = events.filter(event => {
    // Category filter
    if (selectedCategory !== 'all' && event.category !== selectedCategory) {
      return false;
    }

    // Price filter
    if (selectedPriceRange !== 'all') {
      const pricing = event.pricing;
      
      if (selectedPriceRange === 'free') {
        return pricing?.isFree === true || pricing?.price === 0;
      }

      if (!pricing || pricing.isFree) return false;

      const price = typeof pricing.price === 'number' ? pricing.price : parseFloat(pricing.price) || 0;
      const actualPrice = price > 1000 ? price / 100 : price;

      switch (selectedPriceRange) {
        case '0-500':
          return actualPrice >= 0 && actualPrice < 500;
        case '500-1500':
          return actualPrice >= 500 && actualPrice < 1500;
        case '1500-5000':
          return actualPrice >= 1500 && actualPrice < 5000;
        case '5000+':
          return actualPrice >= 5000;
        default:
          return true;
      }
    }

    return true;
  });

  // Group events by category
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const category = event.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {});

  const categories = ['all', ...new Set(events.map(e => e.category).filter(Boolean))];

  if (loading)
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading upcoming events with live pricing...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Events</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );

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
            Discover exciting events with live pricing. Book your tickets now!
          </p>
          
          {/* ✅ LIVE STATS WITH LAST UPDATED TIME */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <div className="inline-flex items-center gap-2 bg-gray-900/50 rounded-full px-6 py-2 border border-gray-800">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 font-semibold">{filteredEvents.length}</span>
              <span className="text-gray-400">events available</span>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-gray-900/50 rounded-full px-4 py-2 border border-gray-800">
              <span className="text-gray-500 text-sm">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </header>

        {/* ✅ ENHANCED SEARCH AND FILTER BAR WITH PRICE FILTERING */}
        <div className="mb-8 sticky top-24 z-20 backdrop-blur-lg bg-gray-900/80 p-4 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, description..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3 font-semibold hover:bg-gray-800 hover:border-cyan-500 transition-colors"
            >
              <FilterIcon className="h-5 w-5 mr-2 text-gray-400" />
              Filters
              {(selectedCategory !== 'all' || selectedPriceRange !== 'all') && (
                <span className="ml-2 bg-cyan-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(selectedCategory !== 'all' ? 1 : 0) + (selectedPriceRange !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
              {/* Category Filter */}
              <div>
                <p className="text-sm text-gray-400 mb-3 font-semibold">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-cyan-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ PRICE RANGE FILTER */}
              <div>
                <p className="text-sm text-gray-400 mb-3 font-semibold">Price Range</p>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedPriceRange(range.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPriceRange === range.value
                          ? 'bg-green-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events Grid */}
        <section>
          {Object.keys(groupedEvents).length > 0 ? (
            selectedCategory === 'all' ? (
              Object.entries(groupedEvents).map(([category, eventsInCategory]) => (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4 capitalize">
                    {category.replace('-', ' ')}{' '}
                    <span className="text-sm text-gray-400 font-normal ml-3">
                      ({eventsInCategory.length} event
                      {eventsInCategory.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {eventsInCategory.map(event => (
                      <EventCard key={event._id} event={event} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4 capitalize">
                  {selectedCategory.replace('-', ' ')} Events
                  <span className="text-sm text-gray-400 font-normal ml-3">
                    ({filteredEvents.length} event
                    {filteredEvents.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map(event => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📅</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                {searchTerm ? 'No Results Found' : 'No Upcoming Events'}
              </h3>
              <p className="text-gray-500 mb-8">
                {searchTerm
                  ? `No upcoming events found for "${searchTerm}". Try different search terms or filters.`
                  : 'There are no upcoming events at the moment. Check back later for new events!'}
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedPriceRange !== 'all') && (
                <div className="flex gap-4 justify-center flex-wrap">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
                    >
                      Clear Search
                    </button>
                  )}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium border border-gray-700"
                    >
                      All Categories
                    </button>
                  )}
                  {selectedPriceRange !== 'all' && (
                    <button
                      onClick={() => setSelectedPriceRange('all')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      All Prices
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AllEvents;
