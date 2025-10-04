const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ADD THIS IMPORT

// ✅ CORRECT AUTH MIDDLEWARE IMPORT
const { authenticate } = require('../middleware/authMiddleware');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket'); // ADD THIS IMPORT

// Try to load Booking model with fallback
let Booking;
try {
  Booking = require('../models/Booking');
  console.log('✅ Booking model loaded successfully');
} catch (error) {
  console.warn('⚠️ Booking model not found, creating mock');
  Booking = {
    countDocuments: () => Promise.resolve(0),
    aggregate: () => Promise.resolve([]),
    getEventStats: () => Promise.resolve({
      totalBookings: 0,
      totalTickets: 0,
      totalRevenue: 0,
      checkedInTickets: 0
    }),
    deleteMany: () => Promise.resolve(),
    find: () => ({ 
      populate: () => ({ 
        sort: () => ({ 
          limit: () => Promise.resolve([]) 
        }) 
      }) 
    }),
    findOneAndUpdate: () => Promise.resolve(null)
  };
}

// ================================
// STAFF MANAGEMENT ROUTES
// ================================

// Get available staff users for assignment
router.get('/available-staff', authenticate, async (req, res) => {
  try {
    console.log('📋 Fetching available staff users for host:', req.user._id);
    
    const staffUsers = await User.find({ 
      selectedRole: 'event_staff' // FIXED: Use correct role name
    }).select('firstName lastName email selectedRole createdAt');
    
    console.log(`✅ Found ${staffUsers.length} staff users`);
    
    res.json({
      success: true,
      staff: staffUsers,
      count: staffUsers.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff users',
      error: error.message
    });
  }
});

// Fallback route for users (alternative endpoint)
router.get('/users', authenticate, async (req, res) => {
  try {
    console.log('📋 Fetching users (fallback) for host:', req.user._id);
    
    const users = await User.find({ 
      selectedRole: 'event_staff' // FIXED: Use correct role name
    }).select('firstName lastName email selectedRole');
    
    res.json({
      success: true,
      users: users
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Assign staff to event
router.post('/events/:eventId/assign-staff', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { staffId } = req.body;
    
    console.log(`👥 Assigning staff ${staffId} to event ${eventId} by host ${req.user._id}`);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }
    
    // Find the event and verify ownership
    const event = await Event.findOne({ _id: eventId, host: req.user._id });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to modify it'
      });
    }
    
    // Verify the staff user exists and has staff role
    const staffUser = await User.findOne({ 
      _id: staffId, 
      selectedRole: 'event_staff' // FIXED: Use correct role name
    });
    
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found or invalid role'
      });
    }
    
    // Check if staff is already assigned
    if (event.assignedStaff && event.assignedStaff.includes(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is already assigned to this event'
      });
    }
    
    // Add staff to event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { assignedStaff: staffId } },
      { new: true }
    ).populate('assignedStaff', 'firstName lastName email');
    
    console.log(`✅ Staff ${staffUser.firstName} ${staffUser.lastName} assigned to event ${event.title}`);
    
    res.json({
      success: true,
      message: 'Staff member assigned successfully',
      event: updatedEvent,
      assignedStaff: staffUser
    });
    
  } catch (error) {
    console.error('❌ Error assigning staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning staff',
      error: error.message
    });
  }
});

// Remove staff from event
router.delete('/events/:eventId/remove-staff/:staffId', authenticate, async (req, res) => {
  try {
    const { eventId, staffId } = req.params;
    
    console.log(`🗑️ Removing staff ${staffId} from event ${eventId} by host ${req.user._id}`);
    
    // Find the event and verify ownership
    const event = await Event.findOne({ _id: eventId, host: req.user._id });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to modify it'
      });
    }
    
    // Check if staff is actually assigned
    if (!event.assignedStaff || !event.assignedStaff.includes(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is not assigned to this event'
      });
    }
    
    // Remove staff from event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $pull: { assignedStaff: staffId } },
      { new: true }
    ).populate('assignedStaff', 'firstName lastName email');
    
    console.log(`✅ Staff removed from event ${event.title}`);
    
    res.json({
      success: true,
      message: 'Staff member removed successfully',
      event: updatedEvent
    });
    
  } catch (error) {
    console.error('❌ Error removing staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing staff',
      error: error.message
    });
  }
});

// Get event staff assignments
router.get('/events/:eventId/staff', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOne({ 
      _id: eventId, 
      host: req.user._id 
    }).populate('assignedStaff', 'firstName lastName email selectedRole');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        assignedStaff: event.assignedStaff || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching event staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event staff',
      error: error.message
    });
  }
});

