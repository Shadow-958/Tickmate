import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "../../components/organizer/DashboardLayout";
import { 
    DashboardSection, 
    EventsListSection, 
    RevenueAnalyticsSection 
} from "../../components/organizer/DashboardComponents";
import { DashboardIcon,CalendarIcon,HistoryIcon,ChartBarIcon,LiveIcon } from "../../helper/Icons";


// --- MAIN DASHBOARD LOGIC ---
export default function OrganizerDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user } = useUser();
  
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsRes, analyticsRes] = await Promise.all([
                fetch(`/api/organizer/my-events?clerkId=${user.id}`),
                fetch(`/api/organizer/analytics?clerkId=${user.id}`)
            ]);
            if (!eventsRes.ok || !analyticsRes.ok) throw new Error('Failed to fetch dashboard data.');
            const eventsData = await eventsRes.json();
            const analyticsData = await analyticsRes.json();
            setEvents(eventsData);
            setAnalytics(analyticsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);
  
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/organizer/my-events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      });
      if (!response.ok) throw new Error('Failed to delete the event.');
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const navItems = [ 
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon }, 
    { id: "live", label: "Live Events", icon: LiveIcon },
    { id: "upcoming", label: "Upcoming Events", icon: CalendarIcon }, 
    { id: "past", label: "Past Events", icon: HistoryIcon }, 
    { id: "analytics", label: "Revenue Analytics", icon: ChartBarIcon } 
  ];

  const renderSection = () => {
    if (loading) return <div className="text-center p-8">Loading Dashboard...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    const now = new Date();
    const live = events.filter(e => new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now);
    const upcoming = events.filter(e => new Date(e.startDateTime) > now);
    const past = events.filter(e => new Date(e.endDateTime) < now);

    switch (activeSection) {
      case "dashboard": return <DashboardSection events={events} handleDeleteEvent={handleDeleteEvent} />;
      case "live": return <EventsListSection title="Live Events" events={live} />;
      case "upcoming": return <EventsListSection title="Upcoming Events" events={upcoming} />;
      case "past": return <EventsListSection title="Past Events" events={past} />;
      case "analytics": return analytics ? <RevenueAnalyticsSection analytics={analytics} /> : <div>Loading analytics...</div>;
      default: return <DashboardSection events={events} handleDeleteEvent={handleDeleteEvent} />;
    }
  };

  return (
    <DashboardLayout
        navItems={navItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
    >
        {renderSection()}
    </DashboardLayout>
  );
}
