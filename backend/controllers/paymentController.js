const Event = require('../models/Event');
const User = require('../models/User');

// Try to load Booking model with fallback
let Booking;
try {
  Booking = require('../models/Booking');
  console.log('✅ Booking model loaded in payment controller');
} catch (error) {
  console.warn('⚠️ Booking model not found in payment controller');
  Booking = null;
}

// Generate demo order ID
const generateDemoOrderId = () => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Generate demo payment ID
const generateDemoPaymentId = () => {
  return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// @desc    Create demo payment order
// @route   POST /api/payments/create-demo-payment
// @access  Private (attendee only)
const createDemoPayment = async (req, res) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('💳 Creating demo payment order:', {
      eventId,
      quantity,
      userId: userId,
      userRole: req.user.selectedRole
    });

    // Validate required fields
    if (!eventId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and quantity are required'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is still bookable
    const now = new Date();
    if (new Date(event.startDateTime) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Event has already started or ended'
      });
    }

    // Calculate amount (in paise for INR, or cents for USD)
    const unitPrice = event.pricing?.price || 0;
    const totalAmount = unitPrice * quantity * 100; // Convert to paise/cents

    // Generate demo order details
    const orderId = generateDemoOrderId();
    const paymentId = generateDemoPaymentId();

    // Create demo payment order response
    const demoOrder = {
      orderId,
      paymentId,
      amount: totalAmount,
      currency: 'INR',
      eventId,
      eventTitle: event.title,
      quantity,
      unitPrice,
      totalAmount,
      attendeeId: userId,
      status: 'created',
      createdAt: new Date().toISOString(),
      // Demo payment gateway simulation
      gateway: 'demo',
      description: `Ticket booking for ${event.title}`,
      notes: {
        eventId,
        attendeeId: userId,
        quantity: quantity.toString()
      }
    };

    console.log('✅ Demo payment order created:', {
      orderId,
      paymentId,
      amount: totalAmount,
      eventTitle: event.title
    });

    res.json({
      success: true,
      message: 'Demo payment order created successfully',
      order: demoOrder,
      // Frontend needs these for payment processing
      key: 'demo_key_for_testing',
      orderId,
      paymentId,
      amount: totalAmount,
      currency: 'INR',
      name: 'Tickmate Event Platform',
      description: `Ticket for ${event.title}`,
      prefill: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        contact: req.user.phone || ''
      },
      theme: {
        color: '#06b6d4'
      }
    });

  } catch (error) {
    console.error('❌ Error creating demo payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// @desc    Process demo payment verification
// @route   POST /api/payments/verify-demo-payment
// @access  Private (attendee only)
const verifyDemoPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, eventId, quantity = 1 } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('🔍 Verifying demo payment for user:', req.user.firstName, req.user.selectedRole);
    console.log('💳 Payment details:', {
      orderId,
      paymentId,
      eventId,
      quantity,
      userId
    });

    // Validate required fields
    if (!orderId || !paymentId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details (orderId, paymentId, eventId)'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // **DEMO PAYMENT SIMULATION - ALWAYS SUCCESS** 
    console.log('🛡️ Running demo payment verification...');
    
    // For demo purposes, we'll simulate different outcomes based on order ID
    // In production, you would verify with actual payment gateway
    
    let paymentSuccess = true;
    let failureReason = null;

    // Simulate occasional failures for testing (you can remove this)
    if (orderId.includes('FAIL')) {
      paymentSuccess = false;
      failureReason = 'Simulated payment failure for testing';
    }

    if (!paymentSuccess) {
      console.log('❌ Demo payment failed (simulated):', orderId);
      return res.status(400).json({
        success: false,
        message: failureReason || 'Payment verification failed'
      });
    }

    // **PAYMENT SUCCESSFUL - CREATE BOOKING**
    console.log('✅ Demo payment verified successfully:', paymentId);

    let booking = null;

    // Create booking if Booking model is available
    if (Booking) {
      try {
        const bookingData = {
          eventId,
          attendeeId: userId,
          ticketNumber: `TK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          quantity: parseInt(quantity),
          unitPrice: event.pricing?.price || 0,
          totalAmount: (event.pricing?.price || 0) * parseInt(quantity),
          currency: 'INR',
          paymentStatus: 'completed',
          paymentMethod: 'demo',
          paymentId,
          paymentDate: new Date(),
          status: 'active',
          attendeeDetails: {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            phone: req.user.phone
          },
          bookingSource: 'web',
          bookedAt: new Date()
        };

        booking = new Booking(bookingData);
        await booking.save();

        console.log('🎫 Booking created successfully:', booking.ticketNumber);
      } catch (bookingError) {
        console.error('❌ Error creating booking:', bookingError);
        // Continue anyway - payment was successful
      }
    } else {
      console.warn('⚠️ Booking model not available - payment verified but no booking created');
    }

    // Success response
    res.json({
      success: true,
      message: 'Payment verified and booking created successfully',
      payment: {
        orderId,
        paymentId,
        status: 'completed',
        amount: (event.pricing?.price || 0) * parseInt(quantity),
        currency: 'INR',
        verifiedAt: new Date().toISOString()
      },
      booking: booking ? {
        _id: booking._id,
        ticketNumber: booking.ticketNumber,
        eventId: booking.eventId,
        quantity: booking.quantity,
        status: booking.status
      } : null,
      event: {
        _id: event._id,
        title: event.title,
        startDateTime: event.startDateTime,
        location: event.location
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed - Please try again',
      error: error.message
    });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/:paymentId/status
// @access  Private
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log('📊 Fetching payment status for:', paymentId);

    // In a real application, you would query your payment gateway
    // For demo purposes, we'll simulate a successful payment
    const demoPaymentStatus = {
      paymentId,
      status: 'completed',
      amount: 500, // Demo amount
      currency: 'INR',
      method: 'demo',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      payment: demoPaymentStatus
    });

  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

module.exports = {
  createDemoPayment,
  verifyDemoPayment,
  getPaymentStatus
};