// ================================
// EVENT MANAGEMENT ROUTES
// ================================

// Get host's events
router.get('/my-events', authenticate, async (req, res) => {
  try {
    console.log('📋 Fetching events for host:', req.user._id);
    
    const events = await Event.find({ host: req.user._id })
      .populate('host', 'firstName lastName email')
      .populate('assignedStaff', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // FIXED: Add statistics using Ticket model
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        try {
          // Use Ticket model for statistics
          const totalTicketsSold = await Ticket.countDocuments({ 
            eventId: event._id,
            status: 'active'
          });
          
          const revenue = await Ticket.aggregate([
            { $match: { eventId: event._id, paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$pricePaid' } } }
          ]);
          
          const checkedInCount = await Ticket.countDocuments({
            eventId: event._id,
            status: 'active',
            'checkInStatus.isCheckedIn': true
          });
          
          const stats = {
            totalBookings: totalTicketsSold,
            totalTicketsSold: totalTicketsSold,
            revenue: revenue[0]?.total || 0,
            checkedInCount: checkedInCount
          };
          
          return {
            ...event.toObject(),
            statistics: stats
          };
        } catch (statsError) {
          console.warn('⚠️ Error calculating stats for event', event._id, ':', statsError.message);
          return {
            ...event.toObject(),
            statistics: {
              totalBookings: 0,
              totalTicketsSold: 0,
              revenue: 0,
              checkedInCount: 0
            }
          };
        }
      })
    );
    
    console.log(`✅ Found ${events.length} events for host`);
    
    res.json({
      success: true,
      events: eventsWithStats,
      count: events.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching host events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// ✅ Get single event details (FIXES 404 ERROR)
router.get('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('📋 Fetching event details for:', eventId);
    
    const event = await Event.findOne({
      _id: eventId,
      host: req.user._id
    })
    .populate('host', 'firstName lastName email')
    .populate('assignedStaff', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    // FIXED: Add statistics using Ticket model
    let statistics = {
      totalBookings: 0,
      totalTicketsSold: 0,
      revenue: 0,
      checkedInCount: 0
    };
    
    try {
      const totalTicketsSold = await Ticket.countDocuments({ 
        eventId: event._id,
        status: 'active'
      });
      
      const revenue = await Ticket.aggregate([
        { $match: { eventId: event._id, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricePaid' } } }
      ]);
      
      const checkedInCount = await Ticket.countDocuments({
        eventId: event._id,
        status: 'active',
        'checkInStatus.isCheckedIn': true
      });
      
      statistics = {
        totalBookings: totalTicketsSold,
        totalTicketsSold: totalTicketsSold,
        revenue: revenue[0]?.total || 0,
        checkedInCount: checkedInCount
      };
    } catch (statsError) {
      console.warn('⚠️ Error calculating event stats:', statsError.message);
    }
    
    console.log('✅ Event found:', event.title);
    
    res.json({
      success: true,
      event: {
        ...event.toObject(),
        statistics
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event details',
      error: error.message
    });
  }
});

// ✅ FIXED: Get event attendees using Ticket model
router.get('/events/:eventId/attendees', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('👥 Fetching attendees for event:', eventId);
    
    // Verify event ownership
    const event = await Event.findOne({ 
      _id: eventId, 
      host: req.user._id 
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    // FIXED: Get tickets (attendees) for this event using Ticket model
    const tickets = await Ticket.find({ eventId, status: 'active' })
      .populate('attendeeId', 'firstName lastName email phone')
      .sort({ bookingDate: -1 });
        
    console.log(`✅ Found ${tickets.length} tickets for event`);
    
    // Format attendee data for frontend
    const formattedAttendees = tickets.map(ticket => ({
      _id: ticket._id,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      attendee: {
        _id: ticket.attendeeId?._id,
        firstName: ticket.attendeeId?.firstName || 'N/A',
        lastName: ticket.attendeeId?.lastName || '',
        email: ticket.attendeeId?.email || 'No email',
        phone: ticket.attendeeId?.phone
      },
      bookingDate: ticket.bookingDate,
      pricePaid: ticket.pricePaid || 0,
      paymentStatus: ticket.paymentStatus || 'completed',
      status: ticket.status || 'active',
      checkInStatus: {
        isCheckedIn: ticket.checkInStatus?.isCheckedIn || false,
        checkInTime: ticket.checkInStatus?.checkInTime,
        checkedInBy: ticket.checkInStatus?.checkedInBy
      },
      quantity: 1 // Tickets are individual
    }));
    
    res.json({
      success: true,
      attendees: formattedAttendees,
      count: formattedAttendees.length,
      event: {
        _id: event._id,
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        location: event.location,
        capacity: event.capacity
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: error.message
    });
  }
});

// ✅ FIXED: Manual check-in endpoint using Ticket model
router.post('/events/:eventId/manual-checkin', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendeeId } = req.body;
    
    console.log(`✅ Manual check-in for attendee ${attendeeId} at event ${eventId}`);
    
    // Verify event ownership
    const event = await Event.findOne({ 
      _id: eventId, 
      host: req.user._id 
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    // FIXED: Update ticket check-in status using Ticket model
    const ticket = await Ticket.findOneAndUpdate(
      { _id: attendeeId, eventId: eventId, status: 'active' },
      {
        'checkInStatus.isCheckedIn': true,
        'checkInStatus.checkInTime': new Date(),
        'checkInStatus.checkInBy': req.user._id
      },
      { new: true }
    ).populate('attendeeId', 'firstName lastName');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or already checked in'
      });
    }
    
    console.log('✅ Attendee checked in successfully');
    
    res.json({
      success: true,
      message: 'Attendee checked in successfully',
      attendee: {
        _id: ticket._id,
        attendeeName: `${ticket.attendeeId?.firstName} ${ticket.attendeeId?.lastName}`,
        ticketNumber: ticket.ticketNumber,
        checkInTime: ticket.checkInStatus.checkInTime
      }
    });
    
  } catch (error) {
    console.error('❌ Manual check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in attendee',
      error: error.message
    });
  }
});

// Create new event
router.post('/events', authenticate, async (req, res) => {
  try {
    console.log('🎪 Creating new event for host:', req.user._id);
    console.log('📝 Event data:', req.body);
    
    const eventData = {
      ...req.body,
      host: req.user._id,
      assignedStaff: [] // Initialize empty staff array
    };
    
    const event = new Event(eventData);
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('host', 'firstName lastName email')
      .populate('assignedStaff', 'firstName lastName email');
    
    console.log('✅ Event created successfully:', populatedEvent.title);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populatedEvent
    });
    
  } catch (error) {
    console.error('❌ Create event error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating event',
      error: error.message
    });
  }
});

