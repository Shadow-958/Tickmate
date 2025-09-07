const express = require('express');
const { 
  getMyEvents, 
  getAnalytics, 
  deleteEvent, 
  getAttendeesForEvent, 
  verifyTicket 
} = require('../controllers/organizerController.js');
// const { authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// router.use(authorize('organizer'));

router.route('/my-events').get(getMyEvents);
router.route('/analytics').get(getAnalytics);
router.route('/my-events/:id').delete(deleteEvent);
router.route('/events/:id/attendees').get(getAttendeesForEvent);
router.route('/tickets/verify').post(verifyTicket);

module.exports = router;
