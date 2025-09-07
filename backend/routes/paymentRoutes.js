const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController.js');

const router = express.Router();

router.route('/create-order').post(createOrder);
router.route('/verify-payment').post(verifyPayment);

module.exports = router;
