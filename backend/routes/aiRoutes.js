const express = require('express');
const router = express.Router();
const aiRecommendationService = require('../services/aiRecommendationService');
const dynamicPricingService = require('../services/dynamicPricingService');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// AI Recommendations
router.get('/recommendations/:userId', authenticate, async (req, res) => {
  try {
    const recommendations = await aiRecommendationService.getRecommendations(req.params.userId);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trending-events', async (req, res) => {
  try {
    const trending = await aiRecommendationService.getTrendingEvents();
    res.json({ success: true, events: trending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Pricing
router.get('/price-recommendations/:eventId', authenticate, authorize('event_host'), async (req, res) => {
  try {
    const recommendations = await dynamicPricingService.getPriceRecommendations(req.params.eventId);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
