// src/components/organizer/AttendeeList.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QrCodeIcon, ChartBarIcon } from "../../helper/Icons.jsx";
import apiClient from "../../utils/apiClient";
import toast from 'react-hot-toast';

const StatusPill = ({ isCheckedIn }) => (
  <div className="flex items-center">
    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${isCheckedIn ? "bg-green-400" : "bg-yellow-400"}`}></div>
    <span className={isCheckedIn ? "text-green-400" : "text-yellow-400"}>
      {isCheckedIn ? "Checked In" : "Not Checked In"}
    </span>
  </div>
);

// Enhanced Search and Filter Component
const SearchAndFilter = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, paymentFilter, setPaymentFilter }) => (
  <div className="mb-6 flex flex-col md:flex-row gap-4">
    <div className="flex-1">
      <input
        type="text"
        placeholder="Search by name, email, or ticket number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
      />
    </div>
    <div className="flex gap-2">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
      >
        <option value="all">All Status</option>
        <option value="checked-in">Checked In</option>
        <option value="not-checked-in">Not Checked In</option>
      </select>
      <select
        value={paymentFilter}
        onChange={(e) => setPaymentFilter(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
      >
        <option value="all">All Payments</option>
        <option value="completed">Paid</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  </div>
);

// Enhanced Stats Component with Analytics
const StatsCards = ({ attendees, event, analytics }) => {
  const totalAttendees = attendees.length;
  const checkedIn = attendees.filter(a => a.checkInStatus?.isCheckedIn).length;
  const notCheckedIn = totalAttendees - checkedIn;
  const paidTickets = attendees.filter(a => a.paymentStatus === 'completed').length;
  const totalRevenue = attendees
    .filter(a => a.paymentStatus === 'completed')
    .reduce((sum, a) => sum + (a.pricePaid || 0), 0);

  const capacity = event?.capacity || 0;
  const capacityPercentage = capacity > 0 ? ((totalAttendees / capacity) * 100).toFixed(1) : 0;

  return (
    <div className="mb-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-cyan-400 font-semibold text-sm">Total Tickets</h3>
              <p className="text-2xl font-bold text-white">{totalAttendees}</p>
              {capacity > 0 && (
                <p className="text-xs text-gray-400">{capacityPercentage}% of capacity</p>
              )}
            </div>
            <span className="text-2xl">🎫</span>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-400 font-semibold text-sm">Checked In</h3>
              <p className="text-2xl font-bold text-white">{checkedIn}</p>
              <p className="text-xs text-gray-400">
                {totalAttendees > 0 ? ((checkedIn / totalAttendees) * 100).toFixed(1) : 0}% checked in
              </p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-400 font-semibold text-sm">Pending</h3>
              <p className="text-2xl font-bold text-white">{notCheckedIn}</p>
              <p className="text-xs text-gray-400">Awaiting check-in</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-purple-400 font-semibold text-sm">Revenue</h3>
              <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{paidTickets} paid tickets</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-cyan-400" />
              Event Analytics
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Capacity Used</p>
              <p className="text-white font-semibold">{analytics.ticketStats?.capacityUtilization || 0}%</p>
            </div>
            <div>
              <p className="text-gray-400">Avg Ticket Price</p>
              <p className="text-white font-semibold">${analytics.revenue?.averageTicketPrice?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-gray-400">Check-in Rate</p>
              <p className="text-white font-semibold">
                {totalAttendees > 0 ? ((checkedIn / totalAttendees) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Revenue</p>
              <p className="text-white font-semibold">${analytics.revenue?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Manual Check-in Component
const ManualCheckIn = ({ eventId, attendeeId, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await apiClient.post(`/api/host/events/${eventId}/manual-checkin`, {
        attendeeId: attendeeId
      });
      
      toast.success('Attendee checked in successfully!');
      onSuccess();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to check in attendee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Checking in...' : 'Check In'}
    </button>
  );
};

// --- Main Attendee List Page Component ---
const AttendeeListPage = () => {
  const { eventId } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Fetching attendee data for event:', eventId);

      // Fetch event details and analytics
      const promises = [
        apiClient.get(`/api/host/events/${eventId}/attendees`),
        apiClient.get(`/api/host/events/${eventId}`).catch(() => null),
        apiClient.get(`/api/host/events/${eventId}/analytics`).catch(() => null)
      ];

      const [attendeesResponse, eventResponse, analyticsResponse] = await Promise.all(promises);

      // Set attendees data
      const attendeesData = attendeesResponse.attendees || [];
      console.log('✅ Loaded attendees:', attendeesData.length);
      setAttendees(attendeesData);

      // Set event data
      if (eventResponse) {
        setEvent(eventResponse.event || eventResponse.data || attendeesResponse.event);
      }

      // Set analytics data
      if (analyticsResponse) {
        setAnalytics(analyticsResponse.analytics || analyticsResponse.data);
        console.log('📊 Loaded analytics:', analyticsResponse.analytics);
      }

    } catch (err) {
      console.error('❌ Error fetching attendees:', err);
      setError(err.message || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // Filter attendees based on search, status, and payment
  const filteredAttendees = attendees.filter(attendee => {
    const attendeeInfo = attendee.attendee || {};
    const firstName = attendeeInfo.firstName || '';
    const lastName = attendeeInfo.lastName || '';
    const email = attendeeInfo.email || '';
    const ticketNumber = attendee.ticketNumber || '';

    const matchesSearch = searchTerm === '' || 
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const isCheckedIn = attendee.checkInStatus?.isCheckedIn || false;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'checked-in' && isCheckedIn) ||
      (filterStatus === 'not-checked-in' && !isCheckedIn);

    const matchesPayment = paymentFilter === 'all' || attendee.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleExportCSV = () => {
    try {
      const csvHeaders = ['S.No.', 'Name', 'Email', 'Ticket Number', 'Price Paid', 'Payment Status', 'Booking Date', 'Check-in Status', 'Check-in Time'];
      const csvRows = filteredAttendees.map((attendee, index) => {
        const attendeeInfo = attendee.attendee || {};
        const isCheckedIn = attendee.checkInStatus?.isCheckedIn || false;
        
        return [
          index + 1,
          `${attendeeInfo.firstName || ''} ${attendeeInfo.lastName || ''}`.trim() || 'N/A',
          attendeeInfo.email || 'No email',
          attendee.ticketNumber || 'N/A',
          `$${(attendee.pricePaid || 0).toFixed(2)}`,
          attendee.paymentStatus || 'Unknown',
          formatDate(attendee.bookingDate),
          isCheckedIn ? 'Checked In' : 'Not Checked In',
          isCheckedIn ? formatDate(attendee.checkInStatus?.checkInTime) : 'N/A'
        ];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendees-${event?.title || 'event'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      console.error('❌ CSV export error:', error);
      toast.error('Failed to export CSV file');
    }
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attendees and analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Attendees</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={fetchData} 
            className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <Link 
              to="/organizer-dashboard"
              className="inline-block mb-4 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Event Attendees
              </span>
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Manage and verify your event attendees
            </p>
            {event && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-medium text-cyan-400">{event.title}</span>
                {event.startDateTime && (
                  <span> • {formatDate(event.startDateTime)}</span>
                )}
                {event.capacity && (
                  <span> • Capacity: {event.capacity}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to={`/scanner/${eventId}`}
              className="flex items-center justify-center bg-cyan-500 text-black font-bold rounded-full px-6 py-3 transition-all hover:bg-cyan-600"
            >
              <QrCodeIcon className="h-6 w-6 mr-2" />
              QR Scanner
            </Link>
          </div>
        </header>

        {/* Enhanced Stats Cards with Analytics */}
        <StatsCards attendees={attendees} event={event} analytics={analytics} />

        {/* Search and Filter */}
        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
        />

        {/* Attendees Table */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-300">S.No.</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Attendee</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Contact</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Ticket Details</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Payment</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((ticket, index) => {
                  const attendeeInfo = ticket.attendee || {};
                  const isCheckedIn = ticket.checkInStatus?.isCheckedIn || false;
                  
                  return (
                    <tr key={`attendee-${ticket.ticketId || ticket._id || index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-medium text-white">{index + 1}</td>
                      
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            {attendeeInfo.firstName || 'N/A'} {attendeeInfo.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {attendeeInfo._id?.slice(-8) || 'N/A'}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div>
                          <p className="text-gray-300 text-sm">
                            {attendeeInfo.email || 'No email'}
                          </p>
                          {attendeeInfo.phone && (
                            <p className="text-xs text-gray-500">📞 {attendeeInfo.phone}</p>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div>
                          <span className="font-mono text-cyan-400 text-sm bg-gray-800 px-2 py-1 rounded block mb-1">
                            {ticket.ticketNumber || 'N/A'}
                          </span>
                          <p className="text-xs text-gray-400">
                            {formatDate(ticket.bookingDate)}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            ${(ticket.pricePaid || 0).toFixed(2)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            ticket.paymentStatus === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {ticket.paymentStatus || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <StatusPill isCheckedIn={isCheckedIn} /> 
                        {isCheckedIn && ticket.checkInStatus?.checkInTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(ticket.checkInStatus.checkInTime)}
                          </p>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {!isCheckedIn && (
                          <ManualCheckIn 
                            eventId={eventId} 
                            attendeeId={ticket._id} 
                            onSuccess={fetchData}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAttendees.length === 0 && (
            <div className="text-center py-12">
              {attendees.length === 0 ? (
                <div>
                  <div className="text-6xl mb-4">🎫</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Ticket Sales Yet</h3>
                  <p className="text-gray-500">Attendees will appear here once people purchase tickets for your event</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Results Found</h3>
                  <p className="text-gray-500">No attendees match your current search or filter criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setPaymentFilter('all');
                    }}
                    className="mt-4 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table Footer */}
          {filteredAttendees.length > 0 && (
            <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-sm text-gray-400">
                  <p>
                    Showing <span className="text-white font-medium">{filteredAttendees.length}</span> of{' '}
                    <span className="text-white font-medium">{attendees.length}</span> attendees
                    {searchTerm && (
                      <span className="text-cyan-400"> matching "{searchTerm}"</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fetchData()}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                  >
                    📋 Export CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendeeListPage;