// Update event
router.put('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOneAndUpdate(
      { _id: eventId, host: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('host', 'firstName lastName email')
     .populate('assignedStaff', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
    
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
});

// Delete event
router.delete('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOneAndDelete({
      _id: eventId,
      host: req.user._id
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // FIXED: Also delete related tickets
    await Ticket.deleteMany({ eventId: eventId });
    
    // Also delete related bookings if they exist
    if (Booking && typeof Booking.deleteMany === 'function') {
      await Booking.deleteMany({ eventId: eventId });
    }
    
    console.log('✅ Event deleted:', event.title);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
});

// ================================
// ANALYTICS ROUTES (FIXED TO USE TICKET MODEL)
// ================================

// @desc    Get event analytics (individual event)
// @route   GET /api/host/events/:eventId/analytics
// @access  Private (host only)
router.get('/events/:eventId/analytics', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('📊 Fetching analytics for event:', eventId, 'by user:', req.user._id);

    // Verify event belongs to this host
    const event = await Event.findOne({
      _id: eventId,
      host: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have access to it'
      });
    }

    // Get ticket statistics (using Ticket model)
    const totalTickets = await Ticket.countDocuments({ 
      eventId, 
      status: 'active' 
    });

    const checkedInTickets = await Ticket.countDocuments({ 
      eventId, 
      status: 'active',
      'checkInStatus.isCheckedIn': true 
    });

    const cancelledTickets = await Ticket.countDocuments({ 
      eventId, 
      status: 'cancelled' 
    });

    // Get revenue data
    const revenueData = await Ticket.aggregate([
      { 
        $match: { 
          eventId: new mongoose.Types.ObjectId(eventId),
          status: 'active',
          paymentStatus: 'completed'
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricePaid' },
          averageTicketPrice: { $avg: '$pricePaid' }
        }
      }
    ]);

    // Get daily booking trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyBookings = await Ticket.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          bookingDate: { $gte: thirtyDaysAgo },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' },
            day: { $dayOfMonth: '$bookingDate' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricePaid' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get recent bookings
    const recentBookings = await Ticket.find({ 
      eventId,
      status: 'active'
    })
    .populate('attendeeId', 'firstName lastName email')
    .sort({ bookingDate: -1 })
    .limit(10);

    // Calculate capacity utilization
    const capacityUtilization = event.capacity > 0 ? 
      (totalTickets / event.capacity * 100).toFixed(1) : 0;

    const analytics = {
      eventInfo: {
        id: event._id,
        title: event.title,
        startDateTime: event.startDateTime,
        capacity: event.capacity,
        status: event.status
      },
      ticketStats: {
        totalSold: totalTickets,
        checkedIn: checkedInTickets,
        pending: totalTickets - checkedInTickets,
        cancelled: cancelledTickets,
        capacityUtilization: parseFloat(capacityUtilization)
      },
      revenue: {
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        averageTicketPrice: revenueData[0]?.averageTicketPrice || 0,
        currency: 'USD'
      },
      trends: {
        dailyBookings: dailyBookings.map(day => ({
          date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
          bookings: day.bookings,
          revenue: day.revenue
        }))
      },
      recentBookings: recentBookings.map(ticket => ({
        ticketNumber: ticket.ticketNumber,
        attendeeName: `${ticket.attendeeId?.firstName || 'Unknown'} ${ticket.attendeeId?.lastName || 'User'}`,
        attendeeEmail: ticket.attendeeId?.email,
        bookingDate: ticket.bookingDate,
        pricePaid: ticket.pricePaid,
        checkInStatus: ticket.checkInStatus?.isCheckedIn || false
      }))
    };

    console.log('✅ Analytics generated:', {
      eventId,
      totalTickets,
      revenue: analytics.revenue.totalRevenue
    });

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics',
      error: error.message
    });
  }
});

