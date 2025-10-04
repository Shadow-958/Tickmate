
// services/dynamicPricingService.js
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

class DynamicPricingService {
  constructor() {
    this.priceHistory = new Map();
    this.demandMetrics = new Map();
  }

  // Calculate demand score based on multiple factors
  async calculateDemandScore(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return 0;

      const now = new Date();
      const eventDate = new Date(event.startDateTime);
      const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);

      // Get ticket sales data
      const totalTickets = await Ticket.countDocuments({ 
        eventId, 
        paymentStatus: 'completed' 
      });

      const salesVelocity = await this.calculateSalesVelocity(eventId);
      const capacityUtilization = totalTickets / event.capacity;

      // Calculate demand factors
      const demandFactors = {
        capacityUtilization: capacityUtilization * 40, // 40% weight
        salesVelocity: Math.min(salesVelocity * 30, 30), // 30% weight, capped
        timeUrgency: this.calculateTimeUrgency(daysUntilEvent) * 20, // 20% weight
        categoryPopularity: await this.getCategoryPopularity(event.category) * 10 // 10% weight
      };

      const demandScore = Object.values(demandFactors).reduce((sum, factor) => sum + factor, 0);

      // Cache the demand metrics
      this.demandMetrics.set(eventId, {
        demandScore,
        factors: demandFactors,
        timestamp: now
      });

