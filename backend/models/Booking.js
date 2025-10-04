const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Core booking information
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TK' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  
  // References
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  attendeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Booking details
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  // Pricing information
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
    default: 'card'
  },
  paymentId: {
    type: String // Razorpay payment ID or similar
  },
  paymentDate: {
    type: Date
  },
  
  // Check-in status
  checkInStatus: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: {
      type: Date
    },
    checkInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Staff member who scanned
    },
    scanLocation: {
      type: String
    }
  },
  
  // Booking status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'refunded', 'expired'],
    default: 'active'
  },
  
  // Additional details
  attendeeDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  
  // Metadata
  bookingSource: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  },
  notes: String,
  
  // Timestamps
  bookedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ attendeeId: 1 });
bookingSchema.index({ ticketNumber: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ 'checkInStatus.isCheckedIn': 1 });
bookingSchema.index({ bookedAt: -1 });

// Virtual for QR code data
bookingSchema.virtual('qrCodeData').get(function() {
  return {
    ticketNumber: this.ticketNumber,
    eventId: this.eventId,
    attendeeId: this.attendeeId,
    bookingId: this._id
  };
});

// Pre-save middleware to update timestamps
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-set payment date when payment is completed
  if (this.paymentStatus === 'completed' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  next();
});

// Static methods
bookingSchema.statics.getEventStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { eventId: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalTickets: { $sum: '$quantity' },
        totalRevenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$paymentStatus', 'completed'] }, 
              '$totalAmount', 
              0
            ]
          }
        },
        checkedInTickets: {
          $sum: {
            $cond: [
              { $eq: ['$checkInStatus.isCheckedIn', true] },
              '$quantity',
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalBookings: 0,
    totalTickets: 0,
    totalRevenue: 0,
    checkedInTickets: 0
  };
};

// Instance methods
bookingSchema.methods.checkIn = async function(staffId, location = null) {
  this.checkInStatus.isCheckedIn = true;
  this.checkInStatus.checkInTime = new Date();
  this.checkInStatus.checkInBy = staffId;
  if (location) this.checkInStatus.scanLocation = location;
  
  return await this.save();
};

bookingSchema.methods.generateQRCode = function() {
  return JSON.stringify({
    ticketNumber: this.ticketNumber,
    eventId: this.eventId,
    attendeeId: this.attendeeId,
    bookingId: this._id,
    timestamp: Date.now()
  });
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
