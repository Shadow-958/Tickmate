const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  bannerImageUrl: {
    type: String,
    default: 'https://placehold.co/1200x400/000000/FFFFFF?text=Eventzilla',
  },
  category: {
    type: String,
    required: true,
    enum: ['tech-meetups', 'workshops-training', 'open-mic-comedy', 'fitness-bootcamp'],
  },
  location: {
    type: String,
    required: true,
  },
  startDateTime: {
    type: Date,
    required: true,
  },
  endDateTime: {
    type: Date,
    required: true,
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: function() { return !this.isFree; }
    },
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  ticketsSold: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
