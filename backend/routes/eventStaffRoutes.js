const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(authorize('event_staff'));

// @route   GET /api/staff/dashboard
// @desc    Get staff dashboard data
// @access  Private (staff only)
router.get('/dashboard', async (req, res) => {
  try {
    const staffId = req.user._id;
    
    console.log('📊 Staff dashboard request for:', staffId);

    // Get events assigned to this staff member
    const assignedEvents = await Event.find({
      assignedStaff: staffId
    }).populate('host', 'firstName lastName email');

    // Get today's events
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaysEvents = assignedEvents.filter(event => {
      const eventDate = new Date(event.startDateTime);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });

    // Get recent scans by this staff member
    const recentScans = await Ticket.find({
      'checkInStatus.checkedInBy': staffId,
      'checkInStatus.isCheckedIn': true
    })
    .populate('eventId', 'title startDateTime')
    .populate('attendeeId', 'firstName lastName email')
    .sort({ 'checkInStatus.checkInTime': -1 })
    .limit(10);

    // Calculate stats
    const totalScansToday = await Ticket.countDocuments({
      'checkInStatus.checkedInBy': staffId,
      'checkInStatus.isCheckedIn': true,
      'checkInStatus.checkInTime': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const stats = {
      assignedEvents: assignedEvents.length,
      todaysEvents: todaysEvents.length,
      totalScansToday,
      recentScans: recentScans.length
    };

    console.log('✅ Staff dashboard data prepared');

    res.status(200).json({
      success: true,
      data: {
        stats,
        assignedEvents,
        todaysEvents,
        recentScans
      }
    });

  } catch (error) {
    console.error('❌ Staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/staff/events
// @desc    Get events assigned to staff member
// @access  Private (staff only)
router.get('/events', async (req, res) => {
  try {
    const staffId = req.user._id;
    
    console.log('📅 Staff events request for:', staffId);

    const events = await Event.find({
      assignedStaff: staffId
    })
    .populate('host', 'firstName lastName email')
    .sort({ startDateTime: -1 });

    // Add statistics for each event
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      const totalTickets = await Ticket.countDocuments({ eventId: event._id });
      const scannedTickets = await Ticket.countDocuments({ 
        eventId: event._id,
        'checkInStatus.isCheckedIn': true 
      });

      return {
        ...event.toObject(),
        statistics: {
          totalTickets,
          scannedTickets,
          pendingScans: totalTickets - scannedTickets
        }
      };
    }));

    console.log('✅ Staff events data prepared');

    res.status(200).json({
      success: true,
      events: eventsWithStats
    });

  } catch (error) {
    console.error('❌ Staff events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events',
      error: error.message
    });
  }
});

// @route   POST /api/staff/scan-ticket
// @desc    Scan ticket for staff member
// @access  Private (staff only)
router.post('/scan-ticket', async (req, res) => {
  try {
    const { eventId, ticketNumber } = req.body;
    const staffId = req.user._id;

    console.log('🎫 Staff scanning ticket:', { eventId, ticketNumber, staffId });

    // Validate required fields
    if (!eventId || !ticketNumber) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and ticket number are required'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Optional: Check if staff is assigned to this event
    // Uncomment if you want to restrict staff to only assigned events
    // const isAssignedStaff = event.assignedStaff?.includes(staffId);
    // if (!isAssignedStaff) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You are not assigned to scan tickets for this event'
    //   });
    // }

    // Find the ticket
    const ticket = await Ticket.findOne({ 
      eventId, 
      ticketNumber: ticketNumber.trim()
    }).populate('attendeeId', 'firstName lastName email phone');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket number - no ticket found with this number'
      });
    }

    // Check if ticket is active
    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This ticket has been cancelled and cannot be used'
      });
    }

    // Check if already scanned/checked in
    if (ticket.verification?.isScanned || ticket.checkInStatus?.isCheckedIn) {
      const scannedAt = ticket.verification?.scannedAt || ticket.checkInStatus?.checkInTime;
      const scannedBy = ticket.verification?.scannedBy || ticket.checkInStatus?.checkedInBy;
      
      // Get scanner info
      let scannerInfo = 'Unknown';
      if (scannedBy) {
        try {
          const scanner = await User.findById(scannedBy, 'firstName lastName');
          if (scanner) {
            scannerInfo = `${scanner.firstName} ${scanner.lastName}`;
          }
        } catch (err) {
          console.log('Could not fetch scanner info:', err.message);
        }
      }

      return res.status(400).json({
        success: false,
        message: `Ticket already scanned at ${new Date(scannedAt).toLocaleString()} by ${scannerInfo}`,
        ticket: {
          attendee: ticket.attendeeId,
          scannedAt: scannedAt,
          scannedBy: scannerInfo
        }
      });
    }

    // Update ticket with scan information
    ticket.verification = {
      isScanned: true,
      scannedAt: new Date(),
      scannedBy: staffId,
      scanMethod: 'staff_scanner'
    };

    // Also update check-in status for compatibility
    ticket.checkInStatus = {
      isCheckedIn: true,
      checkInTime: new Date(),
      checkedInBy: staffId
    };

    await ticket.save();

    console.log('✅ Ticket scanned successfully by staff');

    res.status(200).json({
      success: true,
      message: `Welcome ${ticket.attendeeId.firstName}! Ticket verified successfully.`,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        attendee: {
          firstName: ticket.attendeeId.firstName,
          lastName: ticket.attendeeId.lastName,
          email: ticket.attendeeId.email,
          phone: ticket.attendeeId.phone
        },
        scannedAt: ticket.verification.scannedAt,
        pricePaid: ticket.pricePaid,
        eventTitle: event.title
      }
    });

  } catch (error) {
    console.error('❌ Staff scan error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID or ticket format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error processing ticket scan',
      error: error.message
    });
  }
});

