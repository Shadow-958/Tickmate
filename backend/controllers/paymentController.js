const Razorpay = require('razorpay');
const crypto = require('crypto');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const Ticket = require('../models/Ticket.js');
const QRCode = require('qrcode');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const receiptId = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const options = {
      amount: event.pricing.price,
      currency: "INR",
      receipt: receiptId,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, clerkId } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    const user = await User.findOne({ clerkId });
    const event = await Event.findById(eventId);
    if (!user || !event) {
      return res.status(404).json({ message: 'User or Event not found' });
    }
    const uniqueTicketData = crypto.randomBytes(16).toString('hex');
    const qrCodeUrl = await QRCode.toDataURL(uniqueTicketData);
    const newTicket = new Ticket({
      eventId: event._id,
      attendeeId: user._id,
      qrCodeUrl: qrCodeUrl,
      pricePaid: event.pricing.price,
    });
    await newTicket.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { ticketsSold: 1 } });
    res.status(201).json({ message: 'Payment verified successfully! Ticket created.', ticket: newTicket });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

module.exports = { createOrder, verifyPayment };
