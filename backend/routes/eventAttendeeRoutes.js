const express = require('express');
const { 
  getAvailableEvents,
  getEventDetails,
  bookTicket,
  getMyTickets,
  cancelTicket,
  downloadTicket
} = require('../controllers/eventAttendeeController');

const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const Ticket = require('../models/Ticket'); // For debug route

const router = express.Router();

// @route   GET /api/attendee/events
// @desc    Get all available events for attendees
// @access  Public (better with optional auth for personalization)
router.get('/events', optionalAuth, getAvailableEvents);

// @route   GET /api/attendee/events/:id
// @desc    Get single event details
// @access  Public (better with optional auth)
router.get('/events/:id', optionalAuth, getEventDetails);

// All routes below require authentication and event_attendee role
router.use(authenticate);
router.use(authorize('event_attendee'));

// @route   POST /api/attendee/book-ticket
// @desc    Book ticket for event
// @access  Private (attendee only)
router.post('/book-ticket', bookTicket);

// @route   GET /api/attendee/my-tickets
// @desc    Get user's tickets
// @access  Private (attendee only)
router.get('/my-tickets', getMyTickets);

// @route   GET /api/attendee/my-bookings
// @desc    Get user's bookings (same as my-tickets)
// @access  Private (attendee only)
router.get('/my-bookings', getMyTickets);

// @route   DELETE /api/attendee/tickets/:ticketId
// @desc    Cancel ticket
// @access  Private (attendee only)
router.delete('/tickets/:ticketId', cancelTicket);

// @route   GET /api/attendee/tickets/:ticketId/download
// @desc    Download ticket
// @access  Private (attendee only)
router.get('/tickets/:ticketId/download', downloadTicket);

// ✅ TEMPORARY DEBUG ROUTE - Remove in production
// @route   GET /api/attendee/debug/my-bookings
// @desc    Debug bookings data format
// @access  Private (attendee only)
router.get('/debug/my-bookings', async (req, res) => {
  try {
    console.log('🔍 DEBUG - Checking bookings for user:', req.user._id);

    const tickets = await Ticket.find({ attendeeId: req.user._id })
      .populate('eventId', 'title startDateTime')
      .sort({ bookingDate: -1 })
      .limit(10);

    console.log('🔍 DEBUG - Raw tickets from database:');
    tickets.forEach((ticket, i) => {
      console.log(`  ${i + 1}. Ticket: ${ticket.ticketNumber}`);
      console.log(`     Event: ${ticket.eventId?.title || 'No event'}`);
      console.log(`     Status: ${ticket.status}`);
      console.log(`     Created: ${ticket.bookingDate}`);
      console.log(`     Payment Status: ${ticket.paymentStatus}`);
    });

    res.json({
      success: true,
      debug: true,
      userInfo: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.selectedRole
      },
      ticketCount: tickets.length,
      tickets: tickets.map(t => ({
        ticketId: t._id,
        ticketNumber: t.ticketNumber,
        eventTitle: t.eventId?.title || 'Event deleted',
        eventId: t.eventId?._id,
        status: t.status,
        paymentStatus: t.paymentStatus,
        pricePaid: t.pricePaid,
        bookingDate: t.bookingDate,
        qrCodeData: t.qrCodeData
      })),
      message: 'This is debug data. Check console for detailed logs.'
    });
  } catch (error) {
    console.error('❌ Debug route error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      debug: true
    });
  }
});

// ✅ QUICK STATS ROUTE
// @route   GET /api/attendee/stats
// @desc    Get user booking statistics
// @access  Private (attendee only)
router.get('/stats', async (req, res) => {
  try {
    const attendeeId = req.user._id;

    const totalTickets = await Ticket.countDocuments({ attendeeId });
    const activeTickets = await Ticket.countDocuments({ attendeeId, status: 'active' });
    const usedTickets = await Ticket.countDocuments({ attendeeId, status: 'used' });
    const cancelledTickets = await Ticket.countDocuments({ attendeeId, status: 'cancelled' });

    // Get upcoming events
    const upcomingTickets = await Ticket.find({ 
      attendeeId, 
      status: 'active' 
    })
    .populate('eventId', 'startDateTime')
    .then(tickets => 
      tickets.filter(t => t.eventId && new Date(t.eventId.startDateTime) > new Date()).length
    );

    res.json({
      success: true,
      stats: {
        totalTickets,
        activeTickets,
        usedTickets,
        cancelledTickets,
        upcomingEvents: upcomingTickets
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