      return Math.min(demandScore, 100); // Cap at 100

    } catch (error) {
      console.error('Error calculating demand score:', error);
      return 50; // Default moderate demand
    }
  }

  // Calculate sales velocity (tickets sold per hour in recent period)
  async calculateSalesVelocity(eventId) {
    try {
      const recentHours = 24;
      const cutoffTime = new Date(Date.now() - recentHours * 60 * 60 * 1000);

      const recentSales = await Ticket.countDocuments({
        eventId,
        paymentStatus: 'completed',
        createdAt: { $gte: cutoffTime }
      });

      return recentSales / recentHours; // Sales per hour
    } catch (error) {
      console.error('Error calculating sales velocity:', error);
      return 0;
    }
  }

  // Calculate time urgency factor
  calculateTimeUrgency(daysUntilEvent) {
    if (daysUntilEvent <= 1) return 100; // Very urgent
    if (daysUntilEvent <= 3) return 80;  // High urgency
    if (daysUntilEvent <= 7) return 60;  // Medium urgency
    if (daysUntilEvent <= 14) return 40; // Low urgency
    return 20; // Very low urgency
  }

  // Get category popularity based on recent bookings
  async getCategoryPopularity(category) {
    try {
      const recentDays = 30;
      const cutoffTime = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

      const categoryEvents = await Event.find({
        category,
        createdAt: { $gte: cutoffTime }
      });

      if (categoryEvents.length === 0) return 50; // Default popularity

      const categoryTickets = await Ticket.countDocuments({
        eventId: { $in: categoryEvents.map(e => e._id) },
        paymentStatus: 'completed',
        createdAt: { $gte: cutoffTime }
      });

      const avgTicketsPerEvent = categoryTickets / categoryEvents.length;
      return Math.min(avgTicketsPerEvent * 10, 100); // Scale to 0-100

    } catch (error) {
      console.error('Error calculating category popularity:', error);
      return 50; // Default moderate popularity
    }
  }

  // Calculate optimal price based on demand
  async calculateOptimalPrice(eventId, basePrice) {
    try {
      const demandScore = await this.calculateDemandScore(eventId);
      const event = await Event.findById(eventId);

      if (!event || event.pricing.isFree) return basePrice;

      // Define pricing strategy parameters
      const pricingConfig = {
        minPriceMultiplier: 0.7,  // Minimum 70% of base price
        maxPriceMultiplier: 2.5,  // Maximum 250% of base price
        baselineDemand: 50,       // Baseline demand score
        priceElasticity: 0.02     // Price change per demand point
      };

      // Calculate price multiplier based on demand
      const demandDifference = demandScore - pricingConfig.baselineDemand;
      const priceMultiplier = 1 + (demandDifference * pricingConfig.priceElasticity);

      // Apply constraints
      const constrainedMultiplier = Math.max(
        pricingConfig.minPriceMultiplier,
        Math.min(pricingConfig.maxPriceMultiplier, priceMultiplier)
      );

      const optimalPrice = Math.round(basePrice * constrainedMultiplier);

      // Store price history
      this.storePriceHistory(eventId, {
        price: optimalPrice,
        demandScore,
        multiplier: constrainedMultiplier,
        timestamp: new Date()
      });

      return optimalPrice;

    } catch (error) {
      console.error('Error calculating optimal price:', error);
      return basePrice; // Return base price if calculation fails
    }
  }

  // Store price history for analytics
  storePriceHistory(eventId, priceData) {
    if (!this.priceHistory.has(eventId)) {
      this.priceHistory.set(eventId, []);
    }

    const history = this.priceHistory.get(eventId);
    history.push(priceData);

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
  }

  // Get price recommendations for event host
  async getPriceRecommendations(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return null;

      const basePrice = event.pricing.price;
      const currentOptimalPrice = await this.calculateOptimalPrice(eventId, basePrice);
      const demandMetrics = this.demandMetrics.get(eventId);

      return {
        currentPrice: event.pricing.price,
        recommendedPrice: currentOptimalPrice,
        priceChange: currentOptimalPrice - event.pricing.price,
        priceChangePercent: ((currentOptimalPrice - event.pricing.price) / event.pricing.price * 100).toFixed(1),
        demandScore: demandMetrics?.demandScore || 50,
        demandFactors: demandMetrics?.factors || {},
        recommendations: this.generatePricingRecommendations(demandMetrics?.demandScore || 50),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting price recommendations:', error);
      return null;
    }
  }

  // Generate human-readable pricing recommendations
  generatePricingRecommendations(demandScore) {
    const recommendations = [];

    if (demandScore > 80) {
      recommendations.push({
        type: 'increase',
        message: 'High demand detected! Consider increasing prices to maximize revenue.',
        urgency: 'high'
      });
    } else if (demandScore > 60) {
      recommendations.push({
        type: 'maintain',
        message: 'Good demand level. Current pricing strategy is working well.',
        urgency: 'medium'
      });
    } else if (demandScore < 30) {
      recommendations.push({
        type: 'decrease',
        message: 'Low demand. Consider promotional pricing to boost ticket sales.',
        urgency: 'high'
      });
      recommendations.push({
        type: 'marketing',
        message: 'Consider increasing marketing efforts to generate more interest.',
        urgency: 'medium'
      });
    }

    return recommendations;
  }

  // Automated price updates (called by cron job)
  async updateEventPrices() {
    try {
      const upcomingEvents = await Event.find({
        startDateTime: { $gte: new Date() },
        'pricing.isFree': false,
        'pricing.enableDynamicPricing': true
      });

      const updatePromises = upcomingEvents.map(async (event) => {
        try {
          const optimalPrice = await this.calculateOptimalPrice(event._id, event.pricing.basePrice || event.pricing.price);

          // Only update if price change is significant (>5%)
          const priceChangePercent = Math.abs(optimalPrice - event.pricing.price) / event.pricing.price;

          if (priceChangePercent > 0.05) {
            await Event.findByIdAndUpdate(event._id, {
              'pricing.price': optimalPrice,
              'pricing.lastPriceUpdate': new Date()
            });

            console.log(`Updated price for event ${event._id}: ${event.pricing.price} → ${optimalPrice}`);

            // Notify interested users about price change
            // This would integrate with the real-time service
            return { eventId: event._id, oldPrice: event.pricing.price, newPrice: optimalPrice };
          }

          return null;
        } catch (error) {
          console.error(`Error updating price for event ${event._id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(updatePromises);
      return results.filter(result => result !== null);

    } catch (error) {
      console.error('Error in automated price updates:', error);
      return [];
    }
  }

  // Get pricing analytics for dashboard
  async getPricingAnalytics(eventId) {
    try {
      const history = this.priceHistory.get(eventId) || [];
      const demandMetrics = this.demandMetrics.get(eventId);

      return {
        priceHistory: history.slice(-30), // Last 30 data points
        currentDemand: demandMetrics?.demandScore || 0,
        demandTrend: this.calculateDemandTrend(history),
        revenueProjection: await this.calculateRevenueProjection(eventId),
        optimalPriceRange: await this.calculateOptimalPriceRange(eventId)
      };

    } catch (error) {
      console.error('Error getting pricing analytics:', error);
      return null;
    }
  }

  calculateDemandTrend(history) {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const avg = recent.reduce((sum, item) => sum + item.demandScore, 0) / recent.length;

    const oldest = recent[0].demandScore;
    const newest = recent[recent.length - 1].demandScore;

    if (newest > oldest + 10) return 'increasing';
    if (newest < oldest - 10) return 'decreasing';
    return 'stable';
  }

  async calculateRevenueProjection(eventId) {
    // Implementation for revenue projection based on current trends
    // This would analyze historical data and current demand to project revenue
    return {
      conservative: 0,
      realistic: 0,
      optimistic: 0
    };
  }

  async calculateOptimalPriceRange(eventId) {
    const event = await Event.findById(eventId);
    if (!event) return { min: 0, max: 0 };

    const basePrice = event.pricing.price;
    return {
      min: Math.round(basePrice * 0.7),
      max: Math.round(basePrice * 2.5),
      current: basePrice
    };
  }
}

module.exports = new DynamicPricingService();
