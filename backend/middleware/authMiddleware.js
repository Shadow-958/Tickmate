const User = require('../models/User.js');

const authorize = (...roles) => {
  return async (req, res, next) => {
    const clerkId = req.body.clerkId || req.query.clerkId;

    if (!clerkId) {
      return res.status(400).json({ message: 'User identifier not provided.' });
    }

    try {
      const user = await User.findOne({ clerkId: clerkId });

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error during authorization.' });
    }
  };
};

module.exports = { authorize };
