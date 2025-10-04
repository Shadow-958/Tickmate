const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String },

  clerkId: {
    type: String,
    unique: true,
    sparse: true // allows multiple docs with null or undefined clerkId
  },

  selectedRole: { 
    type: String, 
    enum: ['event_host', 'event_attendee', 'event_staff'], 
    default: 'event_attendee' 
  },

  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  hostProfile: {
    organizationName: { type: String, default: '' },
    organizationDescription: { type: String, default: '' },
    website: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    eventsCreated: { type: Number, default: 0 }
  },

  staffProfile: {
    permissions: { 
      type: [String], 
      default: ['scan_ticket', 'check_in_attendee'] 
    },
    assignedEvents: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Event' 
    }],
    isActive: { type: Boolean, default: true },
    department: { type: String, default: '' }
  },

  attendeeProfile: {
    preferences: { type: [String], default: [] },
    favoriteCategories: { type: [String], default: [] },
    ticketsPurchased: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 }
  },

  photo: { type: String },
  bio: { type: String, maxlength: 500 },
  location: {
    city: { type: String },
    country: { type: String }
  },

  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },

  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },

  // NEW AI FEATURES - USER INTERACTION TRACKING
  userInteractions: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    interactionType: { type: String, enum: ['view', 'book', 'like', 'share'] },
    timestamp: { type: Date, default: Date.now }
  }],

  // NEW AI FEATURES - USER PREFERENCES FOR RECOMMENDATIONS
  preferences: {
    categories: [String],
    priceRange: {
      min: Number,
      max: Number
    },
    locationRadius: Number,
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  }

}, { timestamps: true });

// ENHANCED INDEXES FOR AI FEATURES
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ selectedRole: 1 });
userSchema.index({ clerkId: 1 }, { unique: true, sparse: true });

// NEW INDEXES FOR AI RECOMMENDATION PERFORMANCE
userSchema.index({ 'userInteractions.eventId': 1 });
userSchema.index({ 'userInteractions.interactionType': 1 });
userSchema.index({ 'userInteractions.timestamp': -1 });
userSchema.index({ 'preferences.categories': 1 });
userSchema.index({ 'attendeeProfile.favoriteCategories': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// NEW VIRTUAL FOR AI RECOMMENDATION SCORE
userSchema.virtual('recommendationProfile').get(function() {
  const recentInteractions = this.userInteractions
    .filter(interaction => 
      Date.now() - new Date(interaction.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

  return {
    totalInteractions: this.userInteractions.length,
    recentInteractions: recentInteractions.length,
    favoriteCategories: this.attendeeProfile.favoriteCategories,
    preferredCategories: this.preferences.categories,
    priceRange: this.preferences.priceRange,
    engagementScore: Math.min(recentInteractions.length * 10, 100) // Score out of 100
  };
});

// Pre-save middleware to update onboarding status
userSchema.pre('save', function(next) {
  if (this.selectedRole && !this.onboardingCompleted) {
    this.onboardingCompleted = true;
  }
  next();
});

// NEW METHOD: Track user interaction for AI
userSchema.methods.trackInteraction = function(eventId, interactionType) {
  // Limit to last 100 interactions to prevent unlimited growth
  if (this.userInteractions.length >= 100) {
    this.userInteractions.shift(); // Remove oldest interaction
  }
  
  this.userInteractions.push({
    eventId,
    interactionType,
    timestamp: new Date()
  });
  
  return this.save();
};

// NEW METHOD: Update user preferences based on interactions
userSchema.methods.updatePreferencesFromInteractions = function() {
  const categoryFrequency = {};
  
  // Count category interactions
  this.userInteractions.forEach(interaction => {
    if (interaction.eventId && interaction.eventId.category) {
      const category = interaction.eventId.category;
      categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
    }
  });
  
  // Update preferred categories (top 3)
  const topCategories = Object.entries(categoryFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
  
  this.preferences.categories = topCategories;
  this.attendeeProfile.favoriteCategories = topCategories;
  
  return this.save();
};

// NEW STATIC METHOD: Find users with similar preferences
userSchema.statics.findSimilarUsers = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { _id: { $ne: userId }, selectedRole: 'event_attendee' } },
    {
      $addFields: {
        similarityScore: {
          $size: {
            $setIntersection: ['$preferences.categories', '$preferences.categories']
          }
        }
      }
    },
    { $sort: { similarityScore: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

console.log('🤖 Enhanced User model loaded with AI features:');
console.log('   ✅ User Interaction Tracking');
console.log('   ✅ AI Preference Management');
console.log('   ✅ Recommendation Profile Generation');
console.log('   ✅ Similarity Matching');
