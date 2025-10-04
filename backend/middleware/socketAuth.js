const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.log('❌ Socket auth failed: No token provided');
      return next(new Error('No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ Socket auth failed: User not found for ID:', decoded.userId || decoded.id);
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    console.log('✅ Socket authenticated for user:', user.firstName, user.lastName);
    next();
    
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      next(new Error('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new Error('Token expired'));
    } else {
      next(new Error('Authentication failed'));
    }
  }
};

module.exports = socketAuthMiddleware;
