const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  attendeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  qrCodeUrl: {
    type: String,
    required: true,
    unique: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  pricePaid: {
    type: Number,
    required: true,
  },
  isCheckedIn: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