// @route   GET /api/staff/events/:eventId/attendees
// @desc    Get attendees for a specific event (staff view)
// @access  Private (staff only)
router.get('/events/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const staffId = req.user._id;

    console.log('👥 Staff requesting attendees for event:', eventId);

    // Verify event exists and staff has access
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Optional: Check if staff is assigned
    // const isAssignedStaff = event.assignedStaff?.includes(staffId);
    // if (!isAssignedStaff) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You are not assigned to this event'
    //   });
    // }

    // Get all tickets for this event
    const tickets = await Ticket.find({ eventId })
      .populate('attendeeId', 'firstName lastName email phone')
      .sort({ bookingDate: -1 });

    // Format response
    const attendees = tickets.map(ticket => ({
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      attendee: ticket.attendeeId,
      bookingDate: ticket.bookingDate,
      pricePaid: ticket.pricePaid,
      status: ticket.status,
      checkIn: {
        isCheckedIn: ticket.checkInStatus?.isCheckedIn || false,
        checkInTime: ticket.checkInStatus?.checkInTime,
        checkedInBy: ticket.checkInStatus?.checkedInBy
      },
      verification: ticket.verification
    }));

    console.log('✅ Attendees list prepared for staff');

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        startDateTime: event.startDateTime,
        location: event.location
      },
      attendees,
      stats: {
        total: attendees.length,
        checkedIn: attendees.filter(a => a.checkIn.isCheckedIn).length,
        pending: attendees.filter(a => !a.checkIn.isCheckedIn).length
      }
    });

  } catch (error) {
    console.error('❌ Staff attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendees',
      error: error.message
    });
  }
});

// @route   GET /api/staff/scan-history
// @desc    Get scan history for staff member
// @access  Private (staff only)
router.get('/scan-history', async (req, res) => {
  try {
    const staffId = req.user._id;
    const { limit = 50, eventId } = req.query;

    console.log('📜 Staff scan history request:', { staffId, limit, eventId });

    let query = {
      'checkInStatus.checkedInBy': staffId,
      'checkInStatus.isCheckedIn': true
    };

    if (eventId) {
      query.eventId = eventId;
    }

    const scans = await Ticket.find(query)
      .populate('eventId', 'title startDateTime location')
      .populate('attendeeId', 'firstName lastName email')
      .sort({ 'checkInStatus.checkInTime': -1 })
      .limit(parseInt(limit));

    console.log('✅ Scan history prepared');

    res.status(200).json({
      success: true,
      scans: scans.map(ticket => ({
        ticketNumber: ticket.ticketNumber,
        scannedAt: ticket.checkInStatus.checkInTime,
        attendee: ticket.attendeeId,
        event: ticket.eventId,
        pricePaid: ticket.pricePaid
      }))
    });

  } catch (error) {
    console.error('❌ Staff scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching scan history',
      error: error.message
    });
  }
});

// Debug route - Remove in production
router.get('/debug/info', (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.selectedRole,
      email: req.user.email
    },
    timestamp: new Date()
  });
});

module.exports = router;
