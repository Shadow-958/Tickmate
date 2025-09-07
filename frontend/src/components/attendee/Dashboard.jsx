import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import Ticket from "./Ticket";
import { TicketIcon, HistoryIcon } from '../../helper/Icons.jsx';


// --- Main Dashboard Component ---
const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { user } = useUser();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tickets/my-bookings?clerkId=${
            user.id
          }`
        );
        if (!response.ok) throw new Error('Failed to fetch bookings.');
        
        const allBookings = await response.json();
        const now = new Date();

        const upcoming = allBookings.filter(booking => booking.eventId && new Date(booking.eventId.endDateTime) >= now);
        const past = allBookings.filter(booking => booking.eventId && new Date(booking.eventId.endDateTime) < now);

        upcoming.sort((a, b) => new Date(a.eventId.endDateTime) - new Date(b.eventId.endDateTime));

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
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
    if (loading) return <div className="text-center p-8">Loading your tickets...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    const eventsToShow = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
    
    if (eventsToShow.length === 0) {
        return (
            <div className="text-center p-8">
                <h3 className="text-xl font-bold text-white">No {activeTab} events found.</h3>
                <p className="mt-2 text-gray-400">
                    {activeTab === 'upcoming' ? "Why not explore some new events?" : "Your attended events will appear here."}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {eventsToShow.map(booking => (
              <Ticket key={booking._id} event={booking.eventId} ticket={booking} />
            ))}
        </div>
    )
  }

  return (
    <section className="bg-black min-h-screen text-white">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-gray-900/50 rounded-2xl shadow-2xl shadow-black/30 border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">My Dashboard</span>
                    </h1>
                    <p className="mt-1 text-gray-400">View and manage your event tickets.</p>
                </div>

                <div className="flex flex-col lg:flex-row">
                    <aside className="hidden lg:block w-64 border-r border-gray-800 p-6">
                        <nav className="space-y-2">
                            {navItems.map((item) => <NavLink key={item.id} item={item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} />)}
                        </nav>
                    </aside>

                    <div className="lg:hidden p-4 border-b border-gray-800">
                        <div className="flex bg-gray-800/50 p-1 rounded-lg">
                            {navItems.map((item) => (
                                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors duration-300 ${activeTab === item.id ? "bg-cyan-500 text-white" : "text-gray-400 hover:text-white"}`}>
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
