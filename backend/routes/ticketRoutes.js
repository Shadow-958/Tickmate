const express = require('express');
const { bookTicket, getMyBookings } = require('../controllers/ticketController.js');

const router = express.Router();

router.route('/book').post(bookTicket);
router.route('/my-bookings').get(getMyBookings);

module.exports = router;