// @desc    Get dashboard summary analytics
// @route   GET /api/host/analytics/summary
// @access  Private (host only)
router.get('/analytics/summary', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching summary analytics for host:', req.user._id);

    // Get host's events
    const hostEvents = await Event.find({ host: req.user._id });
    const eventIds = hostEvents.map(e => e._id);

    if (eventIds.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalEvents: 0,
          totalTicketsSold: 0,
          totalRevenue: 0,
          upcomingEvents: 0,
          message: 'No events found. Create your first event to see analytics!'
        }
      });
    }

    // Get aggregate statistics using Ticket model
    const totalTickets = await Ticket.countDocuments({
      eventId: { $in: eventIds },
      status: 'active'
    });

    const totalRevenue = await Ticket.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          status: 'active',
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricePaid' }
        }
      }
    ]);

    const upcomingEvents = await Event.countDocuments({
      host: req.user._id,
      startDateTime: { $gte: new Date() },
      status: 'published'
    });

    const summary = {
      totalEvents: hostEvents.length,
      totalTicketsSold: totalTickets,
      totalRevenue: totalRevenue[0]?.total || 0,
      upcomingEvents: upcomingEvents,
      averageTicketsPerEvent: hostEvents.length > 0 ? 
        (totalTickets / hostEvents.length).toFixed(1) : 0
    };

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Summary analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching summary analytics',
      error: error.message
    });
  }
});

// FIXED: Get analytics using Ticket model
router.get('/analytics', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching analytics for host:', req.user._id);
    
    // Get host's events
    const events = await Event.find({ host: req.user._id });
    const eventIds = events.map(e => e._id);
    
    // Calculate overview stats
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.startDateTime) > new Date()).length;
    
    let analytics = {
      overview: {
        totalEvents,
        upcomingEvents,
        totalTicketsSold: 0,
        totalRevenue: 0
      },
      recent: {
        recentRevenue: 0,
        recentTicketsSold: 0
      },
      eventBreakdown: [],
      categoryDistribution: {}
    };
    
    // FIXED: Use Ticket model instead of Booking
    if (eventIds.length > 0) {
      try {
        const totalTicketsSold = await Ticket.countDocuments({
          eventId: { $in: eventIds },
          status: 'active'
        });
        
        const totalRevenue = await Ticket.aggregate([
          { $match: { eventId: { $in: eventIds }, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$pricePaid' } } }
        ]);
        
        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRevenue = await Ticket.aggregate([
          { 
            $match: { 
              eventId: { $in: eventIds }, 
              paymentStatus: 'completed',
              bookingDate: { $gte: thirtyDaysAgo }
            } 
          },
          { $group: { _id: null, total: { $sum: '$pricePaid' } } }
        ]);
        
        const recentTicketsSold = await Ticket.countDocuments({
          eventId: { $in: eventIds },
          status: 'active',
          bookingDate: { $gte: thirtyDaysAgo }
        });
        
        analytics.overview.totalTicketsSold = totalTicketsSold || 0;
        analytics.overview.totalRevenue = totalRevenue[0]?.total || 0;
        analytics.recent.recentRevenue = recentRevenue[0]?.total || 0;
        analytics.recent.recentTicketsSold = recentTicketsSold || 0;
      } catch (ticketError) {
        console.warn('⚠️ Error calculating ticket analytics:', ticketError.message);
      }
    }
    
    console.log('✅ Analytics calculated successfully:', analytics);
    
    res.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;
