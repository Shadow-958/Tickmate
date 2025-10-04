
// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limit
  general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP'),

  // Authentication rate limit (stricter)
  auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'),

  // Payment rate limit (very strict)
  payment: createRateLimit(15 * 60 * 1000, 5, 'Too many payment attempts'),

  // Event creation limit
  eventCreation: createRateLimit(60 * 60 * 1000, 10, 'Too many events created'),

  // Email sending limit
  email: createRateLimit(60 * 60 * 1000, 20, 'Too many emails sent')
};

// Security headers and protection
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// CSRF protection
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET requests and API endpoints
  if (req.method === 'GET' || req.path.startsWith('/api/')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
  }

  next();
};

// API key validation for external services
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// IP whitelisting for admin operations
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied from this IP address'
    });
  }

  next();
};

// Security middleware setup
const setupSecurity = (app) => {
  // Basic security headers
  app.use(securityHeaders);

  // Data sanitization
  app.use(mongoSanitize()); // Prevent NoSQL injection
  app.use(xss()); // Clean user input from malicious HTML
  app.use(hpp()); // Prevent HTTP Parameter Pollution

  // Apply rate limiting
  app.use('/api/', rateLimiters.general);
  app.use('/api/auth', rateLimiters.auth);
  app.use('/api/payments', rateLimiters.payment);
  app.use('/api/events', rateLimiters.eventCreation);
  app.use('/api/email', rateLimiters.email);
};

module.exports = {
  rateLimiters,
  securityHeaders,
  validateInput,
  csrfProtection,
  validateApiKey,
  ipWhitelist,
  setupSecurity
};
