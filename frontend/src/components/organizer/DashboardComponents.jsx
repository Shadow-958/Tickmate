// src/components/organizer/DashboardComponents.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  LocationIcon, 
  UsersIcon, 
  ChartBarIcon,
  TicketIcon,
  UserGroupIcon,
  DashboardIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '../../helper/Icons';

// Alternative icons (simple SVGs) for missing icons
const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Helper functions
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const getWorkingImageUrl = (imageUrl, defaultImage = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&crop=center') => {
  if (!imageUrl || 
      imageUrl.includes('via.placeholder.com') || 
      imageUrl.includes('FFFFFF?text=Event+Banner') ||
      imageUrl === 'https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner') {
    return defaultImage;
  }
  return imageUrl;
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color = 'cyan', subtitle = null }) => (
  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      )}
    </div>
  </div>
);

// Staff Assignment Card Component
const StaffAssignmentCard = ({ event, staffUsers, onAssignStaff, onRemoveStaff }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');

  const assignedStaffIds = event.assignedStaff || [];
  const assignedStaffDetails = staffUsers.filter(staff => 
    assignedStaffIds.includes(staff._id)
  );
  const availableStaff = staffUsers.filter(staff => 
    !assignedStaffIds.includes(staff._id)
  );

  const handleAssign = () => {
    if (selectedStaff) {
      onAssignStaff(event._id, selectedStaff);
      setSelectedStaff('');
      setShowAssignModal(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
          <p className="text-sm text-gray-400">
            📅 {new Date(event.startDateTime).toLocaleDateString()} at {' '}
            {new Date(event.startDateTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-xs text-gray-500">
            📍 {event.location?.venue || event.location || 'Venue TBD'}
          </p>
        </div>
        
        <button
          onClick={() => setShowAssignModal(true)}
          className="bg-cyan-500 text-black px-3 py-1.5 rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium"
          disabled={availableStaff.length === 0}
        >
          <PlusIcon className="h-4 w-4 inline mr-1" />
          Assign Staff
        </button>
      </div>

      {/* Assigned Staff List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Assigned Staff ({assignedStaffDetails.length})
        </h4>
        
        {assignedStaffDetails.length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-700 rounded-lg">
            <UsersIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No staff assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedStaffDetails.map(staff => (
              <div 
                key={staff._id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold text-sm">
                      {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {staff.firstName} {staff.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{staff.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onRemoveStaff(event._id, staff._id)}
                  className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                  title="Remove staff member"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Assign Staff to {event.title}
            </h3>
            
            {availableStaff.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">No available staff to assign</p>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Choose a staff member...</option>
                    {availableStaff.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.firstName} {staff.lastName} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAssign}
                    disabled={!selectedStaff}
                    className="flex-1 bg-cyan-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedStaff('');
                    }}
                    className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Event Card Component with Staff Management
const EventCard = ({ event, onDelete, staffUsers, onAssignStaff, onRemoveStaff, showStaffManagement = false }) => {
  const now = new Date();
  const eventStart = new Date(event.startDateTime);
  const eventEnd = new Date(event.endDateTime);
  
  const isLive = eventStart <= now && eventEnd >= now;
  const isPast = eventEnd < now;
  const isUpcoming = eventStart > now;

  const getStatusBadge = () => {
    if (isLive) {
      return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">🔴 Live</span>;
    } else if (isPast) {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">📅 Past</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">🕒 Upcoming</span>;
    }
  };

  const stats = event.statistics || {};
  const assignedStaff = event.assignedStaff || [];

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="aspect-video bg-gray-800 relative overflow-hidden">
        <img
          src={getWorkingImageUrl(event.bannerImageUrl)}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&crop=center';
          }}
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
              {event.title}
            </h3>
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {formatDate(event.startDateTime)}
              </div>
              <div className="flex items-center">
                <LocationIcon className="h-4 w-4 mr-2" />
                {event.location?.venue || event.location?.address || 'Location TBD'}
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 mr-2" />
                {formatNumber(stats.totalTicketsSold || 0)} / {formatNumber(event.capacity || 0)} attendees
              </div>
              {showStaffManagement && (
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  {assignedStaff.length} staff assigned
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-cyan-400 font-semibold">{formatNumber(stats.totalTicketsSold || 0)}</p>
            <p className="text-xs text-gray-400">Tickets Sold</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 font-semibold">{formatCurrency(stats.revenue || 0)}</p>
            <p className="text-xs text-gray-400">Revenue</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/manage-event/${event._id}`}
            className="flex-1 bg-cyan-500 text-black text-center py-2 px-3 rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Link>
          <Link
            to={`/attendee-list/${event._id}`}
            className="flex-1 bg-blue-500 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            Attendees
          </Link>
          <Link
            to={`/scanner/${event._id}`}
            className="flex-1 bg-green-500 text-white text-center py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <TicketIcon className="h-4 w-4 mr-1" />
            Scan
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              console.log('Edit event clicked for:', event.title);
              // TODO: Add edit functionality
            }}
            className="flex-1 bg-gray-700 text-gray-300 text-center py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center justify-center"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete && onDelete(event._id)}
            className="flex-1 bg-red-500/20 text-red-400 text-center py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors text-sm flex items-center justify-center"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Section
export const DashboardSection = ({ 
  events = [], 
  analytics = null, 
  handleDeleteEvent, 
  staffUsers = [], 
  onAssignStaff, 
  onRemoveStaff 
}) => {
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.startDateTime) > now);
  const liveEvents = events.filter(e => new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now);
  const recentEvents = events.slice(0, 3);

  // Safe analytics data extraction
  const overview = analytics?.overview || {};
  const totalEvents = overview.totalEvents || events.length || 0;
  const totalTickets = overview.totalTicketsSold || 0;
  const totalRevenue = overview.totalRevenue || 0;
  const upcomingCount = overview.upcomingEvents || upcomingEvents.length || 0;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={formatNumber(totalEvents)}
            icon={CalendarIcon}
            color="cyan"
          />
          <StatsCard
            title="Tickets Sold"
            value={formatNumber(totalTickets)}
            icon={TicketIcon}
            color="blue"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={CurrencyIcon}
            color="green"
          />
          <StatsCard
            title="Upcoming Events"
            value={formatNumber(upcomingCount)}
            icon={ChartBarIcon}
            color="purple"
          />
        </div>
      </div>

      {/* Live Events Alert */}
      {liveEvents.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-6">
          <h3 className="text-green-400 font-semibold mb-2">🔴 Live Events ({liveEvents.length})</h3>
          <p className="text-gray-300">You have {liveEvents.length} event(s) currently running!</p>
          <div className="mt-4 space-y-2">
            {liveEvents.map(event => (
              <div key={`live-event-${event._id}`} className="flex items-center justify-between bg-green-500/5 p-3 rounded-lg">
                <span className="text-white font-medium">{event.title}</span>
                <Link
                  to={`/scanner/${event._id}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Open Scanner
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Events</h2>
          <Link
            to="/newEvent"
            className="bg-cyan-500 text-black px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
          >
            + Create New Event
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
            <CalendarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Events Yet</h3>
            <p className="text-gray-500 mb-6">Create your first event to get started</p>
            <Link
              to="/newEvent"
              className="inline-block bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-medium"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentEvents.map(event => (
              <EventCard
                key={`recent-event-${event._id}`}
                event={event}
                onDelete={handleDeleteEvent}
                staffUsers={staffUsers}
                onAssignStaff={onAssignStaff}
                onRemoveStaff={onRemoveStaff}
                showStaffManagement={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Events List Section
export const EventsListSection = ({ 
  title, 
  events = [], 
  handleDeleteEvent,
  staffUsers = [],
  onAssignStaff,
  onRemoveStaff,
  showStaffManagement = false
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-400">{events.length} event(s)</p>
    </div>

    {events.length === 0 ? (
      <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
        <CalendarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No {title}</h3>
        <p className="text-gray-500">Events will appear here when available</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map(event => (
          <EventCard
            key={`event-list-${event._id}`}
            event={event}
            onDelete={handleDeleteEvent}
            staffUsers={staffUsers}
            onAssignStaff={onAssignStaff}
            onRemoveStaff={onRemoveStaff}
            showStaffManagement={showStaffManagement}
          />
        ))}
      </div>
    )}
  </div>
);

// Staff Management Section
export const StaffManagementSection = ({ events, staffUsers, onAssignStaff, onRemoveStaff }) => {
  const [filter, setFilter] = useState('all');

  const now = new Date();
  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'live':
        return new Date(event.startDateTime) <= now && new Date(event.endDateTime) >= now;
      case 'upcoming':
        return new Date(event.startDateTime) > now;
      case 'past':
        return new Date(event.endDateTime) < now;
      default:
        return true;
    }
  });

  const totalStaffAssignments = events.reduce((total, event) => 
    total + (event.assignedStaff?.length || 0), 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Management</h2>
          <p className="text-gray-400 mt-1">
            Assign staff members to events for ticket scanning and check-in management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Events"
          value={events.length}
          icon={QrCodeIcon}
          color="cyan"
        />
        <StatsCard
          title="Available Staff"
          value={staffUsers.length}
          icon={UsersIcon}
          color="green"
        />
        <StatsCard
          title="Total Assignments"
          value={totalStaffAssignments}
          icon={CheckCircleIcon}
          color="blue"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Events', count: events.length },
          { id: 'live', label: 'Live Events', count: events.filter(e => new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now).length },
          { id: 'upcoming', label: 'Upcoming', count: events.filter(e => new Date(e.startDateTime) > now).length },
          { id: 'past', label: 'Past Events', count: events.filter(e => new Date(e.endDateTime) < now).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab.id
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Staff Overview */}
      {staffUsers.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Available Staff Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staffUsers.map(staff => {
              const assignedEvents = events.filter(event => 
                (event.assignedStaff || []).includes(staff._id)
              );
              
              return (
                <div key={staff._id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">
                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {staff.firstName} {staff.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{staff.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>📋 Assigned to {assignedEvents.length} event{assignedEvents.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          Event Staff Assignments ({filteredEvents.length})
        </h3>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
            <QrCodeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Events Found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Create your first event to start assigning staff members'
                : `No ${filter} events to display`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map(event => (
              <StaffAssignmentCard
                key={event._id}
                event={event}
                staffUsers={staffUsers}
                onAssignStaff={onAssignStaff}
                onRemoveStaff={onRemoveStaff}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Revenue Analytics Section
export const RevenueAnalyticsSection = ({ analytics }) => {
  // Safe data extraction with fallbacks
  const overview = analytics?.overview || {};
  const recent = analytics?.recent || {};
  const eventBreakdown = analytics?.eventBreakdown || [];
  const categoryDistribution = analytics?.categoryDistribution || {};

  const totalRevenue = overview.totalRevenue || 0;
  const totalTickets = overview.totalTicketsSold || 0;
  const totalEvents = overview.totalEvents || 0;
  const recentRevenue = recent.recentRevenue || 0;
  const recentTickets = recent.recentTicketsSold || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
        <select className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500">
          <option value="30d">Last 30 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={CurrencyIcon}
          color="green"
          subtitle="All time"
        />
        <StatsCard
          title="Recent Revenue"
          value={formatCurrency(recentRevenue)}
          icon={ChartBarIcon}
          color="blue"
          subtitle="Last 30 days"
        />
        <StatsCard
          title="Total Tickets"
          value={formatNumber(totalTickets)}
          icon={TicketIcon}
          color="purple"
          subtitle="All time"
        />
        <StatsCard
          title="Avg per Event"
          value={formatCurrency(totalEvents > 0 ? totalRevenue / totalEvents : 0)}
          icon={CalendarIcon}
          color="cyan"
          subtitle="Revenue per event"
        />
      </div>

      {/* Event Performance */}
      {eventBreakdown.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Event Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Event</th>
                  <th className="text-left py-3 px-4 text-gray-400">Tickets Sold</th>
                  <th className="text-left py-3 px-4 text-gray-400">Capacity</th>
                  <th className="text-left py-3 px-4 text-gray-400">Revenue</th>
                  <th className="text-left py-3 px-4 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {eventBreakdown.slice(0, 10).map((event, index) => (
                  <tr key={`analytics-event-${event.eventId || index}`} className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{event.title || 'Untitled Event'}</p>
                        <p className="text-gray-400 text-sm">{formatDate(event.startDateTime)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-cyan-400">{formatNumber(event.ticketsSold || 0)}</td>
                    <td className="py-3 px-4 text-gray-300">{formatNumber(event.capacity || 0)}</td>
                    <td className="py-3 px-4 text-green-400">{formatCurrency(event.revenue || 0)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                        event.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {event.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Distribution */}
      {Object.keys(categoryDistribution).length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Events by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(categoryDistribution).map(([category, count]) => (
              <div key={`category-${category}`} className="bg-gray-800/50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-400">{formatNumber(count)}</p>
                <p className="text-gray-400 text-sm capitalize">{category.replace('-', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {totalRevenue === 0 && totalTickets === 0 && (
        <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
          <ChartBarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Revenue Data</h3>
          <p className="text-gray-500">Revenue analytics will appear here once you have ticket sales</p>
        </div>
      )}
    </div>
  );
};

export default {
  DashboardSection,
  EventsListSection,
  RevenueAnalyticsSection,
  StaffManagementSection
};
