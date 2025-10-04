const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(authorize('event_staff'));

// @desc    Get active events for staff
// @route   GET /api/staff/active-events
// @access  Private (staff only)
router.get('/active-events', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await Event.find({
      startDateTime: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'published'
    })
    .populate('host', 'firstName lastName')
    .select('title startDateTime endDateTime location capacity')
    .sort({ startDateTime: 1 });

    // Add attendee count for each event
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      const attendeeCount = await Ticket.countDocuments({ 
        eventId: event._id, 
        status: 'active' 
      });
      
      const checkedIn = await Ticket.countDocuments({ 
        eventId: event._id, 
        status: 'active',
        'checkInStatus.isCheckedIn': true 
      });

      return {
        ...event.toObject(),
        attendeeCount,
        checkedIn,
        location: event.location?.venue || event.location?.address || 'TBD'
      };
    }));

    res.status(200).json({
      success: true,
      events: eventsWithStats
    });
  } catch (error) {
    console.error('Get active events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching active events',
      error: error.message
    });
  }
});

// @desc    Get scan history for staff
// @route   GET /api/staff/scan-history  
// @access  Private (staff only)
router.get('/scan-history', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get recent check-ins
    const tickets = await Ticket.find({
      'checkInStatus.checkInTime': { $gte: today },
      'checkInStatus.isCheckedIn': true
    })
    .populate('attendeeId', 'firstName lastName')
    .populate('eventId', 'title')
    .sort({ 'checkInStatus.checkInTime': -1 })
    .limit(20);

    const scans = tickets.map(ticket => ({
      attendeeName: `${ticket.attendeeId?.firstName || 'Unknown'} ${ticket.attendeeId?.lastName || 'User'}`,
      eventName: ticket.eventId?.title || 'Unknown Event', 
      timestamp: ticket.checkInStatus.checkInTime || new Date(),
      success: true,
      ticketNumber: ticket.ticketNumber
    }));

    res.status(200).json({
      success: true,
      scans
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching scan history',
      error: error.message
    });
  }
});

// @desc    Get staff statistics
// @route   GET /api/staff/stats
// @access  Private (staff only)
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's check-ins
    const todayScans = await Ticket.countDocuments({
      'checkInStatus.checkInTime': { 
        $gte: today, 
        $lt: tomorrow 
      },
      'checkInStatus.isCheckedIn': true
    });

    res.status(200).json({
      success: true,
      stats: {
        todayScans,
        validScans: todayScans,
        invalidScans: 0 // Placeholder
      }
    });
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats',
      error: error.message
    });
  }
});

// @desc    Get event details for staff (for scanning)
// @route   GET /api/staff/events/:eventId
// @access  Private (staff only)
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event details
    const event = await Event.findById(eventId)
      .populate('host', 'firstName lastName')
      .select('title startDateTime endDateTime location capacity status');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is today or in the future (staff can only scan active events)
    const now = new Date();
    const eventDate = new Date(event.startDateTime);
    
    if (eventDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'This event has already ended'
      });
    }

    // Get attendee statistics
    const totalAttendees = await Ticket.countDocuments({ 
      eventId, 
      status: 'active' 
    });
    
    const checkedInCount = await Ticket.countDocuments({ 
      eventId, 
      status: 'active',
      'checkInStatus.isCheckedIn': true 
    });

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        statistics: {
          totalAttendees,
          checkedInCount,
          pendingCheckIn: totalAttendees - checkedInCount
        }
      }
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event details',
      error: error.message
    });
  }
});

