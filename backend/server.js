const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// NEW IMPORTS
const http = require('http');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventHostRoutes = require('./routes/eventHostRoutes');
const eventAttendeeRoutes = require('./routes/eventAttendeeRoutes');
const eventStaffRoutes = require('./routes/eventStaffRoutes');
const demoPaymentRoutes = require('./routes/paymentRoutes');
const onboardingRoutes = require('./routes/onBoardingRoutes');
const eventsRoutes = require('./routes/eventsRoutes');

// AI SERVICE IMPORTS (with error handling)
let realtimeService = null;
let aiRoutes = null;
let enhancedStaffRoutes = null;

try {
  realtimeService = require('./services/realtimeService');
  console.log('✅ Real-time service loaded');
} catch (error) {
  console.warn('⚠️ Real-time service not found:', error.message);
}

try {
  aiRoutes = require('./routes/aiRoutes');
  console.log('✅ AI routes loaded');
} catch (error) {
  console.warn('⚠️ AI routes not found:', error.message);
}

try {
  enhancedStaffRoutes = require('./routes/enhancedStaffRoutes');
  console.log('✅ Enhanced staff routes loaded');
} catch (error) {
  console.warn('⚠️ Enhanced staff routes not found, using standard staff routes');
}

const app = express();
const PORT = process.env.PORT || 5000;

// CREATE HTTP SERVER
const server = http.createServer(app);

// Trust proxy for rate limiting and real IP
app.set('trust proxy', 1);

// ENHANCED SECURITY MIDDLEWARE
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://placehold.co"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
        },
    },
}));

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Clean user input from malicious HTML
app.use(hpp()); // Prevent HTTP Parameter Pollution

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
}));

// DEVELOPMENT-FRIENDLY RATE LIMITING
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    // PRODUCTION: Apply strict rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // limit each IP to 10 auth requests per windowMs
        message: {
            success: false,
            message: 'Too many authentication attempts, please try again later.'
        }
    });

    app.use('/api/', limiter);
    app.use('/api/auth/', authLimiter);
    
    console.log('✅ Rate limiting enabled (Production mode)');
} else {
    // DEVELOPMENT: Apply very lenient rate limiting or disable entirely
    const devLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10000, // Very high limit for development
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => true // Skip rate limiting entirely in development
    });

    const devAuthLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Very high limit for development
        message: {
            success: false,
            message: 'Too many authentication attempts, please try again later.'
        },
        skip: () => true // Skip rate limiting entirely in development
    });

    // Commented out for development - uncomment if you want very lenient limits
    // app.use('/api/', devLimiter);
    // app.use('/api/auth/', devAuthLimiter);
    
    console.log('⚠️ Rate limiting disabled (Development mode)');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Tickmate', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// INITIALIZE REAL-TIME SERVICE (if available)
if (realtimeService) {
    try {
        realtimeService.initialize(server);
        console.log('✅ Real-time service initialized');
    } catch (error) {
        console.error('❌ Error initializing real-time service:', error.message);
    }
}

// API Routes - Core Routes (FIXED STAFF ROUTE MOUNTING)
app.use('/api/auth', authRoutes);
app.use('/api/host', eventHostRoutes);
app.use('/api/attendee', eventAttendeeRoutes);
app.use('/api/staff', eventStaffRoutes); // ✅ PROPERLY MOUNTED STAFF ROUTES
app.use('/api/payments', demoPaymentRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/events', eventsRoutes);

console.log('✅ Core API routes mounted:');
console.log('   - /api/auth (Authentication)');
console.log('   - /api/host (Event Management + Staff Assignment)'); // ✅ UPDATED
console.log('   - /api/attendee (Ticket Booking)');
console.log('   - /api/staff (Staff Operations)'); // ✅ CONFIRMED MOUNTING
console.log('   - /api/payments (Payment Processing)');
console.log('   - /api/onboarding (User Onboarding)');
console.log('   - /api/events (Public Events)');

// ENHANCED STAFF ROUTES (if available)
if (enhancedStaffRoutes) {
    app.use('/api/staff-enhanced', enhancedStaffRoutes);
    console.log('✅ Enhanced staff routes mounted at /api/staff-enhanced');
}

// AI ROUTES (if available)
if (aiRoutes) {
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI routes mounted at /api/ai');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'TapIn Event Platform API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        features: {
            realTimeEnabled: !!realtimeService,
            aiEnabled: !!aiRoutes,
            enhancedStaffEnabled: !!enhancedStaffRoutes,
            standardStaffEnabled: true,
            rateLimitingEnabled: isProduction,
            staffManagementEnabled: true // ✅ NEW FEATURE
        },
        routes: {
            auth: '/api/auth',
            host: '/api/host',
            attendee: '/api/attendee',
            staff: '/api/staff',
            payments: '/api/payments',
            onboarding: '/api/onboarding',
            events: '/api/events',
            ...(aiRoutes && { ai: '/api/ai' }),
            ...(enhancedStaffRoutes && { staffEnhanced: '/api/staff-enhanced' })
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to TapIn Event Platform API',
        version: '2.0.0',
        documentation: '/api/health',
        endpoints: {
            auth: '/api/auth',
            host: '/api/host',
            attendee: '/api/attendee',
            staff: '/api/staff',
            payments: '/api/payments',
            onboarding: '/api/onboarding',
            events: '/api/events',
            ...(aiRoutes && { ai: '/api/ai' }),
            ...(enhancedStaffRoutes && { staffEnhanced: '/api/staff-enhanced' })
        },
        features: {
            realTime: !!realtimeService,
            ai: !!aiRoutes,
            enhancedSecurity: true,
            enhancedStaff: !!enhancedStaffRoutes,
            rateLimiting: isProduction,
            staffManagement: true // ✅ NEW FEATURE
        }
    });
});

