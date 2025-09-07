const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['attendee', 'organizer'],
    default: 'attendee',
  },
  photo: {
    type: String,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