// @desc    DEBUG - List all tickets for an event
// @route   GET /api/staff/debug/tickets/:eventId
// @access  Private (staff only) - REMOVE IN PRODUCTION
router.get('/debug/tickets/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('🔍 DEBUG - Searching for tickets in event:', eventId);
    
    // Get all tickets for this event
    const tickets = await Ticket.find({ eventId })
      .populate('attendeeId', 'firstName lastName')
      .select('ticketNumber qrCodeData qrCodeUrl status paymentStatus checkInStatus')
      .limit(10);
    
    console.log('🔍 DEBUG - Tickets found for event:', eventId);
    console.log('📊 Total tickets found:', tickets.length);
    
    tickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. Ticket Details:`, {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        qrCodeData: ticket.qrCodeData,
        attendeeName: ticket.attendeeId ? `${ticket.attendeeId.firstName} ${ticket.attendeeId.lastName}` : 'Unknown',
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        checkedIn: ticket.checkInStatus?.isCheckedIn || false
      });
    });
    
    // Also search for the specific tickets that were failing
    console.log('🔍 Searching for specific failed tickets...');
    const specificTicket1 = await Ticket.findOne({
      $or: [
        { ticketNumber: 'TCK1759305841641868' },
        { qrCodeData: 'TCK1759305841641868' }
      ]
    });
    console.log('Ticket TCK1759305841641868:', specificTicket1 ? 'FOUND' : 'NOT FOUND');
    
    const specificTicket2 = await Ticket.findOne({
      $or: [
        { ticketNumber: 'TCK1759083335467521' },
        { qrCodeData: 'TCK1759083335467521' }
      ]
    });
    console.log('Ticket TCK1759083335467521:', specificTicket2 ? 'FOUND' : 'NOT FOUND');
    
    res.json({
      success: true,
      eventId,
      totalTickets: tickets.length,
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        ticketNumber: t.ticketNumber,
        qrCodeData: t.qrCodeData,
        qrCodeUrl: t.qrCodeUrl,
        attendeeName: t.attendeeId ? `${t.attendeeId.firstName} ${t.attendeeId.lastName}` : 'Unknown',
        status: t.status,
        paymentStatus: t.paymentStatus,
        checkedIn: t.checkInStatus?.isCheckedIn || false
      })),
      specificTicketCheck: {
        'TCK1759305841641868': !!specificTicket1,
        'TCK1759083335467521': !!specificTicket2
      }
    });
  } catch (error) {
    console.error('Debug tickets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Verify ticket for staff
// @route   POST /api/staff/verify-ticket
// @access  Private (staff only) 
router.post('/verify-ticket', async (req, res) => {
  try {
    const { ticketCode, eventId } = req.body;

    console.log('🎫 VERIFY TICKET REQUEST:');
    console.log('  - Ticket Code:', ticketCode);
    console.log('  - Event ID:', eventId);
    console.log('  - Staff User:', req.user.firstName, req.user.lastName);

    if (!ticketCode || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket code and event ID are required'
      });
    }

    // First, let's see if we have ANY tickets for this event
    const eventTicketsCount = await Ticket.countDocuments({ eventId });
    console.log(`🔍 Total tickets for event ${eventId}:`, eventTicketsCount);

    if (eventTicketsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tickets found for this event'
      });
    }

    // Enhanced search with detailed logging
    console.log('🔍 SEARCHING FOR TICKET:');
    
    // Search by ticket number
    let ticket = await Ticket.findOne({ ticketNumber: ticketCode })
      .populate('attendeeId', 'firstName lastName email')
      .populate('eventId', 'title startDateTime');
    
    if (ticket) {
      console.log('✅ Found by ticketNumber');
    } else {
      console.log('❌ Not found by ticketNumber');
      
      // Search by QR code data
      ticket = await Ticket.findOne({ qrCodeData: ticketCode })
        .populate('attendeeId', 'firstName lastName email')
        .populate('eventId', 'title startDateTime');
      
      if (ticket) {
        console.log('✅ Found by qrCodeData');
      } else {
        console.log('❌ Not found by qrCodeData');
        
        // Search by ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(ticketCode)) {
          ticket = await Ticket.findById(ticketCode)
            .populate('attendeeId', 'firstName lastName email')
            .populate('eventId', 'title startDateTime');
          
          if (ticket) {
            console.log('✅ Found by _id');
          } else {
            console.log('❌ Not found by _id');
          }
        }
      }
    }

    // If still not found, let's see what tickets we do have
    if (!ticket) {
      console.log('🔍 DEBUGGING - Let\'s see what tickets exist:');
      const sampleTickets = await Ticket.find({ eventId })
        .select('ticketNumber qrCodeData status paymentStatus')
        .limit(5);
      
      console.log('Sample tickets for this event:');
      sampleTickets.forEach((t, index) => {
        console.log(`  ${index + 1}. ticketNumber: "${t.ticketNumber}", qrCodeData: "${t.qrCodeData}", status: "${t.status}"`);
      });
      
      // Also check if the ticket exists in any event
      const ticketInAnyEvent = await Ticket.findOne({
        $or: [
          { ticketNumber: ticketCode },
          { qrCodeData: ticketCode }
        ]
      }).populate('eventId', 'title');
      
      if (ticketInAnyEvent) {
        console.log(`🔍 FOUND ticket in different event: ${ticketInAnyEvent.eventId?.title || 'Unknown Event'}`);
        return res.status(400).json({
          success: false,
          message: `This ticket belongs to a different event: ${ticketInAnyEvent.eventId?.title || 'Unknown Event'}`
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Ticket not found. Please check the QR code.',
        debug: {
          searchedFor: ticketCode,
          eventId: eventId,
          totalEventTickets: eventTicketsCount,
          sampleTickets: sampleTickets.map(t => ({
            ticketNumber: t.ticketNumber,
            qrCodeData: t.qrCodeData
          }))
        }
      });
    }

    console.log('✅ TICKET FOUND:', {
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.eventId?.title,
      attendeeName: `${ticket.attendeeId?.firstName} ${ticket.attendeeId?.lastName}`,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus
    });

    // Verify ticket belongs to this event
    if (ticket.eventId._id.toString() !== eventId) {
      console.log('❌ Event mismatch:', { 
        ticketEventId: ticket.eventId._id.toString(), 
        requestedEventId: eventId 
      });
      return res.status(400).json({
        success: false,
        message: 'This ticket is not valid for the current event'
      });
    }

    // Check if ticket is active
    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Ticket status: ${ticket.status}. Cannot check in.`
      });
    }

    // Check payment status
    if (ticket.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${ticket.paymentStatus}`
      });
    }

    // Initialize checkInStatus if it doesn't exist
    if (!ticket.checkInStatus) {
      ticket.checkInStatus = {
        isCheckedIn: false,
        checkInTime: null,
        checkedInBy: null
      };
    }

    // Check if already checked in
    if (ticket.checkInStatus.isCheckedIn) {
      return res.status(200).json({
        success: false,
        message: `Already checked in at ${ticket.checkInStatus.checkInTime?.toLocaleString() || 'unknown time'}`,
        alreadyCheckedIn: true,
        checkInTime: ticket.checkInStatus.checkInTime,
        attendeeName: `${ticket.attendeeId.firstName} ${ticket.attendeeId.lastName}`
      });
    }

    // Update ticket check-in status
    ticket.checkInStatus.isCheckedIn = true;
    ticket.checkInStatus.checkInTime = new Date();
    ticket.checkInStatus.checkedInBy = req.user._id;
    
    // Also update verification tracking
    if (!ticket.verification) {
      ticket.verification = {
        isScanned: false,
        scanCount: 0
      };
    }
    
    ticket.verification.isScanned = true;
    ticket.verification.scannedAt = new Date();
    ticket.verification.scannedBy = req.user._id;
    ticket.verification.entryTime = new Date();
    ticket.verification.scanCount = (ticket.verification.scanCount || 0) + 1;
    
    await ticket.save();

    console.log(`✅ TICKET CHECKED IN SUCCESSFULLY: ${ticket.ticketNumber} by ${req.user.firstName} ${req.user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Welcome! Check-in successful.',
      attendeeName: `${ticket.attendeeId.firstName} ${ticket.attendeeId.lastName}`,
      ticketNumber: ticket.ticketNumber,
      eventName: ticket.eventId.title,
      checkInTime: ticket.checkInStatus.checkInTime
    });

  } catch (error) {
    console.error('❌ VERIFY TICKET ERROR:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error verifying ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
