// src/components/attendee/AttendeeList.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

const AttendeeListPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FIXED: Single fetchData function without analytics causing errors
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Fetching attendee data for event:', eventId);

      // ✅ FIXED: Fetch event details with proper error handling
      let eventData = null;
      const eventEndpoints = [
        `/api/host/events/${eventId}`,
        `/api/events/${eventId}`,
        `/api/attendee/events/${eventId}`
      ];

      for (const endpoint of eventEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          const response = await apiClient.get(endpoint);
          eventData = response.event || response.data || response;
          if (eventData) {
            console.log(`✅ Event data fetched from: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`❌ Failed endpoint: ${endpoint}`, endpointError.message);
          continue;
        }
      }

      if (!eventData) {
        throw new Error('Event not found or access denied');
      }

      setEvent(eventData);

      // ✅ FIXED: Fetch attendees with better error handling
      let attendeesData = [];
      try {
        console.log('👥 Fetching attendees...');
        const attendeesResponse = await apiClient.get(`/api/host/events/${eventId}/attendees`);
        
        if (attendeesResponse.success) {
          attendeesData = attendeesResponse.attendees || [];
          console.log(`✅ Loaded ${attendeesData.length} attendees`);
        } else {
          console.warn('⚠️ Attendees response not successful:', attendeesResponse.message);
          attendeesData = [];
        }
      } catch (attendeesError) {
        console.error('❌ Could not fetch attendees:', attendeesError.message);
        // Don't throw error, just set empty array
        attendeesData = [];
        
        // Show warning toast but don't fail completely
        if (attendeesError.message.includes('403') || attendeesError.message.includes('401')) {
          toast.error('Access denied. You may not have permission to view attendees.');
        } else {
          toast.warn('Could not load attendees list');
        }
      }

      setAttendees(attendeesData);

      console.log('✅ Data loading complete:', {
        event: eventData?.title || 'Unknown Event',
        attendeeCount: attendeesData.length
      });

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.message || 'Failed to load event data');
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // ✅ FIXED: Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success('Data refreshed!');
  };

  // ✅ ENHANCED: Export to CSV functionality
  const handleExportCSV = () => {
    try {
      if (filteredAttendees.length === 0) {
        toast.error('No attendees to export');
        return;
      }

      // Prepare CSV data
      const csvHeaders = [
        'Ticket Number',
        'First Name', 
        'Last Name',
        'Email',
        'Phone',
        'Booking Date',
        'Amount Paid',
        'Status',
        'Check-in Status',
        'Check-in Time'
      ];

      const csvData = filteredAttendees.map(attendee => {
        const attendeeInfo = attendee.attendee || {};
        const checkInStatus = attendee.checkIn || attendee.checkInStatus || {};
        
        return [
          attendee.ticketNumber || '',
          attendeeInfo.firstName || '',
          attendeeInfo.lastName || '',
          attendeeInfo.email || '',
          attendeeInfo.phone || '',
          attendee.bookingDate ? new Date(attendee.bookingDate).toLocaleDateString() : '',
          attendee.pricePaid ? `$${(attendee.pricePaid / 100).toFixed(2)}` : '$0.00',
          attendee.status || 'active',
          checkInStatus.isCheckedIn ? 'Checked In' : 'Not Checked In',
          checkInStatus.checkInTime ? new Date(checkInStatus.checkInTime).toLocaleString() : ''
        ];
      });

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event?.title || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredAttendees.length} attendees to CSV`);
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Filter attendees based on search and status
  const filteredAttendees = attendees.filter(attendee => {
    const attendeeData = attendee.attendee || {};
    const firstName = attendeeData.firstName || '';
    const lastName = attendeeData.lastName || '';
    const email = attendeeData.email || '';
    const ticketNumber = attendee.ticketNumber || '';

    const matchesSearch = searchTerm === '' || 
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const checkInStatus = attendee.checkIn || attendee.checkInStatus || {};
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'checked-in' && checkInStatus.isCheckedIn) ||
      (filterStatus === 'not-checked-in' && !checkInStatus.isCheckedIn && attendee.status !== 'cancelled') ||
      (filterStatus === 'cancelled' && attendee.status === 'cancelled');

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
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

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusBadge = (attendee) => {
    if (attendee.status === 'cancelled') {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">❌ Cancelled</span>;
    } 
    
    const checkInStatus = attendee.checkIn || attendee.checkInStatus || {};
    if (checkInStatus.isCheckedIn) {
      return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">✅ Checked In</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">🎫 Registered</span>;
    }
  };

  // ✅ FIXED: Calculate statistics with proper error handling
  const stats = {
    total: attendees.length,
    checkedIn: attendees.filter(a => {
      const checkInStatus = a.checkIn || a.checkInStatus || {};
      return checkInStatus.isCheckedIn;
    }).length,
    notCheckedIn: attendees.filter(a => {
      const checkInStatus = a.checkIn || a.checkInStatus || {};
      return !checkInStatus.isCheckedIn && a.status !== 'cancelled';
    }).length,
    cancelled: attendees.filter(a => a.status === 'cancelled').length
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attendees...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Attendees</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchData} 
              className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Try Again
            </button>
            <Link 
              to="/host-dashboard" 
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors inline-block"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to={`/manage-event/${eventId}`}
            className="inline-block mb-4 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Event Management
          </Link>
          <h1 className="text-3xl font-bold mb-2">Attendee Management</h1>
          {event && (
            <div className="bg-gray-900/50 rounded-lg p-4 inline-block">
              <h2 className="text-xl font-semibold text-cyan-400">{event.title}</h2>
              <p className="text-gray-400">{formatDate(event.startDateTime)}</p>
              <div className="flex justify-center space-x-4 mt-2 text-sm">
                <span>📍 {event.location?.venue || event.location || 'Venue TBD'}</span>
                <span>👥 {event.capacity || 0} capacity</span>
              </div>
            </div>
          )}
        </div>

        {/* ✅ FIXED: Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-cyan-400 font-semibold text-sm">Total Attendees</h3>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-semibold text-sm">Checked In</h3>
                <p className="text-2xl font-bold text-white">{stats.checkedIn}</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-400 font-semibold text-sm">Not Checked In</h3>
                <p className="text-2xl font-bold text-white">{stats.notCheckedIn}</p>
              </div>
              <span className="text-2xl">🎫</span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-400 font-semibold text-sm">Cancelled</h3>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: Filters with refresh button */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8 border border-gray-800">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or ticket number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Attendees</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? '🔄' : '↻'} Refresh
              </button>
            </div>

            {/* Export Button */}
            <div>
              <button 
                onClick={handleExportCSV}
                disabled={filteredAttendees.length === 0}
                className="bg-cyan-500 text-black px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📋 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: Attendees Table */}
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
          {filteredAttendees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">
                {attendees.length === 0 ? '👥' : '🔍'}
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {attendees.length === 0 ? 'No Attendees Yet' : 'No Results Found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {attendees.length === 0 
                  ? 'Attendees will appear here once people register for your event' 
                  : 'No attendees match your current filters'
                }
              </p>
              {(searchTerm || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Attendee</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Ticket #</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Booking Date</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Amount Paid</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-semibold">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.map((attendee, index) => {
                      // ✅ FIXED: Create stable unique key
                      const uniqueKey = attendee.ticketId || 
                                       attendee._id || 
                                       attendee.ticketNumber || 
                                       `attendee-${index}`;
                      
                      const attendeeInfo = attendee.attendee || {};
                      const checkInStatus = attendee.checkIn || attendee.checkInStatus || {};

                      return (
                        <tr 
                          key={`attendee-${uniqueKey}`}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-semibold text-white">
                                {attendeeInfo.firstName || 'N/A'} {attendeeInfo.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-400">
                                {attendeeInfo.email || 'No email provided'}
                              </p>
                              {attendeeInfo.phone && (
                                <p className="text-xs text-gray-500">
                                  📞 {attendeeInfo.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-cyan-400 text-sm bg-gray-800 px-2 py-1 rounded">
                              {attendee.ticketNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-300">
                            <div>
                              <p>{formatDate(attendee.bookingDate)}</p>
                              {attendee.paymentStatus && (
                                <p className="text-xs text-gray-500">
                                  Payment: {attendee.paymentStatus}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-green-400 font-semibold">
                              {formatCurrency(attendee.pricePaid || 0)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(attendee)}
                          </td>
                          <td className="py-4 px-6">
                            {checkInStatus.isCheckedIn ? (
                              <div className="text-sm">
                                <p className="text-green-400 font-medium">✅ Checked in</p>
                                <p className="text-gray-400 text-xs">
                                  {formatDate(checkInStatus.checkInTime)}
                                </p>
                                {checkInStatus.scannerRole && (
                                  <p className="text-xs text-gray-500">
                                    by {checkInStatus.scannerRole.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            ) : attendee.status === 'cancelled' ? (
                              <span className="text-red-400">❌ Cancelled</span>
                            ) : (
                              <span className="text-gray-400">⏳ Pending check-in</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <p>
                    Showing <span className="text-white font-medium">{filteredAttendees.length}</span> of{' '}
                    <span className="text-white font-medium">{attendees.length}</span> attendees
                    {searchTerm && (
                      <span className="text-cyan-400"> matching "{searchTerm}"</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4">
                    <Link
                      to={`/scanner/${eventId}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      📱 Open Scanner
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ✅ ENHANCED: Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to={`/scanner/${eventId}`}
            className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 hover:bg-green-500/20 transition-all group text-center"
          >
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">QR Code Scanner</h3>
            <p className="text-gray-400 text-sm">Start scanning tickets for check-in</p>
          </Link>

          <button
            onClick={() => {
              const emails = attendees
                .filter(a => a.attendee?.email && a.status !== 'cancelled')
                .map(a => a.attendee.email);
              
              if (emails.length === 0) {
                toast.error('No attendee emails found');
                return;
              }

              // Copy emails to clipboard
              navigator.clipboard.writeText(emails.join(', '));
              toast.success(`Copied ${emails.length} email addresses to clipboard`);
            }}
            className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6 hover:bg-blue-500/20 transition-all group text-center"
          >
            <div className="text-4xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-white mb-2">Copy Emails</h3>
            <p className="text-gray-400 text-sm">Copy all attendee emails to clipboard</p>
          </button>

          <Link
            to={`/manage-event/${eventId}`}
            className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-6 hover:bg-purple-500/20 transition-all group text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Event Analytics</h3>
            <p className="text-gray-400 text-sm">View detailed event statistics</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttendeeListPage;
