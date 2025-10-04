const mongoose = require('mongoose');

// Check if model already exists
if (mongoose.models.Event) {
  module.exports = mongoose.models.Event;
} else {
  const eventSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    bannerImageUrl: {
      type: String,
      default: 'https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Event+Banner'
    },
    category: {
      type: String,
      required: true,
      enum: [
        'tech-meetups',
        'workshops-training',
        'open-mic-comedy',
        'fitness-bootcamp',
        'conferences',
        'networking',
        'music-concerts',
        'sports',
        'art-exhibitions',
        'business',
        'other'
      ]
    },
    location: {
      venue: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: String,
      zipCode: String
    },
    startDateTime: {
      type: Date,
      required: true
    },
    endDateTime: {
      type: Date,
      required: true
    },
    // ENHANCED PRICING SCHEMA WITH DYNAMIC PRICING
    pricing: {
      isFree: {
        type: Boolean,
        default: false
      },
      price: {
        type: Number,
        required: function() { return !this.pricing?.isFree; },
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      // NEW DYNAMIC PRICING FIELDS
      basePrice: {
        type: Number // Original price before dynamic adjustments
      },
      enableDynamicPricing: {
        type: Boolean,
        default: false
      },
      minPrice: {
        type: Number
      },
      maxPrice: {
        type: Number
      },
      lastPriceUpdate: {
        type: Date
      }
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    ticketsSold: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published'
    }
  }, { 
    timestamps: true 
  });

  // INDEXES FOR PERFORMANCE
  eventSchema.index({ startDateTime: 1 });
  eventSchema.index({ category: 1 });
  eventSchema.index({ 'location.city': 1 });
  eventSchema.index({ host: 1 });
  
  // NEW INDEXES FOR DYNAMIC PRICING
  eventSchema.index({ 'pricing.enableDynamicPricing': 1 });
  eventSchema.index({ 'pricing.lastPriceUpdate': 1 });

  // VIRTUAL FIELDS FOR DYNAMIC PRICING
  eventSchema.virtual('pricing.priceChangePercent').get(function() {
    if (this.pricing.basePrice && this.pricing.price) {
      return ((this.pricing.price - this.pricing.basePrice) / this.pricing.basePrice * 100).toFixed(2);
    }
    return 0;
  });

  // MIDDLEWARE TO SET BASE PRICE ON CREATION
  eventSchema.pre('save', function(next) {
    // Set basePrice on first save if not already set
    if (this.isNew && this.pricing && this.pricing.price && !this.pricing.basePrice) {
      this.pricing.basePrice = this.pricing.price;
    }
    next();
  });

  // VIRTUAL FOR AVAILABILITY
  eventSchema.virtual('isAvailable').get(function() {
    return this.ticketsSold < this.capacity && this.status === 'published';
  });

  // VIRTUAL FOR TICKETS REMAINING
  eventSchema.virtual('ticketsRemaining').get(function() {
    return Math.max(0, this.capacity - this.ticketsSold);
  });

  const Event = mongoose.model('Event', eventSchema);
  module.exports = Event;
}

console.log('🎉 Event model loaded safely with dynamic pricing support');
console.log('💰 Dynamic pricing fields: basePrice, enableDynamicPricing, minPrice, maxPrice, lastPriceUpdate');
