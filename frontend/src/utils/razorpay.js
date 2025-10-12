// Razorpay Integration Utility - Frontend Implementation
// Using Razorpay Checkout script instead of Node.js package

// Razorpay configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890';

// Debug: Log the key ID (first 8 characters only for security)
console.log('🔑 Razorpay Key ID loaded:', RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.substring(0, 8)}...` : 'NOT FOUND');

// Validate configuration
if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'rzp_test_1234567890') {
  console.warn('⚠️ Razorpay Key ID not configured properly');
  console.warn('Please add VITE_RAZORPAY_KEY_ID to your .env file');
}

// Load Razorpay Checkout script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

// Payment options interface
export const createPaymentOptions = (order, userInfo) => ({
  key: RAZORPAY_KEY_ID,
  amount: order.amount,
  currency: order.currency,
  name: 'Tickmate',
  description: `Event Ticket - Order ${order.id}`,
  order_id: order.id,
  prefill: {
    name: userInfo.name || 'Guest User',
    email: userInfo.email || 'guest@example.com',
    contact: userInfo.phone || '9999999999',
  },
  theme: {
    color: '#06b6d4', // Cyan color matching the app theme
  },
  modal: {
    ondismiss: () => {
      console.log('Payment modal dismissed');
    },
  },
  handler: (response) => {
    console.log('Payment successful:', response);
    return response;
  },
});

// Create Razorpay order
export const createRazorpayOrder = async (eventId, quantity = 1) => {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        eventId,
        quantity,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create order');
    }

    return data.order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (paymentData) => {
  try {
    const response = await fetch('/api/payments/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Payment verification failed');
    }

    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Open Razorpay payment modal
export const openRazorpayModal = async (options) => {
  try {
    // Load Razorpay script
    const Razorpay = await loadRazorpayScript();
    
    if (!Razorpay) {
      throw new Error('Failed to load Razorpay script');
    }

    return new Promise((resolve, reject) => {
      const rzp = new Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency,
        name: options.name || 'Tickmate',
        description: options.description || 'Event Ticket',
        order_id: options.order_id,
        prefill: options.prefill || {},
        theme: options.theme || {
          color: '#06b6d4',
        },
        handler: (response) => {
          console.log('✅ Payment successful:', response);
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed');
            reject(new Error('Payment cancelled by user'));
          },
        },
      });

      rzp.on('payment.failed', (response) => {
        console.error('❌ Payment failed:', response);
        reject(new Error(`Payment failed: ${response.error.description}`));
      });

      rzp.open();
    });
  } catch (error) {
    console.error('❌ Error opening Razorpay modal:', error);
    throw error;
  }
};

// Complete payment flow
export const processPayment = async (eventId, userInfo, quantity = 1) => {
  try {
    console.log('🚀 Starting payment process...');
    
    // Step 1: Create order
    const order = await createRazorpayOrder(eventId, quantity);
    
    if (order.isFree) {
      // Handle free events
      console.log('🎉 Free event - processing directly');
      const paymentData = {
        razorpay_order_id: order.id,
        razorpay_payment_id: null,
        razorpay_signature: null,
        eventId,
        attendeeInfo: userInfo,
        quantity,
        isFree: true,
      };
      
      return await verifyPayment(paymentData);
    }
    
    // Step 2: Create payment options
    const paymentOptions = createPaymentOptions(order, userInfo);
    
    // Step 3: Open payment modal
    console.log('💳 Opening payment modal...');
    const paymentResponse = await openRazorpayModal(paymentOptions);
    
    // Step 4: Verify payment
    console.log('🔍 Verifying payment...');
    const paymentData = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      eventId,
      attendeeInfo: userInfo,
      quantity,
      isFree: false,
    };
    
    return await verifyPayment(paymentData);
    
  } catch (error) {
    console.error('❌ Payment process failed:', error);
    throw error;
  }
};

export default {
  loadRazorpayScript,
  createPaymentOptions,
  createRazorpayOrder,
  verifyPayment,
  openRazorpayModal,
  processPayment
};
