import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import {
  DashboardSection,
  EventsListSection,
  RevenueAnalyticsSection,
  StaffManagementSection
} from "./DashboardComponents";
import {
  DashboardIcon,
  CalendarIcon,
  HistoryIcon,
  ChartBarIcon,
  LiveIcon,
  UsersIcon
} from "../../helper/Icons";
import apiClient from "../../utils/apiClient";
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    events: false,
    analytics: false,
    staff: false
  });

  // Check authentication
  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.selectedRole !== 'event_host') {
      console.log('⚠️ User is not an event host:', user.selectedRole);
      toast.error('Access denied. Please switch to event host role.');
      navigate('/role-selection');
      return;
    }
    
    console.log('✅ User authenticated as event host:', user);
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.selectedRole !== 'event_host') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching dashboard data for user:', user._id);
        
        // Fetch events
        setLoadingStates(prev => ({ ...prev, events: true }));
        try {
          console.log('📋 Fetching events...');
          const eventsRes = await apiClient.get('/api/host/my-events');
          console.log('✅ Events response:', eventsRes);
          
          const eventsData = eventsRes.events || eventsRes.data || [];
          setEvents(eventsData);
          console.log(`✅ Loaded ${eventsData.length} events`);
        } catch (eventsError) {
          console.error('❌ Events fetch error:', eventsError);
          toast.error('Failed to load events');
          setEvents([]);
        } finally {
          setLoadingStates(prev => ({ ...prev, events: false }));
        }

        // Fetch analytics (optional)
        setLoadingStates(prev => ({ ...prev, analytics: true }));
        try {
          console.log('📊 Fetching analytics...');
          const analyticsRes = await apiClient.get('/api/host/analytics');
          console.log('✅ Analytics response:', analyticsRes);
          setAnalytics(analyticsRes.analytics || analyticsRes.data || null);
        } catch (analyticsError) {
          console.warn('⚠️ Analytics not available:', analyticsError.message);
          setAnalytics(null);
        } finally {
          setLoadingStates(prev => ({ ...prev, analytics: false }));
        }

        // Fetch staff users
        setLoadingStates(prev => ({ ...prev, staff: true }));
        try {
          console.log('👥 Fetching staff users...');
          const staffRes = await apiClient.get('/api/host/available-staff');
          console.log('✅ Staff response:', staffRes);
          
          const staffData = staffRes.staff || staffRes.data || [];
          setStaffUsers(staffData);
          console.log(`✅ Loaded ${staffData.length} staff users`);
        } catch (staffError) {
          console.warn('⚠️ Staff fetch failed, trying fallback:', staffError.message);
          
          try {
            const usersRes = await apiClient.get('/api/users');
            const staffData = (usersRes.users || []).filter(u => u.selectedRole === 'staff');
            setStaffUsers(staffData);
            console.log(`✅ Loaded ${staffData.length} staff users (fallback)`);
          } catch (fallbackError) {
            console.error('❌ Staff fallback failed:', fallbackError);
            toast.error('Failed to load staff users');
            setStaffUsers([]);
          }
        } finally {
          setLoadingStates(prev => ({ ...prev, staff: false }));
        }

      } catch (err) {
        console.error('❌ Dashboard data fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      await apiClient.delete(`/api/host/events/${eventId}`);
      
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      toast.success('Event deleted successfully');
      
      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('❌ Delete event error:', error);
      toast.error(error.message || 'Failed to delete event');
    }
  };

  const handleAssignStaff = async (eventId, staffId) => {
    try {
      console.log(`👥 Assigning staff ${staffId} to event ${eventId}`);
      
      await apiClient.post(`/api/host/events/${eventId}/assign-staff`, { staffId });
      
      // Update local state - handle both ID arrays and object arrays
      setEvents(prevEvents => prevEvents.map(event => {
        if (event._id === eventId) {
          const currentStaff = event.assignedStaff || [];
          
          // Check if staff is already assigned (handle both ID and object formats)
          const isAlreadyAssigned = currentStaff.some(staff => 
            (typeof staff === 'string' ? staff : staff._id) === staffId
          );
          
          if (!isAlreadyAssigned) {
            return {
              ...event,
              assignedStaff: [...currentStaff, staffId]
            };
          }
        }
        return event;
      }));
      
      toast.success('Staff member assigned successfully');
      console.log('✅ Staff assigned successfully');
    } catch (error) {
      console.error('❌ Assign staff error:', error);
      toast.error(error.message || 'Failed to assign staff member');
    }
  };

  const handleRemoveStaff = async (eventId, staffId) => {
    try {
      console.log(`🗑️ Removing staff ${staffId} from event ${eventId}`);
      
      await apiClient.delete(`/api/host/events/${eventId}/remove-staff/${staffId}`);
      
      // Update local state - handle both ID arrays and object arrays
      setEvents(prevEvents => prevEvents.map(event => {
        if (event._id === eventId) {
          const currentStaff = event.assignedStaff || [];
          
          return {
            ...event,
            assignedStaff: currentStaff.filter(staff => 
              (typeof staff === 'string' ? staff : staff._id) !== staffId
            )
          };
        }
        return event;
      }));
      
      toast.success('Staff member removed successfully');
      console.log('✅ Staff removed successfully');
    } catch (error) {
      console.error('❌ Remove staff error:', error);
      toast.error(error.message || 'Failed to remove staff member');
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "live", label: "Live Events", icon: LiveIcon },
    { id: "upcoming", label: "Upcoming Events", icon: CalendarIcon },
    { id: "past", label: "Past Events", icon: HistoryIcon },
    { id: "staff", label: "Staff Management", icon: UsersIcon },
    { id: "analytics", label: "Revenue Analytics", icon: ChartBarIcon }
  ];

  const renderSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              {loadingStates.events && <p>📋 Loading events...</p>}
              {loadingStates.analytics && <p>📊 Loading analytics...</p>}
              {loadingStates.staff && <p>👥 Loading staff...</p>}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Dashboard Error</h2>
            <p className="text-gray-400 mb-8 max-w-md">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/role-selection')}
                className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Change Role
              </button>
            </div>
          </div>
        </div>
      );
    }

    const now = new Date();
    const live = events.filter(e => {
      const start = new Date(e.startDateTime);
      const end = new Date(e.endDateTime);
      return start <= now && end >= now;
    });
    const upcoming = events.filter(e => new Date(e.startDateTime) > now);
    const past = events.filter(e => new Date(e.endDateTime) < now);

    console.log(`📊 Events categorized: ${live.length} live, ${upcoming.length} upcoming, ${past.length} past`);

    const commonProps = {
      staffUsers,
      onAssignStaff: handleAssignStaff,
      onRemoveStaff: handleRemoveStaff,
      handleDeleteEvent
    };

    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardSection
            events={events}
            analytics={analytics}
            {...commonProps}
          />
        );
      case "live":
        return (
          <EventsListSection
            title="Live Events"
            events={live}
            showStaffManagement={true}
            {...commonProps}
          />
        );
      case "upcoming":
        return (
          <EventsListSection
            title="Upcoming Events"
            events={upcoming}
            showStaffManagement={true}
            {...commonProps}
          />
        );
      case "past":
        return (
          <EventsListSection
            title="Past Events"
            events={past}
            showStaffManagement={false}
            {...commonProps}
          />
        );
      case "staff":
        return (
          <StaffManagementSection
            events={events}
            {...commonProps}
          />
        );
      case "analytics":
        return analytics ? (
          <RevenueAnalyticsSection analytics={analytics} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Analytics Data</h3>
              <p className="text-gray-500">Analytics will appear here once you have events with ticket sales</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Section Not Found</h3>
              <p className="text-gray-500">The requested section could not be found</p>
              <button
                onClick={() => setActiveSection('dashboard')}
                className="mt-4 bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  // Don't render if user is not authenticated or not an event host
  if (!user || user.selectedRole !== 'event_host') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

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
