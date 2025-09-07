const Ticket = require('../models/Ticket.js');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const crypto = require('crypto');
const QRCode = require('qrcode');

const bookTicket = async (req, res) => {
  const { eventId, clerkId } = req.body;

  if (!eventId || !clerkId) {
    return res.status(400).json({ message: 'Event ID and Clerk ID are required' });
  }

  try {
    const event = await Event.findById(eventId);
    const user = await User.findOne({ clerkId: clerkId });

    if (!event || !user) {
      return res.status(404).json({ message: 'Event or User not found' });
    }

    const existingTicket = await Ticket.findOne({
      eventId: event._id,
      attendeeId: user._id,
    });

    if (existingTicket) {
      return res.status(400).json({ message: 'You have already booked a ticket for this event.' });
    }

    const ticketsSold = event.ticketsSold || 0;
    if (ticketsSold >= event.capacity) {
      return res.status(400).json({ message: 'Sorry, this event is sold out.' });
    }

    const uniqueTicketData = crypto.randomBytes(16).toString('hex');
    const qrCodeUrl = await QRCode.toDataURL(uniqueTicketData);

    const newTicket = new Ticket({
      eventId: event._id,
      attendeeId: user._id,
      qrCodeUrl: qrCodeUrl,
      pricePaid: event.pricing.isFree ? 0 : event.pricing.price,
    });

    await newTicket.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { ticketsSold: 1 } });

    res.status(201).json({ message: 'Ticket booked successfully!', ticket: newTicket });
  } catch (error) {
    res.status(500).json({ message: 'Error booking ticket', error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  const { clerkId } = req.query;

  if (!clerkId) {
    return res.status(400).json({ message: 'Clerk ID is required' });
  }

  try {
    const user = await User.findOne({ clerkId: clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookings = await Ticket.find({ attendeeId: user._id }).populate('eventId');
    const validBookings = bookings.filter(booking => booking.eventId !== null);

    res.status(200).json(validBookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

module.exports = { bookTicket, getMyBookings };
