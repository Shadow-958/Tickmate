const Event = require('../models/Event.js');
const User = require('../models/User.js');
const Ticket = require('../models/Ticket.js');
const QRCode = require('qrcode');

const getMyEvents = async (req, res) => {
  try {
    const { clerkId } = req.query;
    const organizer = await User.findOne({ clerkId });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    const events = await Event.find({ organizer: organizer._id }).sort({ startDateTime: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizer events', error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { clerkId } = req.query;
    const organizer = await User.findOne({ clerkId });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    const events = await Event.find({ organizer: organizer._id });
    const now = new Date();
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let upcomingEventsCount = 0;
    events.forEach(event => {
      totalTicketsSold += event.ticketsSold || 0;
      totalRevenue += (event.ticketsSold || 0) * (event.pricing.price || 0);
      if (new Date(event.startDateTime) > now) {
        upcomingEventsCount++;
      }
    });
    const revenueByEvent = events
      .filter(e => e.ticketsSold > 0 && !e.pricing.isFree)
      .map(e => ({
        name: e.title.substring(0, 15) + (e.title.length > 15 ? "..." : ""),
        revenue: (e.ticketsSold * e.pricing.price) / 100,
      }));
    res.status(200).json({
      totalRevenue: totalRevenue / 100,
      totalTicketsSold,
      upcomingEventsCount,
      totalEventsCreated: events.length,
      revenueByEvent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { clerkId } = req.body;
    const { id: eventId } = req.params;
    const organizer = await User.findOne({ clerkId });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this event.' });
    }
    await Event.deleteOne({ _id: eventId });
    await Ticket.deleteMany({ eventId: eventId });
    res.status(200).json({ message: 'Event and associated tickets deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

const getAttendeesForEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const tickets = await Ticket.find({ eventId: eventId }).populate('attendeeId');
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendees', error: error.message });
  }
};

const verifyTicket = async (req, res) => {
  try {
    const { qrCodeData, eventId } = req.body;
    if (!qrCodeData || !eventId) {
      return res.status(400).json({ status: 'error', message: 'QR code data and Event ID are required.' });
    }
    const expectedQrCodeUrl = await QRCode.toDataURL(qrCodeData);
    const ticket = await Ticket.findOne({ qrCodeUrl: expectedQrCodeUrl }).populate('attendeeId');
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Invalid Ticket: Not Found' });
    }
    if (ticket.eventId.toString() !== eventId) {
        return res.status(400).json({ status: 'error', message: 'Ticket is for a different event.' });
    }
    if (ticket.isCheckedIn) {
      return res.status(200).json({
        status: 'warning',
        message: 'Already Checked In',
        attendeeName: `${ticket.attendeeId.firstName || ''} ${ticket.attendeeId.lastName || ''}`.trim(),
      });
    }
    ticket.isCheckedIn = true;
    await ticket.save();
    res.status(200).json({
      status: 'success',
      message: 'Check-In Successful!',
      attendeeName: `${ticket.attendeeId.firstName || ''} ${ticket.attendeeId.lastName || ''}`.trim(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server Error during verification' });
  }
};

module.exports = { getMyEvents, getAnalytics, deleteEvent, getAttendeesForEvent, verifyTicket };
