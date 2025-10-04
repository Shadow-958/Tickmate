// services/aiRecommendationService.js
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

class AIRecommendationService {
  constructor() {
    this.userProfiles = new Map();
    this.eventFeatures = new Map();
    console.log('🤖 AI Recommendation Service initialized');
  }

  // FIXED: Build user profile with proper validation and error handling
  async buildUserProfile(userId) {
    try {
      // CRITICAL: Validate userId before using it
      if (!userId || userId === 'undefined' || userId === 'null' || typeof userId !== 'string') {
        console.warn('⚠️ AI buildUserProfile called with invalid userId:', userId, typeof userId);
        return this.getDefaultProfile(userId);
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.warn('⚠️ AI buildUserProfile called with invalid ObjectId format:', userId);
        return this.getDefaultProfile(userId);
      }

      console.log('🤖 Building user profile for userId:', userId);

      // Safe database queries with validation
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        console.warn('⚠️ User not found for profile building:', userId);
        return this.getDefaultProfile(userId);
      }

      const userTickets = await Ticket.find({ 
        attendeeId: userId,
        status: 'active'
      })
      .populate({
        path: 'eventId',
        select: 'category pricing location startDateTime createdAt'
      })
      .limit(100); // Limit for performance

      console.log(`📊 Found ${userTickets.length} tickets for user profile building`);

      const profile = {
        userId,
        preferredCategories: {},
        averageTicketPrice: 0,
        preferredDays: {},
        locationPreferences: {},
        totalEventsAttended: userTickets.length,
        lastActivity: new Date(),
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email
      };

      // Analyze user's ticket history safely
      let totalSpent = 0;
      let validTickets = 0;

      userTickets.forEach(ticket => {
        if (ticket.eventId && ticket.eventId._id) {
          try {
            const event = ticket.eventId;

            // Track category preferences safely
            if (event.category) {
              profile.preferredCategories[event.category] = 
                (profile.preferredCategories[event.category] || 0) + 1;
            }

            // Track spending patterns safely
            if (ticket.pricePaid && typeof ticket.pricePaid === 'number') {
              totalSpent += ticket.pricePaid;
              validTickets++;
            }

            // Track preferred days safely
            if (event.startDateTime) {
              const eventDay = new Date(event.startDateTime).getDay();
              const dayType = eventDay === 0 || eventDay === 6 ? 'weekend' : 'weekday';
              profile.preferredDays[dayType] = (profile.preferredDays[dayType] || 0) + 1;
            }

            // Track location preferences safely
            if (event.location && event.location.city) {
              const city = event.location.city;
              profile.locationPreferences[city] = (profile.locationPreferences[city] || 0) + 1;
            } else if (event.location && event.location.venue) {
              // Fallback to venue if city not available
              const venue = event.location.venue;
              profile.locationPreferences[venue] = (profile.locationPreferences[venue] || 0) + 1;
            }
          } catch (ticketError) {
            console.warn('⚠️ Error processing ticket in profile building:', ticketError.message);
          }
        }
      });

      profile.averageTicketPrice = validTickets > 0 ? totalSpent / validTickets : 0;

      // Normalize preferences (convert to percentages)
      this.normalizePreferences(profile);

      // Cache the profile
      this.userProfiles.set(userId, profile);
      
      console.log('✅ User profile built successfully:', {
        userId,
        totalEvents: profile.totalEventsAttended,
        avgPrice: profile.averageTicketPrice,
        categories: Object.keys(profile.preferredCategories).length
      });

      return profile;

    } catch (error) {
      console.error('❌ Error building user profile:', error);
      return this.getDefaultProfile(userId);
    }
  }

  // ADDED: Get default profile for invalid users or errors
  getDefaultProfile(userId = 'unknown') {
    return {
      userId,
      preferredCategories: {},
      averageTicketPrice: 50, // Default price
      preferredDays: { 'weekend': 0.6, 'weekday': 0.4 },
      locationPreferences: {},
      totalEventsAttended: 0,
      lastActivity: new Date(),
      isDefault: true,
      error: 'Could not build user profile'
    };
  }

  // FIXED: Safe normalization with validation
  normalizePreferences(profile) {
    const total = profile.totalEventsAttended;
    if (total === 0 || !profile) return;

    try {
      // Normalize categories safely
      Object.keys(profile.preferredCategories || {}).forEach(category => {
        if (profile.preferredCategories[category] && typeof profile.preferredCategories[category] === 'number') {
          profile.preferredCategories[category] = profile.preferredCategories[category] / total;
        }
      });

      // Normalize day preferences safely
      Object.keys(profile.preferredDays || {}).forEach(dayType => {
        if (profile.preferredDays[dayType] && typeof profile.preferredDays[dayType] === 'number') {
          profile.preferredDays[dayType] = profile.preferredDays[dayType] / total;
        }
      });

      // Normalize location preferences safely
      Object.keys(profile.locationPreferences || {}).forEach(location => {
        if (profile.locationPreferences[location] && typeof profile.locationPreferences[location] === 'number') {
          profile.locationPreferences[location] = profile.locationPreferences[location] / total;
        }
      });
    } catch (error) {
      console.warn('⚠️ Error normalizing preferences:', error.message);
    }
  }

  // IMPROVED: Calculate similarity with better error handling
  calculateUserSimilarity(profile1, profile2) {
    try {
      if (!profile1 || !profile2) return 0;

      let similarity = 0;
      let commonCategories = 0;

      // Compare category preferences safely
      Object.keys(profile1.preferredCategories || {}).forEach(category => {
        if (profile2.preferredCategories && profile2.preferredCategories[category]) {
          const diff = Math.abs(profile1.preferredCategories[category] - profile2.preferredCategories[category]);
          similarity += (1 - diff);
          commonCategories++;
        }
      });

      // Compare price preferences safely
      const price1 = profile1.averageTicketPrice || 0;
      const price2 = profile2.averageTicketPrice || 0;
      const maxPrice = Math.max(price1, price2, 1);
      const priceSimilarity = 1 - Math.abs(price1 - price2) / maxPrice;

      similarity += priceSimilarity;

      return commonCategories > 0 ? similarity / (commonCategories + 1) : 0;
    } catch (error) {
      console.warn('⚠️ Error calculating user similarity:', error.message);
      return 0;
    }
  }

  // IMPROVED: Content-based filtering with better validation
  scoreEventForUser(event, userProfile) {
    try {
      if (!event || !userProfile) return 0;

      let score = 0;

      // Category preference score
      const categoryScore = (userProfile.preferredCategories && event.category) ? 
        (userProfile.preferredCategories[event.category] || 0) : 0;
      score += categoryScore * 0.4;

      // Price preference score
      if (event.pricing) {
        const eventPrice = event.pricing.isFree ? 0 : (event.pricing.price || 0);
        const userAvgPrice = userProfile.averageTicketPrice || 50;
        const priceDiff = Math.abs(eventPrice - userAvgPrice);
        const priceScore = Math.max(0, 1 - priceDiff / Math.max(userAvgPrice, eventPrice, 1));
        score += priceScore * 0.2;
      }

      // Location preference score
      if (event.location && userProfile.locationPreferences) {
        const city = event.location.city || event.location.venue || '';
        const locationScore = userProfile.locationPreferences[city] || 0;
        score += locationScore * 0.2;
      }

      // Day preference score
      if (event.startDateTime && userProfile.preferredDays) {
        const eventDay = new Date(event.startDateTime).getDay();
        const dayType = eventDay === 0 || eventDay === 6 ? 'weekend' : 'weekday';
        const dayScore = userProfile.preferredDays[dayType] || 0;
        score += dayScore * 0.1;
      }

      // Freshness score (newer events get slight boost)
      if (event.createdAt) {
        const daysSinceCreated = (Date.now() - new Date(event.createdAt)) / (1000 * 60 * 60 * 24);
        const freshnessScore = Math.max(0, 1 - daysSinceCreated / 30); // Decay over 30 days
        score += freshnessScore * 0.1;
      }

      return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1

    } catch (error) {
      console.warn('⚠️ Error scoring event for user:', error.message);
      return 0;
    }
  }

  // IMPROVED: Get personalized recommendations with better error handling
  async getRecommendations(userId, limit = 10) {
    try {
      console.log('🎯 Getting recommendations for user:', userId);

      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.warn('⚠️ Invalid userId for recommendations:', userId);
        return [];
      }

      // Build or get user profile
      let userProfile = this.userProfiles.get(userId);
      if (!userProfile) {
        userProfile = await this.buildUserProfile(userId);
        if (!userProfile || userProfile.error) {
          console.warn('⚠️ Could not build user profile, returning trending events');
          return await this.getTrendingEvents(limit);
        }
      }

      // Get upcoming events
      const upcomingEvents = await Event.find({
        startDateTime: { $gte: new Date() },
        status: 'published'
      }).limit(100); // Limit for performance

      console.log(`📊 Scoring ${upcomingEvents.length} events for user`);

      // Score each event for this user
      const scoredEvents = upcomingEvents.map(event => {
        const score = this.scoreEventForUser(event, userProfile);
        return {
          event,
          score
        };
      }).filter(item => item.score > 0); // Only include events with positive scores

      // Sort by score and return top recommendations
      scoredEvents.sort((a, b) => b.score - a.score);

      const recommendations = scoredEvents.slice(0, limit).map(item => ({
        ...item.event.toObject(),
        recommendationScore: item.score,
        recommendationReason: this.generateRecommendationReason(item.event, userProfile)
      }));

      console.log(`✅ Generated ${recommendations.length} recommendations for user`);
      return recommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      // Fallback to trending events
      return await this.getTrendingEvents(limit);
    }
  }

  // IMPROVED: Generate recommendation reason with better validation
  generateRecommendationReason(event, userProfile) {
    try {
      const reasons = [];

      if (event.category && userProfile.preferredCategories) {
        const categoryPreference = userProfile.preferredCategories[event.category];
        if (categoryPreference && categoryPreference > 0.2) {
          reasons.push(`You've enjoyed ${event.category.replace(/-/g, ' ')} events before`);
        }
      }

      if (event.location && userProfile.locationPreferences) {
        const city = event.location.city || event.location.venue;
        const locationPreference = userProfile.locationPreferences[city];
        if (locationPreference && locationPreference > 0.2 && city) {
          reasons.push(`Based on your interest in ${city} events`);
        }
      }

      if (event.pricing && userProfile.averageTicketPrice) {
        const eventPrice = event.pricing.isFree ? 0 : (event.pricing.price || 0);
        if (Math.abs(eventPrice - userProfile.averageTicketPrice) < userProfile.averageTicketPrice * 0.3) {
          reasons.push('Matches your usual spending range');
        }
      }

      return reasons.length > 0 ? reasons[0] : 'Recommended for you';
    } catch (error) {
      console.warn('⚠️ Error generating recommendation reason:', error.message);
      return 'Recommended for you';
    }
  }

  // IMPROVED: Update user profile with validation
  async updateUserProfile(userId, eventId, interactionType = 'view') {
    try {
      // Validate inputs
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.warn('⚠️ Invalid userId for profile update:', userId);
        return;
      }

      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        console.warn('⚠️ Invalid eventId for profile update:', eventId);
        return;
      }

      const event = await Event.findById(eventId);
      if (!event) {
        console.warn('⚠️ Event not found for profile update:', eventId);
        return;
      }

      let profile = this.userProfiles.get(userId);
      if (!profile) {
        profile = await this.buildUserProfile(userId);
        if (!profile) return;
      }

      // Update profile based on interaction
      if (event.category) {
        if (interactionType === 'book') {
          profile.preferredCategories[event.category] = 
            (profile.preferredCategories[event.category] || 0) + 0.1;
        } else if (interactionType === 'view') {
          profile.preferredCategories[event.category] = 
            (profile.preferredCategories[event.category] || 0) + 0.05;
        }
      }

      profile.lastActivity = new Date();
      this.userProfiles.set(userId, profile);

      console.log(`📊 Updated user profile for ${interactionType}:`, userId, event.category);

    } catch (error) {
      console.error('❌ Error updating user profile:', error);
    }
  }

  // IMPROVED: Get trending events with better error handling
  async getTrendingEvents(limit = 10) {
    try {
      console.log('📈 Getting trending events');

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentTickets = await Ticket.find({
        bookingDate: { $gte: sevenDaysAgo },
        status: 'active'
      })
      .populate('eventId')
      .limit(1000); // Limit for performance

      const eventPopularity = {};
      recentTickets.forEach(ticket => {
        if (ticket.eventId && ticket.eventId._id) {
          const eventId = ticket.eventId._id.toString();
          eventPopularity[eventId] = (eventPopularity[eventId] || 0) + 1;
        }
      });

      const trendingEventIds = Object.entries(eventPopularity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit * 2) // Get more to filter later
        .map(([eventId]) => eventId);

      const trendingEvents = await Event.find({
        _id: { $in: trendingEventIds },
        startDateTime: { $gte: new Date() },
        status: 'published'
      }).limit(limit);

      const result = trendingEvents.map(event => ({
        ...event.toObject(),
        ticketsSoldRecently: eventPopularity[event._id.toString()] || 0,
        trendingRank: trendingEventIds.indexOf(event._id.toString()) + 1
      }));

      console.log(`✅ Found ${result.length} trending events`);
      return result;

    } catch (error) {
      console.error('❌ Error getting trending events:', error);
      return [];
    }
  }

  // ADDED: Clear cache method for memory management
  clearCache() {
    this.userProfiles.clear();
    this.eventFeatures.clear();
    console.log('🧹 AI service cache cleared');
  }

  // ADDED: Get cache stats
  getCacheStats() {
    return {
      userProfiles: this.userProfiles.size,
      eventFeatures: this.eventFeatures.size,
      lastCleared: new Date()
    };
  }
}

module.exports = new AIRecommendationService();
