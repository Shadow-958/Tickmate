// src/components/attendee/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Ticket from "./Ticket";
import { TicketIcon, HistoryIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';

// --- Main Dashboard Component ---
const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { user } = useAuth();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log('🎫 Fetching bookings for user:', user.firstName);
        
        // FIXED: Use correct endpoint
        const response = await apiClient.get('/api/attendee/my-bookings');
        
        console.log('📋 Bookings response:', response);

        // FIXED: Use correct response property
        const allBookings = response.bookings || [];
        const now = new Date();

        console.log(`Found ${allBookings.length} total bookings`);

        // FIXED: Use correct event property structure
        const upcoming = allBookings.filter(booking => {
          if (!booking.event || !booking.event.startDateTime) return false;
          return new Date(booking.event.endDateTime || booking.event.startDateTime) >= now;
        });
        
        const past = allBookings.filter(booking => {
          if (!booking.event || !booking.event.startDateTime) return false;
          return new Date(booking.event.endDateTime || booking.event.startDateTime) < now;
        });

        // Sort upcoming events by start date
        upcoming.sort((a, b) => new Date(a.event.startDateTime) - new Date(b.event.startDateTime));
        
        // Sort past events by start date (most recent first)
        past.sort((a, b) => new Date(b.event.startDateTime) - new Date(a.event.startDateTime));

        console.log(`📊 Sorted: ${upcoming.length} upcoming, ${past.length} past events`);

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        console.error('❌ Error fetching bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const navItems = [
    { id: "upcoming", label: "Upcoming Events", icon: TicketIcon },
    { id: "past", label: "Past Events", icon: HistoryIcon },
  ];

  const NavLink = ({ item, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`group flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
        isActive ? "bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
      }`}
    >
      <item.icon className={`mr-3 h-6 w-6 transition-colors duration-300 ${isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-400"}`} />
      <span className="flex-1">{item.label}</span>
      {isActive && <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-glow-light"></div>}
    </button>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your tickets...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center p-8">
          <div className="text-red-400 mb-4">❌ Error loading bookings</div>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-cyan-500 text-black px-4 py-2 rounded hover:bg-cyan-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    const eventsToShow = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    if (eventsToShow.length === 0) {
      return (
        <div className="text-center p-8">
          <div className="text-6xl mb-4">
            {activeTab === 'upcoming' ? '🎫' : '📅'}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No {activeTab} events found
          </h3>
          <p className="text-gray-400 mb-6">
            {activeTab === 'upcoming' 
              ? "You haven't booked any upcoming events yet." 
              : "Your past events will appear here after you attend them."
            }
          </p>
          {activeTab === 'upcoming' && (
            <a 
              href="/allevents" 
              className="inline-block bg-cyan-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
            >
              Explore Events
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'} 
            <span className="text-cyan-400 ml-2">({eventsToShow.length})</span>
          </h2>
        </div>
        
        <div className="space-y-6">
          {eventsToShow.map(booking => (
            <Ticket 
              key={booking.ticketId} 
              event={booking.event} 
              ticket={{
                ...booking,
                // Map the booking properties to what Ticket component expects
                _id: booking.ticketId,
                eventId: booking.event
              }} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="bg-black min-h-screen text-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gray-900/50 rounded-2xl shadow-2xl shadow-black/30 border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                My Dashboard
              </span>
            </h1>
            <p className="mt-1 text-gray-400">
              View and manage your event tickets.
            </p>
            {user && (
              <p className="mt-2 text-sm text-cyan-400">
                Welcome back, {user.firstName}! 👋
              </p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row">
            <aside className="hidden lg:block w-64 border-r border-gray-800 p-6">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.id} 
                    item={item} 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                  />
                ))}
              </nav>
            </aside>

            <div className="lg:hidden p-4 border-b border-gray-800">
              <div className="flex bg-gray-800/50 p-1 rounded-lg">
                {navItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors duration-300 ${
                      activeTab === item.id 
                        ? "bg-cyan-500 text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <main className="flex-1 p-6 lg:p-8 min-h-[60vh]">
              <div key={activeTab} className="animate-fade-in">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBookingsPage;
