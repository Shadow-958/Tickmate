
// services/fraudDetectionService.js
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Event = require('../models/Event');

class FraudDetectionService {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.userRiskScores = new Map();
    this.blockedIPs = new Set();
    this.watchedUsers = new Set();
  }

  // Main fraud detection method
  async detectFraud(ticketData, userInfo, paymentInfo) {
    const riskFactors = {
      user: await this.analyzeUserBehavior(userInfo),
      payment: this.analyzePaymentPattern(paymentInfo),
      velocity: await this.analyzeBookingVelocity(userInfo.userId, userInfo.ip),
      device: this.analyzeDeviceFingerprint(userInfo),
      temporal: this.analyzeTemporalPatterns(ticketData),
      network: await this.analyzeNetworkBehavior(userInfo.ip)
    };

    const riskScore = this.calculateRiskScore(riskFactors);
    const riskLevel = this.classifyRisk(riskScore);

    return {
      riskScore,
      riskLevel,
      riskFactors,
      action: this.determineAction(riskScore, riskFactors),
      reasons: this.generateRiskReasons(riskFactors),
      timestamp: new Date()
    };
  }

  // Analyze user behavior patterns
  async analyzeUserBehavior(userInfo) {
    try {
      const { userId, email, ip } = userInfo;
      let riskScore = 0;

      // Check if new user (higher risk)
      const user = await User.findById(userId);
      if (!user) return 100; // No user found - very high risk

      const accountAge = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24); // days
      if (accountAge < 1) riskScore += 30; // Account less than 1 day old
      else if (accountAge < 7) riskScore += 15; // Account less than 1 week old

      // Check user's booking history
      const userTickets = await Ticket.find({ attendeeId: userId });
      const bookingHistory = userTickets.length;

      if (bookingHistory === 0) riskScore += 20; // First-time booker
      else if (bookingHistory < 3) riskScore += 10; // Limited history

      // Check for suspicious email patterns
      if (this.isDisposableEmail(email)) riskScore += 25;
      if (this.hasEmailAnomalies(email)) riskScore += 15;

      // Check if user is on watch list
      if (this.watchedUsers.has(userId)) riskScore += 40;

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return 50; // Default moderate risk
    }
  }

  // Analyze payment patterns
  analyzePaymentPattern(paymentInfo) {
    let riskScore = 0;

    const { amount, method, cardBin, country } = paymentInfo;

    // High-value transactions are riskier
    if (amount > 1000) riskScore += 20;
    else if (amount > 500) riskScore += 10;

    // Check payment method risk
    if (method === 'cryptocurrency') riskScore += 30;
    else if (method === 'prepaid_card') riskScore += 20;

    // Geographic risk (if payment country differs from event country)
    if (country && this.isHighRiskCountry(country)) riskScore += 25;

    // Card BIN analysis (if available)
    if (cardBin && this.isSuspiciousCardBin(cardBin)) riskScore += 30;

    return Math.min(riskScore, 100);
  }

  // Analyze booking velocity (rapid successive bookings)
  async analyzeBookingVelocity(userId, ipAddress) {
    try {
      let riskScore = 0;
      const timeWindow = 60 * 60 * 1000; // 1 hour
      const currentTime = Date.now();

      // Check bookings by user in last hour
      const recentUserBookings = await Ticket.find({
        attendeeId: userId,
        createdAt: { $gte: new Date(currentTime - timeWindow) }
      });

      if (recentUserBookings.length > 10) riskScore += 50; // Too many bookings
      else if (recentUserBookings.length > 5) riskScore += 30;
      else if (recentUserBookings.length > 3) riskScore += 15;

      // Check bookings from same IP
      const recentIPBookings = await this.getRecentBookingsByIP(ipAddress, timeWindow);
      if (recentIPBookings > 20) riskScore += 60; // Suspicious IP activity
      else if (recentIPBookings > 10) riskScore += 40;
      else if (recentIPBookings > 5) riskScore += 20;

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('Error analyzing booking velocity:', error);
      return 0;
    }
  }

  // Analyze device fingerprint
  analyzeDeviceFingerprint(userInfo) {
    let riskScore = 0;
    const { userAgent, screen, timezone, language, plugins } = userInfo.deviceInfo || {};

    // Check for bot-like patterns
    if (!userAgent || this.isBotUserAgent(userAgent)) riskScore += 40;

    // Suspicious screen resolutions
    if (screen && (screen.width < 800 || screen.height < 600)) riskScore += 15;

    // Check for headless browsers
    if (this.isHeadlessBrowser(userInfo.deviceInfo)) riskScore += 50;

    // Too many plugins can indicate automation
    if (plugins && plugins.length > 20) riskScore += 20;

    // Mismatched timezone and location
    if (this.hasMismatchedGeolocation(userInfo)) riskScore += 25;

    return Math.min(riskScore, 100);
  }

  // Analyze temporal patterns
  analyzeTemporalPatterns(ticketData) {
    let riskScore = 0;
    const { eventDate, bookingTime } = ticketData;

    const booking = new Date(bookingTime);
    const event = new Date(eventDate);
    const timeDiff = event.getTime() - booking.getTime();
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);

    // Very last-minute bookings can be suspicious
    if (hoursUntilEvent < 1) riskScore += 30;
    else if (hoursUntilEvent < 24) riskScore += 15;

    // Unusual booking hours (late night/early morning)
    const hour = booking.getHours();
    if (hour < 6 || hour > 23) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  // Analyze network behavior
  async analyzeNetworkBehavior(ipAddress) {
    let riskScore = 0;

    // Check if IP is blacklisted
    if (this.blockedIPs.has(ipAddress)) return 100;

    // Check IP reputation (this would integrate with external services)
    const ipRisk = await this.checkIPReputation(ipAddress);
    riskScore += ipRisk;

    // Check for VPN/Proxy usage
    if (await this.isVPNorProxy(ipAddress)) riskScore += 30;

    // Check for Tor usage
    if (await this.isTorExit(ipAddress)) riskScore += 50;

    return Math.min(riskScore, 100);
  }

  // Calculate overall risk score
  calculateRiskScore(riskFactors) {
    const weights = {
      user: 0.25,
      payment: 0.20,
      velocity: 0.20,
      device: 0.15,
      temporal: 0.10,
      network: 0.10
    };

    return Object.keys(weights).reduce((total, factor) => {
      return total + (riskFactors[factor] || 0) * weights[factor];
    }, 0);
  }

  // Classify risk level
  classifyRisk(riskScore) {
    if (riskScore >= 80) return 'HIGH';
    if (riskScore >= 60) return 'MEDIUM';
    if (riskScore >= 40) return 'LOW';
    return 'MINIMAL';
  }

  // Determine action based on risk
  determineAction(riskScore, riskFactors) {
    if (riskScore >= 90) return 'BLOCK';
    if (riskScore >= 80) return 'MANUAL_REVIEW';
    if (riskScore >= 60) return 'ADDITIONAL_VERIFICATION';
    if (riskScore >= 40) return 'MONITOR';
    return 'ALLOW';
  }

  // Generate human-readable risk reasons
  generateRiskReasons(riskFactors) {
    const reasons = [];

    if (riskFactors.user > 50) reasons.push('New or suspicious user account');
    if (riskFactors.payment > 50) reasons.push('Unusual payment pattern detected');
    if (riskFactors.velocity > 50) reasons.push('Rapid booking activity detected');
    if (riskFactors.device > 50) reasons.push('Suspicious device characteristics');
    if (riskFactors.network > 50) reasons.push('High-risk network or IP address');
    if (riskFactors.temporal > 50) reasons.push('Unusual booking timing');

    return reasons;
  }

  // Helper methods for pattern detection
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'temp-mail.org', 'throwaway.email'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  hasEmailAnomalies(email) {
    // Check for patterns like multiple dots, unusual characters, etc.
    return /\.{2,}|\+.*\+/.test(email) || email.split('@')[0].length > 30;
  }

  isBotUserAgent(userAgent) {
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
    return botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern));
  }

  isHeadlessBrowser(deviceInfo) {
    // Check for characteristics typical of headless browsers
    return !deviceInfo.plugins || 
           deviceInfo.plugins.length === 0 ||
           !deviceInfo.language ||
           deviceInfo.screen?.width === 1024 && deviceInfo.screen?.height === 768; // Common headless resolution
  }

  hasMismatchedGeolocation(userInfo) {
    // This would check if timezone doesn't match IP geolocation
    // Implementation would require geolocation service
    return false; // Placeholder
  }

  isHighRiskCountry(country) {
    const highRiskCountries = ['XX', 'YY']; // Placeholder - would use actual risk list
    return highRiskCountries.includes(country);
  }

  isSuspiciousCardBin(cardBin) {
    // Check against known suspicious BIN ranges
    // Implementation would use BIN database
    return false; // Placeholder
  }

  async checkIPReputation(ipAddress) {
    // Integration with IP reputation service
    // Returns risk score 0-100
    return 0; // Placeholder
  }

  async isVPNorProxy(ipAddress) {
    // Check if IP is from VPN or proxy service
    return false; // Placeholder
  }

  async isTorExit(ipAddress) {
    // Check if IP is a Tor exit node
    return false; // Placeholder
  }

  async getRecentBookingsByIP(ipAddress, timeWindow) {
    // This would require storing IP with ticket records
    return 0; // Placeholder
  }

  // Machine learning model integration (placeholder)
  async predictFraudProbability(features) {
    // This would integrate with an ML model
    // trained on historical fraud data
    return Math.random() * 100; // Placeholder
  }

  // Update fraud patterns based on confirmed cases
  updateFraudPatterns(confirmedFraud) {
    // Machine learning model retraining would happen here
    console.log('Updating fraud patterns with new case:', confirmedFraud);
  }

  // Block IP address
  blockIP(ipAddress, reason) {
    this.blockedIPs.add(ipAddress);
    console.log(`Blocked IP ${ipAddress} for reason: ${reason}`);
  }

  // Add user to watch list
  addToWatchList(userId, reason) {
    this.watchedUsers.add(userId);
    console.log(`Added user ${userId} to watch list for reason: ${reason}`);
  }

  // Get fraud statistics for dashboard
  async getFraudStatistics(timeRange = 30) {
    try {
      const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

      const totalTickets = await Ticket.countDocuments({
        createdAt: { $gte: cutoffDate }
      });

      const flaggedTickets = await Ticket.countDocuments({
        createdAt: { $gte: cutoffDate },
        'fraudCheck.riskLevel': { $in: ['HIGH', 'MEDIUM'] }
      });

      const blockedTransactions = await Ticket.countDocuments({
        createdAt: { $gte: cutoffDate },
        'fraudCheck.action': 'BLOCK'
      });

      return {
        totalTransactions: totalTickets,
        flaggedTransactions: flaggedTickets,
        blockedTransactions: blockedTransactions,
        fraudRate: totalTickets > 0 ? (flaggedTickets / totalTickets * 100).toFixed(2) : 0,
        blockRate: totalTickets > 0 ? (blockedTransactions / totalTickets * 100).toFixed(2) : 0,
        period: timeRange
      };

    } catch (error) {
      console.error('Error getting fraud statistics:', error);
      return null;
    }
  }
}

module.exports = new FraudDetectionService();