// Debug routes (remove in production)
if (!isProduction) {
    // Route debugging
    app.get('/debug/routes', (req, res) => {
        const routes = [];
        
        function extractRoutes(stack, basePath = '') {
            stack.forEach((layer) => {
                if (layer.route) {
                    // Regular route
                    const methods = Object.keys(layer.route.methods);
                    routes.push({
                        path: basePath + layer.route.path,
                        methods: methods.map(m => m.toUpperCase())
                    });
                } else if (layer.name === 'router' && layer.regexp) {
                    // Router middleware
                                const match = layer.regexp && layer.regexp.source
                .replace('\\/?', '') // Remove optional trailing slash
                .replace('(?=\\/|$)', '') // Remove Express-specific lookahead
                .match(/^\\\/(.+)$/);

                if (match) {
                    const routerPath = '/' + match[1].replace(/\\\//g, '/');
                    if (layer.handle && layer.handle.stack) {
                        extractRoutes(layer.handle.stack, basePath + routerPath);
                    }
                }

                }
            });
        }

        extractRoutes(app._router.stack);
        
        res.json({
            success: true,
            routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
            totalRoutes: routes.length
        });
    });

    // Request debugging middleware
    app.use((req, res, next) => {
        if (req.url.includes('/api/staff/') || req.url.includes('/api/host/') || req.url.includes('/api/auth/')) {
            console.log(`🔍 ${req.method} ${req.url} from ${req.ip}`);
        }
        next();
    });
    
    console.log('🔧 Debug routes enabled:');
    console.log('   - GET /debug/routes (Route listing)');
}

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large'
        });
    }

    // Default error response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err
        })
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: [
            '/api/auth',
            '/api/host',
            '/api/attendee',
            '/api/staff',
            '/api/payments',
            '/api/onboarding',
            '/api/events',
            '/api/health'
        ]
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    
    server.close(() => {
        console.log('HTTP server closed');
        
        mongoose.connection.close(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force close after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// START SERVER WITH SOCKET.IO SUPPORT
server.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 Tickmate Event Platform Server Started Successfully!');
    console.log('='.repeat(70));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 Database: ${process.env.MONGO_URI?.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB'}`);
    console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🛡️  Rate Limiting: ${isProduction ? 'ENABLED' : 'DISABLED (Dev Mode)'}`);
    console.log('\n🎯 Available API Endpoints:');
    console.log('   📝 Authentication: /api/auth');
    console.log('   🎪 Event Management: /api/host');
    console.log('   🎫 Ticket Booking: /api/attendee');
    console.log('   👨‍💼 Staff Operations: /api/staff'); // ✅ CONFIRMED IN STARTUP
    console.log('   💳 Payment Processing: /api/payments');
    console.log('   🚀 User Onboarding: /api/onboarding');
    console.log('   🌐 Public Events: /api/events');
    console.log('\n🎯 Available Features:');
    console.log(`   ${realtimeService ? '✅' : '❌'} Real-time notifications (Socket.IO)`);
    console.log(`   ${aiRoutes ? '✅' : '❌'} AI recommendations & dynamic pricing`);
    console.log(`   ${enhancedStaffRoutes ? '✅' : '❌'} Enhanced staff dashboard`);
    console.log('   ✅ Standard staff operations');
    console.log('   ✅ Staff assignment & management'); // ✅ NEW FEATURE
    console.log('   ✅ Advanced security middleware');
    console.log(`   ${isProduction ? '✅' : '⚠️ '} Rate limiting & API protection`);
    if (!isProduction) {
        console.log('\n🔧 Development Mode Features:');
        console.log('   ⚠️  Rate limiting disabled for easy testing');
        console.log('   🔍 Enhanced error logging with stack traces');
        console.log('   📊 Request debugging enabled');
        console.log('   🛠️  Debug routes available at /debug/routes');
    }
    console.log('\n📋 API Documentation: http://localhost:' + PORT + '/api/health');
    console.log('🔧 Debug Route Info: http://localhost:' + PORT + '/debug/routes');
    console.log('='.repeat(70) + '\n');
});

// Export for testing
module.exports = { app, server };
